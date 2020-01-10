(function (angular) {
    'use strict';
    angular.module('cloudlex.templates')
        .controller('TemplateCtrl', TemplateCtrl)

    TemplateCtrl.$inject = ['$scope', '$stateParams', '$modal', 'templateManagementHelper', 'globalConstants', 'templatestDatalayer', 'notification-service', 'modalService', 'templateConstants', '$http', 'matterFactory'];

    function TemplateCtrl($scope, $stateParams, $modal, templateManagementHelper, globalConstants, templatestDatalayer, notificationService, modalService, templateConstants, $http, matterFactory) {
        var vm = this;
        vm.openAddTemplateModal = openAddTemplateModal;
        vm.EditTemplateInfo = EditTemplateInfo;
        vm.DeleteTemplate = DeleteTemplate;
        vm.GenerateTemplate = GenerateTemplate;
        vm.showPaginationButtons = showPaginationButtons;
        vm.getMore = getMore;
        vm.getAll = getAll;
        vm.filterTemplateList = filterTemplateList;
        vm.reset = reset;
        vm.template_config = [];
        vm.auto_template_config = [];
        vm.clickSearch = clickSearch;
        vm.filterRetain = filterRetain;
        vm.sortTemplate = sortTemplate;
        if ($scope.sideNav) {
            vm.outerWrapFlag = $scope.sideNav.display.openDrawer;
        } else {
            vm.outerWrapFlag = '';
        }


        (function () {
            vm.templateGrid = {
                headers: templateManagementHelper.getTemplateGrid(),
            };
            vm.display = templateManagementHelper.temDisplayOptions();
            vm.filter = {
                pageNum: 1,
                pageSize: globalConstants.pageSize,
                categoryfilter: '',
                sortbyfilter: ''
            };
            if ($stateParams.matterId) {
                vm.matterId = $stateParams.matterId;
                vm.matterInfo = matterFactory.getMatterData(vm.matterId);
            } else {
                vm.matterId = 0;
            }
            vm.dataReceived = false;

            templatestDatalayer.getTemplateCatgegory().then(function (response) {
                vm.templateCategories = response.data;
            }, function () {
                alert("cannot get template categories");
            });

            var localfilter = JSON.parse(localStorage.getItem("templateFilter"));
            if (localfilter) {
                localfilter.pageSize = globalConstants.pageSize;
                localStorage.setItem("templateFilter", JSON.stringify(localfilter));
            }

            getTemplateList(vm.filter);

            /**
             * get json configuration for new template
             */
            $http.get('/templates/partials/template_generate_config.json').success(function (response) {
                vm.template_config = response;
            });

            $http.get('/templates/partials/auto_template_generate_config.json').success(function (response) {
                vm.auto_template_config = response;
            });

            var globalTemFilterText = (sessionStorage.getItem("globalTemFilterText")) ? JSON.parse(sessionStorage.getItem("globalTemFilterText")) : '';
            if (utils.isNotEmptyVal(globalTemFilterText)) {
                if (vm.matterId == globalTemFilterText.matterId) {
                    vm.showSearch = true;
                    vm.filterText = globalTemFilterText.filtertext;
                } else {
                    vm.filterText = "";
                }
            }
        })();
        function clickSearch(event) {
            vm.showSearch = true;
        }
        function filterRetain() {
            var retainSearch = {};
            retainSearch.filtertext = vm.filterText;
            retainSearch.matterId = vm.matterId;
            sessionStorage.setItem("globalTemFilterText", JSON.stringify(retainSearch));
        }
        function sortTemplate($sortby, $sortorder, $label) {
            vm.filter.pageNum = 1;
            vm.display.sortby = $sortby;
            vm.display.sortorder = $sortorder;
            vm.display.sortSeleted = $label;
            var filterValues = {
                pageNum: 1,
                pageSize: vm.filter.pageSize === 'all' ? vm.filter.pageSize : globalConstants.pageSize,
                sortbyfilter: vm.display.sortby,
                categoryfilter: vm.newTemplateInfo && vm.newTemplateInfo.category_id ? vm.newTemplateInfo.category_id : ''
            }
            var retainFilter = localStorage.setItem("templateFilter", JSON.stringify(filterValues));
            getTemplateList(filterValues);
        }
        /* function searchTemp(item){
              return item.template_name.match(vm.filterText) ? true : false;
         }*/
        function reset() {
            var localfilter = JSON.parse(localStorage.getItem("templateFilter"));
            if (vm.newTemplateInfo) {
                vm.newTemplateInfo.category_id = '';
            }

            vm.filterText = "";
            sessionStorage.setItem("globalTemFilterText", vm.filterText);
            vm.filter.sortbyfilter = '';
            vm.display.sortSeleted = 'Last Updated';
            localfilter.categoryfilter = '';
            localfilter.sortbyfilter = "";
            localStorage.setItem("templateFilter", JSON.stringify(localfilter));
            getTemplateList(localfilter);
        }

        function filterTemplateList(catId) {
            var filterValues = {
                pageNum: 1,
                pageSize: globalConstants.pageSize,
                categoryfilter: catId,
                sortbyfilter: vm.display.sortby
            };
            var retainFilter = localStorage.setItem("templateFilter", JSON.stringify(filterValues));  //Bug#6661 Template filter retaintion
            getTemplateList(filterValues);
        }

        function getTemplateList(filter) {
            //Bug#6661 Template filter retaintion
            var localfilter = localStorage.getItem("templateFilter");
            localfilter = JSON.parse(localfilter);
            if (utils.isNotEmptyVal(localfilter)) {
                filter = localfilter;
                vm.newTemplateInfo = {};
                vm.newTemplateInfo.category_id = filter.categoryfilter;
                vm.filter.sortbyfilter = filter.sortbyfilter;
                if (filter.sortbyfilter == 2) {
                    vm.display.sortSeleted = 'Template Name DESC';
                } else if (filter.sortbyfilter == 1) {
                    vm.display.sortSeleted = 'Template Name ASC';
                }
            }

            templatestDatalayer.getTemplateList(filter)

                .then(function (response) {
                    vm.filter.pageSize = filter.pageSize;
                    vm.filter.sortbyfilter = filter.sortbyfilter;
                    var data = response.data;
                    vm.templateList = data;
                    /*new unique id as template_type_id is created for each template to fix template_id duplication*/
                    var i = 1;
                    _.forEach(vm.templateList, function (template) {
                        template.template_type_id = i;
                        i++;
                    });

                    vm.dataReceived = true;
                });
        }


        function openAddTemplateModal(mode, templateInfo) {
            var modalInstance = $modal.open({
                templateUrl: 'app/templates/add-edit-template.html',
                controller: 'AddTemplateCtrl as AddTemplate',
                windowClass: 'modelLargeDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    TemplateId: function () {
                        return mode === 'add' ? {} : templateInfo;
                    }
                }
            });
            modalInstance.result.then(function () {
                getTemplateList(vm.filter);
            })
            if (vm.newTemplateInfo) {
                vm.newTemplateInfo.category_id = '';
            }
        }

        function EditTemplateInfo($event, templateInfo) {
            vm.pageMode = 'edit';
            openAddTemplateModal('edit', templateInfo);
            if (vm.newTemplateInfo) {
                vm.newTemplateInfo.category_id = '';
            }
        }

        function DeleteTemplate($event, templateInfo) {
            var template_id = templateInfo.template_id;
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {

                templatestDatalayer.deleteTemplateRecord(template_id)
                    .then(function () {
                        getTemplateList(vm.filter);
                        //alert("deleted successfully");
                        notificationService.success('Template deleted successfully.');
                    }, function () {
                        //alert("unable to delete");
                        notificationService.error('An error occurred. Please try later.');
                    });
            });
            if (vm.newTemplateInfo) {
                vm.newTemplateInfo.category_id = '';
            }
        }


        function GenerateTemplate($event, templateInfo) {

            if (templateInfo.hasOwnProperty("flag")) {
                var resolveObj = {
                    matterId: $stateParams.matterId,
                    template_name: templateInfo.template_name,
                    template_id: templateInfo.id,
                    template_code: templateInfo.template_code,
                    typeId: templateInfo.template_type,
                };
                var modalInstance = openAutoGenerateTemplateModal(resolveObj, templateInfo);
            } else {
                var templateOption = "";
                var templateOptionHold = "";
                var templateApiCall = "";
                var templateName = "";
                var templateId = "";
                var matterId = "";
                var typeId = "";
                _.forEach(templateConstants.templateDetails, function (templateDetail) {

                    if (templateDetail.template_code == templateInfo.template_code) {
                        templateOption = templateDetail.option;
                        templateApiCall = templateDetail.template_api_call;
                        templateName = templateDetail.template_name;
                        matterId = $stateParams.matterId;
                        typeId = templateDetail.typeId;
                        if (utils.isNotEmptyVal(templateOption)) {
                            templateOptionHold = templateOption;
                        }
                    }
                });
                if (templateOptionHold == 'auto_generate') {
                    var resolveObj = {
                        matterId: $stateParams.matterId,
                        lexvia_template: templateInfo.lexviatemplate,
                        template_name: templateInfo.template_name,
                        template_id: templateInfo.template_id,
                        option: templateOptionHold,
                        template_code: templateInfo.template_code,
                        typeId: typeId
                    };

                    var temp_code = '';
                    var generatorTemplateData = '';
                    _.forEach(vm.auto_template_config, function (tempKey) {
                        if (tempKey.template_code == resolveObj.template_code) {
                            generatorTemplateData = tempKey;
                            var modalInstance = openAutoGenerateTemplateModal(resolveObj, generatorTemplateData);
                        }
                    });

                }
                else if (utils.isNotEmptyVal(templateOptionHold)) {
                    var resolveObj = {
                        matterId: $stateParams.matterId,
                        lexvia_template: templateInfo.lexviatemplate,
                        template_name: templateInfo.template_name,
                        template_id: templateInfo.template_id,
                        option: templateOptionHold,
                        template_code: templateInfo.template_code,
                        typeId: typeId
                    };
                    var modalInstance = openTemplateModal(resolveObj);
                } else {
                    if (templateApiCall == "java") {
                        var resetParams = {
                            mid: parseInt(matterId),
                            //tz: moment.tz(moment.tz.guess()).format('Z'),
                            tz: moment.tz.guess(), //Timezone Changes
                            templateId: parseInt(typeId)
                        };
                        templatestDatalayer.GenerateNewTemplateRecord(resetParams, templateApiCall, templateName)
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
                    /* After (1514764800)/1st-Jan-2018 template which do not require UI will automatically generate by Arun instruction applied condition */
                    else if (1514764800 <= templateInfo.updated_date) {
                        var resetParams = {
                            mid: parseInt($stateParams.matterId),
                            //tz: moment.tz(moment.tz.guess()).format('Z'),
                            tz: moment.tz.guess(), //Timezone Changes
                            templateId: parseInt(templateInfo.template_id)
                        };
                        var templateName = templateInfo.template_name;
                        var templateApiCall = "java2";
                        templatestDatalayer.GenerateNewTemplateRecord(resetParams, templateApiCall, templateName)
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
                                    // vm.close();
                                } catch (ex) {
                                    console.log(ex);
                                }
                            }, function (error) {
                                if (localStorage.getItem('templateError') == "true") {
                                    notificationService.error('' + error.data);
                                    localStorage.setItem('templateError', "false");
                                }
                            });
                    } else {

                        if ($stateParams.matterId) {
                            vm.matterId = $stateParams.matterId;
                        } else {
                            vm.matterId = 0;
                        }
                        templatestDatalayer.GenerateTemplateRecord(templateInfo.template_id, templateInfo.lexviatemplate, vm.matterId, "").
                            then(function (response) {
                                templatestDatalayer.DownloadTemplate(response.data).
                                    then(function (response) {
                                        window.open(response.data, '_blank');
                                    });
                            }, function (response) {
                                //alert("unable to delete");
                                notificationService.error('An error occurred. Please try later.');
                            });
                    }
                }
            }

            // open Plantiff/Defendent selection form
            function openTemplateModal(resolveObj) {
                return $modal.open({
                    templateUrl: 'app/templates/partials/select-template.html',
                    controller: 'GenerateTemplateCtrl as GenerateTemplateCtrl',
                    size: 'lg',
                    windowClass: 'medicalIndoDialog',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        templateData: function () {
                            return resolveObj;
                        },
                        template_config: function () {
                            return vm.template_config;
                        },
                        generatorTemplateData: function () {
                            return " ";
                        }
                    }
                });
            }


            function openAutoGenerateTemplateModal(resolveObj, generatorTemplateData) {
                return $modal.open({
                    template: autoGenerateTemplateConfig(resolveObj, generatorTemplateData),
                    controller: 'GenerateTemplateCtrl as GenerateTemplateCtrl',
                    size: 'lg',
                    windowClass: 'medicalIndoDialog',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        templateData: function () {
                            return resolveObj;
                        },
                        template_config: function () {
                            return generatorTemplateData;
                        },
                        generatorTemplateData: function () {
                            return generatorTemplateData;
                        }
                    }
                });
            }



        }

        /* ===================================== Start : Template Auto Generation Code ======================= */

        function autoGenerateTemplateConfig(resolveObj, generatorTemplateData) {

            var createValidationHTML = " ";
            var loop = 0;
            forEach(generatorTemplateData.display_prop, function (data) {
                if (data.hasOwnProperty("required")) {
                    loop++;
                    if (data.required == true) {
                        if (data.type == 'text') {
                            if (loop > 1) {
                                createValidationHTML += " || ";
                            }
                            createValidationHTML += "utils.isEmptyVal(vm.autoGenerateTemplateModelInfo." + data.modelname + ")";
                        }
                        if (data.type == 'datePicker') {
                            if (loop > 1) {
                                createValidationHTML += " || ";
                            }
                            createValidationHTML += "($('#" + data.modelname + "DateDivError').css('display')" + ' == "block")';
                        }
                    }
                }
            });
            generatorTemplateData["createValidationHTML"] = createValidationHTML;

            var html = `
                <div class="modal-header">
                        <div class=" clearfix  heading-with-button-bottom-padding">
                            <h2 class=" pull-left page-title">Generate Template</h2>

                            <div class="pull-right">
                                <button class="btn btn-default pull-right" data-ng-disabled="GenerateTemplateCtrl.newAutoValidateSelection(GenerateTemplateCtrl.TemplateModelInfo)"
                                    data-ng-click="GenerateTemplateCtrl.generateAutoTemplate(GenerateTemplateCtrl.TemplateModelInfo,GenerateTemplateCtrl.autoGenerateTemplateModelInfo)">
                                    Generate
                                </button>
                                <button class="btn btn-default btn-styleNone pull-right margin-right10px" data-ng-click="GenerateTemplateCtrl.close()">Cancel</button>
                            </div>
                        </div>

                    </div>

                    <div class="filter-greybox container modal-body">`

            forEach(generatorTemplateData.display_prop, function (dataObj, index) {

                if (dataObj.hasOwnProperty("type")) {
                    html += `<div class="col-md-6" style="min-height:80px !important;">`

                    switch (dataObj.type) {
                        case "dropdown":
                            html += createDropdown(dataObj);
                            break;
                        case "text":
                            html += createText(dataObj);
                            break;
                        case "datePicker":
                            html += createDatePicker(dataObj);
                            break;
                        default:
                    }

                    html += `</div>`;
                }
                // else if (dataObj.hasOwnProperty("multitype")) {
                //     html += `<div class="col-md-6"  style="min-height:80px !important;">`
                //     switch (dataObj.multitype) {
                //         case "dropdown":
                //             html += createDropdown(dataObj);
                //             break;
                //         default:
                //     }
                //     html += `</div>`;
                // }

            })

            html += `</div></div>`;

            return html;
        }

        function createDropdown(dataObj) {
            switch (dataObj.api) {
                case "getTitle":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.title': return getTitle_title(dataObj); break;
                        default: return getTitle_title(dataObj);
                    }
                    break;
                case "getAction":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.action': return getAction_action(dataObj); break;
                        default: return getAction_action(dataObj);
                    }
                    break;
                case "getOption":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.option1': return getOption_option(dataObj); break;
                        case 'GenerateTemplateCtrl.option2': return getOption_option(dataObj); break;
                        default: return getOption_option(dataObj);
                    }
                    break;
                case "getCheckbox":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.checkbox': return getCheckbox_checkbox(dataObj); break;
                        case 'GenerateTemplateCtrl.acceptance': return getCheckbox_acceptance(dataObj); break;
                        default: return getCheckbox_checkbox(dataObj);
                    }
                    break;
                case "getPlaintiffs":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.plaintiffs': return getPlaintiffs(dataObj); break;
                        case 'GenerateTemplateCtrl.plaintiff_dropdown': return getPlaintiffs(dataObj); break;
                        case 'GenerateTemplateCtrl.plaintiff_dropdown_minor': return getPlaintiffs_plaintiff_dropdown_minor(dataObj); break;
                        case 'GenerateTemplateCtrl.plaintiff_guardian': return getPlaintiffs_plaintiff_guardian(dataObj); break;
                        case 'GenerateTemplateCtrl.estateAdmins': return getPlaintiffs(dataObj); break;
                        case 'GenerateTemplateCtrl.deceased_plaintiff': return getPlaintiffs(dataObj); break;
                        case 'GenerateTemplateCtrl.plaintiffEmployers': return getPlaintiffs_plaintiffEmployers(dataObj); break;
                        case 'GenerateTemplateCtrl.plaintiffInsuranceProviders': return getPlaintiffs_plaintiffInsuranceProviders(dataObj); break;
                        default: return getPlaintiffs(dataObj);
                    }
                    break;
                case "getDefendants":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.defendants': return getDefendants(dataObj); break;
                        case 'GenerateTemplateCtrl.defendants_dropdown': return getDefendants_defendants_dropdown(dataObj); break;
                        case 'GenerateTemplateCtrl.defendants_dropdown1': return getDefendants_defendants_dropdown1(dataObj); break;
                        case 'GenerateTemplateCtrl.defendants_dropdown2': return getDefendants_defendants_dropdown2(dataObj); break;
                        default: return getDefendants(dataObj);
                    }
                    break;
                case "getDefendantAttorney":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.defendants': return getDefendantAttorney(dataObj); break;
                        case 'GenerateTemplateCtrl.defendants_dropdown': return getDefendantAttorney(dataObj); break;
                        case 'GenerateTemplateCtrl.uniqDefendantAttorneyids': return getDefendantAttorney_uniqDefendantAttorneyids(dataObj); break;
                        case 'GenerateTemplateCtrl.uniqDefendantAttorneyids1': return getDefendantAttorney_uniqDefendantAttorneyids1(dataObj); break;
                        case 'GenerateTemplateCtrl.otherPartyMediator': return getDefendantAttorney_otherPartyMediator(dataObj); break;

                        default: return getDefendantAttorney(dataObj);
                    }
                    break;
                case "getParalegals":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.paralegalList': return getParalegals_paralegalList(dataObj); break;
                        case 'GenerateTemplateCtrl.allParalegalList': return getParalegals_allParalegalList(dataObj); break;
                        case 'GenerateTemplateCtrl.allParalegalList1': return getParalegals_allParalegalList1(dataObj); break;
                        case 'GenerateTemplateCtrl.OnlyParalegalList': return getParalegals(dataObj); break;
                        case 'GenerateTemplateCtrl.leadAttorneyList': return getParalegals(dataObj); break;
                        case 'GenerateTemplateCtrl.allAttorneysList': return getParalegals(dataObj); break;
                        default: return getParalegals(dataObj);
                    }
                    break;
                case "getAttorneys":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.allAttorneysList': return getAttorneys(dataObj); break; /* need to create function*/
                        case 'GenerateTemplateCtrl.onlyLeadAtt': return getleadAttorney(dataObj); break; /* need to create function*/
                        case 'GenerateTemplateCtrl.onlyLeadAtt1': return getleadAttorney1(dataObj); break; /* need to create function*/

                        default: return getAttorneys(dataObj);
                    }
                    break;
                case "getCaptionCategoryDocuments":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.captionDocumentList': return getCaptionCategoryDocuments_captionDocumentList(dataObj); break; /* need to create function*/
                        default: return getCaptionCategoryDocuments(dataObj);
                    }
                    break;
                case "getExpenseInfo":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.expenseProviders': return getExpenseInfo(dataObj); break; /* need to create function*/
                        default: return getExpenseInfo(dataObj);
                    }
                    break;
                case "getAllParties":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.expenseProviders': return getAllParties(dataObj); break; /* need to create function*/
                        default: return getAllParties(dataObj);
                    }
                    break;
                case "getMedicalInfo":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.associateMedicalContacts': return getMedicalInfo(dataObj); break;
                        case 'GenerateTemplateCtrl.allMedicalProviders': return getMedicalInfo(dataObj); break;
                        case 'GenerateTemplateCtrl.uniqueAllMedicalProviders': return getMedicalInfo_uniqueAllMedicalProviders(dataObj); break;
                        case 'GenerateTemplateCtrl.associateMedicalContactsForNotEmptyPhysician': return getMedicalInfo(dataObj); break;
                        case 'GenerateTemplateCtrl.allMedicalProvidersPlantiffOnly': return getMedicalInfo(dataObj); break;
                        case 'GenerateTemplateCtrl.physicianOnlyPlaintiff': return getMedicalInfo(dataObj); break;
                        case 'GenerateTemplateCtrl.physician_provider_medicalInfo': return getMedicalInfo(dataObj); break;
                        case 'GenerateTemplateCtrl.medicalproviderdate': return getMedicalInfo(dataObj); break;
                        case 'GenerateTemplateCtrl.medicalInfoDates': return getMedicalInfo_medicalInfoDates(dataObj); break;
                        case 'GenerateTemplateCtrl.medicalInfoRequestedDates': return getMedicalInfo_medicalInfoRequestedDates(dataObj); break;
                        default: return getMedicalInfo(dataObj);
                    }
                    break;
                case "getMedicalInfo_Java":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.physicianListOnly': return getMedicalInfo_Java(dataObj); break;
                        default: return getMedicalInfo_Java(dataObj);
                    }
                    break;
                case "getMedicalInfoAndGetMedicalBillInfo":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.allMedicalProvidersAndMedicalBillInfo': return getMedicalInfoAndGetMedicalBillInfo(dataObj); break;
                        case 'GenerateTemplateCtrl.medicalProvidersFromMedicalBillAndInfo': return getMedicalInfoAndGetMedicalBillInfo_medicalProvidersFromMedicalBillAndInfo(dataObj); break;
                        case 'GenerateTemplateCtrl.medicalBillAndInfoDates': return getMedicalInfoAndGetMedicalBillInfo_medicalBillAndInfoDates(dataObj); break;
                        case 'GenerateTemplateCtrl.uniqMedicalBillInfoForOutstandingAmount': return getMedicalInfoAndGetMedicalBillInfo_uniqMedicalBillInfoForOutstandingAmount(dataObj); break;
                        default: return getMedicalInfoAndGetMedicalBillInfo(dataObj);
                    }
                    break;
                case "getMedicalInfoAndGetOtherParties":
                case "getMedicalInfo_JavaAndGetOtherParties":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.physiciansFromMedicalInfoAndOtherParties': return getMedicalInfoAndGetOtherParties_physiciansFromMedicalInfoAndOtherParties(dataObj); break;
                        case 'GenerateTemplateCtrl.otherPartyCounsel': return getMedicalInfoAndGetOtherParties_otherPartyCounsel(dataObj); break;
                        case 'GenerateTemplateCtrl.phpJavaPhysicianConcat': return getMedicalInfoAndGetOtherParties_phpJavaPhysicianConcat(dataObj); break;
                        default: return getMedicalInfoAndGetOtherParties(dataObj);
                    }
                    break;
                case "getMedicalBillInfo":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.medicalBillInfo': return getMedicalBillInfo(dataObj); break;
                        case 'GenerateTemplateCtrl.medicalBillInfoList': return getMedicalBillInfo(dataObj); break;
                        case 'GenerateTemplateCtrl.uniqMedicalBillInfo': return getMedicalBillInfo_uniqMedicalBillInfo(dataObj); break;
                        case 'GenerateTemplateCtrl.MedicalBillInfoPlantiffOnly': return getMedicalBillInfo(dataObj); break;
                        case 'GenerateTemplateCtrl.medicalBillDates': return getMedicalBillInfo_medicalBillDates(dataObj); break;
                        default: return getMedicalBillInfo(dataObj);
                    }
                    break;
                case "getServiceProviders":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.associateContactsList': return getServiceProviders(dataObj); break; /* need to defined */
                        default: return getServiceProviders(dataObj);
                    }
                    break;
                case "getInsuranceContacts":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.noFaultInsuranceProviders': return getInsuranceContacts_noFaultInsuranceList(dataObj); break;
                        case 'GenerateTemplateCtrl.workersCompInsurance': return getInsuranceContacts(dataObj); break;
                        case 'GenerateTemplateCtrl.insuranceContactList': return getInsuranceContacts(dataObj); break;
                        case 'GenerateTemplateCtrl.uniqOnlyInsuranceProvider': return getInsuranceContacts_uniqOnlyInsuranceProvider(dataObj); break;
                        case 'GenerateTemplateCtrl.uniqonlyInsuranceProviderNew': return getInsuranceContacts_uniqonlyInsuranceProviderNew(dataObj); break;
                        case 'GenerateTemplateCtrl.uniqOnlyInsuranceProviderAdjuster': return getInsuranceContacts_uniqOnlyInsuranceProviderAdjuster(dataObj); break;
                        case 'GenerateTemplateCtrl.filterClaim': return getInsuranceContacts(dataObj); break;
                        case 'GenerateTemplateCtrl.onlyInsuranceProvider': return getInsuranceContacts(dataObj); break;
                        case 'GenerateTemplateCtrl.onlyInsuranceBIProvider': return getInsuranceContacts(dataObj); break;
                        case 'GenerateTemplateCtrl.InsuranceUMProvider': return getInsuranceContacts(dataObj); break;
                        case 'GenerateTemplateCtrl.InsurancePropertyProvider': return getInsuranceContacts(dataObj); break;
                        case 'GenerateTemplateCtrl.onlyInsuranceProviderPlantiff': return getInsuranceContacts(dataObj); break;
                        case 'GenerateTemplateCtrl.insuranceAdjusorInsuredType': return getInsuranceContacts_insuranceAdjusor_insurancetype(dataObj); break;
                        case 'GenerateTemplateCtrl.insuranceAdjusorInsured': return getInsuranceContacts_insuranceAdjusorInsured(dataObj); break;
                        case 'GenerateTemplateCtrl.insuranceHealth': return getInsuranceContacts_insuranceHealth(dataObj); break;
                        case 'GenerateTemplateCtrl.insuranceAdjusters': return getInsuranceContacts_insuranceAdjusters(dataObj); break;
                        case 'GenerateTemplateCtrl.insuranceAdjusorInsuredDefendant': return getInsuranceContacts(dataObj); break;
                        case 'GenerateTemplateCtrl.onlyInsuranceProviderDefendant': return getInsuranceContacts_onlyInsuranceProviderDefendant(dataObj); break;
                        case 'GenerateTemplateCtrl.uniquOnlyInsuranceProviderDefendant': return getInsuranceContacts(dataObj); break;
                        case 'GenerateTemplateCtrl.defendantAdjusters': return getInsuranceContacts_defendantAdjusters(dataObj); break;
                        case 'GenerateTemplateCtrl.insuranceInsured': return getInsuranceContacts_insuranceInsured(dataObj); break;
                        case 'GenerateTemplateCtrl.onlyInsuranceProviderDefendant2': return getInsuranceContacts_onlyInsuranceProviderDefendant2(dataObj); break;
                        default: return getInsuranceContacts(dataObj);
                    }
                    break;
                case "insuredParty":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.insuranceContactList': return insuredParty(dataObj); break;  /* Need to defined */
                        case 'GenerateTemplateCtrl.insuredParties': return insuredParty(dataObj); break;
                        default: return insuredParty(dataObj);
                    }
                    break;
                case "getOtherParties":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.otherPartydata': return getOtherParties(dataObj); break;
                        case 'GenerateTemplateCtrl.workerCompAttorney': return getOtherParties(dataObj); break;
                        case 'GenerateTemplateCtrl.otherPartyPhysicians': return getOtherParties(dataObj); break;
                        case 'GenerateTemplateCtrl.associateContacts': return getOtherParties(dataObj); break;
                        case 'GenerateTemplateCtrl.otherPartytWitness': return getOtherParties_otherPartytWitness(dataObj); break;
                        case 'GenerateTemplateCtrl.otherPartyPhysicians': return getOtherParties_otherPartyPhysicians(dataObj); break;
                        case 'GenerateTemplateCtrl.otherPartytHospital': return getOtherParties_otherPartytHospital(dataObj); break;
                        case 'GenerateTemplateCtrl.plaintiffAttorney': return getOtherParties_plaintiffAttorney(dataObj); break;

                        default: return getOtherParties(dataObj);
                    }
                    break;
                case "getEBTEvents":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.EBTEvents': return getEBTEvents_EBTEvents(dataObj); break;
                        case 'GenerateTemplateCtrl.solEvents': return getEBTEvents_solEvents(dataObj); break;
                        case 'GenerateTemplateCtrl.otherEvents': return getEBTEvents(dataObj); break;
                        case 'GenerateTemplateCtrl.arbitrationEvent': return getEBTEvents_arbitrationEvent(dataObj); break;
                        case 'GenerateTemplateCtrl.TrialEvents': return getEBTEvents_TrialEvents(dataObj); break;
                        case 'GenerateTemplateCtrl.EUOEvents': return getEBTEvents_EUOEvents(dataObj); break;
                        case 'GenerateTemplateCtrl.EUOADEvents': return getEBTEvents(dataObj); break;
                        case 'GenerateTemplateCtrl.NOCEvents': return getEBTEvents(dataObj); break;
                        case 'GenerateTemplateCtrl.IMEEvents': return getEBTEvents_IMEEvents(dataObj); break;
                        case 'GenerateTemplateCtrl.AllEvents': return getEBTEvents(dataObj); break;
                        case 'GenerateTemplateCtrl.phoneConferenceEvents': return getEBTEvents_phoneConEvents(dataObj); break;
                        case 'GenerateTemplateCtrl.mediationEvents': return getEBTEvents_mediationEvents(dataObj); break;
                        case 'GenerateTemplateCtrl.discoveryEndDateEvent': return getEBTEvents_discoveryEndDateEvent(dataObj); break;
                        case 'GenerateTemplateCtrl.FacilitationEvents': return getEBTEvents_FacilitationEvents(dataObj); break;
                        case 'GenerateTemplateCtrl.settlementConferenceEvents': return getEBTEvents_settlementConferenceEvents(dataObj); break;
                        case 'GenerateTemplateCtrl.hearingEvents': return getEBTEvents_hearingEvents(dataObj); break;
                        case 'GenerateTemplateCtrl.pretrialConferenceEvents': return getEBTEvents_pretrialConferenceEvents(dataObj); break;
                        default: return getEBTEvents(dataObj);
                    }
                    break;
                case "addInsuranceProvider":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.insuranceFilterOnPlaintiff': return addInsuranceProvider(dataObj); break;
                        default: return addInsuranceProvider(dataObj);
                    }
                    break;
                case "otherPartyContact":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.otherPartyContact': return otherPartyContact(dataObj); break;
                        case 'GenerateTemplateCtrl.filterOtherPartyData': return otherPartyContact(dataObj); break;
                        case 'GenerateTemplateCtrl.filterOtherPartyHospital': return otherPartyContact(dataObj); break;
                        case 'GenerateTemplateCtrl.filterOtherPartySpouse': return otherPartyContact_filterOtherPartySpouse(dataObj); break;
                        default: return otherPartyContact(dataObj);
                    }
                    break;
                case "getMatterAllContactList":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.matterAllContacts': return getMatterAllContactList(dataObj); break;
                        case 'GenerateTemplateCtrl.insurance_providerList': return getMatterAllContactList_insurance_providerList(dataObj); break;
                        case 'GenerateTemplateCtrl.allMatterContacts': return getMatterAllContactList_allMatterContacts(dataObj); break;
                        case 'GenerateTemplateCtrl.matterContactsForDefault': return getMatterAllContactList(dataObj); break;
                        default: return getMatterAllContactList(dataObj);
                    }
                    break;
                case "getMatterContactList":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.matterContacts': return getMatterContactList(dataObj); break;
                        default: return getMatterContactList(dataObj);
                    }
                    break;
                case "getMatterLiens":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.AllMatterLiens': return getMatterLiens_AllMatterLiens(dataObj); break;
                        case 'GenerateTemplateCtrl.lienAmounts': return getMatterLiens(dataObj); break;
                        case 'GenerateTemplateCtrl.AllMatterLiens': return getMatterLiens(dataObj); break;
                        default: return getMatterLiens(dataObj);
                    }
                    break;

                case "getUsersInFirm":
                    switch (dataObj.list) {
                        case 'GenerateTemplateCtrl.allFirmUser': return getUsersInFirm_allFirmUser(dataObj); break;
                        default: return getUsersInFirm(dataObj);
                    }
                    break;
                case "getLawSecTitle":
                    return getLawSecTitle(); /* Todo */
                    break;
                case "timePicker":
                    return timePicker(); /* Todo */
                    break;
                case "getOtherParties":
                    return getOtherParties(); /* Todo */
                    break;
                case "getDefendantsAPICall":
                    break;
                case "defaultOne":
                    return defaultOne(dataObj);
                    break;
                default:
                    return defaultOne(dataObj);
            }
        }



        function createText(dataObj) {
            var createHTML = '';
            createHTML += `<clx-textbox model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `></clx-textbox>`;
            return createHTML;
        }

        function createDatePicker(dataObj) {
            var createHTML = '';
            createHTML += `<clx-date condition="GenerateTemplateCtrl.openCalender(event)" model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `></clx-date>`;
            return createHTML;
        }

        function defaultOne(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{name:$select.search} | orderBy: 'name'" selectedviewproperty='<small> {{$select.selected.name}}</small>'
                    dropdownviewproperty='<small> {{item.name}} </small>'>
                </clx-select>`;
            return createHTML;
        }
        /* ====================================== Plaintiffs Function start ===================================== */
        function getTitle_title(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` selectedviewproperty='<small>{{$select.selected.id}}</small>' dropdownviewproperty='<small>{{item.id}}</small>'>
            </clx-select>`;
            return createHTML;
        }
        function getAction_action(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` selectedviewproperty='<small>{{$select.selected.id}}</small>' dropdownviewproperty='<small>{{item.id}}</small>'>
            </clx-select>`;
            return createHTML;
        }

        function getOption_option(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` selectedviewproperty='<small>{{$select.selected.id}}</small>' dropdownviewproperty='<small>{{item.id}}</small>'>
            </clx-select>`;
            return createHTML;
        }

        function getCheckbox_checkbox(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` selectedviewproperty='<small>{{$select.selected.id}}</small>' dropdownviewproperty='<small>{{item.id}}</small>'>
            </clx-select>`;
            return createHTML;
        }

        function getCheckbox_acceptance(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` selectedviewproperty='<small>{{$select.selected.id}}</small>' dropdownviewproperty='<small>{{item.id}}</small>'>
            </clx-select>`;
            return createHTML;
        }

        function getPlaintiffs(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{name:$select.search} | orderBy: 'name'" selectedviewproperty='<small> {{$select.selected.name}}</small>'
                    dropdownviewproperty='<small> {{item.name}} </small>'>
                </clx-select>`;
            return createHTML;
        }

        function getPlaintiffs_plaintiff_dropdown_minor(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{name:$select.search} | orderBy: 'name'" selectedviewproperty='<small> {{$select.selected.name}}</small>'
                    dropdownviewproperty='<small> {{item.name}} </small>'>
                </clx-select>`;
            return createHTML;
        }


        function getPlaintiffs_plaintiffEmployers(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression="item" ngfilter=" | filter:{new_contact_name:$select.search} | orderBy: 'new_contact_name'" selectedviewproperty='<small> {{$select.selected.new_contact_name}}</small>'
                    dropdownviewproperty='<small> {{item.new_contact_name}} </small>'>
                </clx-select>`;
            return createHTML;
        }

        //Html for insurance provider
        function getPlaintiffs_plaintiffInsuranceProviders(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{insurance_provider_name:$select.search}" selectedviewproperty='<small> {{$select.selected.insurance_provider_name}}</small>'
            dropdownviewproperty=' <small><strong>Insurance Provider-</strong>{{item.insurance_provider_name}} <br> </small>
                <small><strong>Adjuster-</strong>{{item.adjuster_name}}<br> </small>
                <small ><strong>Claim No-</strong>{{item.claim_number}} <br> </small> 
                <small > <strong>Demand Amount- </strong>{{item.demanded_amount}} <br></small>
                <small > <strong>Offer Amount- </strong>{{item.offered_amount}} <br></small>  
                <hr style="margin:0; border-top:1px solid #ccc">'></clx-select>`;
            return createHTML;
        }

        function getPlaintiffs_plaintiff_guardian(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression="item" ngfilter=" | filter:{new_contact_name:$select.search} | orderBy: 'new_contact_name'" selectedviewproperty='<small> {{$select.selected.new_contact_name}}</small>'
                dropdownviewproperty='<small> {{item.new_contact_name}} </small>'>
                </clx-select>`;
            return createHTML;
        }
        /* ======================================== Plaintiffs function ends ======================================= */

        /* ======================================== Defendant function Starts ======================================= */

        function getDefendants(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `   ngexpression="item.defendantid" ngfilter=" | filter:{name:$select.search} | orderBy: 'name'" selectedviewproperty='<small> {{$select.selected.name}}</small>'
                    dropdownviewproperty='<small> {{item.name}} </small>'>
                </clx-select>`;
            return createHTML;
        }

        function getDefendants_defendants_dropdown(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression="item.defendantid"
            ngfilter=" | filter:{name:$select.search} | orderBy: 'name'" selectedviewproperty='<small> {{$select.selected.name}}</small>'
            dropdownviewproperty='<small> {{item.name}} </small>'>
        </clx-select>`;
            return createHTML;
        }

        function getDefendants_defendants_dropdown1(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression="item"
            ngfilter=" | filter:{name:$select.search} | orderBy: 'name'" selectedviewproperty='<small> {{$item.name}}</small>'
            dropdownviewproperty='<small> {{item.name}} </small>'>
        </clx-select>`;
            return createHTML;
        }

        function getDefendants_defendants_dropdown2(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression="item"
            ngfilter=" | filter:{name:$select.search} | orderBy: 'name'" selectedviewproperty='<small>{{$select.selected.name}}</small>'
            dropdownviewproperty='<small> {{item.name}} </small>'>
        </clx-select>`;
            return createHTML;
        }

        function getDefendantAttorney_uniqDefendantAttorneyids(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression = "item" ngfilter = " | filter:{name:$select.search}" selectedviewproperty = '<small> {{$select.selected.name}}</small>'
            dropdownviewproperty = '<small> {{item.name}} </small>' >
        </clx-select>`;
            return createHTML;
        }
        function getDefendantAttorney_uniqDefendantAttorneyids1(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression = "item" ngfilter = " | filter:{name:$select.search}" selectedviewproperty = '<small> {{$item.name}}</small>'
            dropdownviewproperty = '<small> {{item.name}} </small>' >
        </clx-select>`;
            return createHTML;
        }
        function getDefendantAttorney_otherPartyMediator(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression = "item" ngfilter = " | filter:{contact_name:$select.search}" selectedviewproperty = '<small> {{$select.selected.contact_name}}</small>'
            dropdownviewproperty = '<small> {{item.contact_name}} </small>' >
        </clx-select>`;
            return createHTML;
        }



        /* ======================================== Defendant function Starts ======================================= */

        function getParalegals(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo"`;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `  ngexpression="item.uid" ngfilter=" | filter:{contact_name:$select.search} | filter: {type : 'Paralegal'} "
                selectedviewproperty='<small> {{$select.selected.contact_name}}</small>' groupby="GenerateTemplateCtrl.groupParalegals"
                groupfilter="GenerateTemplateCtrl.paralegalType" dropdownviewproperty='<small> {{item.contact_name}} </small>'>
            </clx-select>`;
            return createHTML;
        }

        function getParalegals_paralegalList(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo"`;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `  ngexpression="item.uid" ngfilter=" | filter:{contact_name:$select.search}"
                selectedviewproperty='<small> {{$select.selected.contact_name}}</small>' groupby="GenerateTemplateCtrl.groupParalegals"
                groupfilter="GenerateTemplateCtrl.paralegalType" dropdownviewproperty='<small> {{item.contact_name}} </small>'>
            </clx-select>`;
            return createHTML;
        }

        function getParalegals_allParalegalList(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo"`;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression="item.uid" ngfilter=" | filter:{contact_name:$select.search}"
            groupby="GenerateTemplateCtrl.groupParalegals" groupfilter="GenerateTemplateCtrl.paralegalType" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>'
            dropdownviewproperty='<small> {{item.contact_name}} </small>'>
        </clx-select>`;
            return createHTML;
        }
        function getParalegals_allParalegalList1(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo"`;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression="item" ngfilter=" | filter:{contact_name:$select.search}"
            groupby="GenerateTemplateCtrl.groupParalegals" groupfilter="GenerateTemplateCtrl.paralegalType" selectedviewproperty='<small> {{$item.contact_name}}</small>'
            dropdownviewproperty='<small> {{item.contact_name}} </small>'>
        </clx-select>`;
            return createHTML;
        }

        function getCaptionCategoryDocuments_captionDocumentList(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo"`;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression="item.documentid" ngfilter=" | filter:{documentname:$select.search}" selectedviewproperty='<small> {{$select.selected.documentname}}</small>'
            dropdownviewproperty='<small> {{item.documentname}} </small>'>
        </clx-select>`;
            return createHTML;
        }

        function getAttorneys(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `   ngexpression="item.uid"
                    ngfilter=" | filter:{contact_name:$select.search}" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>'
                    groupby="GenerateTemplateCtrl.groupAllAttorneys" groupfilter="GenerateTemplateCtrl.attorneyTypes" dropdownviewproperty='<small> {{item.contact_name}} </small>'>`;
            return createHTML;
        }
        function getleadAttorney(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `   ngexpression="item.uid"
                    ngfilter=" | filter:{contact_name:$select.search}" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>'
                    groupby="GenerateTemplateCtrl.groupAllAttorneys" groupfilter="GenerateTemplateCtrl.attorneyTypes" dropdownviewproperty='<small> {{item.contact_name}} </small>'>`;
            return createHTML;
        }

        function getleadAttorney1(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `   ngexpression="item.uid"
                    ngfilter=" | filter:{contact_name:$select.search}" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>'
                    groupfilter="GenerateTemplateCtrl.attorneyTypes" dropdownviewproperty='<small> {{item.contact_name}} </small>'>`;
            return createHTML;
        }

        function getExpenseInfo(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item.defendantid" ngfilter=" | filter:{name:$select.search} | orderBy: 'name'" selectedviewproperty='<small> {{$select.selected.name}}</small>'
                    dropdownviewproperty='<small> {{item.name}} </small>'>
                </clx-select>`;
            return createHTML;
        }

        function getMedicalInfo_allMedicalProviders() {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{contact_name:$select.search} "
                    selectedviewproperty='<small> {{$select.selected.contact_name}}</small>'
                    dropdownviewproperty='<small> {{item.contact_name}} </small>'>
                </clx-select>`;
            return createHTML;
        }

        /* For - getMedicalInfo_uniqueAllMedicalProviders or getMedicalInfo_allMedicalProvidersAssociatePhysician */
        function getMedicalInfo(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `  ngexpression="item" ngfilter=" | filter:{physicianid: {contact_name:$select.search}} | orderBy: &apos;contact_name&apos;"
            selectedviewproperty="<span>{{ $select.selected.physicianid.contact_name }}</span>" dropdownviewproperty="<small> {{item.physicianid.contact_name }}</small>">
                </clx-select>`;
            return createHTML;
        }

        function getMedicalInfo_Java(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `  ngexpression="item"
            ngfilter=" | filter:{physician: {full_name:$select.search}} | orderBy: &apos;full_name&apos;"
            selectedviewproperty="<span>{{ $select.selected.physician.full_name }}</span>" dropdownviewproperty="<small> {{item.physician.full_name }}</small>">
                </clx-select>`;
            return createHTML;
        }

        function getMedicalInfo_uniqueAllMedicalProviders(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{contact_name:$select.search} | orderBy: 'contact_name'" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>'
                dropdownviewproperty='<small> {{item.contact_name}} </small>'>
                </clx-select>`;
            return createHTML;
        }
        /* -------------------------------------------- Medical Bill AND MEDICAL INFO FUNCTION -------------------------------------------------------------------------------------------------- */
        function getMedicalInfoAndGetOtherParties_physiciansFromMedicalInfoAndOtherParties(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{contact_name:$select.search} | orderBy: 'contact_name'" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>'
                    dropdownviewproperty='<small> {{item.contact_name}} </small>'></clx-select>`;
            return createHTML;
        }
        function getMedicalInfoAndGetOtherParties_phpJavaPhysicianConcat(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{contact_name:$select.search} | orderBy: 'contact_name'" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>'
                    dropdownviewproperty='<small> {{item.contact_name}} </small>'></clx-select>`;
            return createHTML;
        }
        function getMedicalInfoAndGetOtherParties_otherPartyCounsel(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{contact_name:$select.search} | orderBy: 'contact_name'" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>'
                    dropdownviewproperty='<small> {{item.contact_name}} </small>'></clx-select>`;
            return createHTML;
        }

        function getMedicalInfoAndGetMedicalBillInfo_medicalProvidersFromMedicalBillAndInfo(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{contact_name:$select.search} | orderBy: 'contact_name'" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>'
                dropdownviewproperty='<small> {{item.contact_name}} </small>'>
                </clx-select>`;
            return createHTML;
        }

        function getMedicalInfoAndGetMedicalBillInfo_medicalBillAndInfoDates(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression="item"
            selectedviewproperty='<small>{{$select.selected.startEndDate}}</small>' dropdownviewproperty='<small>{{item.startEndDate}}</small>'></clx-select>`;
            return createHTML;
        }

        function getMedicalInfoAndGetMedicalBillInfo_uniqMedicalBillInfoForOutstandingAmount(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression="item"
            selectedviewproperty='<small> {{$select.selected.providerid.contact_name}}</small>' 
            dropdownviewproperty='<small><strong>Medical Provider-</strong>{{item.providerid.contact_name}}<br></strong></small>
            <small><strong>Bill Amount-</strong>{{item.outstandingamount|currency}}<br></strong></small>
            <hr style="margin:0; border-top:1px solid #ccc">'></clx-select>`;
            return createHTML;
        }

        function getMedicalBillInfo(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{contact_name:$select.search} | orderBy: 'contact_name'" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>'
                    dropdownviewproperty='<small> {{item.contact_name}} </small>'></clx-select>`;
            return createHTML;
        }

        function getMedicalBillInfo_uniqMedicalBillInfo(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression="item" ngfilter=" | filter:{contact_name:$select.search} | orderBy: 'contact_name'" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>'
            dropdownviewproperty='<small> {{item.contact_name}} </small>'></clx-select>`;
            return createHTML;
        }

        function getMedicalBillInfo_medicalBillDates(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression="item"
            selectedviewproperty='<small>{{$select.selected.startEndDate}}</small>' dropdownviewproperty='<small>{{item.startEndDate}}</small>'></clx-select>`;
            return createHTML;
        }

        function getMedicalInfo_medicalInfoDates(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression="item"
            selectedviewproperty='<small>{{$select.selected.startEndDate}}</small>' dropdownviewproperty='<small>{{item.startEndDate}}</small>'></clx-select>`;
            return createHTML;
        }

        function getMedicalInfo_medicalInfoRequestedDates(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression="item"
            selectedviewproperty='<small>{{$select.selected.dateRequested2}}</small>' dropdownviewproperty='<small>{{item.dateRequested2}}</small>'></clx-select>`;
            return createHTML;
        }

        function getAllParties() { return "getAllParties" };
        function getServiceProviders() { return "getServiceProviders" };

        /* =================================     Insurance Function Starts   ====================================== */

        function getInsuranceContacts(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{contact_name:$select.search} | orderBy: 'contact_name'" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>'
                        dropdownviewproperty='<small> {{item.contact_name}} </small>'></clx-select>`;
            return createHTML;
        }
        function getInsuranceContacts_defendantAdjusters(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression="item.adjusterId" ngfilter=" | filter:{contact_name:$select.search}" selectedviewproperty='<small>{{$select.selected.adjusterId.firstname}} {{$select.selected.adjusterId.lastname}}</small>'
            dropdownviewproperty='<small> {{item.adjusterId.firstname}} {{item.adjusterId.lastname}} </small>'></clx-select>`;
            return createHTML;
        }
        function getInsuranceContacts_uniqOnlyInsuranceProvider(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{contact_name:$select.search}" selectedviewproperty='<small>{{$select.selected.contact_name}}</small>'
            dropdownviewproperty='<small>{{item.contact_name}}</small>'></clx-select>`;
            return createHTML;
        }

        function getInsuranceContacts_uniqonlyInsuranceProviderNew(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{insuranceProvider_contact_name:$select.search}" selectedviewproperty='<small>{{$select.selected.insuranceProvider_contact_name}}</small>'
            dropdownviewproperty='<small>{{item.insuranceProvider_contact_name}}</small>'></clx-select>`;
            return createHTML;
        }

        function getInsuranceContacts_noFaultInsuranceList(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{contact_name:$select.search}" selectedviewproperty='<small>{{$select.selected.contact_name}}</small>'
            dropdownviewproperty='<small>{{item.contact_name}}</small>'></clx-select>`;
            return createHTML;
        }

        function getInsuranceContacts_uniqOnlyInsuranceProviderAdjuster(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{contact_name:$select.search}" selectedviewproperty='<small>{{$select.selected.contact_name}}</small>'
            dropdownviewproperty='<small><strong>Insurance Provider-</strong>{{item.insuranceproviderid.firstname}} {{item.insuranceproviderid.lastname}}<br> </small>
                <small><strong>Adjuster Name-</strong>{{item.adjusterid.firstname}} {{item.adjusterid.lastname}}</strong></small><hr style="margin:0; border-top:1px solid #ccc">'></clx-select>`;
            return createHTML;
        }

        function getInsuranceContacts_insuranceAdjusorInsured(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{insuranceProviderName:$select.search}" selectedviewproperty='<small> {{$select.selected.insuranceProviderName}}</small>'
            dropdownviewproperty=' <small><strong>Insurance Provider-</strong>{{item.insuranceproviderid.firstname}} {{item.insuranceproviderid.lastname}}<br> </small>
                <small><strong>Adjuster-</strong>{{item.adjusterid.firstname}} {{item.adjusterid.lastname}}<br> </small>
                <small ><strong>Claim No-</strong>{{item.claimnumber}} <br> </small> 
                <small > <strong>Insured Party- </strong>{{item.insuredpartyid.firstname}} {{item.insuredpartyid.lastname}}<br></small>  
                <hr style="margin:0; border-top:1px solid #ccc">'></clx-select>`;
            return createHTML;
        }

        function getInsuranceContacts_insuranceHealth(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{contact_name:$select.search}" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>'
            dropdownviewproperty=' <small><strong>Insurance Provider-</strong>{{item.insuranceproviderid.firstname}} {{item.insuranceproviderid.lastname}}<br> </small>
                <small><strong>Adjuster-</strong>{{item.adjusterid.firstname}} {{item.adjusterid.lastname}}<br> </small>
                <small ><strong>Claim No-</strong>{{item.claimnumber}} <br> </small> 
                <small > <strong>Insured Party- </strong>{{item.insuredpartyid.firstname}} {{item.insuredpartyid.lastname}}<br></small>  
                <hr style="margin:0; border-top:1px solid #ccc">'></clx-select>`;
            return createHTML;
        }

        function getInsuranceContacts_insuranceAdjusor_insurancetype(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{contact_name:$select.search}" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>'
            dropdownviewproperty=' <small><strong>Insurance Provider-</strong>{{item.insuranceproviderid.firstname}} {{item.insuranceproviderid.lastname}}<br> </small>
                <small><strong>Adjuster-</strong>{{item.adjusterid.firstname}} {{item.adjusterid.lastname}}<br> </small>
                <small ><strong>Claim No-</strong>{{item.claimnumber}} <br> </small>
                <small > <strong>Insured Party- </strong>{{item.insuredpartyid.firstname}} {{item.insuredpartyid.lastname}}<br></small>
                <small > <strong>Insurance Type- </strong>{{item.insurancetype}}<br></small>  
                <hr style="margin:0; border-top:1px solid #ccc">'></clx-select>`;
            return createHTML;
        }

        function getInsuranceContacts_insuranceInsured(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{contact_name:$select.search}" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>'
                dropdownviewproperty=' <small><strong>Insurance Provider-</strong>{{item.insuranceproviderid.firstname}} {{item.insuranceproviderid.lastname}}<br> </small> 
                <small > <strong>Insured Party- </strong>{{item.insuredpartyid.firstname}} {{item.insuredpartyid.lastname}}<br></small>  
                <hr style="margin:0; border-top:1px solid #ccc">'></clx-select>`;
            return createHTML;
        }

        function getInsuranceContacts_onlyInsuranceProviderDefendant(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression="item" ngfilter=" | filter:{contact_name:$select.search}" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>'
            dropdownviewproperty=' <small><strong>Insurance Provider-</strong>{{item.insuranceproviderid.firstname}} {{item.insuranceproviderid.lastname}}<br> </small>
                <small><strong>Adjuster Name-</strong>{{item.adjusterid.firstname}} {{item.adjusterid.lastname}}</strong><br></small>
                <small > <strong>Insured Party- </strong>{{item.insuredpartyid.firstname}} {{item.insuredpartyid.lastname}}<br></small>
                <hr style="margin:0; border-top:1px solid #ccc">'></clx-select>`;
            return createHTML;
        }

        function getInsuranceContacts_onlyInsuranceProviderDefendant2(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression="item" ngfilter=" | filter:{contact_name:$select.search}" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>'
            dropdownviewproperty=' <small><strong>Insurance Provider-</strong>{{item.insuranceproviderid.firstname}} {{item.insuranceproviderid.lastname}}<br> </small>
                <small><strong>Adjuster Name-</strong>{{item.adjusterid.firstname}} {{item.adjusterid.lastname}}</strong><br></small>
                <small ><strong>Claim No-</strong>{{item.claimnumber}} <br> </small>
                <small > <strong>Insured Party- </strong>{{item.insuredpartyid.firstname}} {{item.insuredpartyid.lastname}}<br></small>
                <hr style="margin:0; border-top:1px solid #ccc">'></clx-select>`;
            return createHTML;
        }

        /* ============================================= Insurance Function Ends =============================================== */

        function insuredParty() { return "insuredParty" };

        function getOtherParties() { return "getOtherParties" };


        function getOtherParties_otherPartytWitness(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{contact_name:$select.search}" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>'
            dropdownviewproperty='<small> {{item.contact_name}} </small>'></clx-select>`;
            return createHTML;
        }

        function getOtherParties_otherPartytHospital(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{contact_name:$select.search}" selectedviewproperty='<small> {{$select.selected.firstname}} {{$select.selected.middelname}} {{$select.selected.lastname}}</small>'
            dropdownviewproperty='<small> {{item.firstname}} {{item.middelname}} {{item.lastname}} </small>'></clx-select>`;
            return createHTML;
        }

        function getOtherParties_otherPartyPhysicians(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `  ngexpression="item" ngfilter=" | filter:{physicianid: {contact_name:$select.search}} | orderBy: &apos;contact_name&apos;"
            selectedviewproperty="<span>{{ $select.selected.physicianid.contact_name }}</span>" dropdownviewproperty="<small> {{item.physicianid.contact_name }}</small>">
                </clx-select>`;
            return createHTML;
        }

        function getOtherParties_plaintiffAttorney(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression = "item" ngfilter = " | filter:{contact_name:$select.search}" selectedviewproperty = '<small> {{$select.selected.contact_name}}</small>'
            dropdownviewproperty = '<small> {{item.contact_name}} </small>' >
        </clx-select>`;
            return createHTML;
        }


        /* ============================================= Events Function Starts ================================================ */
        function getEBTEvents_EBTEvents(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression="item.id" ngfilter="|filter:{startEndTime:$select.search}"
            selectedviewproperty='<small>{{$select.selected.startEndTime}}</small>' dropdownviewproperty='<small>{{item.startEndTime}}</small>'>
                </clx-select> `;
            return createHTML;
        }

        function getEBTEvents_phoneConEvents(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression="item.id" ngfilter="|filter:{startEndTime:$select.search}"
            selectedviewproperty='<small>{{$select.selected.startEndTime}}</small>' dropdownviewproperty='<small>{{item.startEndTime}}</small>'>
                </clx-select> `;
            return createHTML;
        }

        function getEBTEvents_FacilitationEvents(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression="item.id" ngfilter="|filter:{startEndTime:$select.search}"
            selectedviewproperty='<small>{{$select.selected.startEndTime}}</small>' dropdownviewproperty='<small>{{item.startEndTime}}</small>'>
                </clx-select> `;
            return createHTML;
        }

        function getEBTEvents_settlementConferenceEvents(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression="item.id" ngfilter="|filter:{startEndTime:$select.search}"
            selectedviewproperty='<small>{{$select.selected.startEndTime}}</small>' dropdownviewproperty='<small>{{item.startEndTime}}</small>'>
                </clx-select> `;
            return createHTML;
        }

        function getEBTEvents_hearingEvents(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `ngexpression="item.id" ngfilter="|filter:{startEndTime:$select.search}"
            selectedviewproperty='<small>{{$select.selected.startEndTime}}</small>' dropdownviewproperty='<small>{{item.startEndTime}}</small>'>
                </clx-select> `;
            return createHTML;
        }

        function getEBTEvents_IMEEvents(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` list="GenerateTemplateCtrl.IMEEvents"  ngexpression="item.id" ngfilter=" | filter:{startEndTime:$select.search}"
            selectedviewproperty='<small> {{$select.selected.startEndTime}}</small>' dropdownviewproperty='<small> {{item.startEndTime}} </small>'>
        </clx-select> `;
            return createHTML;
        }

        function getEBTEvents_EUOEvents(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `list="GenerateTemplateCtrl.EUOEvents" ngexpression="item.id"
            ngfilter="|filter:{startEndTime:$select.search}" selectedviewproperty='<small>{{$select.selected.startEndTime}}</small>'
            dropdownviewproperty='<small>{{item.startEndTime}}</small>'>
        </clx-select> `;
            return createHTML;
        }

        function getEBTEvents_arbitrationEvent(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `list="GenerateTemplateCtrl.EUOEvents" ngexpression="item.id"
            ngfilter="|filter:{startEndTime:$select.search}" selectedviewproperty='<small>{{$select.selected.startEndTime}}</small>'
            dropdownviewproperty='<small>{{item.startEndTime}}</small>'>
        </clx-select> `;
            return createHTML;
        }

        function getEBTEvents_TrialEvents(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `list="GenerateTemplateCtrl.TrialEvents" ngexpression="item.id"
            ngfilter=" | filter:{startEndTime:$select.search}" selectedviewproperty='<small> {{$select.selected.startEndTime}}</small>'
            dropdownviewproperty='<small> {{item.startEndTime}} </small>'>
        </clx-select> `;
            return createHTML;
        }

        function getEBTEvents_mediationEvents(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item.id" ngfilter=" | filter:{startEndTime:$select.search}" selectedviewproperty='<small> {{$select.selected.startEndTime}}</small>'
            dropdownviewproperty='<small> {{item.startEndTime}} </small>'>
        </clx-select> `;
            return createHTML;
        }
        function getEBTEvents_discoveryEndDateEvent(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item.id" ngfilter=" | filter:{startEndTime:$select.search}" selectedviewproperty='<small> {{$select.selected.startEndTime}}</small>'
            dropdownviewproperty='<small> {{item.startEndTime}} </small>'>
        </clx-select> `;
            return createHTML;
        }
        function getEBTEvents_solEvents(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item.id" ngfilter=" | filter:{startEndTime:$select.search}" selectedviewproperty='<small> {{$select.selected.startEndTime}}</small>'
            dropdownviewproperty='<small> {{item.startEndTime}} </small>'>
        </clx-select> `;
            return createHTML;
        }
        function getEBTEvents_pretrialConferenceEvents(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item.id" ngfilter=" | filter:{startEndTime:$select.search}" selectedviewproperty='<small> {{$select.selected.startEndTime}}</small>'
            dropdownviewproperty='<small> {{item.startEndTime}} </small>'>
        </clx-select> `;
            return createHTML;
        }

        /* ============================================= Events Function Ends ================================================ */

        function addInsuranceProvider() { return "addInsuranceProvider" };
        function otherPartyContact_filterOtherPartySpouse(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` list="GenerateTemplateCtrl.filterOtherPartySpouse" ngexpression="item" ngfilter=" | filter:{contact_name:$select.search} "
                    selectedviewproperty='<small> {{$select.selected.contact_name}}</small>' dropdownviewproperty='<small> {{item.contact_name}} </small>'>
                </clx-select>`;
            return createHTML;
        }
        /* ============================================= Starts : Matter Contact Function ==================================== */
        function getMatterAllContactList(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` list="GenerateTemplateCtrl.allMatterContacts" ngexpression="item" ngfilter=" | filter:{contact_name:$select.search} "
                    selectedviewproperty='<small> {{$select.selected.contact_name}}</small>' groupby="GenerateTemplateCtrl.groupContacts"
                    dropdownviewproperty='<small> {{item.contact_name}} </small>'>
                </clx-select>`;
            return createHTML;
        }

        function getMatterAllContactList_allMatterContacts(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `list="GenerateTemplateCtrl.allMatterContacts" ngexpression="item"
            ngfilter=" | filter:{contact_name:$select.search}" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>' F
            dropdownviewproperty='<small> {{item.contact_name}} </small>'>
        </clx-select>`;
            return createHTML;
        }
        function getMatterAllContactList_insurance_providerList(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `list="GenerateTemplateCtrl.insurance_providerList" ngexpression="item"
            ngfilter=" | filter:{contact_name:$select.search}" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>' F
            dropdownviewproperty='<small> {{item.contact_name}} </small>'>
        </clx-select>`;
            return createHTML;
        }

        function getMatterContactList() { return "getMatterContactList" };
        function getMatterLiens() { return "getMatterLiens" };
        /* ============================================= Ends : Matter Contact Function ==================================== */

        /* ============================================= Firm Users function starts ==============================================*/
        function getUsersInFirm_allFirmUser(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `list="GenerateTemplateCtrl.allFirmUser" ngexpression="item.user_id"
            ngfilter=" | filter:{full_name:$select.search}" groupby="GenerateTemplateCtrl.groupFirmUsers" groupfilter="GenerateTemplateCtrl.firmUserType" selectedviewproperty='<small> {{$select.selected.full_name}}</small>'
            dropdownviewproperty='<small> {{item.full_name}} </small>'>
        </clx-select>`;
            return createHTML;
        }
        /* ============================================= Firm Users function ends ==============================================*/
        /* ============================================= Matter : Lien holder =================================================*/
        function getMatterLiens_AllMatterLiens(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `list="GenerateTemplateCtrl.AllMatterLiens" ngexpression="item"
            ngfilter=" | filter:{contact_name:$select.search}" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>' F
            dropdownviewproperty='<small> {{item.contact_name}} </small>'>
        </clx-select>`;
            return createHTML;
        }

        /* ============================================= Matter : Lien holder =================================================*/

        function uniqueAllMedicalProviders() {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `    list="GenerateTemplateCtrl.uniqueAllMedicalProviders" ngexpression="item" ngfilter=" | filter:{contact_name:$select.search} | orderBy: 'contact_name'" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>'
                    dropdownviewproperty='<small> {{item.contact_name}} </small>'>
                </clx-select> `;
            return createHTML;
        }

        function insuranceAdjusorInsured() {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `  list="GenerateTemplateCtrl.insuranceAdjusorInsured"
                    ngexpression="item" ngfilter=" | filter:{contact_name:$select.search}" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>'
                    dropdownviewproperty=' <small><strong>Insurance Provider-</strong>{{item.insuranceproviderid.firstname}} {{item.insuranceproviderid.lastname}}<br> </small>
                    <small><strong>Adjuster-</strong>{{item.adjusterid.firstname}} {{item.adjusterid.lastname}}<br> </small>
                    <small ><strong>Claim No-</strong>{{item.claimnumber}} <br> </small> 
                    <small > <strong>Insured Party- </strong>{{item.insuredpartyid.firstname}} {{item.insuredpartyid.lastname}}<br></small>  
                    <hr style="margin:0; border-top:1px solid #ccc">'> </clx-select>`;
            return createHTML;
        }



        function arbitrationEvent() {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` list="GenerateTemplateCtrl.arbitrationEvent"  ngexpression="item.id" ngfilter="|filter:{startEndTime:$select.search}" selectedviewproperty='<small>{{$select.selected.startEndTime}}</small>'
                    dropdownviewproperty='<small>{{item.startEndTime}}</small>'>
                </clx-select> `;
            return createHTML;
        }

        function getLawSecTitle() {
            return "Need to implement";
        }
        function timePicker() {
            return "Need to implement";
        }
        function getOtherParties(dataObj) {
            var createHTML = '';
            createHTML += `<clx-select model="GenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item"
                    selectedviewproperty="<span>{{ $select.selected.contact_name }}</span>" dropdownviewproperty="<small> {{item.contact_name }}</small>">
                </clx-select> `;
            return createHTML;
        }


        /* ===================================== End: Template Auto Generation Code ======================= */

        function handleDocData(response) {
            if (response.doc_Id > 0)
                templatestDatalayer.DownloadTemplate(response.doc_Id);
        }

        function showPaginationButtons() {
            if (!vm.dataReceived) {
                return false;
            }

            if (angular.isUndefined(vm.templateList) || vm.templateList.length <= 0) { return false; }

            if (vm.filter.pageSize === 'all') {
                return false;
            }

            if (vm.templateList.length < (vm.filter.pageSize * vm.filter.pageNum)) {
                return false
            }
            return true;
        }

        function getMore() {
            vm.filter.pageNum += 1;
            // vm.sortbyfilter=vm.display.sortby;
            var filterValues = {
                pageNum: vm.filter.pageNum,
                pageSize: globalConstants.pageSize,
                categoryfilter: vm.newTemplateInfo && vm.newTemplateInfo.category_id ? vm.newTemplateInfo.category_id : '',
                sortbyfilter: vm.filter.sortbyfilter,
            };
            templatestDatalayer.getTemplateList(filterValues)
                .then(function (response) {
                    var data = response.data;
                    vm.templateList = vm.templateList.concat(data);
                    vm.dataReceived = true;
                });
            /*var filterValues = {
            pageNum: +1,
            pageSize: globalConstants.pageSize,
            categoryfilter: vm.filter.categoryfilter,
            sortbyfilter: vm.display.sortby,
        };
        var retainFilter = localStorage.setItem("templateFilter", JSON.stringify(filterValues)); 
        getTemplateList(filterValues);*/
        }

        function getAll() {
            vm.filter.pageSize = 'all';
            var filterValues = {
                pageNum: 1,
                pageSize: 'all',
                categoryfilter: vm.newTemplateInfo && vm.newTemplateInfo.category_id ? vm.newTemplateInfo.category_id : '',
                sortbyfilter: vm.filter.sortbyfilter,
            };
            templatestDatalayer.getTemplateList(filterValues)
                .then(function (response) {
                    var data = response.data;
                    vm.templateList = data;
                    vm.dataReceived = true;
                });
        }
    }

})(angular);


