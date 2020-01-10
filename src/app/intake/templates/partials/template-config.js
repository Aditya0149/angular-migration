angular.module('intake.templates')
    .constant('intakeTemplateConstants', {

        intaketemplateDetails: [
            { template_api_call: "java2", template_code: "DLT09", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1423_6", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1423_7", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1353_12", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1275_15", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1244_4", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1244_3", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1244_2", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1244_1", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1226_1364", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1226_1107", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1226_1106", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1226_1100", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1166_9", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1153_10", option: 'Nothing' },
            { template_api_call: "java2", template_code: "F1153_9", option: 'Nothing' },
            { template_api_call: "java2", template_code: "F1143_133", option: 'Nothing' },
            { template_api_call: "java2", template_code: "F1309_12", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1309_14", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1309_3", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1309_21", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1309_28", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1309_29", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1479_13", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1473_8", option: 'auto_generate' },

            { template_api_call: "java2", template_code: "F1563_11", option: 'Nothing' },
            { template_api_call: "java2", template_code: "F1563_12", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1563_13", option: 'Nothing' },
            { template_api_call: "java2", template_code: "F1563_14", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1563_15", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1563_16", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1563_17", option: 'auto_generate' },

            { template_api_call: "java2", template_code: "F1125_41", option: 'auto_generate' },
            { template_api_call: "java2", template_code: "F1125_42", option: 'auto_generate' }

        ],
        contactGroupBy: ['Defendant', 'Other Party', 'Insurance Adjuster', 'Insurance Provider', 'Insurance Party', 'Plaintiff', 'Service Provider', 'Physician', 'Medical Bills Service Provider', 'Lien Insurance Provider', 'Lien Holder', 'Lien Adjuster'],
        paralegalGroupBy: ['Attorney', 'Paralegal', 'Partner', 'Staffs'],
        allAttorneysGroupBy: ['Attorney', 'Partner'],
        plaintiffDefendantGroupBy: ['Plaintiff', 'Defendant'],
        serviceProvidersGroup: ['Service Provider', 'Insurance Provider', 'Physician']
    });