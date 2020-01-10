angular.module('cloudlex.dashboard')
    .factory('dashboardHelper', dashboardHelper);

dashboardHelper.$inject = ['globalConstants'];
function dashboardHelper(globalConstants) {
    var usageFilter, weekMap = [];

    return {
        getInitData: _getInitData,
        getTrendId: _getTrendId,
        getMatterTrendProp: _getMatterTrendProp,
        setMatterTrendChartData: _setMatterTrendChartData,
        setAreaChart: _setAreaChart,
        modifyMatterTypeAreaChart: _setMatterTypeAreaChart,
        setDailyUsageChart: _setDailyUsageChart,
        getDailyUsageChartObj: _getDailyUsageChartObj,
        generateDailyUsageChart: _generateDailyUsageChart,
        modifyDailyUsageChart: _modifyDailyUsageChart,
        arrangeMatterAgeData: _arrangeMatterAgeData,
        totalMatterAge: _totalMatterAge,
        formatMatterResponse: _formatMatterResponse
    }

    function _getInitData() {
        var today = moment().startOf('day');
        today = new Date(today.toDate());
        today = moment(today.getTime()).unix();


        var initData = {
            matterTrends: ["New Matters Opened", "Closed Matters", "Referred Out Matters"],
            matterTrendFilters: [{ key: '3M', value: '3M' },
            { key: '6M', value: '6M' },
            { key: '1Y', value: '1Y' }],
            dailyUsageFilters: [{ key: '1W', value: '1W' },
            { key: '1M', value: '1M' },
            { key: '3M', value: '3M' }],
            avarageAgeFilters: [{ key: { s: _getUTCTimestamp(moment().subtract(3, 'months')), e: today }, value: '3M' },
            { key: { s: _getUTCTimestamp(moment().subtract(6, 'months')), e: today }, value: '6M' },
            { key: { s: _getUTCTimestamp(moment().subtract(1, 'year')), e: today }, value: '1Y' },
            { key: 'all', value: 'All' }],

        }
        return initData;
    }

    function _getUTCTimestamp(momentDate) {
        momentDate = momentDate.startOf('day').utc();
        var date = new Date(momentDate.toDate());
        date = moment(date.getTime()).unix();
        return date;
    }

    function _getTrendId(trend) {
        var trends = {
            "New Matters Opened": 'it',
            "Closed Matters": 'clo',
            "Referred Out Matters": 'ro'
        };
        return trends[trend];
    }

    function _getMatterTrendProp(trend) {
        var props = {
            "New Matters Opened": 'intook',
            "Closed Matters": 'closed',
            "Referred Out Matters": 'referred_out'
        };
        return props[trend];
    }

    //as the server send data for only values exsisting in the database 
    //rest of the values needs to be updated 
    function _setMatterTrendChartData(data) {
        var updatedData = [];
        var oneYearArrayFromThisMonth = _getOneYearFromThisMonthArray();
        _.forEach(oneYearArrayFromThisMonth, function (month) {
            var monthFound = _.find(data, function (item) { return item.date === month });
            if (angular.isDefined(monthFound)) {
                monthFound.count = parseInt(monthFound.count);
                updatedData.push(monthFound);
            } else {
                updatedData.push({ date: month, count: 0 });
            }
        })
        return updatedData;
    }

    function _getOneYearFromThisMonthArray() {
        var now = moment();
        var yearBack = moment().subtract(11, 'months');
        var range = moment.range(yearBack, now)
        var monthsArray = [];
        var date = yearBack;
        while (range.contains(date)) {
            var dateString = date.format('YYYY MMM');
            monthsArray.push(dateString);
            date = date.add(1, 'month');
        }
        return monthsArray;
    }

    function _setAreaChart(bindTo, chartName, data) {
        var values = _getValues(chartName, data);
        var categories = _getCategoriesForAreaChart(data);
        return {
            bindto: '#' + bindTo,
            color: {
                pattern: ['green']
            },
            transition: {
                duration: 0
            },
            data: {
                x: 'x',
                columns: [
                    categories,
                    values
                ],
                type: 'area-spline'
            },
            axis: {
                x: {
                    type: 'timeseries',
                    tick: {
                        format: function (x) {
                            var month = x.getMonth();
                            return globalConstants.months[month]
                        },
                        culling: false
                    },
                    padding: { left: 0 }
                },
                y: {
                    tick: {
                        format: function (x) {
                            if (x != Math.floor(x)) {
                                //var tick = d3.selectAll('.c3-axis-y g.tick').filter(function () {
                                //    var text = d3.select(this).select('text').text();
                                //    return +text === x;
                                //}).style('opacity', 0);
                                return '';
                            }
                            return x;
                        }
                    }
                }
            },
            legend: {
                show: false
            }
        };
    }

    function _formatMatterResponse(data) {
        var matters = [];
        _.forEach(data, function (arr, key) {
            matters = matters.concat(arr);
        });
        return matters;
    }

    function _getValues(chartName, data) {
        var values = [];
        _.forEach(data, function (item) {
            values.push(item.count)
        });

        values.unshift(chartName);
        return values;
    }

    function _getCategoriesForAreaChart(data) {
        var categories = [];
        _.forEach(data, function (item) {
            var date = moment(item.date, 'YYYY MMM');
            var formatted = date.format('YYYY-MM-DD')
            categories.push(formatted);
        })
        categories.unshift('x');
        return categories;
    }

    function _getDataForDateRange(dateRange, data) {
        var dataForDateRange;
        switch (dateRange) {
            case '1Y':
                dataForDateRange = data;
                break;
            case '6M':
                dataForDateRange = data.splice(7, 13)
                dataForDateRange.unshift(data[0]);
                break;
            case '3M':
                dataForDateRange = data.splice(10, 13)
                dataForDateRange.unshift(data[0]);
                break;
        }
        return dataForDateRange;
    }

    function _setMatterTypeAreaChart(matterType, filterKey, data, chartInfo, unloadType) {
        if (angular.isUndefined(chartInfo)) {
            return;
        }

        var valuesForChart = _getValues(matterType, data);
        var values = _getDataForDateRange(filterKey, valuesForChart);

        var categoriesForChart = _getCategoriesForAreaChart(data);
        var categories = _getDataForDateRange(filterKey, categoriesForChart);

        var unload = angular.copy(unloadType);

        chartInfo.load({
            columns: [categories, values],
            unload: [unload]
        });

        chartInfo.axis.max({ y: _.max(values.slice(1)) + 0.1 });
    }

    function _getDateRangeData(usageData, start, end) {
        var rangeData = [];
        var range = moment().range(start, end);
        var date = start;
        while (range.contains(date)) {
            var day = date.format('ddd');
            var data = _.find(usageData, function (data) {
                return data.date === date.format('YYYY-MM-DD');
            })
            rangeData.push(data);
            date = date.add(1, 'day');
        }
        return rangeData;
    }

    //daily usage chart start
    function _setDailyUsageChart(usageData) {
        var today = moment().endOf('day');
        var threeMonthsFromNow = moment().subtract(3, 'months').startOf('day');
        var range = moment().range(threeMonthsFromNow, today);
        var dailyUsageData = [];
        var date = threeMonthsFromNow;
        while (range.contains(date)) {
            var data = _.find(usageData, function (item) { return item.date == date.format('YYYY-MM-DD') });
            if (angular.isDefined(data)) {
                data.day = date.format('YYYY-MM-DD');
                data.avg = data.avg;
                dailyUsageData.push(data);
            } else {
                dailyUsageData.push({ date: date.format('YYYY-MM-DD'), avg: 0, day: date.format('YYYY-MM-DD') });
            }
            date = date.add(1, 'day');
        }
        return dailyUsageData;
    }

    //junk
    function _getDailyUsageChartObj(bindTo, usageData) {
        var values = usageData.map(function (data) {
            return data.avg;
        });
        values.unshift('Average Daily Usage');

        var categories = usageData.map(function (data) {
            return data.date;
        });
        categories.unshift('x');

        return {
            bindto: '#' + bindTo,
            color: {
                pattern: ['#83acbe']
            },
            data: {
                x: 'x',
                columns: [
                    categories,
                    values
                ],
                type: 'area-spline'
            },
            axis: {
                x: {
                    type: 'timeseries',
                    tick: {
                        format: function (x) {
                            return _formatDate(x);
                        }
                    },
                    padding: { left: 0 },
                },
                y: {
                    tick: {
                        format: function (n) {
                            if (Number(n) === n && n % 1 === 0) {
                                return n;
                            } else {
                                "";
                            }
                        }
                    }
                },
            },
            grid: {
                y: {
                    show: false
                }
            },

            legend: {
                show: false
            },
        };
    }

    function _generateDailyUsageChart(bindTo, usageData, filter) {
        var chartData = {};
        switch (filter) {
            case '1M':
                chartData = _setChartDataForMonth(usageData);
                break;
            case '1W':
                chartData = _setWeeksData(usageData);
                break;
            case '3M':
                chartData = _set3MonthsData(usageData);
                break;
        }

        var values = chartData.values.map(function (data) {
            return data.avg;
        });

        //calculate average
        var avg = 0;
        _.forEach(values, function (val) {
            avg += val;
        })

        avg = avg / values.length;
        avg = avg === 0 ? 0 : Math.round(avg * 100) / 100;

        values.unshift('Average Daily Usage');

        var categories = chartData.values.map(function (data) {
            return data.date;
        });
        categories.unshift('x');

        var xValues = chartData.xValues;

        var chart = {
            bindto: '#' + bindTo,
            color: {
                pattern: ['#83acbe']
            },
            data: {
                x: 'x',
                columns: [
                    categories,
                    values
                ],
                type: 'area-spline'
            },
            axis: {
                x: {
                    type: 'timeseries',
                    tick: {
                        //format: function (x) {
                        //    return _formatDate(x);
                        //}
                        fit: true,
                        values: xValues
                    },
                    padding: { left: 0 },
                },
                y: {
                    tick: {
                        format: function (x) {
                            if (x != Math.floor(x)) {
                                var tick = d3.selectAll('.c3-axis-y g.tick').filter(function () {
                                    var text = d3.select(this).select('text').text();
                                    return (text === x || utils.isEmptyString(text));
                                }).style('opacity', 0);

                                return '';
                            }
                            return x;
                        }
                    }
                }
            },
            tooltip: {
                format: {
                    value: function (value, ratio, id) {
                        return value;
                    }
                }
            },
            grid: {
                y: {
                    show: false
                }
            },

            legend: {
                show: false
            },
            padding: {
                right: 30,
                left: 40
            }
        };

        var usageChart = c3.generate(chart);
        usageChart.ygrids([{ value: avg }]);
    }

    function _setChartDataForMonth(usageData) {
        var aMonthAgo = moment().subtract(1, 'month').startOf('day');
        var yest = moment().endOf('day');
        var monthData = _getDateRangeData(usageData, angular.copy(aMonthAgo), yest);
        var xValues = [aMonthAgo.format('YYYY-MM-DD'),
        aMonthAgo.add(15, 'days'),
        yest.format('YYYY-MM-DD')];

        return { values: monthData, xValues: xValues };
    }

    function _setWeeksData(usageData) {
        var aWeekAgo = moment().subtract(1, 'week').startOf('day');
        var yest = moment().endOf('day');
        var weekAgoData = _getDateRangeData(usageData, angular.copy(aWeekAgo), yest);
        var xValues = [
            aWeekAgo.format('YYYY-MM-DD'),
            yest.format('YYYY-MM-DD')
        ];
        return { values: weekAgoData, xValues: xValues };
    }

    function _set3MonthsData(usageData) {
        var threeMonthsAgo = moment().subtract(3, 'months').startOf('day');
        var yest = moment().endOf('day');
        var weekAgoData = _getDateRangeData(usageData, angular.copy(threeMonthsAgo), yest);
        var xValues = [threeMonthsAgo.format('YYYY-MM-DD'),
        angular.copy(threeMonthsAgo).add(1, 'month').format('YYYY-MM-DD'),
        angular.copy(threeMonthsAgo).add(2, 'month').format('YYYY-MM-DD'),
        moment().endOf('day').format('YYYY-MM-DD')
        ];
        return { values: weekAgoData, xValues: xValues };
    }

    //function for 1 week view  
    function _getUsageDataForWeek(usageData) {
        var data = [];
        var startDate = moment().subtract(1, 'week').startOf('day');
        var endDate = moment().endOf('day');
        var range = moment.range(startDate, endDate);
        date = moment().subtract(1, 'week').startOf('day');

        while (range.contains(date)) {
            var day = date.format('ddd')
            if (!(day === 'Sat' || day === 'Sun')) {
                var dataForDate = _.find(usageData, function (data) { return data.day === date.format('YYYY-MM-DD') });
                data.push(dataForDate);
            }
            date = date.add(1, 'day');
        }
        return data;
    }

    //junk
    function _formatDate(date) {
        switch (usageFilter) {
            case "1W":
                var day = date.getDay();
                return globalConstants.weekDays[day];
                break;
            case "1M":
                var week = _.find(weekMap, function (item) { return _.isEqual(item.date, date) })
                return angular.isDefined(week) ? week.week : "";
            case "3M":
                var month = date.getMonth();
                return globalConstants.months[month];
                return;
        }
    }

    function _modifyDailyUsageChart(filter, usageData, chart) {
        usageFilter = filter;
        var data, categories, values, start, end;
        switch (filter) {
            case '1W':
                data = usageData.slice(usageData.length - 8, usageData.length - 1);
                start = moment().subtract(1, 'week');
                end = moment();
                categories = data.map(function (item) { return item.day; });
                values = data.map(function (item) { return item.avg; });
                break;
            case '1M':
                data = _getMonthsData(usageData);
                start = moment().subtract(1, 'month').startOf('day');
                end = moment();
                categories = data.map(function (item) { return item.categories; });
                _setWeekMap(categories);
                values = data.map(function (item) { return item.avg; });
                break;
            case '3M':
                data = _get3MonthsData(usageData);
                start = moment().startOf('month').subtract(2, 'months');
                end = moment();
                categories = data.map(function (item) { return item.categories; });
                values = data.map(function (item) { return item.avg; });
                break;
        }


        var average = 0;
        _.forEach(values, function (value) {
            average += value
        })
        average = average / values.length;

        values.unshift('Average Daily Usage');
        categories.unshift('x');

        chart.ygrids([{ value: average, text: 'avg usage' }]);

        chart.load({
            columns: [categories, values],
        });

        var periodString = start.format('D MMM') + ' - ' + end.format('D MMM');
        return periodString;
    }

    //junk
    function _setWeekMap(categories) {
        _.forEach(categories, function (cat, index) {
            var date = moment(cat, 'YYYY-MM-DD');
            date = new Date(date.toDate());
            weekMap.push({ date: date, week: "W" + (index + 1) });
        })
    }

    //junk
    function _getMonthsData(data) {
        var monthData = [];
        var week = 0;
        var aMonthAgo = moment().subtract(1, 'month');
        //start with a weeks back date
        var date = moment().subtract(1, 'week');
        while (date.isAfter(aMonthAgo)) {
            var endDate = angular.copy(date).add(1, 'week');
            var average = _getValuesByWeek(date, endDate, data);
            week++;
            monthData.unshift({ categories: date.format('YYYY-MM-DD'), avg: average });
            date = angular.copy(date).subtract(1, 'week');
        }
        return monthData;
    }

    //junk
    function _get3MonthsData(data) {
        var threeMonthsData = [];
        var aMonthAgo = moment().startOf('month').format('YYYY-MM');
        var aMonthAgoDate = moment().startOf('month').format('YYYY-MM-DD');
        threeMonthsData.push(angular.copy({ avg: _getAvgForMonth(data, aMonthAgo), categories: aMonthAgoDate }));

        var twoMonthsAgo = moment().startOf('month').subtract(1, 'months').format('YYYY-MM');
        var twoMonthsAgoDate = moment().startOf('month').subtract(1, 'months').format('YYYY-MM-DD');
        threeMonthsData.push(angular.copy({ avg: _getAvgForMonth(data, twoMonthsAgo), categories: twoMonthsAgoDate }));

        var threeMonthsAgo = moment().startOf('month').subtract(2, 'months').format('YYYY-MM');
        var threeMonthsAgoDate = moment().startOf('month').subtract(2, 'months').format('YYYY-MM-DD');
        threeMonthsData.push(angular.copy({ avg: _getAvgForMonth(data, threeMonthsAgo), categories: threeMonthsAgoDate }));
        return threeMonthsData;
    }

    //junk
    function _getAvgForMonth(data, month) {
        var dataForMonth = _.filter(data, function (item) {
            return item.date.substring(0, 7) === month;
        });
        var avg = 0;
        _.forEach(dataForMonth, function (data) {
            avg += data.avg;
        })
        avg = avg / dataForMonth.length;
        avg = avg === 0 ? 0 : Math.round(avg * 100) / 100;
        return avg;
    }

    //junk
    function _getValuesByWeek(start, end, values) {
        var dates = _.pluck(values, 'date');
        var startIndex = _.indexOf(dates, start.format('YYYY-MM-DD'));
        var endIndex = _.indexOf(dates, end.format('YYYY-M-DD'));
        var weeksData = values.slice(startIndex, endIndex);
        var average = 0;
        _.forEach(weeksData, function (data) {
            average += data.avg;
        })
        average = average / weeksData.length;
        average = average === 0 ? 0 : Math.round(average * 100) / 100
        return average;
    }
    //daily usage chart end


    function _totalMatterAge(avgMatterAgeData) {
        var total = 0;
        _.forEach(avgMatterAgeData, function (data) {
            total += parseInt(data.avg);
        })
        return total;
    }

    function _arrangeMatterAgeData(data) {
        //define the order of the data
        var order = ["New Case/Pre-Lit", "Litigation", "Discovery", "Trial", "Motion"];
        var orderedData = [];
        //loop on the ordered data and sort accoringly
        _.forEach(order, function (status) {
            var dta = _.find(data, function (item) { return item.status.toUpperCase() === status.toUpperCase() });
            orderedData.push(dta);
        })
        return orderedData;
    }
}