//Template Add Edit controller
(function () {
    'use strict';

    angular
        .module('cloudlex.templates')
        .controller('AddTemplateCtrl', AddTemplateCtrl);

    AddTemplateCtrl.$inject = ['$timeout', '$modalInstance', 'TemplateId', 'templatestDatalayer', 'notification-service'];

    function AddTemplateCtrl($timeout, $modalInstance, TemplateId, templatestDatalayer, notificationService) {

        var vm = this;

        vm.getTemplateKeyword = getTemplateKeyword;
        vm.close = closePopup;
        vm.addTemplateInfo = addTemplateInfo;
        vm.insertCaption = insertCaption;
        vm.insertKeyword = insertKeyword;
        (function () {
            vm.newTemplateInfo = TemplateId;
            templatestDatalayer.getTemplateCatgegory().then(function (response) {
                vm.templateCategories = response.data;
            }, function () {
                notificationService.error("cannot get template categories");
            });


            templatestDatalayer.getTemplateCatgegory();
            getTemplateKeyword();
            getTemplateCaption();
            $timeout(function () {
                CKEDITOR.replace("editornew");
            }, 300)

        })();

        function addTemplateInfo(newTemplateInfo) {
            var newTemplateInfo = setIdsBeforeSaving(newTemplateInfo);
            if (newTemplateInfo.template_id == '' || newTemplateInfo.template_id == undefined) {
                addTemplate(newTemplateInfo);
            } else {
                editTemplate(newTemplateInfo);
            }
        }

        function setIdsBeforeSaving(newTemplateInfo) {
            var newTemplateInfo = angular.copy(newTemplateInfo);
            return newTemplateInfo;
        }

        function addTemplate(newTemplateInfo) {
            newTemplateInfo.template_content = CKEDITOR.instances.editornew.getData();
            templatestDatalayer.addTemplateRecord(newTemplateInfo)
                .then(function (response) {
                    if (response.data.code && response.data.errormessage) {
                        notificationService.error(response.data.errormessage);
                    } else {
                        $modalInstance.close();
                        notificationService.success('Template added successfully.');
                    }
                }, function () {
                    //alert("unable to add");
                    notificationService.error('An error occurred. Please try later.');
                });
        }

        function editTemplate(newTemplateInfo) {
            newTemplateInfo.template_content = CKEDITOR.instances.editornew.getData();
            templatestDatalayer.editTemplateRecord(newTemplateInfo)
                .then(function (response) {
                    if (response.data.code && response.data.errormessage) {
                        notificationService.error(response.data.errormessage);
                    } else {
                        $modalInstance.close();
                        notificationService.success('Template updated successfully.');
                    }
                }, function () {
                    //alert("unable to add");
                    notificationService.error('An error occurred. Please try later.');
                });
        }


        function getTemplateKeyword() {
            return templatestDatalayer.getTemplateKeywrdList()
                .then(function (response) {
                    vm.templateKeyword = response.data.keyword;
                }, function () {
                    alert("cannot get template Keyword");
                });
        }

        vm.getKeywordValue = function (keywordvalue) {
            vm.newTemplateInfo.kewwordValue = '';
            var keyvalues = _.find(vm.templateKeyword, function (item) {
                return item.category_id === keywordvalue

            })
            if (keyvalues) {
                vm.selectedKeyValue = keyvalues.variables;
            } else {
                vm.selectedKeyValue = [];
            }

        }

        function getTemplateCaption() {
            return templatestDatalayer.getTemplateCaptionList()
                .then(function (response) {
                    vm.templateCaptions = response.data;
                }, function () {
                    alert("cannot get template Caption");
                });
        }

        function closePopup() {
            $modalInstance.dismiss();
        }

        function insertCaption(captiontext) {
            var keyvalues = _.find(vm.templateCaptions, function (item) {
                return item.caption_id === captiontext;

            })
            var captiontext = keyvalues.caption_description;
            if (captiontext != undefined && captiontext != '') {
                CKEDITOR.instances.editornew.insertHtml(captiontext);
            }

        }

        function insertKeyword(select_key) {
            var keyvalues = _.find(vm.selectedKeyValue, function (item) {
                return item.variable_id === select_key;

            })
            var keyText = keyvalues.variable;

            if (keyText != undefined && keyText != '') {
                CKEDITOR.instances.editornew.insertHtml('<span class="markKeword" contenteditable="false">«' + keyText.toUpperCase() + '»</span>&nbsp');
            }
        }
    }



})();


