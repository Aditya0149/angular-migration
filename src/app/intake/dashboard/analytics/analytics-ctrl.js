(function (angular) {
    'use strict';

    angular
        .module('intake.dashboard')
        .controller('IntakeAnalyticsCtrl', AnalyticsController);

    AnalyticsController.$inject = ['$scope', '$state', '$timeout', 'masterData', 'intakeEventsHelper', 'intakeDashboardHelper',
        'intakeDashboardDatalayer'];
    function AnalyticsController($scope, $state, $timeout, masterData, intakeEventsHelper, intakeDashboardHelper,
        intakeDashboardDatalayer) {

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
        vm.gotoActivity = gotoActivity;
        vm.showTopStrip = showTopStrip;
        vm.filterAverageMatterAge = filterAverageMatterAge;
        //US#6148-More functionality for matters assigned to Attorney
        vm.showAllMatters = showAllMatters;
        var intialLimit = 5;
        vm.matterLimit = intialLimit;//initial attorney matter limit to show on grid
        vm.reset = reset;
        vm.resetforDonut = false;
        //Check is admin
        var userRole = masterData.getUserRole();
        vm.isUser = (userRole.is_admin == '1' || userRole.role == 'Managing Partner/Attorney' || userRole.role == 'LexviasuperAdmin') ? true : false;

        (function () {
            initVariables();
            initData();
            //persist last visited tab on dashboard
            localStorage.setItem("dashboardTab", ".analytics");
        })();

        //US#6226
        function reset() {
            localStorage.setItem("dashboardAnalyticsVenueInfo", "");
            vm.map.jurisdiction = "New York";
            vm.map.venue = "Select Venue";
            vm.map.markers = {};
            venueReceived = false //US#7040
        }

        function initVariables() {
            var initVarData = intakeDashboardHelper.getInitData();
            vm.display = {};
            vm.matterTypes = initVarData.matterTrends;

            vm.matterTypesFilters = initVarData.matterTrendFilters;
            setMatterTrendFilter();
            setStripData();
        }

        function setMatterTrendFilter() {
            //set matter trend filter (3M, 6M, 1Y)
            var persistedTrendFilter = localStorage.getItem("dashboardAnalyticsMatterTrendFilter");
            if (utils.isNotEmptyVal(persistedTrendFilter)) {
                var isValidTrend = _.find(vm.matterTypesFilters, function (type) {
                    return type.key == persistedTrendFilter;
                });
                vm.selectedMatterTrendFilter = utils.isNotEmptyVal(isValidTrend) ? isValidTrend.key : '1Y';
                vm.selectedMatterTrendFilterVal = utils.isNotEmptyVal(isValidTrend) ? isValidTrend.val : '12';
            } else {
                vm.selectedMatterTrendFilter = '1Y';
                vm.selectedMatterTrendFilterVal = '12';
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
            getMaterTrendData();
            // intakeDashboardDatalayer
            //     .getDashboardData()
            //     .then(function (response) {
            //         vm.display.dashboard = true;
            //         var data = response.data;
            //         getMaterTrendData();
            //     }, function (e) { });
        }

        function getMaterTrendData() {
            intakeDashboardDatalayer
                .getMatterTrend(vm.selectedMatterTrendFilterVal)
                .then(function (response) {
                    vm.display.matterTrend = true;
                    $timeout(function () {

                        vm.StatusBarData = {
                            totalLeadsAdded: response.totalLeadsAdded,
                            totalLeadsAccepted: response.totalAcceptedLeads,
                            LeadConversionRate: (response.leadConversionRate && response.leadConversionRate != 0) ? response.leadConversionRate.toFixed(2) + "%" : "-",
                            AverageAcceptedValuation: response.avgValuation
                        }
                        var data = {
                            newLeads: response.newLeads,
                            acceptedLeads: response.acceptedLeads,
                            duration: vm.selectedMatterTrendFilterVal
                        }
                        var donutDataTypeInfo = response.typeInfo;
                        setChartData(data);
                        setDonutChartData(donutDataTypeInfo);

                        var donutDataAvgVal = response.averageIntakeValuation;
                        setDonutData(donutDataAvgVal);

                        vm.display.statusStrip = true;
                    })
                }, function (e) {

                });
        }

        function setDonutData(data) {
            var donutDataTypeInfo = intakeDashboardHelper.setAvgValDonutChart("avgValDonut-chart", data);
            var typeInfoDonutChart = c3.generate(donutDataTypeInfo);
        }

        function setDonutChartData(data) {
            var donutDataTypeInfo = intakeDashboardHelper.setDonutChart("donut-chart", data);
            var typeInfoDonutChart = c3.generate(donutDataTypeInfo);
        }

        function setChartData(data) {
            matterTrendData = intakeDashboardHelper.setMatterTrendChartData(data);
            vm.areaChartObj = intakeDashboardHelper.setAreaChart("area-chart", vm.selectedMatterTrend, matterTrendData);
            matterTrendChart = c3.generate(vm.areaChartObj);
        }

        function setDailyUsageData(data) {
            dailyUsageData = intakeDashboardHelper.setDailyUsageChart(data);
            intakeDashboardHelper.generateDailyUsageChart("monthly-usage-chart", dailyUsageData, '1M');
            intakeDashboardHelper.generateDailyUsageChart("weekly-usage-chart", dailyUsageData, '1W');
            intakeDashboardHelper.generateDailyUsageChart("threemonthly-usage-chart", dailyUsageData, '3M');
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
            $state.go('intake-overview', { matterId: matter.matter_id });
        }

        function getDataForMaterTrend(trend) {
            vm.selectedMatterTrend = trend;
            //persist matter trend
            localStorage.setItem("dashboardAnalyticsMatterTrend", trend);
            var unload = angular.copy(prevSelectedMatterTrend);
            intakeDashboardDatalayer
                .getMatterTrend(vm.selectedMatterTrendFilterVal).then(function (response) {
                    var data = response.data.matters_closed_refout_intook[intakeDashboardHelper.getMatterTrendProp(trend)];
                    matterTrendData = intakeDashboardHelper.setMatterTrendChartData(data);
                    intakeDashboardHelper.modifyMatterTypeAreaChart(vm.selectedMatterTrend, vm.selectedMatterTrendFilter, matterTrendData, matterTrendChart, prevSelectedMatterTrend);
                    prevSelectedMatterTrend = vm.selectedMatterTrend;
                });
        }

        function filterMatterTrendData(filterKey) {
            if (angular.isUndefined(filterKey) || angular.isUndefined(matterTrendChart)) {
                return;
            }

            //persist trend filter
            localStorage.setItem("dashboardAnalyticsMatterTrendFilter", filterKey);
            var persistedTrendFilter = localStorage.getItem("dashboardAnalyticsMatterTrendFilter");
            if (utils.isNotEmptyVal(persistedTrendFilter)) {
                var isValidTrend = _.find(vm.matterTypesFilters, function (type) {
                    return type.key == persistedTrendFilter;
                });
                vm.selectedMatterTrendFilter = utils.isNotEmptyVal(isValidTrend) ? isValidTrend.key : '1Y';
                vm.selectedMatterTrendFilterVal = utils.isNotEmptyVal(isValidTrend) ? isValidTrend.val : '12';
            } else {
                vm.selectedMatterTrendFilter = '1Y';
                vm.selectedMatterTrendFilterVal = '12';
            }
            getMaterTrendData();
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

            intakeDashboardDatalayer.getMattersByVenue(venue.id)
                .then(function (response) {
                    vm.map.markers = intakeDashboardHelper.formatMatterResponse(response.data.matters_by_venue);
                    venueReceived = true;
                })
        }

        function gotoActivity(activity) {
            switch (activity.event) {
                case "Document Upload":
                    $state.go('intakedocument-view', { matterId: activity.matter_id, documentId: activity.id });
                    break;
                case "Calendar Entry Added":
                    intakeEventsHelper.setSelectedEvent({ id: activity.id });
                    $state.go('intakeevents', { matterId: activity.matter_id });
                    break;
                case "Status Change":
                    $state.go('intake-overview', { matterId: activity.matter_id });
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
            intakeDashboardDatalayer
                .getMatterAverageAge(s, e)
                .then(function (response) {
                    var data = response.data.average_age;
                    vm.matterAverageAge = intakeDashboardHelper.arrangeMatterAgeData(data);
                    vm.totalDays = intakeDashboardHelper.totalMatterAge(data);
                    vm.showMatterAge = true;
                });
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
