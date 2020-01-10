(function (angular) {
    'use strict';

    angular
        .module('cloudlex.dashboard')
        .controller('AnalyticsCtrl', AnalyticsController);

    AnalyticsController.$inject = ['$scope', '$state', '$timeout', 'masterData', 'eventsHelper', 'dashboardHelper',
        'dashboardDatalayer', 'matterFactory'];
    function AnalyticsController($scope, $state, $timeout, masterData, eventsHelper, dashboardHelper,
        dashboardDatalayer, matterDatalayer) {

        var vm = this,
            donutData,
            venueReceived = false,
            matterTrendData,
            prevSelectedMatterTrend,
            matterTrendChart,
            dailyUsageData, dailyUsageChart;

        vm.getKeys = getKeys;
        vm.showData = showData;
        vm.goToMatter = goToMatter;
        vm.getDataForMaterTrend = getDataForMaterTrend;
        vm.filterMatterTrendData = filterMatterTrendData;
        vm.filterDailyUsage = filterDailyUsage;
        vm.getMattersForVenue = getMattersForVenue;
        vm.noDataForVenueMsg = noDataForVenueMsg;
        vm.getStatusWiseCounts = getStatusWiseCounts;
        vm.gotoActivity = gotoActivity;
        vm.showTopStrip = showTopStrip;
        vm.filterAverageMatterAge = filterAverageMatterAge;
        vm.getVenuesForJurisdiction = getVenuesForJurisdiction;
        //US#6148-More functionality for matters assigned to Attorney
        vm.showAllMatters = showAllMatters;
        var intialLimit = 5;
        vm.matterLimit = intialLimit;//initial attorney matter limit to show on grid
        vm.reset = reset;
        vm.resetforDonut = false;
        (function () {
            var userRole = masterData.getUserRole();
            vm.isMD = userRole.role === 'Managing Partner/Attorney' || userRole.role === 'LexviasuperAdmin';
            initVariables();
            initData();
            //persist last visited tab on dashboard
            localStorage.setItem("dashboardTab", ".analytics");
        })();

        //US#6226
        function reset() {
            localStorage.setItem("dashboardAnalyticsVenueInfo", "");
            var resetJurisdiction = utils.isNotEmptyVal(localStorage.getItem("firmJurisdiction")) ? JSON.parse(localStorage.getItem("firmJurisdiction")) : '';

            vm.map.jurisdiction = utils.isNotEmptyVal(resetJurisdiction) ? resetJurisdiction.name : 'New York';
            vm.map.venue = "Select Venue";
            vm.map.markers = {};
            venueReceived = false //US#7040
            getVenuesForJurisdiction(resetJurisdiction);
        }

        function initVariables() {
            vm.jurisdictionList = masterData.getJurisdictions();
            vm.venues = masterData.getVenues();
            var initVarData = dashboardHelper.getInitData();
            vm.display = {};
            vm.matterTypes = initVarData.matterTrends;

            // var defaultJurisdiction = localStorage.getItem("jurisdictionId");
            // defaultJurisdiction = _.where(vm.jurisdictionList, {id: defaultJurisdiction})
            // vm.selectedJurisdiction = defaultJurisdiction[0];
            // localStorage.setItem('firmJurisdiction', JSON.stringify(vm.selectedJurisdiction));

            vm.matterTypesFilters = initVarData.matterTrendFilters;
            vm.dailyUsageFilters = initVarData.dailyUsageFilters;
            vm.avarageAgeFilters = initVarData.avarageAgeFilters;
            setMatterTrendFilter();
            setDailyUsageFilter();
            setStripData();
            setVenueInfo();
        }

        function setMatterTrendFilter() {
            //set matter trend filter (3M, 6M, 1Y)
            var persistedTrendFilter = localStorage.getItem("dashboardAnalyticsMatterTrendFilter");
            if (utils.isNotEmptyVal(persistedTrendFilter)) {
                var isValidTrend = _.find(vm.matterTypesFilters, function (type) {
                    return type.key == persistedTrendFilter;
                });
                vm.selectedMatterTrendFilter = utils.isNotEmptyVal(isValidTrend) ? isValidTrend.key : '1Y';
            } else {
                vm.selectedMatterTrendFilter = '1Y';
            }

            //set matter trend (closed matters, in-took matters, referred out matters)
            var persistedTrend = localStorage.getItem("dashboardAnalyticsMatterTrend");
            if (utils.isNotEmptyVal(persistedTrend)) {
                vm.selectedMatterTrend = (vm.matterTypes.indexOf(persistedTrend) > -1) ? persistedTrend : vm.matterTypes[0];
                prevSelectedMatterTrend = (vm.matterTypes.indexOf(persistedTrend) > -1) ? persistedTrend : vm.matterTypes[0];
            } else {
                vm.selectedMatterTrend = vm.matterTypes[0];
                prevSelectedMatterTrend = vm.matterTypes[0];
            }
        }

        function setDailyUsageFilter() {
            var persistedDailyUsageFilter = localStorage.getItem("dashboardAnalyticsDailyUsageFilter");

            if (utils.isNotEmptyVal(persistedDailyUsageFilter)) {
                var isValidUsageFilter = _.find(vm.dailyUsageFilters, function (filter) {
                    return filter.key == persistedDailyUsageFilter;
                });

                vm.selectedDailyUsageFilter = utils.isNotEmptyVal(isValidUsageFilter) ? isValidUsageFilter.key : "1M";
            } else {
                vm.selectedDailyUsageFilter = '1M';
            }
        }

        function setStripData() {
            var persistedStripData = localStorage.getItem("dashboardAnalyticsStatusStrip")
            vm.statusStripData = utils.isNotEmptyVal(persistedStripData) ? persistedStripData : "Current Matters";
            if (vm.statusStripData === "Average Age") {
                var persistedAvgMatterFilter = localStorage.getItem("dashboardAnalyticsAvgMatter");

                try {
                    persistedAvgMatterFilter = JSON.parse(persistedAvgMatterFilter);
                    vm.selectedAverageAgeFilter = persistedAvgMatterFilter;
                } catch (e) {
                    vm.selectedAverageAgeFilter = 'all';
                }

                filterAverageMatterAge(vm.selectedAverageAgeFilter);
            }
        }

        function setVenueInfo() {
            var tempObj = {
                jurisdiction:'',
                venue: 'Select Venue'
            };
            var tempJurisdiction = utils.isNotEmptyVal(localStorage.getItem('firmJurisdiction')) ? JSON.parse(localStorage.getItem('firmJurisdiction')) : '';
            tempObj.jurisdiction = utils.isNotEmptyVal(tempJurisdiction) ? tempJurisdiction.name : "New York";
            var persistedVenueInfo = utils.isNotEmptyVal(tempObj) ? tempObj : JSON.parse(localStorage.getItem("dashboardAnalyticsVenueInfo"));
            vm.selectedJurisdiction = tempObj;

            // var persistedVenueInfo =JSON.parse(localStorage.getItem("dashboardAnalyticsVenueInfo"));

            if (utils.isNotEmptyVal(persistedVenueInfo)) {
                try {
                    persistedVenueInfo = persistedVenueInfo;
                    persistedVenueInfo.markers = [];
                    vm.map = persistedVenueInfo;
                } catch (e) {
                    vm.map = {};
                }
            } else {
                vm.map = {};
            }

            vm.map.jurisdiction = utils.isNotEmptyVal(vm.map.jurisdiction) ? vm.map.jurisdiction : 'New York';
            var jurisdiction = _.find(vm.jurisdictionList, function (jurisdiction) {
                return jurisdiction.name == vm.map.jurisdiction;
            });

            vm.map.venue = utils.isNotEmptyVal(vm.map.venue) ? vm.map.venue : 'Select Venue';
            if (vm.map.venue != 'Select Venue') {
                var selectedVenue = vm.map.venue;
                var venueObj = _.find(vm.venues, function (venue) {
                    return venue.name === selectedVenue
                });
                if (utils.isEmptyVal(venueObj)) {
                    vm.map.venue = 'Select Venue';
                }
            }
            getVenuesForJurisdiction(jurisdiction);
        }

        function initData() {
            getDashboardData();
        }

        function noDataForVenueMsg(venue) {
            if (angular.isUndefined(venue) || !venueReceived) {
                return false;
            }

            if (venueReceived) {
                return utils.isEmptyObj(venue);
            }
        }

        function getDashboardData() {
            dashboardDatalayer
                .getDashboardData()
                .then(function (response) {
                    var data = response.data;
                    if (vm.isMD) {
                        getDataForMD(data);
                    } else {
                        getDataForNonMD(data);
                    }
                }, function (e) { });
        }

        function getDataForMD(data) {
            vm.display.dashboard = true;
            //wait for the dom to render
            $timeout(function () {
                var donutData = data.attorney_matters;
                setDonutData(donutData);
                var dailyUsage = data.daily_usage;
                setDailyUsageData(dailyUsage);
                vm.topStripOptions = ["Current Matters", "Average Age"];
                getMaterTrendData();
                getStatusWiseCounts('all');
            })
        }

        function getDataForNonMD(data) {
            prevSelectedMatterTrend = 'Closed Matters';
            vm.selectedMatterTrend = 'Closed Matters';
            vm.matterTypes = ['Closed Matters'];
            vm.statuses = [{ value: 'all', label: 'All Matters' }, { value: 'my', label: 'My Matters' }];
            vm.topStripOptions = ["Current Matters"];
            vm.statusStripData = "Current Matters";
            var persistedStatusStripParam = localStorage.getItem("dashboardAnalyticsStatusStripParam");
            vm.statusId = utils.isNotEmptyVal(persistedStatusStripParam) ? persistedStatusStripParam : 'my';
            getStatusWiseCounts(vm.statusId);
            setChartData(data.matters_closed_refout_intook.closed);
            vm.userActivities = data.user_activities.timeline_data;//Bug#5978-fixed
            vm.display.matterTrend = true;
            vm.display.dashboard = true;
        }

        function getMaterTrendData() {
            dashboardDatalayer
                .getMatterTrend(dashboardHelper.getTrendId(prevSelectedMatterTrend))
                .then(function (response) {
                    vm.display.matterTrend = true;
                    $timeout(function () {
                        var data = response.data.matters_closed_refout_intook[dashboardHelper.getMatterTrendProp(prevSelectedMatterTrend)];
                        setChartData(data);
                    })
                }, function (e) {

                });
        }

        function getStatusWiseCounts(param) {
            //persist all/my matters param
            localStorage.setItem("dashboardAnalyticsStatusStripParam", param);

            matterDatalayer
                .getStatusWiseCounts(param)
                .then(function (data) {
                    var newdata = {};
                    var all_data = {};
                    var stalled_data = {};

                    angular.forEach(data, function (value, key) {
                        switch (key) {
                            case 'All':
                                all_data['Total'] = value;
                                break;
                            case 'Stalled':
                                stalled_data[key] = value;
                                break;
                            default:
                                newdata[key] = value;
                                break;
                        }
                    });

                    delete newdata['Federal Court'];
                    vm.statusWiseCounts = newdata;
                    vm.statusWiseCountsAll = all_data;
                    vm.statusWiseCountsStalled = stalled_data;
                    vm.display.statusStrip = true;
                });
        }

        function setDonutData(data) {
            vm.donutData = data;
            vm.donutTitle = vm.donutData.length + " "
        }

        function setChartData(data) {
            matterTrendData = dashboardHelper.setMatterTrendChartData(data);
            var areaChartObj = dashboardHelper.setAreaChart("area-chart", vm.selectedMatterTrend, matterTrendData)
            matterTrendChart = c3.generate(areaChartObj);
            filterMatterTrendData(vm.selectedMatterTrendFilter);
        }

        function setDailyUsageData(data) {
            dailyUsageData = dashboardHelper.setDailyUsageChart(data);
            dashboardHelper.generateDailyUsageChart("monthly-usage-chart", dailyUsageData, '1M');
            dashboardHelper.generateDailyUsageChart("weekly-usage-chart", dailyUsageData, '1W');
            dashboardHelper.generateDailyUsageChart("threemonthly-usage-chart", dailyUsageData, '3M');
            filterDailyUsage(vm.selectedDailyUsageFilter)
        }

        /*----------------------------------------------event handler----------------------------------------------------------*/

        function getKeys(obj) {
            if (!obj) {
                return [];
            } else {
                var keys = Object.keys(obj);
                return _.filter(keys, function (key) { return utils.isNotEmptyString(key); })
            }
        }

        function showData(data) {
            vm.resetforDonut = true;
            vm.selectedAttorney = {};
            vm.matterLimit = intialLimit;//reset attorney matter limit to show on grid
            $scope.$apply(function () {

                if (utils.isEmptyVal(data)) {
                    vm.selectedAttorney = undefined;
                } else {
                    var attorney = _.find(vm.donutData, function (attroney) {
                        return attroney.aid.toString() === data.id.toString();
                    });

                    vm.selectedAttorney.name = data.name;
                    vm.selectedAttorney.matters = attorney.matterInfo;
                    vm.selectedAttorney.count = attorney.count;
                    //US#6138-Update more text
                    var moreMatters = attorney.count - intialLimit;
                    vm.selectedAttorney.moreText = moreMatters > 0 ? moreMatters + " More" : "";
                }
            });
        }

        function goToMatter(matter) {
            $state.go('add-overview', { matterId: matter.matter_id });
        }

        function getDataForMaterTrend(trend) {
            vm.selectedMatterTrend = trend;
            //persist matter trend
            localStorage.setItem("dashboardAnalyticsMatterTrend", trend);
            var unload = angular.copy(prevSelectedMatterTrend);
            dashboardDatalayer
                .getMatterTrend(dashboardHelper.getTrendId(trend)).then(function (response) {
                    var data = response.data.matters_closed_refout_intook[dashboardHelper.getMatterTrendProp(trend)];
                    matterTrendData = dashboardHelper.setMatterTrendChartData(data);
                    dashboardHelper.modifyMatterTypeAreaChart(vm.selectedMatterTrend, vm.selectedMatterTrendFilter, matterTrendData, matterTrendChart, prevSelectedMatterTrend);
                    prevSelectedMatterTrend = vm.selectedMatterTrend;
                });
        }

        function filterMatterTrendData(filterKey) {
            if (angular.isUndefined(filterKey) || angular.isUndefined(matterTrendChart)) {
                return;
            }

            //persist trend filter
            localStorage.setItem("dashboardAnalyticsMatterTrendFilter", filterKey);
            dashboardHelper.modifyMatterTypeAreaChart(vm.selectedMatterTrend, filterKey, matterTrendData, matterTrendChart, prevSelectedMatterTrend);
        }

        function filterDailyUsage(filterKey) {
            vm.usageChart = filterKey;

            //persist daily usage chart filters
            localStorage.setItem("dashboardAnalyticsDailyUsageFilter", filterKey);

            switch (filterKey) {
                case '1W':
                    var aWeekAgo = moment().subtract(1, 'week').startOf('day'); //Bug#6672
                    var yest = moment().endOf('day');
                    vm.usageTimePeriod = aWeekAgo.format('DD-MMM') + ' - ' + yest.format('DD-MMM');
                    break;
                case '1M':
                    var aMonthAgo = moment().subtract(1, 'month').startOf('day');//Bug#6672
                    var yest = moment().endOf('day');
                    vm.usageTimePeriod = aMonthAgo.format('DD-MMM') + ' - ' + yest.format('DD-MMM');
                    break;
                case '3M':
                    var threeMonthsAgo = moment().subtract(3, 'months').startOf('day');//Bug#6672
                    var yest = moment().endOf('day');
                    vm.usageTimePeriod = threeMonthsAgo.format('DD-MMM') + ' - ' + yest.format('DD-MMM');
                    break;
            }
        }

        function getMattersForVenue(venue) {
            vm.map.venue = venue.name;
            //persist venue info
            localStorage.setItem("dashboardAnalyticsVenueInfo", JSON.stringify(vm.map));

            dashboardDatalayer.getMattersByVenue(venue.id)
                .then(function (response) {
                    vm.map.markers = dashboardHelper.formatMatterResponse(response.data.matters_by_venue);
                    venueReceived = true;
                })
        }

        function gotoActivity(activity) {
            switch (activity.event) {
                case "Document Upload":
                    $state.go('document-view', { matterId: activity.matter_id, documentId: activity.id });
                    break;
                case "Calendar Entry Added/Updated":
                    eventsHelper.setSelectedEvent({ event_id: activity.id });
                    $state.go('events', { matterId: activity.matter_id });
                    break;
                case "Status Change":
                    $state.go('add-overview', { matterId: activity.matter_id });
                    break;
            }
        }

        function showTopStrip(type) {
            vm.statusStripData = type;
            //persist status strip
            localStorage.setItem("dashboardAnalyticsStatusStrip", type);
            if (type === "Average Age") {
                vm.selectedAverageAgeFilter = 'all';
                filterAverageMatterAge(vm.selectedAverageAgeFilter);
            }
        }

        function filterAverageMatterAge(param) {
            var s, e;
            if (param === 'all') {
                s = ""; e = "";
            } else {
                s = param.s;
                e = param.e;
            }
            //persist average matter filters
            localStorage.setItem("dashboardAnalyticsAvgMatter", JSON.stringify(param));

            vm.showMatterAge = false;
            dashboardDatalayer
                .getMatterAverageAge(s, e)
                .then(function (response) {
                    var data = response.data.average_age;
                    vm.matterAverageAge = dashboardHelper.arrangeMatterAgeData(data);
                    vm.totalDays = dashboardHelper.totalMatterAge(data);
                    vm.showMatterAge = true;
                });
        }

        function getVenuesForJurisdiction(jurisdiction) {
            jurisdiction = utils.isEmptyVal(jurisdiction) ?
                _.find(vm.jurisdictionList, function (jurisdiction) {
                    return jurisdiction.name === "New York";
                })
                : jurisdiction;

            vm.map.jurisdiction = utils.isNotEmptyVal(jurisdiction.name) ? jurisdiction.name : '';

            //persist venue data
            localStorage.setItem("dashboardAnalyticsVenueInfo", JSON.stringify(vm.map));
            var venue_list = _.filter(masterData.getVenues(), function (venue) {
                return venue.jurisdiction_id === jurisdiction.id;
            });
            vm.venues = venue_list;
            clearVenueIfNotExist(vm.venues);
        }

        function clearVenueIfNotExist(venues) {
            var venue = _.find(venues, function (venue) {
                return venue.name === vm.map.venue;
            });

            if (utils.isEmptyVal(venue)) {
                vm.map.venue = "Select Venue";
                vm.map.markers = [];
            } else {
                getMattersForVenue(venue);
            }
        }

        //US#6148: when 'more ' link is clicked then show all matters
        function showAllMatters() {
            vm.matterLimit = vm.selectedAttorney.matters.length;
        }
    }

})(angular);