(function (angular) {
    'use strict';
    angular.module('cloudlex.templates')
        .factory('templatestDatalayer', templatestDatalayer);


    templatestDatalayer.$inject = ['$http', '$q', 'globalConstants'];

    function templatestDatalayer($http, $q, globalConstants) {

        var urls = {
            templateList: globalConstants.webServiceBase + 'lexviatemplates/lexviatemplate?',
            templateCatList: globalConstants.webServiceBase + 'lexviadocuments/getcategories',
            templateKeywordList: globalConstants.webServiceBase + 'lexviatemplates/getKeywords.json',
            matterContacts: globalConstants.webServiceBase + 'lexviatemplates/getMatterContacts/[ID].json',
            getTemplateCaptionList: globalConstants.webServiceBase + 'lexviatemplates/getCaptions.json',
            addTemplateRecordUrl: globalConstants.webServiceBase + 'lexviatemplates/lexviatemplate',
            editTemplateRecordUrl: globalConstants.webServiceBase + 'lexviatemplates/lexviatemplate/',
            deleteTemplateRecordUrl: globalConstants.webServiceBase + 'lexviatemplates/lexviatemplate/',
            generateTemplateRecordUrl: globalConstants.webServiceBase + 'lexviatemplates/generate.json?',
            javaGenerateTemplateRecordUrl: globalConstants.javaWebServiceBaseV1 + 'generateTemplate',
            javaGenerateTemplateRecordUrlVersion2: globalConstants.javaWebServiceBaseV2 + 'generateTemplate',
            //DownloadTemplateUrl: globalConstants.webServiceBase + "lexviafiles/sharedaccessdownload/"
            DownloadTemplateUrl: globalConstants.webServiceBase + "lexviafiles/viewblob/",
            generateDefaultTemplate: globalConstants.webServiceBase + "lexviatemplates/generatedefault.json?",
        };

        return {
            getTemplateList: _getTemplateList,
            getTemplateCatlist: _getTemplateCatlist,
            getTemplateKeywrdList: _getTemplateKeywrdList,
            getTemplateCaptionList: _getTemplateCaptionList,
            addTemplateRecord: _addTemplateRecord,
            editTemplateRecord: _editTemplateRecord,
            deleteTemplateRecord: _deleteTemplateRecord,
            GenerateTemplateRecord: _GenerateTemplateRecord,
            GenerateNewTemplateRecord: _GenerateNewTemplateRecord,
            DownloadTemplate: _DownloadTemplate,
            getTemplateCatgegory: _getTemplateCatgegory,
            getMatterContacts: _getMatterContacts

        };

        function _getTemplateList(filter) {
            var url = urls.templateList + utils.getParams(filter);
            return $http.get(url);
        }

        function _getTemplateCatgegory() {
            return _getTemplateCatlist();

        }

        function _getTemplateCatlist() {
            var url = urls.templateCatList;
            return $http.get(url);

        }

        function _getMatterContacts(matterID) {
            var url = getURL(urls.matterContacts, matterID);
            return $http.get((url), {
                params: {
                    pageNum: 1,
                    pageSize: 100
                }
            });

        }

        function _getTemplateKeywrdList() {
            var url = urls.templateKeywordList;
            return $http.get(url);

        }

        function _getTemplateCaptionList() {
            var url = urls.getTemplateCaptionList;
            return $http.get(url);

        }

        function _addTemplateRecord(newTemplateInfo) {
            var url = urls.addTemplateRecordUrl;
            return $http.post(url, newTemplateInfo);
        }

        function _editTemplateRecord(newTemplateInfo) {
            var url = urls.editTemplateRecordUrl + newTemplateInfo.template_id;
            return $http.put(url, newTemplateInfo);

        }

        function _deleteTemplateRecord(ids) {
            var url = urls.deleteTemplateRecordUrl + ids;
            return $http.delete(url);
        }

        /**
         * Generate new template
         */
        function _GenerateNewTemplateRecord(resetParams, APICall, fileName) {
            if (APICall == "php") {
                var url = urls.generateTemplateRecordUrl + utils.getParams(resetParams);
                return $http.get(url);
            } else if (APICall == "java") {
                var deferred = $q.defer();
                var token = {
                    'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                    'Content-type': 'application/json'
                }

                var url = urls.javaGenerateTemplateRecordUrl;
                $http({
                    url: url,
                    method: "POST",
                    headers: token, // Add params into headers
                    data: resetParams,
                    responseType: 'arraybuffer'
                }).success(function (response, status, type, headers) {
                    deferred.resolve(response);
                }).error(function (error) {
                    deferred.resolve(ee);
                });
                return deferred.promise;
            } else if (APICall == "java2") {
                var deferred = $q.defer();
                var token = {
                    'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                    'Content-type': 'application/json'
                }
                var url = urls.javaGenerateTemplateRecordUrlVersion2;
                $http({
                    url: url,
                    method: "POST",
                    headers: token, // Add params into headers
                    data: resetParams,
                    responseType: 'arraybuffer'
                }).success(function (response, status, type, headers) {
                    deferred.resolve(response);
                }).error(function (error) {
                    deferred.resolve(ee);
                });
                return deferred.promise;
            } else if (APICall == "php2") {
                var url = urls.generateDefaultTemplate + utils.getParams(resetParams);
                return $http.get(url);
            }

        }



        function _GenerateTemplateRecord(tid, templatetype, matterId, defendantid,
            plaintiffid, provider_id, option, typeId, leadattorneyid, paralegalid, showsocialsecuritynumber, secondleadattorney, secondparalegal, contactType) {
            var params = getparams(tid, templatetype, matterId, defendantid, plaintiffid, provider_id, option, typeId, leadattorneyid, paralegalid, showsocialsecuritynumber, secondleadattorney, secondparalegal, contactType);

            var url = urls.generateTemplateRecordUrl + utils.getParams(params);
            return $http.get(url);

        }

        function getparams(tid, templatetype, matterId, defendantId, userId,
            provider_id, option, typeId, leadattorneyid, paralegalid, showsocialsecuritynumber, secondleadattorney, secondparalegal, contactType) {
            var params;
            if (option) {
                switch (option) {
                    case 'Plaintiff':
                        (typeId == 18) ?
                            params = { templateid: tid, matterid: matterId, templatetype: templatetype, contactid: defendantId.contactid, leadattorneyid: leadattorneyid } :
                            (typeId == 23) ?
                                params = {
                                    templateid: tid,
                                    matterid: matterId,
                                    templatetype: templatetype,
                                    contactid: userId.contactid.contactid, //provider_id.contactid
                                    userid: userId.plaintiffid,
                                    leadattorneyid: leadattorneyid,
                                    insuranceproviderid: provider_id
                                } :
                                (typeId == 24) ?
                                    params = {
                                        templateid: tid,
                                        matterid: matterId,
                                        templatetype: templatetype,
                                        plaintiffid: userId,
                                        attorneyid: leadattorneyid,
                                        paralegalid: paralegalid,
                                        secondattorneyid: secondleadattorney,
                                        secondparalegalid: secondparalegal
                                    } :
                                    params = { templateid: tid, matterid: matterId, templatetype: templatetype, userid: userId, leadattorneyid: leadattorneyid }
                        break;
                    case 'Defendant':
                        (typeId == 19) ?
                            params = { templateid: tid, matterid: matterId, templatetype: templatetype, contactid: defendantId.contactid,/**userId.contactid */ leadattorneyid: leadattorneyid, plaintiffid: userId } :
                            params = { templateid: tid, matterid: matterId, templatetype: templatetype, userid: (typeId == 3 || typeId == 4) ? defendantId : userId }
                        break;
                    case 'PlaintiffDefendant':
                        (typeId == 17) ?
                            params = {
                                templateid: tid,
                                matterid: matterId,
                                templatetype: templatetype,
                                userid: userId,
                                contactid: provider_id,
                                leadattorneyid: leadattorneyid,
                                insuredpartyid: defendantId
                            } :
                            (typeId == 25 || typeId == 26) ?
                                params = {
                                    templateid: tid,
                                    matterid: matterId,
                                    templatetype: templatetype,
                                    plaintiffid: userId,
                                    contactid: provider_id,
                                    insuredpartyid: defendantId,
                                    leadattorneyid: leadattorneyid
                                } :
                                params = { templateid: tid, matterid: matterId, templatetype: templatetype, userid: defendantId, plaintiffid: userId, insuranceproviderid: provider_id };
                        break;
                    case 'PlaintiffService':
                        (typeId == 20 || typeId == 28) ?
                            params = { templateid: tid, matterid: matterId, templatetype: templatetype, plaintiffid: userId, mattercontactid: defendantId, contactType: contactType, contactid: provider_id, showsocialsecuritynumber: showsocialsecuritynumber } :
                            (typeId == 21 || typeId == 22) ?
                                params = { templateid: tid, matterid: matterId, templatetype: templatetype, plaintiffid: userId, contactid: provider_id, leadattorneyid: leadattorneyid } :
                                (typeId == 16) ? params = { templateid: tid, matterid: matterId, templatetype: templatetype, plaintiffid: userId, contactid: provider_id, paralegalid: paralegalid } :
                                    (typeId == 8) ? params = { templateid: tid, matterid: matterId, templatetype: templatetype, userid: userId, insuranceproviderid: provider_id } :
                                        params = { templateid: tid, matterid: matterId, templatetype: templatetype, userid: userId, insuranceproviderid: provider_id, leadattorneyid: leadattorneyid, paralegalid: paralegalid, showsocialsecuritynumber: showsocialsecuritynumber };
                        break;
                    case 'Attorney':
                        params = { templateid: tid, matterid: matterId, templatetype: templatetype, userid: userId, leadattorneyid: leadattorneyid }
                        break;
                    case 'DefendantAttorney':
                        params = { templateid: tid, matterid: matterId, templatetype: templatetype, userid: userId, attorneyid: provider_id, leadattorneyid: leadattorneyid }
                        break;
                    case 'PlaintiffEvents':
                        params = { templateid: tid, matterid: matterId, templatetype: templatetype, plaintiffid: userId, eventid: provider_id, leadattorneyid: leadattorneyid }
                        break;
                }
                return params;

            } else {
                params = { templateid: tid, matterid: matterId, templatetype: templatetype, attorneyid: userId, insuranceproviderid: provider_id }
                return params;
            }

        }

        function getURL(serviceUrl, id) {
            var url = serviceUrl.replace("[ID]", id);
            return url;
        };

        function _DownloadTemplate(documentId) {
            var url = urls.DownloadTemplateUrl + documentId + '.json' + '?doctype=temp&download=true';
            return $http.get(url);
        }
    }


})(angular);

