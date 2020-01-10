(function (angular) {
    'use strict';
    angular.module('intake.templates')
        .controller('IntakeTemplateCtrl', IntakeTemplateCtrl)

    IntakeTemplateCtrl.$inject = ['$scope', '$stateParams', '$modal', 'intakeTemplateManagementHelper', 'globalConstants', 'intakeTemplatestDatalayer', 'notification-service', 'modalService', 'intakeTemplateConstants', '$http'];

    function IntakeTemplateCtrl($scope, $stateParams, $modal, intakeTemplateManagementHelper, globalConstants, intakeTemplatestDatalayer, notificationService, modalService, intakeTemplateConstants, $http) {
        var vm = this;
        vm.openAddTemplateModal = openAddTemplateModal;
        vm.EditTemplateInfo = EditTemplateInfo;
        vm.DeleteTemplate = DeleteTemplate;
        vm.IntakeGenerateTemplate = IntakeGenerateTemplate;
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
                headers: intakeTemplateManagementHelper.getTemplateGrid(),
            };
            vm.display = intakeTemplateManagementHelper.temDisplayOptions();
            vm.filter = {
                page_num: 1,
                page_size: globalConstants.pageSize,
                category_filter: '',
                sort_by_filter: ''
            };
            if ($stateParams.intakeId) {
                vm.intakeId = $stateParams.intakeId;
            } else {
                vm.intakeId = 0;
            }
            vm.dataReceived = false;

            intakeTemplatestDatalayer.getTemplateCatgegory().then(function (response) {
                vm.templateCategories = response.data;
            }, function () {
                alert("cannot get template categories");
            });

            var localfilter = JSON.parse(localStorage.getItem("intakeTemplateFilter"));
            if (localfilter) {
                localfilter.page_size = globalConstants.pageSize;
                localStorage.setItem("intakeTemplateFilter", JSON.stringify(localfilter));
            }

            getTemplateList(vm.filter);

            /**
             * get json configuration for new template
             */
            $http.get('intake/templates/partials/template_generate_config.json').success(function (response) {
                vm.template_config = response;
            });

            $http.get('intake/templates/partials/auto_template_generate_config.json').success(function (response) {
                vm.auto_template_config = response;
            });

            var globalIntakeTemplateFilterText = (sessionStorage.getItem("globalIntakeTemplateFilterText")) ? JSON.parse(sessionStorage.getItem("globalIntakeTemplateFilterText")) : "";
            if (utils.isNotEmptyVal(globalIntakeTemplateFilterText)) {
                if (vm.intakeId == globalIntakeTemplateFilterText.intakeId) {
                    vm.showSearch = true;
                    vm.filterText = globalIntakeTemplateFilterText.filtertext;
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
            retainSearch.intakeId = vm.intakeId;
            sessionStorage.setItem("globalIntakeTemplateFilterText", JSON.stringify(retainSearch));
        }
        function sortTemplate($sortby, $sortorder, $label) {
            vm.filter.page_num = 1;
            vm.display.sortby = $sortby;
            vm.display.sortorder = $sortorder;
            vm.display.sortSeleted = $label;
            var filterValues = {
                page_num: 1,
                page_size: vm.filter.page_size === '' ? vm.filter.page_size : globalConstants.pageSize,
                sort_by_filter: vm.display.sortby,
                category_filter: vm.newTemplateInfo && vm.newTemplateInfo.category_id ? vm.newTemplateInfo.category_id : ''
            }
            var retainFilter = localStorage.setItem("intakeTemplateFilter", JSON.stringify(filterValues));
            getTemplateList(filterValues);
        }

        function reset() {
            var localfilter = JSON.parse(localStorage.getItem("intakeTemplateFilter"));
            if (vm.newTemplateInfo) {
                vm.newTemplateInfo.category_id = '';
            }

            vm.filterText = "";
            sessionStorage.setItem("globalIntakeTemplateFilterText", vm.filterText);
            vm.filter.sort_by_filter = '';
            vm.display.sortSeleted = 'Last Updated';
            localfilter.category_filter = '';
            localfilter.sort_by_filter = "";
            localStorage.setItem("intakeTemplateFilter", JSON.stringify(localfilter));
            getTemplateList(localfilter);
        }

        function filterTemplateList(catId) {
            var filterValues = {
                page_num: 1,
                page_size: globalConstants.pageSize,
                category_filter: catId,
                sort_by_filter: vm.display.sortby
            };
            var retainFilter = localStorage.setItem("intakeTemplateFilter", JSON.stringify(filterValues));  //Bug#6661 Template filter retaintion
            getTemplateList(filterValues);
        }

        function getTemplateList(filter) {
            //Bug#6661 Template filter retaintion
            var localfilter = localStorage.getItem("intakeTemplateFilter");
            localfilter = JSON.parse(localfilter);
            if (utils.isNotEmptyVal(localfilter)) {
                filter = localfilter;
                vm.newTemplateInfo = {};
                vm.newTemplateInfo.category_id = filter.category_filter;
                vm.filter.sort_by_filter = filter.sort_by_filter;
                if (filter.sort_by_filter == 2) {
                    vm.display.sortSeleted = 'Template Name DESC';
                } else if (filter.sort_by_filter == 1) {
                    vm.display.sortSeleted = 'Template Name ASC';
                }
            }

            intakeTemplatestDatalayer.getTemplateList(filter)

                .then(function (response) {
                    vm.filter.page_size = filter.page_size;
                    vm.filter.sort_by_filter = filter.sort_by_filter;
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

                intakeTemplatestDatalayer.deleteTemplateRecord(template_id)
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


        function IntakeGenerateTemplate($event, templateInfo) {
            var templateOption = "";
            var templateOptionHold = "";
            var templateApiCall = "";
            var templateName = "";
            var templateId = "";
            var intakeId = "";
            var typeId = "";
            _.forEach(intakeTemplateConstants.intaketemplateDetails, function (templateDetail) {
                if (templateDetail.template_code == templateInfo.template_code) {
                    templateOption = templateDetail.option;
                    templateApiCall = templateDetail.template_api_call;
                    // templateName = templateDetail.template_name;
                    intakeId = $stateParams.intakeId;
                    // typeId = templateDetail.typeId;
                    if (utils.isNotEmptyVal(templateOption)) {
                        templateOptionHold = templateOption;
                    }
                }
            });

            if (templateOptionHold == 'auto_generate') {
                var resolveObj = {
                    intakeId: $stateParams.intakeId,
                    // lexvia_template: templateInfo.lexviatemplate,
                    // template_name: templateInfo.template_name,
                    // template_id: templateInfo.template_id,
                    option: templateOptionHold,
                    template_code: templateInfo.template_code,
                    // typeId: typeId
                };

                var temp_code = '';
                var generatorTemplateData = '';
                _.forEach(vm.auto_template_config, function (tempKey) {
                    if (tempKey.template_code == resolveObj.template_code) {
                        generatorTemplateData = tempKey;
                        var modalInstance = openAutoGenerateTemplateModal(resolveObj, generatorTemplateData, templateInfo);
                    }
                });

            } else if (utils.isNotEmptyVal(templateOptionHold)) {
                var generatorTemplateData = '';
                var resolveObj = {
                    intakeId: $stateParams.intakeId,
                    // lexvia_template: templateInfo.template_type,
                    // template_name: templateInfo.template_name,
                    // template_id: templateInfo.template_id,
                    option: templateOptionHold,
                    template_code: templateInfo.template_code,
                    // typeId: typeId
                };
                _.forEach(vm.template_config, function (tempKey) {
                    if (tempKey.template_code == resolveObj.template_code) {
                        generatorTemplateData = tempKey;
                    }
                });
                var modalInstance = openTemplateModal(resolveObj, generatorTemplateData, templateInfo);
            }
            /* When we do not require UI will automatically generate */
            else if (false) {
                var resetParams = {
                    mid: parseInt($stateParams.matterId),
                    //tz: moment.tz(moment.tz.guess()).format('Z'),
                    tz: moment.tz.guess(), //Timezone Changes
                    templateId: parseInt(templateInfo.template_id)
                };
                var templateName = templateInfo.template_name;
                var templateApiCall = "java2";
                intakeTemplatestDatalayer.GenerateNewTemplateRecord(resetParams, templateApiCall, templateName)
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
            }



            // open Plantiff/Defendent selection form
            function openTemplateModal(resolveObj, generatorTemplateData, templateDetailFromJava) {
                return $modal.open({
                    templateUrl: 'app/intake/templates/partials/select-template.html',
                    controller: 'IntakeGenerateTemplateCtrl as IntakeGenerateTemplateCtrl',
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
                        },
                        templateDetailFromJava: function () {
                            return templateDetailFromJava;
                        }
                    }
                });
            }


            function openAutoGenerateTemplateModal(resolveObj, generatorTemplateData, templateDetailFromJava) {
                return $modal.open({
                    template: autoGenerateTemplateConfig(resolveObj, generatorTemplateData),
                    controller: 'IntakeGenerateTemplateCtrl as IntakeGenerateTemplateCtrl',
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
                        },
                        templateDetailFromJava: function () {
                            return templateDetailFromJava;
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
                                <button class="btn btn-default pull-right" data-ng-disabled="IntakeGenerateTemplateCtrl.newAutoValidateSelection(IntakeGenerateTemplateCtrl.TemplateModelInfo)"
                                    data-ng-click="IntakeGenerateTemplateCtrl.generateAutoTemplate(IntakeGenerateTemplateCtrl.TemplateModelInfo,IntakeGenerateTemplateCtrl.autoGenerateTemplateModelInfo)">
                                    Generate
                                </button>
                                <button class="btn btn-default btn-styleNone pull-right margin-right10px" data-ng-click="IntakeGenerateTemplateCtrl.close()">Cancel</button>
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

            })

            html += `</div></div>`;

            return html;
        }

        function createDropdown(dataObj) {
            switch (dataObj.api) {
                case "getPlaintiffs":
                    switch (dataObj.list) {
                        case 'IntakeGenerateTemplateCtrl.plaintiff_dropdown': return getPlaintiffs(dataObj); break;
                        default: return getPlaintiffs(dataObj);
                    }
                    break;
                case "getTreatmentDates":
                    switch (dataObj.list) {
                        case 'IntakeGenerateTemplateCtrl.medicalInfoDates': return getTreatmentDates(dataObj); break;
                        default: return getTreatmentDates(dataObj);
                    }
                    break;
                case "getPhysicianInfo":
                    switch (dataObj.list) {
                        case 'IntakeGenerateTemplateCtrl.onlyPhysicians': return getPhysicianInfo(dataObj); break;
                        default: return getPhysicianInfo(dataObj);
                    }
                    break;
                case "getInsuredParty":
                    switch (dataObj.list) {
                        case 'IntakeGenerateTemplateCtrl.insuranceInsuredAdjuster': return getInsuredParty(dataObj); break;
                        default: return getInsuredParty(dataObj);
                    }
                case "getAssignUser":
                    switch (dataObj.list) {
                        case 'IntakeGenerateTemplateCtrl.assignUsers': return getAssignUsers(dataObj); break;
                        default: return getAssignUsers(dataObj);
                    }
                    break;
                default:
                    return defaultOne(dataObj);
            }
        }

        function createText(dataObj) {
            var createHTML = '';
            createHTML += `<clx-intake-textbox model="IntakeGenerateTemplateCtrl.autoGenerateTemplateModelInfo" `
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `></clx-intake-textbox>`;
            return createHTML;
        }

        function createDatePicker(dataObj) {
            var createHTML = '';
            createHTML += `<clx-intake-date condition="IntakeGenerateTemplateCtrl.openCalender(event)" model="IntakeGenerateTemplateCtrl.autoGenerateTemplateModelInfo" `
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += `></clx-intake-date>`;
            return createHTML;
        }

        function defaultOne(dataObj) {
            var createHTML = '';
            createHTML += `<clx-intake-select model="IntakeGenerateTemplateCtrl.autoGenerateTemplateModelInfo" `
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{name:$select.search} | orderBy: 'name'" selectedviewproperty='<small> {{$select.selected.name}}</small>'
                    dropdownviewproperty='<small> {{item.name}} </small>'>
                </clx-intake-select>`;
            return createHTML;
        }
        /* ====================================== Plaintiffs Function start ===================================== */

        function getPlaintiffs(dataObj) {
            var createHTML = '';
            createHTML += `<clx-intake-select model="IntakeGenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{name:$select.search} | orderBy: 'name'" selectedviewproperty='<small> {{$select.selected.name}}</small>'
                    dropdownviewproperty='<small> {{item.name}} </small>'>
                </clx-intake-select>`;
            return createHTML;
        }

        /* ======================================== Plaintiffs function ends ======================================= */

        //Treatment Date Dropdown 
        function getTreatmentDates(dataObj) {
            var createHTML = '';
            createHTML += `<clx-intake-select model="IntakeGenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{startEndDate:$select.search} | orderBy: 'startEndDate'" selectedviewproperty='<small> {{$select.selected.startEndDate}}</small>'
                    dropdownviewproperty='<small> {{item.startEndDate}} </small>'>
                </clx-intake-select>`;
            return createHTML;
        }

        //insured party dropdown
        function getInsuredParty(dataObj) {
            var createHTML = '';
            createHTML += `<clx-intake-select model="IntakeGenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{insuredPartyName:$select.search} | orderBy: 'insuredPartyName'" selectedviewproperty='<small> {{$select.selected.insuredPartyName}}</small>'
                    dropdownviewproperty='<small> {{item.insuredPartyName}} </small>'>
                </clx-intake-select>`;
            return createHTML;
        }

        //Physician Dropdown
        function getPhysicianInfo(dataObj) {
            var createHTML = '';
            createHTML += `<clx-intake-select model="IntakeGenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{contact_name:$select.search} | orderBy: 'contact_name'" selectedviewproperty='<small> {{$select.selected.contact_name}}</small>'
                    dropdownviewproperty='<small> {{item.contact_name}} </small>'>
                </clx-intake-select>`;
            return createHTML;
        }

        // Intake Users 
        function getAssignUsers(dataObj) {
            var createHTML = '';
            createHTML += `<clx-intake-select model="IntakeGenerateTemplateCtrl.autoGenerateTemplateModelInfo" `;
            for (var key in dataObj) {
                createHTML += key + "=\"" + dataObj[key] + "\" "
            }
            createHTML += ` ngexpression="item" ngfilter=" | filter:{fullName:$select.search} | orderBy: 'fullName'" selectedviewproperty='<small> {{$select.selected.fullName}}</small>'
                    dropdownviewproperty='<small> {{item.fullName}} </small>'>
                </clx-intake-select>`;
            return createHTML;
        }



        /* ===================================== End: Template Auto Generation Code ======================= */

        function handleDocData(response) {
            if (response.doc_Id > 0)
                intakeTemplatestDatalayer.DownloadTemplate(response.doc_Id);
        }

        function showPaginationButtons() {
            if (!vm.dataReceived) {
                return false;
            }

            if (angular.isUndefined(vm.templateList) || vm.templateList.length <= 0) { return false; }

            if (vm.filter.page_size === '') {
                return false;
            }

            if (vm.templateList.length < (vm.filter.page_size * vm.filter.page_num)) {
                return false
            }
            return true;
        }

        function getMore() {
            vm.filter.page_num += 1;
            // vm.sort_by_filter=vm.display.sortby;
            var filterValues = {
                page_num: vm.filter.page_num,
                page_size: globalConstants.pageSize,
                category_filter: vm.newTemplateInfo && vm.newTemplateInfo.category_id ? vm.newTemplateInfo.category_id : '',
                sort_by_filter: vm.filter.sort_by_filter,
            };
            intakeTemplatestDatalayer.getTemplateList(filterValues)
                .then(function (response) {
                    var data = response.data;
                    vm.templateList = vm.templateList.concat(data);
                    vm.dataReceived = true;
                });
        }

        function getAll() {
            // vm.filter.page_size = 'all';
            vm.filter.page_size = '';
            var filterValues = {
                page_num: '',
                page_size: '',
                category_filter: vm.newTemplateInfo && vm.newTemplateInfo.category_id ? vm.newTemplateInfo.category_id : '',
                sort_by_filter: vm.filter.sort_by_filter,
            };
            intakeTemplatestDatalayer.getTemplateList(filterValues)
                .then(function (response) {
                    var data = response.data;
                    vm.templateList = data;
                    vm.dataReceived = true;
                });
        }
    }

})(angular);



(function (angular) {
    'use strict';
    angular.module('intake.templates')
        .factory('intakeTemplatestDatalayer', intakeTemplatestDatalayer);


    intakeTemplatestDatalayer.$inject = ['$http', '$q', 'globalConstants'];

    function intakeTemplatestDatalayer($http, $q, globalConstants) {

        var urls = {
            intakeTemplateList: globalConstants.intakeServiceBaseV2 + 'intake-template?',
            templateCatList: globalConstants.webServiceBase + 'lexviadocuments/getcategories',
            javaGenerateTemplateRecordUrlVersion2: globalConstants.webServiceBase + 'Intake-Manager/v1/intake-template',
            DownloadTemplateUrl: globalConstants.webServiceBase + "lexviafiles/viewblob/",
        };

        return {
            getTemplateList: _getTemplateList,
            getTemplateCatgegory: _getTemplateCatgegory,
            getTemplateCatlist: _getTemplateCatlist,
            GenerateNewTemplateRecord: _GenerateNewTemplateRecord,
            DownloadTemplate: _DownloadTemplate,
        };

        function _getTemplateList(filter) {
            var url = urls.intakeTemplateList + utils.getIntakeParams(filter);
            return $http.get(url);
        }

        function _getTemplateCatgegory() {
            return _getTemplateCatlist();
        }

        function _getTemplateCatlist() {
            var url = urls.templateCatList;
            return $http.get(url);
        }

        /**
         * Generate new template
         */
        function _GenerateNewTemplateRecord(resetParams, APICall, fileName) {

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

        }

        function _DownloadTemplate(documentId) {
            var url = urls.DownloadTemplateUrl + documentId + '.json' + '?doctype=temp&download=true';
            return $http.get(url);
        }
    }


})(angular);

(function (angular) {

    angular.module('intake.templates')
        .factory('intakeTemplateManagementHelper', intakeTemplateManagementHelper);

    function intakeTemplateManagementHelper() {
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
                    prop: 'category_name'
                }],
                displayName: 'Category',
                dataWidth: "20"
            },
            {
                field: [{
                    html: '<div class="button-vertical-center">' +

                        '<div data-ng-hide="sideNav.display.openDrawer== true"' +
                        ' class="pull-left"' +
                        ' data-ng-click="intakeTemplate.IntakeGenerateTemplate($event,data)" ><span class="sprite default-generate" tooltip="Generate" tooltip-append-to-body="true"></span>' +
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
                filterText: ''
            };
        }
    }
})(angular);
