import { TimelineListHelperService } from './timeline-list-helper';
import { TimelineDataService } from './timeline-data-service';

(function (angular) {

    'use strict';

    angular.module('cloudlex.timeline').
        controller('TimelineCtrl', TimelineController);
    TimelineController.$inject = ['timelineDataService', '$stateParams', '$modal',
        '$scope', 'timelineListHelper', 'contactFactory', 'matterFactory', '$rootScope', 'practiceAndBillingDataLayer', 'mailboxDataService','clxTableService'
    ];

    //controller definition 
    function TimelineController(timelineDataService, $stateParams, $modal,
        $scope, timelineListHelper, contactFactory,
        matterFactory, $rootScope, practiceAndBillingDataLayer, mailboxDataService, clxTableService) {

        var self = this;

        self.matterId = $stateParams.matterId;

        self.timelineList = []; //Data model for holding list of timeline       
        self.matterInfo = {};


        self.filter = {};
        self.getMore = getMore;
        self.getAll = getAll;
        self.filterTimelineList = filterTimelineList;
        self.getTimeLineData = getTimeLineData;
        self.applySortByFilter = applySortByFilter;
        self.tagCancelled = tagCancelled;
        self.selectedSort = 'Date DESC';
        self.showPaginationButtons = showPaginationButtons;
        self.scrollReachedBottom = scrollReachedBottom;
        self.scrollReachedTop = scrollReachedTop;
        self.dataReceived = false;
        self.setFilters = setFilters;
        self.print = print;
        self.filterText = '';
        self.downloadTimelineList = downloadTimelineList;
        self.filterRetain = filterRetain;

        var initTimelineLimit = 10;
        var page_size = 100;
        var getAllFlag = false;
        self.showSearch = false;
        self.showTable = false;
        self.firmData = {
            API: "PHP",
            state: "mailbox"
        };
        self.firmData = JSON.parse(localStorage.getItem('firmSetting'));
        self.tableOtions = [
            {
                header:'User', 
                keys:[{name:'pic',type:'image',class:'defaultprofileImage profile-pic'}], 
                width: 10
            }, 
            {
                header:'Activity', 
                keys:[{name:'user_name', class:'block'}, {name:'event', class:'bold block'}], 
                width:30
            }, 
            {
                header:'Details', 
                keys:[{name:'details',class:'default-cursor'}], 
                width:45
            }, 
            {
                header:'Date and Time', 
                keys:[{name:'date',class:"default-cursor"}], 
                width:15
            }
        ]
        //clxTableService.updateTableOtions.next(self.tableOtions);
        // clxTableService.paginationEvent.subscribe( event => {
        //     if ( event == 'more' ) 
        // })
        //get email signature
        function getUserEmailSignature() {
            mailboxDataService.emailSignature()
                .then(function (data) {
                    if (utils.isNotEmptyVal(data.data)) {
                        self.signature = data.data[0];
                        self.signature = '<br/><br/>' + self.signature;
                    }
                });
        }

        $scope.$on('composeEmailFromContact', function (event, data) {
            if (!(window.isDrawerOpen)) {
                self.compose = true;
                var html = "";
                html += (self.signature == undefined) ? '' : self.signature;
                self.composeEmail = html;
                $rootScope.updateComposeMailMsgBody(self.composeEmail, '', '', '', 'contactEmail', data);
            }
        });

        // Get event call from mailbox controller for close compose popup
        $rootScope.$on("callCloseComposeMail", function () {
            closeComposeMail(); // close compose mail popup
        });

        // close compose mail popup
        function closeComposeMail() {

            self.compose = false;
        }

        function setUserList(users) {
            var userList = [];
            _.forEach(users, function (user) {
                _.forEach(user, function (val, key) {
                    if (user[key] instanceof Array) {
                        _.forEach(user[key], function (usr) {
                            usr.Name = usr.name + ' ' + usr.lname;
                            userList.push(usr);
                        });
                    }
                })
            });
            //get unique user ids
            userList = _.uniq(userList, function (item) {
                return item.uid;
            });

            return userList;
        }

        (function () {
            displayWorkflowIcon();
            contactFactory.getUsersList()
                .then(function (users) {
                    self.users = setUserList(users);
                    persistData();
                });
            self.timelineLimit = initTimelineLimit;
            // matterFactory.setBreadcrum(self.matterId, 'Timeline');  
            matterFactory.setBreadcrumWithPromise(self.matterId, 'Timeline').then(function (resultData) {
                self.matterHInfo = resultData;
            });
            matterInfo();
            getUserEmailSignature();
            self.matterInformation = matterFactory.getMatterData(self.matterId);
        })();

        self.openContactCard = function (contact) {
            contactFactory.displayContactCard1(contact.contactid, contact.edited, contact.contact_type);
            contact.edited = false;
        };

        function displayWorkflowIcon() {
            var response = practiceAndBillingDataLayer.getConfigurableData();
            response.then(function (data) {
                var resData = data.matter_apps; //promise
                if (angular.isDefined(resData) && resData != '' && resData != ' ') {
                    self.is_workflow = (resData.workflow == 1) ? true : false;
                }
            });
        }

        $rootScope.$on('updateWorkflowIcons', function (updateworkflowIconevent) {
            displayWorkflowIcon();
        });

        var retainSText = JSON.parse(sessionStorage.getItem("retainSearchText"));
        if (utils.isNotEmptyVal(retainSText)) {
            if (self.matterId == retainSText.matterid && utils.isNotEmptyVal(retainSText.timelineFiltertext)) {
                self.showSearch = true;
                self.filterText = retainSText.timelineFiltertext;
                //clxTableService.searchKey.next(self.filterText);
            }
        }

        function filterRetain() {
            var retainSText = JSON.parse(sessionStorage.getItem("retainSearchText"));
            if (utils.isNotEmptyVal(retainSText)) {
                if (self.matterId != retainSText.matterid) {
                    $rootScope.retainSearchText = {};
                }
            }
            $rootScope.retainSearchText.timelineFiltertext = self.filterText;
            $rootScope.retainSearchText.matterid = self.matterId;
            sessionStorage.setItem("retainSearchText", JSON.stringify($rootScope.retainSearchText));
            //clxTableService.searchKey.next(self.filterText);
        }

        function matterInfo() {
            timelineDataService.matterInfo(self.matterId)
                .then(function (response) {
                    self.matterInfo = response.data ? response.data[0] : '';
                });
        }

        // get data
        function getTimeLineData(filter) {
            self.dataLoaderFlag = false;
            //  localStorage.setItem("timeLineListFilters", JSON.stringify(filter)); //store applied filters
            var filtersApplied = angular.copy(filter);
            filtersApplied.activity_filter = utils.isNotEmptyVal(filtersApplied.activity_filter) ? filtersApplied.activity_filter.id : '';
            filtersApplied.updated_by_filter = utils.isNotEmptyVal(filtersApplied.updated_by_filter) ? filtersApplied.updated_by_filter : '';
            filtersApplied.created_by_filter = utils.isNotEmptyVal(filtersApplied.created_by_filter) ? filtersApplied.created_by_filter : '';
            filtersApplied.page_num = 1;
            if (getAllFlag == false) {
                filtersApplied.page_size = page_size;
                self.filter.page_size = page_size;
            }

            timelineDataService.getTimeline_offDrupal(filtersApplied, self.matterId)
                .then(function (response) {
                    var timelineList = response.timeline_data;
                    self.total = response.count;
                    timelineListHelper.setModifiedDisplayDate(timelineList);
                    self.timelineList = timelineList ? timelineList : [];
                    self.dataReceived = true;
                    self.dataLoaderFlag = true;
                    //clxTableService.updateTable.next(self.timelineList);
                });


        }

        //Get sort
        function applySortByFilter(sortObj) {

            self.selectedSort = sortObj.name;
            self.filter.sort_order = sortObj.sort_order;
            self.filter.page_num = 1;
            self.filter.page_size = 100;

            getTimeLineData(self.filter);
        }

        //print
        function print() {
            timelineListHelper.getuserList(self.users);
            timelineListHelper.getPrintData(self.timelineList, self.filter, self.selectedSort, self.matterInfo);
        }

        //export
        function downloadTimelineList() {
            exportTimelinelist(self.filter, self.selectedSort, self.timelineList);
        }

        // sort object
        self.sorts = [{
            name: 'Date ASC',
            sort_order: 'ASC',
            value: 1
        },
        {
            name: 'Date DESC',
            sort_order: 'DESC',
            value: 2
        }
        ];

        self.activities = [{
            id: 1,
            name: 'Status Change'
        },
        {
            id: 2,
            name: 'Note Updated'
        },
        {
            id: 10,
            name: 'Note Added'
        },
        {
            id: 3,
            name: 'Calendar Entry Added / Updated '
        },
        {
            id: 4,
            name: 'Document Uploaded'
        },
        {
            id: 5,
            name: 'Document Deleted'
        },
        {
            id: 6,
            name: 'Calendar Entry Deleted'
        },
        {
            id: 7,
            name: 'Note Deleted'
        }, //Bug#7198 Add activity name
        {
            id: 8,
            name: 'Document Updated'
        }, //US-9137
        {
            id: 9,
            name: 'Document Moved'
        }
        ];

        function persistData() {
            self.clickedRow = -1;
            var persistedFilter = sessionStorage.getItem('timelineListFilters');
            var retainsFilter = JSON.parse(sessionStorage.getItem("retainFilters"));
            if (utils.isNotEmptyVal(retainsFilter)) {
                if (self.matterId == retainsFilter.matterID) {

                    if (utils.isNotEmptyVal(persistedFilter)) { //if the filters are not empty, then try 
                        try {
                            self.filter = JSON.parse(persistedFilter);
                            getTimeLineData(self.filter);
                            self.tags = generateTags(self.filter);
                            getTimeLineData(self.filter);
                        } catch (e) {
                            setFilters();
                        }
                    } else {
                        init();
                    }
                } else {
                    init();
                }
            } else {
                init();
            }
        }

        function init() {
            setFilters(); // set filters
            getTimeLineData(self.filter);
        }

        function setFilters() {
            var defaultSelected = _.find(self.sorts, function (sort) {
                return sort.value == 2 && sort.sort_order == 'DESC'
            });
            self.selectedSort = defaultSelected.name;
            self.filter = {
                page_num: 1,
                page_size: page_size,
                sort_order: defaultSelected.sort_order
            };

        }

        /* Call back funtion for when filter tag is calncelled */
        function tagCancelled(tag) {
            switch (tag.key) {
                case 'activity':
                    {
                        self.filter.activity_filter = '';
                        sessionStorage.setItem("timelineListFilters", JSON.stringify(self.filter)); //store applied filters
                        getTimeLineData(self.filter);

                        break;
                    }
                case 'updated_by_filter':
                    {
                        self.filter.updated_by_filter = '';
                        sessionStorage.setItem("timelineListFilters", JSON.stringify(self.filter)); //store applied filters
                        getTimeLineData(self.filter);

                        break;
                    }
                case 'created_by_filter':
                    {
                        self.filter.created_by_filter = '';
                        sessionStorage.setItem("timelineListFilters", JSON.stringify(self.filter)); //store applied filters
                        getTimeLineData(self.filter);

                        break;
                    }
                case 'dateRange':
                    {
                        self.filter.start_date = "";
                        self.filter.end_date = "";
                        sessionStorage.setItem("timelineListFilters", JSON.stringify(self.filter)); //store applied filters
                        getTimeLineData(self.filter);
                        break;
                    }
            }

        }

        //Tags
        function generateTags(filtersTags) {
            var tags = [];

            if (utils.isNotEmptyVal(self.filter.activity_filter)) {
                var activity = _.find(self.activities, function (act) {
                    return act.id == self.filter.activity_filter.id;
                });

                if (utils.isNotEmptyVal(activity)) {
                    var actFilter = {};
                    actFilter.value = 'Activity : ' + activity.name;
                    actFilter.key = 'activity';
                    actFilter.type = 'activity';
                    tags.push(actFilter);
                }
            }

            if (utils.isNotEmptyVal(self.filter.updated_by_filter)) {
                var updatedByUser = {};
                var user = _.find(self.users, function (usr) {
                    return usr.uid == self.filter.updated_by_filter;
                });

                updatedByUser.value = 'Updated by: ' + user.Name;
                updatedByUser.key = 'updated_by_filter';
                updatedByUser.type = 'updated_by_filter';
                tags.push(updatedByUser);
            }

            if (utils.isNotEmptyVal(self.filter.created_by_filter)) {
                var createdByUser = {};
                var user = _.find(self.users, function (usr) {
                    return usr.uid == self.filter.created_by_filter;
                });

                createdByUser.value = 'Created by: ' + user.Name;
                createdByUser.key = 'created_by_filter';
                createdByUser.type = 'created_by_filter';
                tags.push(createdByUser);
            }

            if (utils.isNotEmptyVal(self.filter.start_date) && (utils.isNotEmptyVal(self.filter.end_date))) {
                var dateFilterObj = {
                    key: 'dateRange',
                    value: 'Date Range from :' + moment.unix(self.filter.start_date).format('MM/DD/YYYY') +
                        ' to: ' + moment.unix(self.filter.end_date).format('MM/DD/YYYY')
                };
                tags.push(dateFilterObj);
            }

            return tags;
        }

        //headers of grid 
        self.clxGridOptions = {
            headers: timelineListHelper.getGridHeaders()
        }

        /* check whether to show more and all buttons*/
        function showPaginationButtons() {

            if (!self.dataReceived) { // if data not received
                return false;
            }

            if (angular.isUndefined(self.timelineList) || self.timelineList.length <= 0) { //if data is empty
                return false;
            }

            if (self.filter.page_size === 'all') { // if pagesize is all
                return false;
            }

            if (self.timelineList.length < (self.filter.page_size * self.filter.page_num)) {
                return false
            }
            return true;
        }

        function scrollReachedBottom() {
            if (self.timelineLimit <= self.total) {
                self.timelineLimit = self.timelineLimit + initTimelineLimit;
            }
        }

        function scrollReachedTop() {
            self.timelineLimit = initTimelineLimit;
        }


        /* Callback to get more data according to pagination */
        function getMore() {
            self.filter.page_num += 1;
            self.filter.page_size = page_size;
            self.dataReceived = false;
            timelineDataService.getTimeline_offDrupal(self.filter, self.matterId)
                .then(function (response) {
                    timelineListHelper.setModifiedDisplayDate(response.timeline_data);
                    self.total = response.count;
                    //  self.timelineList= timelineList;
                    _.forEach(response.timeline_data, function (timeline) {
                        self.timelineList.push(timeline);
                    });
                    self.dataReceived = true;
                });
        }

        /* Callback to get all  data */
        function getAll() {
            self.filter.page_size = 'all';
            getAllFlag = true;
            self.dataReceived = false;
            getTimeLineData(self.filter);
        }

        //filter function
        function filterTimelineList() {
            var modalInstance = $modal.open({
                templateUrl: 'app/timeline/timeline-filters/timeline-filters.html',
                controller: 'timelineFillterCtrl as timelineFillterCtrl',
                windowClass: 'modalLargeDialog',
                backdrop: "static",
                keyboard: false,
                resolve: {
                    filter: function () {
                        return self.filter
                    },
                    tags: function () {
                        return self.tags;
                    }
                }
            });

            //on close of popup
            modalInstance.result.then(function (filterObj) {
                self.filter = filterObj.filter;
                // self.filter.pageNum = 1;
                // self.filter.pageSize = pageSize;
                self.tags = generateTags(self.filter);

                var retainsFilter = JSON.parse(sessionStorage.getItem("retainFilters"));
                if (utils.isNotEmptyVal(retainsFilter)) {
                    if (self.matterId != retainsFilter.matterID) {
                        sessionStorage.removeItem("documentFiltersMatter");
                        sessionStorage.removeItem("motionFiltertags");
                        sessionStorage.removeItem("matterNotesFilters");

                    }
                }
                $rootScope.retainFilters.matterID = self.matterId;
                sessionStorage.setItem("retainFilters", JSON.stringify($rootScope.retainFilters));
                sessionStorage.setItem("timelineListFilters", JSON.stringify(self.filter));
                getTimeLineData(self.filter);

            }, function () {

            });

        }

        function exportTimelinelist(filter, sort, data) {
            var filterObj = getexportFiltersObj(filter, sort);
            timelineDataService.downloadTimelinelist(filterObj, data, self.matterId)
                .then(function (response) {
                    var filename = "Matter_Timeline";
                    var linkElement = document.createElement('a');
                    try {
                        var blob = new Blob([response], {
                            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        });
                        var url = window.URL.createObjectURL(blob);

                        linkElement.setAttribute('href', url);
                        linkElement.setAttribute("download", filename + ".xlsx");

                        var clickEvent = new MouseEvent("click", {
                            "view": window,
                            "bubbles": true,
                            "cancelable": false
                        });
                        linkElement.dispatchEvent(clickEvent);
                    } catch (ex) {
                        console.log(ex);
                    }
                })
        }

        function getexportFiltersObj(filter, sort) {
            var filterObj = {};

            if (filter.created_by_filter) {
                filterObj['created_by_filter'] = filter.created_by_filter;
            } else {
                filterObj['created_by_filter'] = '';
            }

            if (filter.updated_by_filter) {
                filterObj['updated_by_filter'] = filter.updated_by_filter;
            } else {
                filterObj['updated_by_filter'] = '';
            }

            if (filter.start_date) {
                filterObj['start_date'] = filter.start_date;
            } else {
                filterObj['start_date'] = '';
            }
            if (filter.start_date) {
                filterObj['end_date'] = filter.end_date;
            } else {
                filterObj['end_date'] = '';
            }
            if (filter.activity_filter) {
                filterObj['activity_filter'] = filter.activity_filter.id;
            } else {
                filterObj['activity_filter'] = '';
            }
            filterObj['sort_order'] = filter.sort_order;

            filterObj['page_size'] = filter.page_size;
            filterObj['page_num'] = filter.page_num;
            filterObj['matterId'] = self.matterId;

            return filterObj
        }


    }

    angular.module('cloudlex.timeline')
        .service('timelineListHelper', TimelineListHelperService)
        .service('timelineDataService', TimelineDataService);

})(angular);