(function (angular) {

    angular.module('cloudlex.templates')
        .factory('templateManagementHelper', templateManagementHelper);

    function templateManagementHelper() {
        return {
            getTemplateGrid: _getTemplatesGrid,
            temDisplayOptions: temDisplayOptions
        };

        function _getTemplatesGrid() {
            return [{
                field: [{
                    prop: 'template_name'
                }],
                displayName: 'Template Name',
                dataWidth: "35"
            },
            {
                field: [{
                    prop: 'template_description'
                }],
                displayName: 'Description',
                dataWidth: "35"
            },
            {
                field: [{
                    prop: 'categoryname'
                }],
                displayName: 'Category',
                dataWidth: "20"
            },
            {
                field: [{
                    html: '<div class="button-vertical-center">' +

                        '<div data-ng-hide="sideNav.display.openDrawer== true || template.matterInfo.archivalMatterReadOnlyFlag"' +
                        ' class="pull-left"' +
                        ' data-ng-click="template.GenerateTemplate($event,data)" ><span class="sprite default-generate" tooltip="Generate" tooltip-append-to-body="true"></span>' +
                        '&nbsp;</div><span class="marginLR-5px"></span>' +

                        '</div>'
                }],

                displayName: 'Action',
                dataWidth: "10"
            }
            ];
        }
        function temDisplayOptions() {
            return {
                filtered: true,
                // documentListReceived: false,
                //  documentSelected: {},
                sortOption: [{
                    'key': 1,
                    'lable': 'Template Name ASC',
                    'sortorder': 'asc',
                    'divider': 1,
                },
                {
                    'key': 2,
                    'lable': 'Template Name DESC',
                    'sortorder': 'desc',
                    'divider': 1,
                },
                {
                    'key': '',
                    'lable': 'Last Updated',
                    'sortorder': '',
                    'divider': 0,
                }
                ],
                sortSeleted: 'Last Updated',
                sortby: '',
                sortorder: '',
                /*  filters: {
                      plaintiff: '',
                      category: '',
                  },
                  filtertags: [],*/
                filterText: ''
            };
        }
    }
})(angular);
