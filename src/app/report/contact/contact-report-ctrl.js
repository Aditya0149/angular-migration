(function (angular) {

    'use strict';

    angular.module('cloudlex.report')
        .controller('ContactReportCtrl', ContactReportCtrl);

    ContactReportCtrl.$inject = ['$scope', '$modal', '$rootScope', 'masterData', 'contactDataLayer', 'contactReportHelper', 'contactFactory', 'matterFactory', 'globalConstants', 'mailboxDataService'];

    function ContactReportCtrl($scope, $modal, $rootScope, masterData, contactDataLayer, contactReportHelper, contactFactory, matterFactory, globalConstants, mailboxDataService) {
        var vm = this,
            pageSize = 250,
            users = [],
            initLimit = 20;

        var masterDataObj = masterData.getMasterData();
        vm.filterReportContact = filterReportContact;
        vm.tagCancelled = tagCancelled;
        vm.exportContactReport = exportContactReport;
        vm.printContactReport = printContactReport;
        vm.getMore = getMore;
        vm.getAll = getAll;
        vm.showPaginationButtons = showPaginationButtons;
        vm.getContact = getContact;
        vm.openContactCard = openContactCard;
        vm.reachedBottom = reachedBottom;
        vm.reachedTop = reachedTop;
        vm.contact;
        vm.JavaFilterAPIForContactList = true;
        (function () {
            vm.filter = {
                pageNum: 1,
                pageSize: pageSize,
                statusIds: [],
                role: []
            };

            //init clicked row count
            vm.clickedRow = -1;
            vm.dataLimit = initLimit;
            vm.filterSentToAPI = {
                pageNum: 1,
                pageSize: pageSize,
                contactid: '',
                statusIds: '',
                roleFilter: ''
            };

            vm.selectionModel = {
                multiFilters: {
                    statuses: [],
                    roles: []
                }
            };

            vm.dataReceived = false;
            vm.contactReportGrid = {
                headers: contactReportHelper.contactReportGrid()
            };

            var contact = sessionStorage.getItem("contactReportContact");
            if (utils.isNotEmptyVal(contact)) {
                try {
                    vm.contact = JSON.parse(contact);
                } catch (e) { vm.contact = {}; }
            }

            var appliedFilters = sessionStorage.getItem("contactReportFilters");
            if (utils.isNotEmptyVal(appliedFilters)) {
                try {
                    vm.filter = JSON.parse(appliedFilters);

                    if (angular.isDefined(vm.filter.contact) && angular.isDefined(vm.filter.contact.contactid)) {
                        vm.filterSentToAPI.contactId = vm.filter.contact.contactid;
                    } else {
                        vm.filterSentToAPI.contactId = '';
                    }

                    vm.filterSentToAPI.statusIds = angular.isDefined(vm.filter.statusIds) ? vm.filter.statusIds.toString() : "";

                    vm.filterSentToAPI.roleFilter = angular.isDefined(vm.filter.roleFilter) ? vm.filter.roleFilter.toString() : "";

                    vm.tags = contactReportHelper.generateTags(vm.filter, masterDataObj);
                } catch (e) { }
            }

            var selectionModel = sessionStorage.getItem("contactReportMultifilters");
            if (utils.isNotEmptyVal(appliedFilters)) {
                try {
                    vm.selectionModel = JSON.parse(selectionModel);
                } catch (e) { }
            }


            if (utils.isNotEmptyVal(contact) || utils.isNotEmptyVal(appliedFilters)) {
                getContact();
            }

            if (utils.isEmptyVal(contact)) {
                vm.total = 0;
            }

            getUserEmailSignature();
            vm.firmData = JSON.parse(sessionStorage.getItem('firmSetting'));

        })();

        function getContact() {
            var filter = {};
            filter = vm.filterSentToAPI;
            persistFilters();
            if (angular.isDefined(vm.contact) && angular.isDefined(vm.contact.contactid)) {
                filter.contactType = utils.isNotEmptyVal(vm.contact.contact_type) ? vm.contact.contact_type : '';
                filter.contactId = vm.contact.contactid;
                contactDataLayer.getContactData(filter)
                    .then(function (response) {
                        //init clicked row count
                        vm.clickedRow = -1;
                        var data = response.data.matters;
                        contactReportHelper.setDates(data);
                        vm.contactReportList = data;
                        vm.dataReceived = true;
                        vm.total = response.data.matters_count;
                        _.forEach(vm.contactReportList, function (item) {
                            if (item.contact) {
                                item.contact_name = item.contact.contact_name;
                            }
                        });
                    });
            } else {
                vm.contactReportList = [];
                vm.dataReceived = false;
            }
        }

        function setCount(res) {
            vm.total = res.data[0];
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

        function persistFilters() {
            sessionStorage.setItem("contactReportFilters", JSON.stringify(vm.filter));
            sessionStorage.setItem("contactReportMultifilters", JSON.stringify(vm.selectionModel));
            sessionStorage.setItem("contactReportContact", JSON.stringify(vm.contact));
        }

        $scope.$watch(function () {
            return vm.contact;
        }, function (newValue) {
            if (utils.isEmptyVal(newValue)) {
                vm.contactReportList = [];
                if (newValue != "") {
                    getContact();
                }
                else {
                    vm.contactReportList = [];
                    vm.dataReceived = false;
                    vm.filterSentToAPI.contactId = '';
                    vm.filter.contact = undefined;
                    sessionStorage.removeItem("contactReportContact");
                    sessionStorage.setItem("contactReportFilters", JSON.stringify(vm.filter));
                }

            }
        });

        vm.getContactForReport = getContactForReport;
        vm.formatTypeaheadDisplayForContactReport = contactFactory.formatTypeaheadDisplay;

        function getContactForReport(contactName) {
            var postObj = {};
            postObj.type = globalConstants.allTypeList;
            postObj.first_name = utils.isNotEmptyVal(contactName) ? contactName : '';
            //postObj = matterFactory.setContactType(postObj);
            postObj.page_Size = 250

            return matterFactory.getContactsByName(postObj, vm.JavaFilterAPIForContactList)
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

        function filterReportContact() {




            var modalInstance = $modal.open({
                templateUrl: 'app/report/contact/contact-filter-popup/contact-report-filter.html',
                controller: 'ContactReportFilterCtrl as contactReportFilterCtrl',
                windowClass: 'valuation-window',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    params: function () {
                        return {
                            masterData: masterDataObj,
                            filters: angular.copy(vm.selectionModel.multiFilters),
                            filter: vm.filterSentToAPI,
                            tags: vm.tags
                        };
                    }
                }
            });

            modalInstance.result.then(function (filterObj) {
                vm.selectionModel.multiFilters = angular.extend(vm.filter, filterObj);
                vm.filter.pageNum = 1;
                vm.filter.pageSize = pageSize;
                applyMultiSelectFilter();

            }, function () {

            });
        }

        function applyMultiSelectFilter() {
            var postArray = ['statusIds', 'roleFilter'];
            var valKey = ['statuses', 'roles'];
            _.each(postArray, function (val, index) {
                var data = _.pluck(vm.selectionModel.multiFilters[valKey[index]], "id").join();
                if (!_.isEmpty(data)) {
                    vm.filter[val] = data;
                } else {
                    vm.filter[val] = '';
                }
            });

            //console.log("filters: ", vm.filter);
            vm.tags = contactReportHelper.generateTags(vm.filter, masterDataObj);
            if (angular.isDefined(vm.filter.contact) && angular.isDefined(vm.filter.contact.contactid)) {
                vm.filterSentToAPI.contactId = vm.filter.contact.contactid;

            } else {
                vm.filterSentToAPI.contactId = '';
            }

            vm.filterSentToAPI.statusIds = angular.isDefined(vm.filter.statusIds) ? vm.filter.statusIds.toString() : "";
            vm.filterSentToAPI.roleFilter = angular.isDefined(vm.filter.roleFilter) ? vm.filter.roleFilter.toString() : "";

            getContact(vm.filterSentToAPI);
        };

        function tagCancelled(cancelTag) {
            if (cancelTag.type == "Contact") {
                vm.filterSentToAPI.contactId = '';
                vm.filter.contact = undefined;
            } else if (cancelTag.type == "statuses" || cancelTag.type == "roles") {
                //get array of current filter of the cancelled type
                var currentFilters = _.pluck(vm.selectionModel.multiFilters[cancelTag.type], 'id');
                //remove the cancelled filter
                var index = currentFilters.indexOf(cancelTag.key);
                vm.selectionModel.multiFilters[cancelTag.type].splice(index, 1);
            }
            applyMultiSelectFilter();
        }

        function exportContactReport() {
            var filterObj = angular.copy(vm.filterSentToAPI);
            contactDataLayer.exportContactReport(filterObj);
        }

        function printContactReport() {
            var filterDisplayObj = setFilterDisplayObj(vm.filterSentToAPI);
            contactReportHelper.printContactReport(vm.filterSentToAPI, vm.contactReportList, filterDisplayObj);
        }

        function setFilterDisplayObj() {
            var postArray = ['statusIds', 'roleFilter'];
            var valKey = ['statuses', 'matter_contact_roles'];
            var filterObj = {};
            _.each(postArray, function (val, index) {
                var array = masterDataObj[valKey[index]];
                var appliedFilters = [];
                //iterate over current selected filters
                var filterString = '';
                if (angular.isDefined(vm.filter[val]) && angular.isDefined(vm.filter[val].toString())) {
                    filterString = vm.filter[val].toString();

                }
                _.forEach(filterString.split(','), function (id) {
                    if (utils.isEmptyString(id)) { return; }
                    if (id === "all") { appliedFilters.push("all"); } //if filter id is all push as is
                    else {
                        // find object from array having the current id
                        var appliedFilter = _.find(array, function (item) {
                            if (index == 1) {
                                // matter_contact_roles has cid and c_role_name attribute
                                return item.cid === id;
                            } else {
                                return item.id === id;
                            }

                        });
                        if (index == 1) {
                            if (utils.isEmptyString(appliedFilter.c_role_name)) {
                                appliedFilters.push('{Blank}');
                            } else {
                                appliedFilters.push(appliedFilter.c_role_name);
                            }
                        } else {
                            if (utils.isEmptyString(appliedFilter.name)) {
                                appliedFilters.push('{Blank}');
                            } else {
                                appliedFilters.push(appliedFilter.name);
                            }
                        }

                    }
                });
                filterObj[val] = {};
                filterObj[val].name = valKey[index].toUpperCase();
                filterObj[val].data = appliedFilters;
            });

            var userFilterObj = {};
            userFilterObj.contact = {};

            if (angular.isDefined(vm.contact) && vm.contact != '') {
                if (utils.isNotEmptyVal(vm.contact.contactid)) {
                    userFilterObj.contact.id = vm.contact.contactid;
                    userFilterObj.contact.name = vm.contact.name;
                } else {
                    userFilterObj.contact.id = '';
                    userFilterObj.contact.name = '';
                }
            } else {
                userFilterObj.contact.name = '';
            }

            filterObj.contact = {
                name: "Contact",
                data: userFilterObj.contact.name
            }
            return filterObj;
        }

        function getAll() {
            vm.filter.pageSize = 'All';
            vm.filterSentToAPI.pageSize = 'All';
            vm.dataReceived = false;
            getContact(vm.filter);
        }

        function getMore() {
            vm.filter.pageNum += 1;
            vm.filter.pageSize = pageSize;
            vm.dataReceived = true;
            contactDataLayer.getContactData(vm.filter)
                .then(function (response) {
                    var data = response.data;
                    contactReportHelper.setDates(data);
                    vm.contactReportList = vm.contactReportList.concat(data);
                    vm.dataReceived = true;
                });
        }

        function showPaginationButtons() {

            if (!vm.dataReceived) {
                return false;
            }

            if (angular.isUndefined(vm.contactReportList) || vm.contactReportList.length <= 0) { return false; }

            if (vm.filter.pageSize === 'All') {
                return false;
            }

            if (vm.contactReportList.length < (vm.filter.pageSize * vm.filter.pageNum)) {
                return false
            }
            return true;
        }

        function openContactCard(contact) {
            var contactId = contact.contact ? contact.contact.contact_id : '';
            var contactType = contact.contact ? contact.contact.contact_type : '';

            contactFactory.displayContactCard1(contactId, contact.edited, contactType);
        }

        function reachedBottom() {
            if (vm.dataLimit <= vm.total) {
                vm.dataLimit += initLimit;
            }
        }

        function reachedTop() {
            vm.dataLimit = initLimit;
        }

        $scope.$on("contactCardEdited", function (e, editedContact) {
            var contactObj = editedContact;
            var contacts = angular.copy(vm.contactReportList);
            vm.contactReportList = [];
            _.forEach(contacts, function (contact) {
                if (contact.contact.contact_id == contactObj.contactid) {
                    contact.contact_name = utils.isNotEmptyVal(contactObj.firstname) ? contactObj.firstname : '';
                    contact.contact_name += " ";
                    contact.contact_name += utils.isNotEmptyVal(contactObj.lastname) ? contactObj.lastname : '';
                }
            });
            vm.contactReportList = contacts;
        });
    }


})(angular);


(function (angular) {

    angular.module('cloudlex.report')
        .factory('contactReportHelper', contactReportHelper);

    contactReportHelper.$inject = ['globalConstants'];

    function contactReportHelper(globalConstants) {
        return {
            contactReportGrid: _contactReportGrid,
            /* getSorts: _getSorts,*/
            setDates: _setDates,
            printContactReport: _printContactReport,
            generateTags: _generateTags
        };

        function _contactReportGrid() {
            return [{
                field: [{
                    prop: 'contact_name',
                    printDisplay: 'Contact Name',
                    onClick: "contactReportCtrl.openContactCard(data)",
                    cursor: true,
                    underline: true
                }],
                displayName: 'Contact Name',
                dataWidth: '15'
            },
            {
                field: [{
                    prop: 'matter_name',
                    printDisplay: 'Matter Name',
                    href: { link: '#/matter-overview', paramProp: ['matter_id'] }
                }],
                displayName: 'Matter Name',
                dataWidth: '20'
            },
            {
                field: [{ //DOI show on grid for US#5886 
                    prop: 'date_of_incidence',
                    printDisplay: 'Date of Incident'
                }],
                displayName: 'Date of Incident',
                dataWidth: '15'
            },
            {
                field: [{
                    prop: 'status',
                    printDisplay: 'Status'
                }],
                displayName: 'Status',
                dataWidth: '15'
            },
            {
                field: [{
                    prop: 'sub_status',
                    printDisplay: 'Sub Status'
                },


                ],
                displayName: 'Sub Status',
                dataWidth: '15'

            },
            {
                field: [{
                    prop: 'role',
                    printDisplay: 'Role'
                }],
                displayName: 'Role',
                dataWidth: '20'
            }
            ];
        }

        /*function _getSorts() {
         var sorts = [
         { name: 'Task name  ASC', sortBy: 'taskname', sortOrder: 'ASC' },
         { name: 'Task name  DESC', sortBy: 'taskname', sortOrder: 'DESC' },
         { name: 'Matter name ASC', sortBy: 'matter_name', sortOrder: 'ASC' },
         { name: 'Matter name DESC', sortBy: 'matter_name', sortOrder: 'DESC' },
         { name: 'Due date ASC', sortBy: 'duedate', sortOrder: 'ASC' },
         { name: 'Due date DESC', sortBy: 'duedate', sortOrder: 'DESC' },
         { name: 'Assignment date ASC', sortBy: 'assignmentdate', sortOrder: 'ASC' },
         { name: 'Assignment date DESC', sortBy: 'assignmentdate', sortOrder: 'DESC' }
         ];
         return sorts;
         }*/



        function _setDates(data) {
            _.forEach(data, function (item) {
                // item.dueDate = utils.isNotEmptyVal(item.duedate) ?
                //     moment.unix(item.duedate).format('MM-DD-YYYY') : '';
                // item.assignmentDate = utils.isNotEmptyVal(item.assignmentdate) ?
                //     moment.unix(item.assignmentdate).format('MM-DD-YYYY') : '';
                //  item.dateofincidence = utils.isNotEmptyVal(item.dateofincidence) ?
                //     moment.unix(item.dateofincidence).utc().format('MM-DD-YYYY') : '';
                if ((angular.isDefined(item.date_of_incidence) && !_.isNull(item.date_of_incidence) && !utils.isEmptyString(item.date_of_incidence) && item.date_of_incidence != 0 && item.date_of_incidence != '-')) {
                    item.date_of_incidence = moment.unix(item.date_of_incidence).utc().format('MM-DD-YYYY');
                } else {
                    item.date_of_incidence = "  -  "
                }

            });
        }

        function _printContactReport(filter, data, filterObj) {
            //var sorts = _getSorts();
            //var filtersForPrint = _getFilterObj(filter, sorts, filterObj);

            var headers = _contactReportGrid();
            headers = _getPropsFromHeaders(headers);

            var printPage = _getPrintPage(headers, data, filterObj);
            window.open().document.write(printPage);
        }

        /*function _getFilterObj(filter, users, sorts) {

            var sortData = _.find(sorts, function (sort) {
                return (sort.sortBy === filter.sortBy && sort.sortOrder === filter.sortOrder);
            });

            var assignedto = utils.isNotEmptyVal(filter.assignedTo) ? _.find(users, function (user) {
                return user.uid === filter.assignedTo
            }).fname : '';

            var assignedby = utils.isNotEmptyVal(filter.assignedBy) ? _.find(users, function (user) {
                return user.uid === filter.assignedBy
            }).fname : " ";

            var assignedDateRange = "from : " + (utils.isNotEmptyVal(filter.asignDateStart) ? moment.unix(filter.asignDateStart).format('MM-DD-YYYY') : '  -  ') +
                " to : " + (utils.isNotEmptyVal(filter.asignDateEnd) ? moment.unix(filter.asignDateEnd).format('MM-DD-YYYY') : '  -  ');

            var dueDateRange = "from : " + (utils.isNotEmptyVal(filter.dueDateStart) ? moment.unix(filter.dueDateStart).format('MM-DD-YYYY') : '  -  ') +
                " to : " + (utils.isNotEmptyVal(filter.dueDateEnd) ? moment.unix(filter.dueDateEnd).format('MM-DD-YYYY') : '  -  ');


            var filterObj = {
                For: filter.for === 'mytask' ? 'My Tasks' : 'All Tasks',
                'Assigned To': assignedto,
                'Assigned By': assignedby,
                'Sort By': sortData.name,
                'Assigned On': assignedDateRange,
                'Due Date': dueDateRange
            };

            return filterObj;
        }*/

        function _getPropsFromHeaders(headers) {
            var displayHeaders = [];
            _.forEach(headers, function (head) {
                _.forEach(head.field, function (field) {
                    displayHeaders.push({ prop: field.prop, display: field.printDisplay });
                });
            });
            return displayHeaders;
        }

        function _getPrintPage(headers, taskAgeData, filters) {
            var html = "<!doctype html><html><head><meta charset='utf-8'><title>Matter Contact Relationship Report</title>";

            /*html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";*/
            html += "<style>table tr { page-break-inside: always; }  </style></head>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img  src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Matter Contact Relationship Report</h1><div></div>";
            html += "<body>";
            html += "<div><h2 style='padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";
            html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
            html += "<tr>";
            angular.forEach(filters, function (val, key) {
                html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;' class='labelTxt'><label><strong>" + val.name + " : </strong></label>";
                if (val.data instanceof Array) {
                    _.forEach(val.data, function (item, index) {
                        html += "<span style='padding:2px 0px 2px 2px; '> " + item;
                        if (index + 1 < val.data.length) {
                            html += ","
                        }
                        html += "</span>";
                    });
                } else {
                    html += "<span style='padding:5px; '>  " + val.data + '</span>';
                }
                html += "</div>";
            });
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "</tr>";
            html += '<tr>';
            angular.forEach(headers, function (header) {
                html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + header.display + "</th>";
            });
            html += '</tr>';


            angular.forEach(taskAgeData, function (age) {
                html += '<tr>';
                angular.forEach(headers, function (header) {
                    age[header.prop] = (_.isNull(age[header.prop]) || angular.isUndefined(age[header.prop]) || utils.isEmptyString(age[header.prop])) ? " - " : utils.removeunwantedHTML(age[header.prop]);
                    html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + utils.removeunwantedHTML(age[header.prop]) + "</td>";
                })
                html += '</tr>'
            })


            html += "</body>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}";
            html += "tbody {display:table-row-group;}</style>";
            html += "</table>";
            html += "</html>";
            return html;
        }

        function _generateTags(appliedFilter, masterDataObj) {
            var tags = [];
            var filterArray = [{ type: 'statuses', list: 'statuses', filter: 'statusIds', tagname: 'Status' }, { type: 'roles', list: 'matter_contact_roles', filter: 'roleFilter', tagname: 'Role' }];

            _.forEach(filterArray, function (filterObj) {
                var filterData = getFilterValues(masterDataObj, filterObj.list, filterObj.type);
                var appliedFilters = appliedFilter[filterObj.filter].toString().split(',');

                _.forEach(appliedFilters, function (filterId) {
                    var selectedFilter = _.find(filterData, function (filter) {
                        return parseInt(filter.key) === parseInt(filterId);
                    });

                    if (angular.isDefined(selectedFilter)) {
                        selectedFilter.value = utils.isEmptyString(selectedFilter.value) ? '{Blank}' : selectedFilter.value;
                        selectedFilter.value = filterObj.tagname + ' : ' + selectedFilter.value;
                        tags.push(selectedFilter);
                    }
                });
            });

            var contact = {};

            if (angular.isDefined(appliedFilter.contact) && appliedFilter.contact != '') {
                contact.key = appliedFilter.contact.contactid;
                contact.type = "Contact";
                contact.value = "Contact: " + appliedFilter.contact.name;
                tags.push(contact);
            }


            return tags;
        }

        function getFilterValues(masterDataObj, filter, type) {
            return masterDataObj[filter].map(function (item) {
                // matter_contact_roles has cid and c_role_name attribute
                if (type == 'roles') {
                    return {
                        key: item.cid,
                        value: item.c_role_name,
                        type: type || ''
                    };
                } else {
                    return {
                        key: item.id,
                        value: item.name,
                        type: type || ''
                    };
                }

            });
        }
    }

})(angular);

(function (angular) {

    angular.module('cloudlex.report')
        .factory('contactDataLayer', contactDataLayer);

    contactDataLayer.$inject = ['$http', 'globalConstants', 'reportFactory', '$q'];

    function contactDataLayer($http, globalConstants, reportFactory, $q) {

        var url;
        if (!globalConstants.useApim) {
            url = globalConstants.javaWebServiceBaseV4 + 'reports/matter-contact-report?';
        } else {
            url = globalConstants.matterBase + 'reports/v1/matter-contact-report?';
        }
        var urls = {
            contactDataUrl: globalConstants.webServiceBase + 'reports/matterstats.json?',
            contactDataUrl_offDrupal: url,
            contactCountUrl: globalConstants.webServiceBase + 'reports/matterstats_count.json?',
            exportContactReportUrl: globalConstants.webServiceBase + 'reports/report.json?reportname=ContactMattersList&filename=contact_matter_list.xlsx&type=excel&'
            /*taskAgeData: globalConstants.webServiceBase + 'reports/taskage?',
             getUsers: globalConstants.webServiceBase + 'tasks/staffsinfirm',
             exportContactReport: globalConstants.webServiceBase + 'reports/report.json?reportname=TaskAge&filename=Task_Age_Report.xlsx&type=excel&'*/

        };

        return {
            getContactData: _getContactData,
            getContactCount: _getContactCount,
            exportContactReport: _exportContactReport
            /*getTaskAgeData: _getTaskAgeData,
             getUsersInFirm: _getUsersInFirm,
             exportContactReport: _exportContactReport*/
        }

        function _getContactData(filters) {
            var url = urls.contactDataUrl_offDrupal + utils.getContactReportParams(filters);
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
            })
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        function _getContactCount(filters) {
            var url = urls.contactCountUrl + utils.getParams(filters);
            return $http.get(url);
        }

        function _exportContactReport(filter) {
            filter.pageSize = 1000;
            reportFactory.downloadMatterContact(filter)
                .then(function (response) {
                    utils.downloadFile(response.data, "contact_matter_list.xlsx", response.headers("Content-Type"));
                });
        }


        /*function _getTaskAgeData(filters) {
         var url = urls.taskAgeData + utils.getParams(filters);
         return $http.get(url);
         }

         function _getUsersInFirm() {
         var url = urls.getUsers;
         return $http.get(url);
         }

         function _exportContactReport(filter) {
         var url = urls.exportContactReport + utils.getParams(filter);
         var download = window.open(url, '_self');
         }*/

    }

})(angular);