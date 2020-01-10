//Template Generate controller
(function () {
    'use strict';

    angular
        .module('intake.templates')
        .controller('IntakeGenerateTemplateCtrl', IntakeGenerateTemplateCtrl);

    IntakeGenerateTemplateCtrl.$inject = ['$modalInstance', 'notification-service', 'globalConstants', 'templateData', 'intakeTemplatestDatalayer', 'intakeTemplateHelper', 'template_config', '$filter', 'generatorTemplateData', 'templateDetailFromJava', 'intakeFactory', 'contactFactory'];

    function IntakeGenerateTemplateCtrl($modalInstance, notificationService, globalConstants, templateData, intakeTemplatestDatalayer, intakeTemplateHelper, template_config, $filter, generatorTemplateData, templateDetailFromJava, intakeFactory, contactFactory) {

        var vm = this;
        vm.TemplateDetails = globalConstants.TemplateDetails;
        // vm.TemplateModelInfo = {};
        vm.autoGenerateTemplateModelInfo = {};
        vm.generatorTemplateData = generatorTemplateData;
        vm.TemplateModelInfo = templateData;
        vm.templateDetailFromJava = templateDetailFromJava;
        vm.generateNewTemplate = generateNewTemplate;
        vm.close = closePopup;
        vm.option = templateData.option;
        vm.template_code = templateData.template_code;
        vm.getPlaintiffEmployers = getPlaintiffEmployers;
        vm.plaintiff_dropdown = [];
        vm.medicalProvider_dropdown = [];
        vm.medicalProviderAndPhysician = [];
        vm.medicalProviderAndPhysicianNew = [];
        vm.medicalProviderOnly = [];
        vm.medicalProviderServiceDates = [];
        vm.physician_dropdown = [];
        vm.witness_dropdown = [];
        vm.insurance_dropdown = [];
        vm.insuranceProvider_dropdown = [];
        vm.employer_dropdown = [];
        vm.assignUsers = [];
        vm.insuranceInsuredAdjuster = [];
        vm.onlyPhysicians = [];
        vm.medicalProviderData = [];
        vm.serviceStartEndDates = [];
        vm.medicalInfoDates = [];

        /**
         * new template validation on generate template
         */
        vm.newValidateSelection = function (option) {
            switch (option) {
                case "F1153_10":
                case "F1153_9":
                    if ($("#custom_dateDateDivError").css('display') == "block") {
                        return true;
                    }
                    break;
                case "F1143_133":
                    if ($("#date_Employed_To1DateDivError").css('display') == "block" || $("#date_Employed_To2DateDivError").css('display') == "block" || $("#date_Employed_To3DateDivError").css('display') == "block" || $("#filling_dateDateDivError").css('display') == "block" || $("#date_Employed_From1DateDivError").css('display') == "block" || $("#date_Employed_From2DateDivError").css('display') == "block" || $("#date_Employed_From3DateDivError").css('display') == "block" || $("#marriage_dateDateDivError").css('display') == "block") {
                        return true;
                    }
                    break;
            }

        }

        /**
         * Date picker setting
         */
        vm.openCalender = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
        }


        /*function to close pop up*/
        function closePopup() {
            $modalInstance.dismiss();
        }

        function setTemplateConfig() {
            var temp_code = '';
            _.forEach(template_config, function (tempKey) {
                if (tempKey == vm.TemplateModelInfo.template_code) {
                    vm.configure_template = template_config;
                    temp_code = tempKey;
                    return;
                }
            });
            if (vm.configure_template != undefined) {
                var display_fields = [];
                display_fields.push(Object.keys(vm.configure_template.display_prop.display_fields));
                if (temp_code == vm.TemplateModelInfo.template_code) {
                    /** Todo : Switch */
                    if (display_fields[0].indexOf('plaintiff') != -1 || display_fields[0].indexOf('plaintiffs') != -1 || display_fields[0].indexOf('plaintiffs1') != -1 || display_fields[0].indexOf('plaintiffs2') != -1 || display_fields[0].indexOf('plaintiffs3') != -1 || display_fields[0].indexOf('plaintiff_multi') != -1 || display_fields[0].indexOf('plaintiff_onChange') != -1 || display_fields[0].indexOf('deceased_plaintiffs') != -1 || display_fields[0].indexOf('plaintiffs_guardian') != -1 || display_fields[0].indexOf('plaintiff_onChange_primary') != -1 || display_fields[0].indexOf('plaintiff_onChange_secondary') != -1) {
                        getPlaintiffdetails();
                    }
                    if (display_fields[0].indexOf('refferedBy') != -1 || display_fields[0].indexOf('assignUser') != -1) {
                        getIntakeInfo();
                    }
                    if (display_fields[0].indexOf('medical_provider') != -1 || display_fields[0].indexOf('service_Date') != -1 || display_fields[0].indexOf('medical_provider1') != -1 || display_fields[0].indexOf('medical_provider2') != -1) {
                        getPlaintiffdetails();
                    }
                    if (display_fields[0].indexOf('witness') != -1 || display_fields[0].indexOf('witness1') != -1) {
                        getPlaintiffdetails();
                    }
                    if (display_fields[0].indexOf('physicianProvider') != -1 || display_fields[0].indexOf('serviceProvider') != -1 || display_fields[0].indexOf('medicalProvider_Physicians') != -1) {
                        getPlaintiffdetails();
                    }
                    if (display_fields[0].indexOf('insurance') != -1 || display_fields[0].indexOf('insured_Party') != -1) {
                        getPlaintiffdetails();
                    }
                }
            }
        }

        (function () {

            // set template configuration 
            vm.callCheck = 1;
            (vm.TemplateModelInfo.option == "auto_generate") ? autoGenerateTemplateConfig() : setTemplateConfig();

        })();



        /**
         * set params for specific template
         */
        function setParams(templateCode, params) {
            var resetParams = {};
            switch (templateCode) {
                case "F1153_10":
                case "F1153_9":
                    resetParams = {
                        template_code: templateCode,
                        intake_id: parseInt(params.intakeId),
                        time_zone: moment.tz.guess(),
                        template_type: params.templatetype,
                        plaintiff_id: angular.isDefined(params.plaintiff) ? [parseInt(params.plaintiff.intakePlaintiffId)] : [0],
                        contact_id: utils.isNotEmptyVal(vm.referredById) ? [parseInt(vm.referredById.contactId)] : [0],
                        contact_type: ['Local'],
                        RETAINER_AGREEMENT_DATE: angular.isDefined(params.custom_date) ? moment.unix(params.custom_date).utc().format('MMMM D, YYYY') : '{RETAINER_AGREEMENT_DATE}'
                    }
                    break;
                case "F1143_133":
                    // Dates Calculation
                    var employmentStartDate = angular.isDefined(params.date_Employed_From1) ? moment.unix(params.date_Employed_From1).utc().format('MMMM DD, YYYY') : ''
                    var employmentEndDate = angular.isDefined(params.date_Employed_To1) ? moment.unix(params.date_Employed_To1).utc().format('MMMM DD, YYYY') : ''
                    var employmentStartDate2 = angular.isDefined(params.date_Employed_From2) ? moment.unix(params.date_Employed_From2).utc().format('MMMM DD, YYYY') : ''
                    var employmentEndDate2 = angular.isDefined(params.date_Employed_To2) ? moment.unix(params.date_Employed_To2).utc().format('MMMM DD, YYYY') : ''
                    var employmentStartDate3 = angular.isDefined(params.date_Employed_From3) ? moment.unix(params.date_Employed_From3).utc().format('MMMM DD, YYYY') : ''
                    var employmentEndDate3 = angular.isDefined(params.date_Employed_To3) ? moment.unix(params.date_Employed_To3).utc().format('MMMM DD, YYYY') : ''

                    var employmentDate1 = employmentStartDate + " " + employmentEndDate;
                    var employmentDate2 = employmentStartDate2 + " " + employmentEndDate2;
                    var employmentDate3 = employmentStartDate3 + " " + employmentEndDate3;

                    //Employer Selection
                    var employerIds = [];
                    employerIds[0] = angular.isDefined(params.plaintiffEmployerIds) ? parseInt(params.plaintiffEmployerIds.intakeEmployerId) : 0;
                    employerIds[1] = angular.isDefined(params.plaintiffEmployerIds_sec) ? parseInt(params.plaintiffEmployerIds_sec.intakeEmployerId) : 0;
                    employerIds[2] = angular.isDefined(params.plaintiffEmployerIds_ter) ? parseInt(params.plaintiffEmployerIds_ter.intakeEmployerId) : 0;

                    //Witness Selection
                    var witnessIds = [];
                    witnessIds[0] = angular.isDefined(params.witnessId) ? parseInt(params.witnessId.contact.contactId) : 0;
                    witnessIds[1] = angular.isDefined(params.witnessId1) ? parseInt(params.witnessId1.contact.contactId) : 0;

                    //Medical Provider and Physican selection
                    var medicalproviderIds = [];
                    medicalproviderIds[0] = (angular.isDefined(params.medicalproviderId) && params.medicalproviderId.medProvider.contactId) ? parseInt(params.medicalproviderId.medProvider.contactId) : 0;
                    medicalproviderIds[1] = (angular.isDefined(params.medicalproviderId2) && params.medicalproviderId2.medProvider.contactId) ? parseInt(params.medicalproviderId2.medProvider.contactId) : 0;
                    medicalproviderIds[2] = (angular.isDefined(params.medicalproviderId3) && params.medicalproviderId3.medProvider.contactId) ? parseInt(params.medicalproviderId3.medProvider.contactId) : 0;

                    var medicalTreatmentIds = [];
                    medicalTreatmentIds[0] = (angular.isDefined(params.medicalproviderId) && params.medicalproviderId.treatmentId) ? parseInt(params.medicalproviderId.treatmentId) : 0;
                    medicalTreatmentIds[1] = (angular.isDefined(params.medicalproviderId2) && params.medicalproviderId2.treatmentId) ? parseInt(params.medicalproviderId2.treatmentId) : 0;
                    medicalTreatmentIds[2] = (angular.isDefined(params.medicalproviderId3) && params.medicalproviderId3.treatmentId) ? parseInt(params.medicalproviderId3.treatmentId) : 0;

                    resetParams = {
                        template_code: templateCode,
                        intake_id: parseInt(params.intakeId),
                        time_zone: moment.tz.guess(),
                        template_type: params.templatetype,
                        plaintiff_id: angular.isDefined(params.plaintiff) ? [parseInt(params.plaintiff.intakePlaintiffId)] : [0],
                        plaintiffEmployer_id: utils.isNotEmptyVal(employerIds) ? employerIds : [0],
                        plaintiffEmployer_type: ['Local', 'Local', 'Local'],
                        medicalprovider_id: utils.isNotEmptyVal(medicalproviderIds) ? medicalproviderIds : [0],
                        medicalprovider_type: ['Local', 'Local', 'Local'],
                        medicalTreatment_id: utils.isNotEmptyVal(medicalTreatmentIds) ? medicalTreatmentIds : [0],
                        witness_id: utils.isNotEmptyVal(witnessIds) ? witnessIds : [0],
                        user_id: angular.isDefined(params.assign_user) ? [parseInt(params.assign_user.userId)] : [0],
                        insurance_id: angular.isDefined(params.onlyInsuranceId) ? [parseInt(params.onlyInsuranceId.intakeInsuranceId)] : [0],
                        EMERGENCY_CONTACT_NUMBER: angular.isDefined(params.textBoxOne) ? params.textBoxOne : '{EMERGENCY_CONTACT_NUMBER}',
                        ACCIDENT_DESCRIPTION: angular.isDefined(params.textBoxTwo) ? params.textBoxTwo : '{ACCIDENT_DESCRIPTION}',
                        TIME_RESTRICTED_TO_BED_TEXT: angular.isDefined(params.textBoxThree) ? params.textBoxThree : '{TIME_RESTRICTED_TO_BED_TEXT}',
                        TIME_RESTRICTED_TO_HOUSE_TEXT: angular.isDefined(params.textBoxFour) ? params.textBoxFour : '{TIME_RESTRICTED_TO_HOUSE_TEXT}',
                        LOSS_OF_SERVICES_DESCRIPTION_TEXT: angular.isDefined(params.textBoxFive) ? params.textBoxFive : '{LOSS_OF_SERVICES_DESCRIPTION_TEXT}',
                        POLICE_OFFICER_ACCIDENT_REPORT_INFORMATION_TEXT: angular.isDefined(params.textBoxSix) ? params.textBoxSix : '{POLICE_OFFICER_ACCIDENT_REPORT_INFORMATION_TEXT}',
                        PRIOR_ACCIDENTS_OR_INJURIES_TEXT: angular.isDefined(params.textBoxSeven) ? params.textBoxSeven : '{PRIOR_ACCIDENTS_OR_INJURIES_TEXT}',
                        SUBSEQUENT_ACCIDENTS_OR_INJURIES_TEXT: angular.isDefined(params.textBoxEight) ? params.textBoxEight : '{SUBSEQUENT_ACCIDENTS_OR_INJURIES_TEXT}',
                        PRIOR_RELATED_MEDICAL_CONDITIONS_TEXT: angular.isDefined(params.textBoxNine) ? params.textBoxNine : '{PRIOR_RELATED_MEDICAL_CONDITIONS_TEXT}',
                        MEANS_OF_CALCULATION_TEXT: angular.isDefined(params.textBoxTen) ? params.textBoxTen : '{MEANS_OF_CALCULATION_TEXT}',
                        LIABILITY_BASIS_TEXT: angular.isDefined(params.userValueOne) ? params.userValueOne : '{LIABILITY_BASIS_TEXT}',
                        SOCIAL_SECURITY_DISABILITY_INFORMATION_TEXT: angular.isDefined(params.userValueTwo) ? params.userValueTwo : '{SOCIAL_SECURITY_DISABILITY_INFORMATION_TEXT}',
                        USER_ADDRESS: angular.isDefined(params.userValueThree) ? params.userValueThree : '{USER_ADDRESS}',
                        USER_RESIDENCE_STATE: angular.isDefined(params.userValueFour) ? params.userValueFour : '{USER_RESIDENCE_STATE}',
                        USER_RESIDENCE_COUNTY: angular.isDefined(params.userValueFive) ? params.userValueFive : '{USER_RESIDENCE_COUNTY}',
                        PLAINTIFF_SPOUSE_SSN: angular.isDefined(params.userValueSix) ? params.userValueSix : '{PLAINTIFF_SPOUSE_SSN}',
                        AMOUNT_OF_LOST_INCOME_TEXT: utils.isNotEmptyVal(params.amountInNumbers1) ? params.amountInNumbers1 : '{AMOUNT_OF_LOST_INCOME_TEXT}',
                        BILLED_AMOUNT_1: utils.isNotEmptyVal(params.amountInNumbers2) ? params.amountInNumbers2 : '{BILLED_AMOUNT_1}',
                        BILLED_AMOUNT_2: utils.isNotEmptyVal(params.amountInNumbers3) ? params.amountInNumbers3 : '{BILLED_AMOUNT_2}',
                        BILLED_AMOUNT_3: utils.isNotEmptyVal(params.amountInNumbers4) ? params.amountInNumbers4 : '{BILLED_AMOUNT_3}',
                        PLAINTIFF_GROSS_PAY_1: utils.isNotEmptyVal(params.amountInNumbers5) ? params.amountInNumbers5 : '{PLAINTIFF_GROSS_PAY_1}',
                        PLAINTIFF_GROSS_PAY_2: utils.isNotEmptyVal(params.amountInNumbers6) ? params.amountInNumbers6 : '{PLAINTIFF_GROSS_PAY_2}',
                        PLAINTIFF_GROSS_PAY_3: utils.isNotEmptyVal(params.amountInNumbers7) ? params.amountInNumbers7 : '{PLAINTIFF_GROSS_PAY_3}',
                        DATE_OF_FILING: angular.isDefined(params.filling_date) ? moment.unix(params.filling_date).utc().format('MMMM D, YYYY') : '{DATE_OF_FILING}',
                        PLAINTIFF_DATE_OF_MARRIAGE: angular.isDefined(params.marriage_date) ? moment.unix(params.marriage_date).utc().format('MMMM D, YYYY') : '{PLAINTIFF_DATE_OF_MARRIAGE}',
                        PLAINTIFF_DATES_EMPLOYED_1: utils.isNotEmptyVal(employmentDate1) ? employmentDate1 : '{PLAINTIFF_DATES_EMPLOYED_1}',
                        PLAINTIFF_DATES_EMPLOYED_2: utils.isNotEmptyVal(employmentDate2) ? employmentDate2 : '{PLAINTIFF_DATES_EMPLOYED_2}',
                        PLAINTIFF_DATES_EMPLOYED_3: utils.isNotEmptyVal(employmentDate3) ? employmentDate3 : '{PLAINTIFF_DATES_EMPLOYED_3}'
                    }
                    break;

                case "F1563_11":
                    resetParams = {
                        template_code: templateCode,
                        intake_id: parseInt(params.intakeId),
                        time_zone: moment.tz.guess(),
                        template_type: params.templatetype,
                        plaintiff_id: angular.isDefined(params.plaintiff) ? [parseInt(params.plaintiff.intakePlaintiffId)] : [0],
                        plaintiffEmployer_id: angular.isDefined(params.plaintiffEmployerIdsNew) ? [params.plaintiffEmployerIdsNew.intakeEmployerId] : [0],
                        plaintiffEmployer_type: ['Local'],
                        medicalTreatment_id: angular.isDefined(params.medicalProviderPhysicians) ? [params.medicalProviderPhysicians.contactId] : [0],
                        medicalprovider_id: angular.isDefined(params.medicalServiceProvider) ? [params.medicalServiceProvider.contactId] : [0],
                        medicalprovider_type: ['Local'],
                        insurance_id: angular.isDefined(params.insuredParty) ? [params.insuredParty.intakeInsuranceId] : [0],
                        ACCIDENT_TIME: angular.isDefined(params.accidentTime) ? params.accidentTime : '{ACCIDENT_TIME}',
                        ACCIDENT_DESCRIPTION: angular.isDefined(params.textBoxTwo) ? params.textBoxTwo : '{ACCIDENT_DESCRIPTION}',
                        VEHICLE_INFORMATION: angular.isDefined(params.vehicleInformation) ? params.vehicleInformation : '{VEHICLE_INFORMATION}'
                    }
                    break;

                case "F1563_13":
                    resetParams = {
                        template_code: templateCode,
                        intake_id: parseInt(params.intakeId),
                        time_zone: moment.tz.guess(),
                        template_type: params.templatetype,
                        plaintiff_id: angular.isDefined(params.plaintiff) ? [parseInt(params.plaintiff.intakePlaintiffId)] : [0],
                        DATE_OF_SERVICE: angular.isDefined(params.serviceDates) ? params.serviceDates.startEndDate : '{DATE_OF_SERVICE}',
                        medicalprovider_id: angular.isDefined(params.medicalServiceProvider) ? [params.medicalServiceProvider.contactId] : [0],
                        medicalprovider_type: ['Local'],
                    }
                    break;
            }
            return resetParams;
        }

        /**
         * Add extra parameters for specific template
         */
        function extraParams(templateInfo, params) {
            /** Todo: Switch */
            if (templateInfo.template_code == "F1_116") {

                params.otherPartyContactid = [];
                params.otherPartyContacttype = [];
                _.forEach(templateInfo.multiselectcontactid, function (currentItem, index) {
                    params.otherPartyContactid.push(parseInt(currentItem.contactid));
                    params.otherPartyContacttype.push(currentItem.contact_type);
                });
            }
            return params;
        }

        /* Start: Template  Auto Generation Code */

        function autoGenerateTemplateConfig() {
            _.forEach(vm.generatorTemplateData.display_prop, function (data) {
                switch (data.api) {
                    case "getPlaintiffs":
                    case "getTreatmentDates":
                    case "getInsuredParty":
                    case "getPhysicianInfo":
                        getPlaintiffdetails();
                        break;
                    case "getAssignUser":
                        getIntakeInfo();
                        break;
                    case "getMatterAllContactList":
                        getMatterAllContactList();
                        break;
                    default:
                        getPlaintiffdetails()
                        break;
                }

            });
        }
        /**
         * Auto template validation on generate template
         */
        vm.newAutoValidateSelection = function (option) {
            switch (option) {
                case "option":
                    return false;
                    break;
                default:
                    return (eval(vm.generatorTemplateData.createValidationHTML));
            }
        }


        vm.generateAutoTemplate = generateAutoTemplate;
        function generateAutoTemplate(TemplateModelInfo, AutoGenerateTemplateModelInfo) {
            var APIFlag = generatorTemplateData.template_api_call;
            var templateName = templateDetailFromJava.template_name;
            var resetParams = {
                template_code: templateDetailFromJava.template_code,
                intake_id: parseInt(TemplateModelInfo.intakeId),
                time_zone: moment.tz.guess(),
                template_type: templateDetailFromJava.template_type
            };


            var requestParamCopy = angular.copy(generatorTemplateData.request_params);

            forEach(generatorTemplateData.display_prop, function (data, index) {
                if (data.hasOwnProperty('apiCallOnly')) {
                    autoGenerateAPIResetParam(data, AutoGenerateTemplateModelInfo, resetParams);
                } else if (data.hasOwnProperty('primary')) {
                    autoGeneratePrimaryResetParam(data, AutoGenerateTemplateModelInfo, resetParams);
                } else if (data.hasOwnProperty('subKey') && (!(data.hasOwnProperty('primary') || data.hasOwnProperty('secondary') || data.hasOwnProperty('tertiary')))) {
                    autoGenerateSubKeyResetParam(data, AutoGenerateTemplateModelInfo, resetParams);
                } else if (data.hasOwnProperty('multipleSubKey')) {
                    autoGenerateMultipleSubKeyResetParam(data, AutoGenerateTemplateModelInfo, resetParams);
                } else if (data.hasOwnProperty('multipleKey')) {
                    autoGenerateMultipleKeyResetParam(data, AutoGenerateTemplateModelInfo, resetParams);
                }

            });

            forEach(generatorTemplateData.request_params, function (data) {

                if (AutoGenerateTemplateModelInfo.hasOwnProperty(data.key) && utils.isNotEmptyVal(AutoGenerateTemplateModelInfo[data.key])) {
                    var obj = AutoGenerateTemplateModelInfo[data.key];
                    utils.isNotEmptyVal(data.keyValue) ? obj = obj[data.keyValue] : obj = obj;
                    if (!(obj == "undefined" || obj == null || obj == '')) {
                        obj = convertResetParam(data.type, obj);
                    } else {
                        obj = convertResetParam(data.defaultValueType, data.defaultValue);
                    }
                    resetParams[data.key] = obj;
                } else {
                    resetParams[data.key] = convertResetParam(data.defaultValueType, data.defaultValue);
                }

            });

            generatorTemplateData.request_params = requestParamCopy;

            intakeTemplatestDatalayer.GenerateNewTemplateRecord(resetParams, APIFlag, templateName)
                .then(function (response) {
                    var filename = templateName.replace('.', '-');
                    var linkElement = document.createElement('a');
                    try {
                        var blob = new Blob([response], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
                        var url = window.URL.createObjectURL(blob);

                        linkElement.setAttribute('href', url);
                        linkElement.setAttribute("download", filename + ".docx");

                        var clickEvent = new MouseEvent("click", {
                            "view": window,
                            "bubbles": true,
                            "cancelable": false
                        });
                        linkElement.dispatchEvent(clickEvent);
                        vm.close();
                    } catch (ex) {
                        console.log(ex);
                    }
                }, function (error) {
                    if (localStorage.getItem('templateError') == "true") {
                        notificationService.error('' + error.data);
                        localStorage.setItem('templateError', "false");
                    }
                });
        }


        function autoGenerateAPIResetParam(data, AutoGenerateTemplateModelInfo, resetParams) {

            resetParams[data.modelname] = [];
            if (data.hasOwnProperty('subKey')) {
                resetParams[data.subKey] = [];
            }

            _.forEach(vm[data.apiList], function (currentItem) {
                var value;
                (currentItem[data.apiAttribute]) ? value = currentItem[data.apiAttribute] : value = data.apiAttributeDefaultValue;
                var obj = convertResetParam(data.apiAttributeDefaultValueType, value);
                resetParams[data.modelname].push(obj);
                if (data.hasOwnProperty('subKey')) {
                    var subValue;
                    (currentItem[data.apiSubKeyAttribute]) ? subValue = currentItem[data.apiSubKeyAttribute] : subValue = data.apiSubKeyAttributeDefaultValue;
                    var obj = convertResetParam(data.apiSubKeyAttributeDefaultValueType, subValue);
                    resetParams[data.subKey].push(obj);
                }
            });

        }

        function autoGeneratePrimaryResetParam(data, AutoGenerateTemplateModelInfo, resetParams) {

            resetParams[data.modelname] = [];
            if (data.hasOwnProperty('subKey')) {
                resetParams[data.subKey] = [];
            }
            var arrLoop = ["primary", "secondary", "tertiary"];

            for (var i = 0; i < arrLoop.length; i++) {
                forEach(generatorTemplateData.request_params, function (data1) {
                    if (data1.hasOwnProperty(arrLoop[i]) && data.modelname == data1[arrLoop[i]]) {
                        if (AutoGenerateTemplateModelInfo.hasOwnProperty(data1.key) && utils.isNotEmptyVal(AutoGenerateTemplateModelInfo[data1.key])) {
                            var obj = AutoGenerateTemplateModelInfo[data1.key];
                            utils.isNotEmptyVal(data1.keyValue) ? obj = obj[data1.keyValue] : obj = obj;
                            if (!(obj == "undefined" || obj == null || obj == '')) {
                                obj = convertResetParam(data1.type, obj);
                            } else {
                                obj = convertResetParam(data1.defaultValueType, data1.defaultValue);
                            }
                            resetParams[data.modelname].push(obj);

                            if (data.hasOwnProperty('subKey')) {
                                if (AutoGenerateTemplateModelInfo.hasOwnProperty(data1.key) && utils.isNotEmptyVal(AutoGenerateTemplateModelInfo[data1.key])) {
                                    var resetParamsObj = data1
                                    var subObj = AutoGenerateTemplateModelInfo[data.modelname];
                                    var value = subKeySwitchCase(data, AutoGenerateTemplateModelInfo, resetParamsObj, subObj);
                                    resetParams[data.subKey].push(value);
                                } else {
                                    var resetParamsObj = data1;
                                    var value = convertResetParam(resetParamsObj.defaultSubValueType, resetParamsObj.defaultSubValue);
                                    resetParams[data.subKey].push(value);
                                }
                                resetParams[data.subKey].push(value);
                            }
                            generatorTemplateData.request_params.splice(_.indexOf(generatorTemplateData.request_params, _.findWhere(generatorTemplateData.request_params, { key: data1.key })), 1);
                        } else {
                            resetParams[data.modelname].push(convertResetParam(data1.defaultValueType, data1.defaultValue));
                            if (data.hasOwnProperty('subKey')) {
                                if (AutoGenerateTemplateModelInfo.hasOwnProperty(data1.key) && utils.isNotEmptyVal(AutoGenerateTemplateModelInfo[data1.key])) {
                                    var resetParamsObj = data1
                                    var subObj = AutoGenerateTemplateModelInfo[data.modelname];
                                    var value;
                                    value = subKeySwitchCase(data, AutoGenerateTemplateModelInfo, resetParamsObj, subObj);
                                    resetParams[data.subKey].push(value);
                                } else {
                                    var resetParamsObj = data1;
                                    var value = convertResetParam(resetParamsObj.defaultSubValueType, resetParamsObj.defaultSubValue);
                                    resetParams[data.subKey].push(value);
                                }
                                resetParams[data.subKey].push(value);
                            }
                            generatorTemplateData.request_params.splice(_.indexOf(generatorTemplateData.request_params, _.findWhere(generatorTemplateData.request_params, { key: data1.key })), 1);
                        }
                    }

                });
            }

        }

        function autoGenerateSubKeyResetParam(data, AutoGenerateTemplateModelInfo, resetParams) {

            if (AutoGenerateTemplateModelInfo.hasOwnProperty(data.modelname) && utils.isNotEmptyVal(AutoGenerateTemplateModelInfo[data.modelname])) {
                var resetParamsObj = (generatorTemplateData.request_params, _.findWhere(generatorTemplateData.request_params, { key: data.modelname }))
                var subObj = AutoGenerateTemplateModelInfo[data.modelname];
                var value = subKeySwitchCase(data, AutoGenerateTemplateModelInfo, resetParamsObj, subObj);
                resetParams[resetParamsObj.subKey] = value;
            } else {
                var resetParamsObj = (generatorTemplateData.request_params, _.findWhere(generatorTemplateData.request_params, { key: data.modelname }))
                var value = convertResetParam(resetParamsObj.defaultSubValueType, resetParamsObj.defaultSubValue);
                resetParams[resetParamsObj.subKey] = value;
            }

        }

        function autoGenerateMultipleSubKeyResetParam(data, AutoGenerateTemplateModelInfo, resetParams) {
            if (data.hasOwnProperty('multipleSubKey')) {
                resetParams[data.multipleSubKey] = [];
            }

            var resetParamsObj = (generatorTemplateData.request_params, _.findWhere(generatorTemplateData.request_params, { key: data.modelname }))

            resetParams[resetParamsObj.key] = [];
            if (AutoGenerateTemplateModelInfo.hasOwnProperty(resetParamsObj.key) && utils.isNotEmptyVal(AutoGenerateTemplateModelInfo[resetParamsObj.key])) {
                var obj = AutoGenerateTemplateModelInfo[resetParamsObj.key];
                for (var i = 0; i < AutoGenerateTemplateModelInfo[data.modelname].length; i++) {
                    var value;
                    var objValue;
                    utils.isNotEmptyVal(resetParamsObj.keyValue) ? objValue = obj[i][resetParamsObj.keyValue] : objValue = obj[i];
                    if (!(objValue == "undefined" || objValue == null || objValue == '')) {
                        value = convertResetParam(resetParamsObj.type, objValue);
                    } else {
                        value = convertResetParam(resetParamsObj.defaultValueType, resetParamsObj.defaultValue);
                    }
                    resetParams[resetParamsObj.key].push(value);
                }
            } else {
                resetParams[resetParamsObj.key].push(convertResetParam(resetParamsObj.defaultValueType, resetParamsObj.defaultValue));
            }

            if (AutoGenerateTemplateModelInfo.hasOwnProperty(data.modelname) && utils.isNotEmptyVal(AutoGenerateTemplateModelInfo[data.modelname])) {

                var subObj = AutoGenerateTemplateModelInfo[data.modelname];
                for (var i = 0; i < subObj.length; i++) {
                    var value = subKeySwitchCase(data, AutoGenerateTemplateModelInfo, resetParamsObj, subObj[i]);
                    resetParams[resetParamsObj.multipleSubKey].push(value);
                }

            } else {
                var resetParamsObj = (generatorTemplateData.request_params, _.findWhere(generatorTemplateData.request_params, { key: data.modelname }));
                var value = convertResetParam(resetParamsObj.defaultSubValueType, resetParamsObj.defaultSubValue);
                resetParams[resetParamsObj.multipleSubKey].push(value);

            }

            generatorTemplateData.request_params.splice(_.indexOf(generatorTemplateData.request_params, _.findWhere(generatorTemplateData.request_params, { key: data.modelname })), 1);

        }

        function autoGenerateMultipleKeyResetParam(data, AutoGenerateTemplateModelInfo, resetParams) {

            var resetParamsObj = (generatorTemplateData.request_params, _.findWhere(generatorTemplateData.request_params, { key: data.modelname }))

            resetParams[resetParamsObj.key] = [];
            if (AutoGenerateTemplateModelInfo.hasOwnProperty(resetParamsObj.key) && utils.isNotEmptyVal(AutoGenerateTemplateModelInfo[resetParamsObj.key])) {
                var obj = AutoGenerateTemplateModelInfo[resetParamsObj.key];
                for (var i = 0; i < AutoGenerateTemplateModelInfo[data.modelname].length; i++) {
                    var value;
                    var objValue;
                    utils.isNotEmptyVal(resetParamsObj.keyValue) ? objValue = obj[i][resetParamsObj.keyValue] : objValue = obj[i];
                    if (!(objValue == "undefined" || objValue == null || objValue == '')) {
                        value = convertResetParam(resetParamsObj.type, objValue);
                    } else {
                        value = convertResetParam(resetParamsObj.defaultValueType, resetParamsObj.defaultValue);
                    }
                    resetParams[resetParamsObj.key].push(value);
                }
            } else {
                resetParams[resetParamsObj.key].push(convertResetParam(resetParamsObj.defaultValueType, resetParamsObj.defaultValue));
            }

            generatorTemplateData.request_params.splice(_.indexOf(generatorTemplateData.request_params, _.findWhere(generatorTemplateData.request_params, { key: data.modelname })), 1);

        }


        function subKeySwitchCase(data, AutoGenerateTemplateModelInfo, resetParamsObj, subObj) {
            var value;
            switch (data.subKey || data.multipleSubKey) {
                case "defendantAttorneyTypes":
                case "medicalProviderType":
                    value = subObj[resetParamsObj.subKeyValue];
                    if (!(value == "undefined" || value == null || value == '')) {
                        value = convertResetParam(resetParamsObj.subType, value);
                        return value;
                    } else {
                        value = convertResetParam(resetParamsObj.defaultSubValueType, resetParamsObj.defaultSubValue);
                        return value;
                    }
                    break;
                case "plaintiffEmployerType":
                    utils.isNotEmptyVal(subObj[resetParamsObj.subKeyValue]) ? value = subObj[resetParamsObj.subKeyValue] : value = subObj;
                    if (!(value == "undefined" || value == null || value == '')) {
                        value = (value == "1") ? "Global" : "Local";
                        value = convertResetParam(resetParamsObj.subType, value);
                        return value;
                    } else {
                        value = convertResetParam(resetParamsObj.defaultSubValueType, resetParamsObj.defaultSubValue);
                        return value;
                    }
                    break;
                case "contactTypes":
                case "hospitalType":
                    utils.isNotEmptyVal(subObj[resetParamsObj.subKeyValue]) ? value = subObj[resetParamsObj.subKeyValue] : value = subObj;
                    if (!(value == "undefined" || value == null || value == '')) {
                        value = (value == "Global") ? "Global" : "Local";
                        value = convertResetParam(resetParamsObj.subType, value);
                        return value;
                    } else {
                        value = convertResetParam(resetParamsObj.defaultSubValueType, resetParamsObj.defaultSubValue);
                        return value;
                    }
                    break;
                case "NOTICE_DAY":
                case "SCHEDULED_DAY":
                    utils.isNotEmptyVal(subObj[resetParamsObj.subKeyValue]) ? value = subObj[resetParamsObj.subKeyValue] : value = subObj;
                    if (!(value == "undefined" || value == null || value == '')) {
                        var day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][subObj.getDay()];
                        value = day;
                        value = convertResetParam(resetParamsObj.subType, value);
                        return value;
                    } else {
                        value = convertResetParam(resetParamsObj.defaultSubValueType, resetParamsObj.defaultSubValue);
                        return value;
                    }
                    break;
                default:
            }
        }

        function convertResetParam(type, value) {
            switch (type) {
                case "string":
                    return value;
                    break;
                case "ArrayStringValue":
                    return [value];
                    break;
                case "int":
                    return parseInt(value);
                    break;
                case "ArrayIntValue":
                    return [parseInt(value)];
                    break;
                case "date":
                    return moment.unix(utils.getUTCTimeStamp(value)).utc().format('MM/DD/YYYY');
                    break;
                case "date_1":
                    return moment.unix(utils.getUTCTimeStamp(value)).utc().format('MMMM D, YYYY');
                    break;
                case "date_2":
                    var dateStr = moment.unix(utils.getUTCTimeStamp(value)).utc().format('Do') + " DAY OF " + moment.unix(utils.getUTCTimeStamp(value)).utc().format('MMMM') + " " + moment.unix(utils.getUTCTimeStamp(value)).utc().format('YYYY');
                    return dateStr;
                    break;
                case "TreatmentDate":
                    if (utils.isNotEmptyVal(value.servicedate) && utils.isNotEmptyVal(value.serviceenddate)) {
                        return moment.unix(value.servicedate).utc().format('MMMM D, YYYY') + '|' + moment.unix(value.serviceenddate).utc().format('MMMM D, YYYY');
                    } else if (utils.isNotEmptyVal(value.servicedate)) {
                        return moment.unix(value.servicedate).utc().format('MMMM D, YYYY') + '|' + " ";
                    } else if (utils.isNotEmptyVal(value.serviceenddate)) {
                        return " " + '|' + moment.unix(value.serviceenddate).utc().format('MMMM D, YYYY');
                    }
                    break;
                case "TreatmentDate_1":
                    if (utils.isNotEmptyVal(value.servicestartdate) && utils.isNotEmptyVal(value.serviceenddate)) {
                        return moment.unix(value.servicestartdate).utc().format('MMMM D, YYYY') + '|' + moment.unix(value.serviceenddate).utc().format('MMMM D, YYYY');
                    } else if (utils.isNotEmptyVal(value.servicestartdate)) {
                        return moment.unix(value.servicestartdate).utc().format('MMMM D, YYYY') + '|' + " ";
                    } else if (utils.isNotEmptyVal(value.serviceenddate)) {
                        return " " + '|' + moment.unix(value.serviceenddate).utc().format('MMMM D, YYYY');
                    }
                    break;
                case "MedicalBillAndInfoDate":
                    if (value.hasOwnProperty("medicalbillid")) {
                        if (utils.isNotEmptyVal(value.servicedate) && utils.isNotEmptyVal(value.serviceenddate)) {
                            return moment.unix(value.servicedate).utc().format('MMMM D, YYYY') + '|' + moment.unix(value.serviceenddate).utc().format('MMMM D, YYYY');
                        } else if (utils.isNotEmptyVal(value.servicedate)) {
                            return moment.unix(value.servicedate).utc().format('MMMM D, YYYY') + '|' + " ";
                        } else if (utils.isNotEmptyVal(value.serviceenddate)) {
                            return " " + '|' + moment.unix(value.serviceenddate).utc().format('MMMM D, YYYY');
                        }
                    }
                    else if (value.hasOwnProperty("medicaltreatmentid")) {
                        if (utils.isNotEmptyVal(value.servicestartdate) && utils.isNotEmptyVal(value.serviceenddate)) {
                            return moment.unix(value.servicestartdate).utc().format('MMMM D, YYYY') + '|' + moment.unix(value.serviceenddate).utc().format('MMMM D, YYYY');
                        } else if (utils.isNotEmptyVal(value.servicestartdate)) {
                            return moment.unix(value.servicestartdate).utc().format('MMMM D, YYYY') + '|' + " ";
                        } else if (utils.isNotEmptyVal(value.serviceenddate)) {
                            return " " + '|' + moment.unix(value.serviceenddate).utc().format('MMMM D, YYYY');
                        }
                    }
                    break;
                case "currency":
                    return $filter('currency')(value, '', 2);
                    break;
                case "key":
                    return value;
                    break;
                case "code_0":
                    return 0;
                    break;
                case "code_1":
                    return [0];
                    break;
                case "code_local_array":
                    return ["Local"];
                    break;
                case "undefined":
                    return undefined;
                    break;
                case "blank":
                    return '';
                    break;
                case "blank_array":
                    return [''];
                    break;
                case "multiple_int_array":
                    return value.map(Number);
                    break;
                default:
                    return value;
            }
        }
        /* End: Template Auto Generation Code  */

        /*function to generate template when user clicks on generate template*/
        function generateNewTemplate(TemplateModelInfo) {
            if (vm.configure_template != undefined) {
                if (vm.configure_template.template_type == 'new') {
                    var templateInfo = {}, resetParams = {}, params = {};
                    templateInfo = angular.copy(vm.TemplateModelInfo);
                    /**
                     * validation on generate template
                     */
                    // if ((templateInfo.template_code == "F1_46" && templateInfo.secondaryDefendantsAttorney.length > 5) || (templateInfo.template_code == "F1_45" && templateInfo.secondaryDefendantsAttorney.length > 5)) {
                    //     notificationService.error("Please select only 5 secondary defendants attorney");
                    //     return;
                    // }
                    params = [];
                    params = angular.copy(vm.configure_template.request_params.params);
                    // params.templateid = templateInfo.template_id;
                    params.intakeId = utils.isNotEmptyVal(templateInfo.intakeId) ? templateInfo.intakeId : 0;
                    params.templatetype = vm.templateDetailFromJava.template_type;
                    _.forEach(vm.configure_template.request_params.params, function (value, key) {
                        switch (value) {
                            case "plaintiffs":
                                _.forEach(templateInfo, function (templateValue, templateKey) {
                                    if (templateKey == value) {
                                        /*plantiffs model value returned by radio input is JSON, so it has to be convert into array*/
                                        if (typeof templateInfo.plaintiffs != "object") {
                                            if (!Array.isArray(templateInfo.plaintiffs) && utils.isNotEmptyVal(templateInfo.plaintiffs)) {
                                                params.plaintiff = JSON.parse(templateInfo.plaintiffs);
                                            }
                                        } else {
                                            params.plaintiff = templateInfo.plaintiffs;
                                        }
                                    }
                                });
                                break;

                            case "plaintiffEmployerIds":
                                params.plaintiffEmployerIds = (templateInfo.plaintiffEmployerIds != undefined) ? templateInfo.plaintiffEmployerIds : undefined;
                                break;
                            case "plaintiffEmployerIdsNew":
                                params.plaintiffEmployerIdsNew = (templateInfo.plaintiffEmployerIdsNew != undefined) ? templateInfo.plaintiffEmployerIdsNew : undefined;
                                break;
                            case "plaintiffEmployerIds_sec":
                                params.plaintiffEmployerIds_sec = (templateInfo.plaintiffEmployerIds_sec != undefined) ? templateInfo.plaintiffEmployerIds_sec : undefined;
                                break;
                            case "serviceDates":
                                params.serviceDates = (templateInfo.serviceDates != undefined) ? templateInfo.serviceDates : undefined;
                                break;
                            case "insuredParty":
                                params.insuredParty = (templateInfo.insuredParty != undefined) ? templateInfo.insuredParty : undefined;
                                break;
                            case "medicalProviderPhysicians":
                                params.medicalProviderPhysicians = (templateInfo.medicalProviderPhysicians != undefined) ? templateInfo.medicalProviderPhysicians : undefined;
                                break;
                            case "medicalServiceProvider":
                                params.medicalServiceProvider = (templateInfo.medicalServiceProvider != undefined) ? templateInfo.medicalServiceProvider : undefined;
                                break;
                            case "plaintiffEmployerIds_ter":
                                params.plaintiffEmployerIds_ter = (templateInfo.plaintiffEmployerIds_ter != undefined) ? templateInfo.plaintiffEmployerIds_ter : undefined;
                                break;
                            case "onlyInsuranceId":
                                params.onlyInsuranceId = (templateInfo.onlyInsuranceId != undefined) ? templateInfo.onlyInsuranceId : undefined;
                                break;
                            case "medicalproviderId":
                                params.medicalproviderId = (templateInfo.medicalproviderId != undefined) ? templateInfo.medicalproviderId : undefined;
                                break;
                            case "medicalproviderId2":
                                params.medicalproviderId2 = (templateInfo.medicalproviderId2 != undefined) ? templateInfo.medicalproviderId2 : undefined;
                                break;
                            case "medicalproviderId3":
                                params.medicalproviderId3 = (templateInfo.medicalproviderId3 != undefined) ? templateInfo.medicalproviderId3 : undefined;
                                break;
                            case "ServiceDate":
                                params.ServiceDate = (templateInfo.ServiceDate != undefined) ? templateInfo.ServiceDate : undefined;
                                break;
                            case "assign_user":
                                params.assign_user = (templateInfo.assign_user != undefined) ? templateInfo.assign_user : undefined;
                                break;
                            case "witnessId":
                                params.witnessId = (templateInfo.witnessId != undefined) ? templateInfo.witnessId : undefined;
                                break;
                            case "medicalServiceDates":
                                params.medicalServiceDates = (templateInfo.medicalServiceDates != undefined) ? templateInfo.medicalServiceDates : undefined;
                                break;
                            case "witnessId1":
                                params.witnessId1 = (templateInfo.witnessId1 != undefined) ? templateInfo.witnessId1 : undefined;
                                break;
                            case "physicianId":
                                params.physicianId = (templateInfo.physicianId != undefined) ? templateInfo.physicianId : undefined;
                                break;
                            case "custom_date":
                                (templateInfo.custom_date == undefined) ? params.custom_date = undefined : params.custom_date = utils.getUTCTimeStamp(templateInfo.custom_date);
                                break;
                            case "marriage_date":
                                (templateInfo.marriage_date == undefined) ? params.marriage_date = undefined : params.marriage_date = utils.getUTCTimeStamp(templateInfo.marriage_date);
                                break;
                            case "filling_date":
                                (templateInfo.filling_date == undefined) ? params.filling_date = undefined : params.filling_date = utils.getUTCTimeStamp(templateInfo.filling_date);
                                break;
                            case "date_Employed_From1":
                                (templateInfo.date_Employed_From1 == undefined) ? params.date_Employed_From1 = undefined : params.date_Employed_From1 = utils.getUTCTimeStamp(templateInfo.date_Employed_From1);
                                break;
                            case "date_Employed_From2":
                                (templateInfo.date_Employed_From2 == undefined) ? params.date_Employed_From2 = undefined : params.date_Employed_From2 = utils.getUTCTimeStamp(templateInfo.date_Employed_From2);
                                break;
                            case "date_Employed_From3":
                                (templateInfo.date_Employed_From3 == undefined) ? params.date_Employed_From3 = undefined : params.date_Employed_From3 = utils.getUTCTimeStamp(templateInfo.date_Employed_From3);
                                break;
                            case "date_Employed_To1":
                                (templateInfo.date_Employed_To1 == undefined) ? params.date_Employed_To1 = undefined : params.date_Employed_To1 = utils.getUTCTimeStamp(templateInfo.date_Employed_To1);
                                break;
                            case "date_Employed_To2":
                                (templateInfo.date_Employed_To2 == undefined) ? params.date_Employed_To2 = undefined : params.date_Employed_To2 = utils.getUTCTimeStamp(templateInfo.date_Employed_To2);
                                break;
                            case "date_Employed_To3":
                                (templateInfo.date_Employed_To3 == undefined) ? params.date_Employed_To3 = undefined : params.date_Employed_To3 = utils.getUTCTimeStamp(templateInfo.date_Employed_To3);
                                break;
                            case "textBoxOne":
                                (templateInfo.textBoxOne == undefined) ? params.textBoxOne = undefined : params.textBoxOne = templateInfo.textBoxOne;
                                break;
                            case "textBoxTwo":
                                (templateInfo.textBoxTwo == undefined) ? params.textBoxTwo = undefined : params.textBoxTwo = templateInfo.textBoxTwo;
                                break;
                            case "accidentTime":
                                (templateInfo.accidentTime == undefined) ? params.accidentTime = undefined : params.accidentTime = templateInfo.accidentTime;
                                break;
                            case "vehicleInformation":
                                (templateInfo.vehicleInformation == undefined) ? params.vehicleInformation = undefined : params.vehicleInformation = templateInfo.vehicleInformation;
                                break;
                            case "textBoxThree":
                                (templateInfo.textBoxThree == undefined) ? params.textBoxThree = undefined : params.textBoxThree = templateInfo.textBoxThree;
                                break;
                            case "textBoxFour":
                                (templateInfo.textBoxFour == undefined) ? params.textBoxFour = undefined : params.textBoxFour = templateInfo.textBoxFour;
                                break;
                            case "textBoxFive":
                                (templateInfo.textBoxFive == undefined) ? params.textBoxFive = undefined : params.textBoxFive = templateInfo.textBoxFive;
                                break;
                            case "textBoxSix":
                                (templateInfo.textBoxSix == undefined) ? params.textBoxSix = undefined : params.textBoxSix = templateInfo.textBoxSix;
                                break;
                            case "textBoxSeven":
                                (templateInfo.textBoxSeven == undefined) ? params.textBoxSeven = undefined : params.textBoxSeven = templateInfo.textBoxSeven;
                                break;
                            case "textBoxEight":
                                (templateInfo.textBoxEight == undefined) ? params.textBoxEight = undefined : params.textBoxEight = templateInfo.textBoxEight;
                                break;
                            case "textBoxNine":
                                (templateInfo.textBoxNine == undefined) ? params.textBoxNine = undefined : params.textBoxNine = templateInfo.textBoxNine;
                                break;
                            case "textBoxTen":
                                (templateInfo.textBoxTen == undefined) ? params.textBoxTen = undefined : params.textBoxTen = templateInfo.textBoxTen;
                                break;
                            case "userValueOne":
                                (templateInfo.userValueOne == undefined) ? params.userValueOne = undefined : params.userValueOne = templateInfo.userValueOne;
                                break;
                            case "userValueTwo":
                                (templateInfo.userValueTwo == undefined) ? params.userValueTwo = undefined : params.userValueTwo = templateInfo.userValueTwo;
                                break;
                            case "userValueThree":
                                (templateInfo.userValueThree == undefined) ? params.userValueThree = undefined : params.userValueThree = templateInfo.userValueThree;
                                break;
                            case "userValueFour":
                                (templateInfo.userValueFour == undefined) ? params.userValueFour = undefined : params.userValueFour = templateInfo.userValueFour;
                                break;
                            case "userValueFive":
                                (templateInfo.userValueFive == undefined) ? params.userValueFive = undefined : params.userValueFive = templateInfo.userValueFive;
                                break;
                            case "userValueSix":
                                (templateInfo.userValueSix == undefined) ? params.userValueSix = undefined : params.userValueSix = templateInfo.userValueSix;
                                break;
                            case "amountInWords":
                                params.amountInWords = (templateInfo.amountInWords != undefined) ? templateInfo.amountInWords : undefined;
                                break;
                            case "amountInNumbers":
                                params.amountInNumbers = (templateInfo.amountInNumbers != undefined) ? templateInfo.amountInNumbers : undefined;
                                break;
                            case "amountInNumbers1":
                                params.amountInNumbers1 = (templateInfo.amountInNumbers1 != undefined) ? templateInfo.amountInNumbers1 : undefined;
                                break;
                            case "amountInNumbers2":
                                params.amountInNumbers2 = (templateInfo.amountInNumbers2 != undefined) ? templateInfo.amountInNumbers2 : undefined;
                                break;
                            case "amountInNumbers3":
                                params.amountInNumbers3 = (templateInfo.amountInNumbers3 != undefined) ? templateInfo.amountInNumbers3 : undefined;
                                break;
                            case "amountInNumbers4":
                                params.amountInNumbers4 = (templateInfo.amountInNumbers4 != undefined) ? templateInfo.amountInNumbers4 : undefined;
                                break;
                            case "amountInNumbers5":
                                params.amountInNumbers5 = (templateInfo.amountInNumbers5 != undefined) ? templateInfo.amountInNumbers5 : undefined;
                                break;
                            case "amountInNumbers6":
                                params.amountInNumbers6 = (templateInfo.amountInNumbers6 != undefined) ? templateInfo.amountInNumbers6 : undefined;
                                break;
                            case "amountInNumbers7":
                                params.amountInNumbers7 = (templateInfo.amountInNumbers7 != undefined) ? templateInfo.amountInNumbers7 : undefined;
                                break;
                            case "amountInNumbers8":
                                params.amountInNumbers8 = (templateInfo.amountInNumbers8 != undefined) ? templateInfo.amountInNumbers8 : undefined;
                                break;
                            case "amountInNumbers9":
                                params.amountInNumbers9 = (templateInfo.amountInNumbers9 != undefined) ? templateInfo.amountInNumbers9 : undefined;
                                break;
                            case "amountInNumbers10":
                                params.amountInNumbers10 = (templateInfo.amountInNumbers10 != undefined) ? templateInfo.amountInNumbers10 : undefined;
                                break;

                        }
                    });
                    /** add extra paramters to template */
                    extraParams(templateInfo, params);
                    var APIFlag = vm.generatorTemplateData.template_api_call;
                    var templateCode = vm.configure_template.template_code;
                    var templateName = vm.templateDetailFromJava.template_name;
                    resetParams = setParams(templateInfo.template_code, params);
                    if (APIFlag == "java2") {
                        intakeTemplatestDatalayer.GenerateNewTemplateRecord(resetParams, APIFlag, templateName)
                            .then(function (response) {
                                var filename = templateName.replace('.', '-');
                                var linkElement = document.createElement('a');
                                try {
                                    var blob = new Blob([response], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
                                    var url = window.URL.createObjectURL(blob);

                                    linkElement.setAttribute('href', url);
                                    linkElement.setAttribute("download", filename + ".docx");

                                    var clickEvent = new MouseEvent("click", {
                                        "view": window,
                                        "bubbles": true,
                                        "cancelable": false
                                    });
                                    linkElement.dispatchEvent(clickEvent);
                                    vm.close();
                                } catch (ex) {
                                    console.log(ex);
                                }
                            }, function (error) {

                                if (localStorage.getItem('templateError') == "true") {
                                    notificationService.error('' + error.data);
                                    localStorage.setItem('templateError', "false");
                                }
                            });
                    }
                }
            } else {

                if (vm.TemplateModelInfo.matterId) {
                    vm.TemplateModelInfo.matterId = vm.TemplateModelInfo.matterId;
                } else {
                    vm.TemplateModelInfo.matterId = 0;
                }

                //user ids are seperated from  object
                //for each user id GenerateTemplateRecord will be called
                var plaintiffids = [];
                var defendantids = [];
                var associate_party_id = '';
                var templateInfo = {};
                templateInfo = angular.copy(vm.TemplateModelInfo);
                /*plantiffs model value returned by radio input is JSON, so it has to be convert into array*/
                if (!Array.isArray(templateInfo.plaintiffs) && utils.isNotEmptyVal(templateInfo.plaintiffs)) {
                    plaintiffids.push(JSON.parse(templateInfo.plaintiffs));
                    templateInfo.plaintiffs = plaintiffids;
                }
                if (!Array.isArray(templateInfo.defendants) && utils.isNotEmptyVal(templateInfo.defendants)) {
                    defendantids.push(JSON.parse(templateInfo.defendants));
                    templateInfo.defendants = defendantids;
                }
                /*set the parameters for generating template by type id and type of selected template*/
                switch (vm.option) {
                    case 'Plaintiff':
                        if (templateInfo.typeId == 18) {
                            templateInfo.userlist = _.pluck(templateInfo.plaintiffs, 'contactid');
                        } else if (templateInfo.typeId == 23) {
                            templateInfo.userlist = _.pluck(templateInfo.plaintiffs, 'plaintiffid');
                            templateInfo.associate_party_id = templateInfo.plaintiffs[0].employerid
                        } else {
                            templateInfo.userlist = _.pluck(templateInfo.plaintiffs, 'plaintiffid');
                        }
                        break;

                }
                //download template for entered template info    
                downloadTemplate(templateInfo);
            }
        }
        /*geneate template by calling function of template data layer*/
        function downloadTemplate(templateObj) {
            templateHelper.setTemplateObj(templateObj, vm.option);
            var plaintiffArr = [];
            localStorage.setItem('templateError', "true");
            if (vm.option != "PlaintiffDefendant" || (vm.option == "PlaintiffDefendant" && (templateObj.typeId == 17 || templateObj.typeId == 25 || templateObj.typeId == 26))) {
                _.forEach(templateObj.userlist, function (user, index) {
                    if (templateObj.plaintiffs == undefined) {
                        intakeTemplatestDatalayer.GenerateTemplateRecord(
                            templateObj.template_id, // template id
                            templateObj.lexvia_template,
                            templateObj.matterId, // matter id
                            (templateObj.typeId == 20) ? templateObj.contactId : user.defendantId, // user.defendantId ------ contact id or defendant id
                            (templateObj.typeId == 23) ? '' : user.plaintiffId, // plaintiff id
                            (templateObj.typeId == 23) ? templateObj.insuranceproviderid : user.RequiredAssociateId, // insurance provider id
                            vm.option, // option 
                            templateObj.typeId, // type id for temmplate
                            templateObj.leadattorneyid, // lead attorney id
                            templateObj.paralegalid, // paralegal id
                            (templateObj.showsocialsecuritynumber == '1') ? '1' : '0',
                            templateObj.secondleadattorneyid, // second lead attorney id
                            templateObj.secondparalegalid, // second paralegal id
                            (templateObj.typeId == 20) ? templateObj.contactType : undefined)
                            .then(function (response) {
                                intakeTemplatestDatalayer.DownloadTemplate(response.data).
                                    then(function (response) {
                                        window.open(response.data, '_blank');
                                        vm.close();
                                    });
                            }, function (response) {
                                if (localStorage.getItem('templateError') == "true") {
                                    notificationService.error('' + response.data);
                                    localStorage.setItem('templateError', "false");
                                }
                            });
                    } else {
                        // _.forEach(templateObj.plaintiffs, function (plaintiff) {
                        intakeTemplatestDatalayer.GenerateTemplateRecord(
                            templateObj.template_id, // template id
                            templateObj.lexvia_template,
                            templateObj.matterId, // matter id
                            (templateObj.typeId == 20) ? templateObj.contactId : user.defendantId, // user.defendantId ------ contact id or defendant id
                            (templateObj.typeId == 23) ? templateObj.plaintiffs[index] : templateObj.plaintiffs[index].plaintiffid, // plaintiff id
                            (templateObj.typeId == 23) ? templateObj.insuranceproviderid : user.RequiredAssociateId, // insurance provider id
                            vm.option, // option 
                            templateObj.typeId, // type id for temmplate
                            templateObj.leadattorneyid, // lead attorney id
                            templateObj.paralegalid, // paralegal id
                            (templateObj.showsocialsecuritynumber == '1') ? '1' : '0',
                            templateObj.secondleadattorneyid, // second lead attorney id
                            templateObj.secondparalegalid, // second paralegal id
                            (templateObj.typeId == 20) ? templateObj.contactType : undefined)
                            .then(function (response) {
                                intakeTemplatestDatalayer.DownloadTemplate(response.data).
                                    then(function (response) {
                                        window.open(response.data, '_blank');
                                        vm.close();
                                    });
                            }, function (response) {
                                if (localStorage.getItem('templateError') == "true") {
                                    notificationService.error('' + response.data);
                                    localStorage.setItem('templateError', "false");
                                }
                            });
                        // });
                    }

                });
            } else {
                _.forEach(templateObj.plaintiffids, function (plaintiff_id) {
                    _.forEach(templateObj.defendantids, function (defendant_id) {
                        intakeTemplatestDatalayer.GenerateTemplateRecord(
                            templateObj.template_id,
                            templateObj.lexvia_template,
                            templateObj.matterId,
                            defendant_id,
                            plaintiff_id,
                            (templateObj.typeId == 6 || templateObj.typeId == 7) ? templateObj.insuranceproviderid : templateObj.associate_party_id,
                            vm.option,
                            (templateObj.showsocialsecuritynumber == '1') ? '1' : '0')
                            .then(function (response) {
                                intakeTemplatestDatalayer.DownloadTemplate(response.data).
                                    then(function (response) {
                                        window.open(response.data, '_blank');
                                        vm.close();
                                    });
                            }, function (error) {
                                if (utils.isEmptyVal(error.data)) {
                                    notificationService.error('An error occurred. Please try later.');
                                } else {
                                    if (localStorage.getItem('templateError') == "true") {
                                        notificationService.error('' + error.data);
                                        localStorage.setItem('templateError', "false");
                                    }
                                }
                            });
                    });
                });
            }
        }



        /**
         * Start: Create Function here and Get Data For ex. getPlaintiff, defendant, lien etc....
         */

        /* Start:  function to get plaintiffs*/
        function getPlaintiffdetails() {
            if (vm.callCheck == 1) {
                var intakeId = vm.TemplateModelInfo.matterId ? vm.TemplateModelInfo.matterId : vm.TemplateModelInfo.intakeId;
                intakeFactory.getPlaintiffById(intakeId)
                    .then(function (response) {
                        var data = response;
                        _.forEach(data, function (contactPlantiff) {
                            if (contactPlantiff.contact) {
                                contactFactory.formatContactAddress(contactPlantiff.contact);
                            }
                            if (contactPlantiff.estateAdminId) {
                                contactFactory.formatContactAddress(contactPlantiff.estateAdminId);
                            }
                            if (contactPlantiff.poa) {
                                contactFactory.formatContactAddress(contactPlantiff.poa);
                            }
                            intakeTemplateHelper.setNamePropForPlaintiff(data);
                            vm.plaintiff_dropdown = data;


                            //Medical provider dropdown
                            if (utils.isNotEmptyVal(contactPlantiff.intakeMedicalRecords)) {
                                vm.medicalProviderData = utils.isNotEmptyVal(contactPlantiff.intakeMedicalRecords[0].intakeMedicalProviders) ? contactPlantiff.intakeMedicalRecords[0].intakeMedicalProviders : null;
                            }

                            _.forEach(vm.medicalProviderData, function (obj) {
                                var medProviderObj = {};
                                var physicianObj = {};
                                var dateObj = {};

                                // Calculation for service dates
                                if ((obj.serviceStartDate != 0) && (obj.serviceEndDate != 0)) {
                                    dateObj.servicedate = 'Start: ' + moment.unix(obj.serviceStartDate).utc().format('MM/DD/YYYY') + ' |  End: ' + moment.unix(obj.serviceEndDate).utc().format('MM/DD/YYYY');
                                    vm.serviceStartEndDates.push(dateObj);
                                } else if ((obj.serviceStartDate != 0)) {
                                    dateObj.servicedate = 'Start: ' + moment.unix(obj.serviceStartDate).utc().format('MM/DD/YYYY') + ' |  End: ' + " ";
                                    vm.serviceStartEndDates.push(dateObj);
                                } else if ((obj.serviceEndDate != 0)) {
                                    dateObj.servicedate = 'Start: ' + " " + ' |  End: ' + moment.unix(obj.serviceEndDate).utc().format('MM/DD/YYYY');
                                    vm.serviceStartEndDates.push(dateObj);
                                }
                                // Calculation for Medical Provider
                                if (obj.medicalProviders) {
                                    obj.medicalProviders.contact_name = utils.isNotEmptyVal(obj.medicalProviders.lastName) ? obj.medicalProviders.firstName + " " + obj.medicalProviders.lastName : obj.medicalProviders.firstName;

                                    medProviderObj.contactName = obj.medicalProviders.contact_name;
                                    medProviderObj.contactId = obj.medicalProviders.contactId;
                                    medProviderObj.treatmentId = obj.intakeMedicalRecordId;
                                    medProviderObj.phoneCell = obj.medicalProviders.phoneCell;
                                    medProviderObj.phoneHome = obj.medicalProviders.phoneHome;
                                    medProviderObj.phoneWork = obj.medicalProviders.phoneWork;
                                    medProviderObj.serviceEndDate = obj.medicalProviders.serviceEndDate;
                                    medProviderObj.serviceStartDate = obj.medicalProviders.serviceStartDate

                                    vm.medicalProvider_dropdown.push(medProviderObj);
                                }
                                // Calculation for Physician
                                if (obj.physician) {
                                    obj.physician.contact_name = utils.isNotEmptyVal(obj.physician.lastName) ? obj.physician.firstName + " " + obj.physician.lastName : obj.physician.firstName;

                                    physicianObj.contactName = obj.physician.contact_name;
                                    physicianObj.contactId = obj.physician.contactId;
                                    physicianObj.phoneCell = obj.physician.phoneCell;
                                    physicianObj.phoneHome = obj.physician.phoneHome;
                                    physicianObj.phoneWork = obj.physician.phoneWork;

                                    vm.physician_dropdown.push(obj.physician);
                                }

                                // Object for med provider and Medical Record Id
                                var dataObj = {
                                    "medProvider": medProviderObj,
                                    "physician": physicianObj,
                                    "treatmentId": medProviderObj.treatmentId,
                                    "medProviderName": medProviderObj.contactName,
                                    "serviceStartEndDates": dateObj.servicedate
                                };
                                vm.medicalProviderAndPhysician.push(dataObj);
                            });

                            //Medical provider dropdown_New
                            if (utils.isNotEmptyVal(contactPlantiff.intakeMedicalRecords)) {
                                var medicalProvider = utils.isNotEmptyVal(contactPlantiff.intakeMedicalRecords[0].intakeMedicalProviders) ? contactPlantiff.intakeMedicalRecords[0].intakeMedicalProviders : null;

                                _.forEach(medicalProvider, function (obj) {
                                    var medicalPhysicianObj = {};
                                    if (obj.medicalProviders != null) {
                                        obj.medicalProviders.contact_name = utils.isNotEmptyVal(obj.medicalProviders.lastName) ? obj.medicalProviders.firstName + " " + obj.medicalProviders.lastName : obj.medicalProviders.firstName;
                                        medicalPhysicianObj.medicalProvider = obj.medicalProviders;
                                    }
                                    if (obj.physician != null) {
                                        obj.physician.contact_name = utils.isNotEmptyVal(obj.physician.lastName) ? obj.physician.firstName + " " + obj.physician.lastName : obj.physician.firstName;
                                        medicalPhysicianObj.physician = obj.physician;
                                    }

                                    if (utils.isEmptyObj(medicalPhysicianObj)) {
                                        return;
                                    }
                                    else {
                                        vm.medicalProviderAndPhysicianNew.push(medicalPhysicianObj);
                                    }

                                });
                            }

                            //Medical provider Only
                            if (utils.isNotEmptyVal(contactPlantiff.intakeMedicalRecords)) {
                                var medicalProvider = utils.isNotEmptyVal(contactPlantiff.intakeMedicalRecords[0].intakeMedicalProviders) ? contactPlantiff.intakeMedicalRecords[0].intakeMedicalProviders : null;

                                _.forEach(medicalProvider, function (obj) {
                                    var medicalProviderObj = {};
                                    if (obj.medicalProviders != null) {
                                        obj.medicalProviders.contact_name = utils.isNotEmptyVal(obj.medicalProviders.lastName) ? obj.medicalProviders.firstName + " " + obj.medicalProviders.lastName : obj.medicalProviders.firstName;
                                        medicalProviderObj = obj.medicalProviders;
                                    }

                                    if (utils.isEmptyObj(medicalProviderObj)) {
                                        return;
                                    }
                                    else {
                                        vm.medicalProviderOnly.push(medicalProviderObj);
                                    }

                                });
                            }

                            //Only Physician Data
                            if (utils.isNotEmptyVal(contactPlantiff.intakeMedicalRecords)) {
                                var medicalProvider = utils.isNotEmptyVal(contactPlantiff.intakeMedicalRecords[0].intakeMedicalProviders) ? contactPlantiff.intakeMedicalRecords[0].intakeMedicalProviders : null;

                                _.forEach(medicalProvider, function (obj) {
                                    var physicianObj = {};

                                    if (obj.physician != null) {
                                        physicianObj.physician = obj.physician;
                                        vm.onlyPhysicians.push(physicianObj.physician);
                                    }
                                });
                            }

                            //Start date of Service and End Date of Service
                            if (utils.isNotEmptyVal(contactPlantiff.intakeMedicalRecords)) {
                                var medicalProvider = utils.isNotEmptyVal(contactPlantiff.intakeMedicalRecords[0].intakeMedicalProviders) ? contactPlantiff.intakeMedicalRecords[0].intakeMedicalProviders : null;

                                var serviceEndDate, serviceStartDate;
                                _.forEach(medicalProvider, function (currentItem) {
                                    serviceEndDate = currentItem.serviceEndDate;
                                    serviceStartDate = currentItem.serviceStartDate

                                    var dataObj = {
                                        "serviceEndDate": serviceEndDate,
                                        "serviceStartDate": serviceStartDate,
                                    };
                                    vm.medicalProviderServiceDates.push(dataObj);
                                });
                            }

                            _.forEach(vm.medicalProviderServiceDates, function (currentItem) {
                                if ((currentItem.serviceStartDate != 0) && (currentItem.serviceEndDate != 0)) {
                                    currentItem.startEndDate = 'Start: ' + moment.unix(currentItem.serviceStartDate).utc().format('MM/DD/YYYY') + ' |  End: ' + moment.unix(currentItem.serviceEndDate).utc().format('MM/DD/YYYY');
                                    vm.medicalInfoDates.push(currentItem);
                                }
                                else if ((currentItem.serviceStartDate != 0)) {
                                    currentItem.startEndDate = 'Start: ' + moment.unix(currentItem.serviceStartDate).utc().format('MM/DD/YYYY') + ' |  End: ' + " ";
                                    vm.medicalInfoDates.push(currentItem);
                                }
                                else if ((currentItem.serviceEndDate != 0)) {
                                    currentItem.startEndDate = 'Start: ' + " " + ' |  End: ' + moment.unix(currentItem.serviceEndDate).utc().format('MM/DD/YYYY');
                                    vm.medicalInfoDates.push(currentItem);
                                }
                            });


                            //Witness dropdown
                            if (utils.isNotEmptyVal(contactPlantiff.intakeWitnesses)) {
                                var witness = contactPlantiff.intakeWitnesses;

                                _.forEach(witness, function (data) {
                                    data.contact_name = utils.isNotEmptyVal(data.contact.lastName) ? data.contact.firstName + " " + data.contact.lastName : data.contact.firstName;
                                    vm.witness_dropdown.push(data);
                                });
                            }

                            //Insurance Provider dropdown
                            if (utils.isNotEmptyVal(contactPlantiff.insuranceInfos)) {
                                var InsuranceInfo = contactPlantiff.insuranceInfos;

                                _.forEach(InsuranceInfo, function (data) {
                                    if (utils.isNotEmptyVal(data.insuranceProvider)) {
                                        data.insuranceProvider.contact_name = utils.isNotEmptyVal(data.insuranceProvider.lastName) ? data.insuranceProvider.firstName + " " + data.insuranceProvider.lastName : data.insuranceProvider.firstName;
                                        data.insuranceProvider.intakeInsuranceId = data.intakeInsuranceId;
                                        vm.insuranceProvider_dropdown.push(data.insuranceProvider);
                                    }
                                });
                            }

                            //Insurance Provider,Adjuster,Claim number dropdown
                            if (utils.isNotEmptyVal(contactPlantiff.insuranceInfos)) {
                                var InsuranceInfo1 = contactPlantiff.insuranceInfos;

                                _.forEach(InsuranceInfo1, function (data) {
                                    if (utils.isNotEmptyVal(data.insuranceProvider)) {
                                        vm.insurance_dropdown.push(data);
                                    }
                                });
                            }

                            //Insured Party, Adjuster and Insurance Provider Only
                            if (utils.isNotEmptyVal(contactPlantiff.insuranceInfos)) {
                                var InsuranceInfo = contactPlantiff.insuranceInfos;

                                _.forEach(InsuranceInfo, function (currentItem) {
                                    var insuranceObj = {};
                                    if (currentItem.adjuster != null) {
                                        insuranceObj.adjusterName = currentItem.adjuster.firstName + " " + currentItem.adjuster.lastName;
                                        insuranceObj.adjusterContactID = currentItem.adjuster.contactId;
                                    }
                                    if (currentItem.insuranceProvider != null) {
                                        insuranceObj.insuranceProviderName = currentItem.insuranceProvider.firstName + " " + currentItem.insuranceProvider.lastName;
                                        insuranceObj.insuranceProviderContactID = currentItem.insuranceProvider.contactId;
                                    }
                                    if (currentItem.insuredParty[0] != null) {
                                        insuranceObj.insuredPartyName = currentItem.insuredParty[0].firstName + " " + currentItem.insuredParty[0].lastName;
                                        insuranceObj.insuredPartyContactID = currentItem.insuredParty[0].contactId;
                                    }
                                    insuranceObj.intakeInsuranceId = currentItem.intakeInsuranceId;
                                    insuranceObj.claimNumber = currentItem.claimNumber;
                                    insuranceObj.excessConfirmed = currentItem.excessConfirmed;
                                    insuranceObj.insuranceType = currentItem.insuranceType;
                                    insuranceObj.policyExhausted = currentItem.policyExhausted;
                                    insuranceObj.policyLimit = currentItem.policyLimit;
                                    insuranceObj.policyLimitMax = currentItem.policyLimitMax;
                                    insuranceObj.policyNumber = currentItem.policyNumber;
                                    insuranceObj.type = currentItem.type;

                                    if (utils.isEmptyObj(insuranceObj)) {
                                        return;
                                    }
                                    else {
                                        vm.insuranceInsuredAdjuster.push(insuranceObj);
                                    }
                                });
                            }


                        });
                    }, function (error) {

                    });
                vm.callCheck = vm.callCheck + 1;
            }
        }

        // function to get employer details
        function getPlaintiffEmployers(plaintiffs) {
            vm.employer_dropdown = [];

            if (utils.isNotEmptyVal(plaintiffs.intakeEmployer)) {
                _.forEach(plaintiffs.intakeEmployer, function (employer) {
                    var obj = {};
                    obj.intakeEmployerName = employer.contact.firstName + ' ' + (utils.isNotEmptyVal(employer.contact.lastName) ? obj.contact.lastName : '');
                    obj.intakeEmployerId = utils.isNotEmptyVal(employer) ? parseInt(employer.intakeEmployerId) : '';

                    vm.employer_dropdown.push(obj);
                });
            }
        }

        // Function to get intake overview details
        function getIntakeInfo() {
            var intakeId = vm.TemplateModelInfo.matterId ? vm.TemplateModelInfo.matterId : vm.TemplateModelInfo.intakeId;
            var dataObj = {
                "page_number": 1,
                "page_size": 250,
                "intake_id": intakeId,
                "is_migrated": 2
            };
            var promise = intakeFactory.getMatterList(dataObj);
            promise
                .then(function (response) {
                    var matterInfo = response.intakeData[0];
                    vm.referredById = utils.isNotEmptyVal(matterInfo.referredBy) ? matterInfo.referredBy : "";

                    // Intake assigned user
                    if (utils.isNotEmptyVal(matterInfo.assignedUser)) {
                        _.forEach(matterInfo.assignedUser, function (data) {
                            vm.assignUsers.push(data);
                        });
                    }
                }, function (error) {
                });
        }

        /* Start:  function to get plaintiffs*/

        /** Todo: Added Required Function here */

        /**
         * End: Create Function here and Get Data For ex. getPlaintiff, defendant, lien etc....
         */


    }
})();

(function (angular) {

    angular.module('intake.templates')
        .factory('intakeTemplateHelper', intakeTemplateHelper);


    function intakeTemplateHelper() {
        return {
            setNamePropForPlaintiff: _setNamePropForPlaintiff,
        };

        function _setNamePropForPlaintiff(plaintiffs) {
            _.forEach(plaintiffs, function (plaintiff) {
                plaintiff.name = utils.isNotEmptyVal(plaintiff.contact) ? (plaintiff.contact.firstName + " " + plaintiff.contact.lastName) : '';
                plaintiff.contactId = utils.isNotEmptyVal(plaintiff.contact) ? plaintiff.contact.contactId : '';
            });
        }

    }

})(angular);
