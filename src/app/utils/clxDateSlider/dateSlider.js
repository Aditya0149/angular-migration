(function (angular) {
    'use strict';

    angular
        .module('clxDateSlider', [])
        .directive('clxDateSlider', dateSlider);

    function dateSlider() {
        var directive = {
            restrict: 'E',
            scope: {
                getData: '&',
                getEventsCount: '&',
                selectedDate: '=',
                refreshCount: '='
            },
            controllerAs: 'dateSlider',
            bindToController: true,
            replace: true,
            controller: clxDateSliderCtrl,
            templateUrl: 'app/utils/clxDateSlider/clxDateSlider.html'
        };

        return directive;
    }

    clxDateSliderCtrl.$inject = ['$scope', '$timeout', 'dateSliderHelper'];
    function clxDateSliderCtrl($scope, $timeout, dateSliderHelper) {
        var vm = this,
            today = moment().startOf('day'),
            //  var today = moment().startOf('day');
            //  var startOfDayUTC = utils.getUTCTimeStamp(today);
            selectedDay = {};



        vm.calender = [];
        //init
        (function () {
            vm.refreshCount = false;
            vm.showWeek = true;
            dateSliderHelper.setCurrentYear(vm.selectedDate);
            setSelectedDate();
            getEventsCountFn();
        })();

        vm.goToToday = goToToday;
        vm.getNextWeek = dateSliderHelper.getNextWeek;
        vm.getPrevWeek = dateSliderHelper.getPreviousWeek;
        vm.getDataForSelectedDay = getDataForSelectedDay;
        vm.isDateSelected = isDateSelected;
        vm.getCount = getEventsCountFn;
        vm.slideWeek = slideWeek;

        function setSelectedDate() {
            if (angular.isDefined(vm.selectedDate) && utils.isNotEmptyString(vm.selectedDate)) {
                dateSliderHelper.goToDate(vm.selectedDate, vm.calender);
                selectedDay = dateSliderHelper.getDateFromCalender(vm.selectedDate, vm.calender);
            } else {
                dateSliderHelper.goToToday(vm.calender);//sets weeks which has today's date
                selectedDay = dateSliderHelper.getTodayFromCalender(vm.calender);
            }
        }

        function getDataForSelectedDay(day) {
            selectedDay = day;
            vm.getData()(day);
        }

        function goToToday(calender) {
            dateSliderHelper.goToToday(calender);
            var day = dateSliderHelper.getTodayFromCalender(calender);
            selectedDay = day;
            vm.getData()(day);
        }

        function isDateSelected(day) {
            return day.date === selectedDay.date;
        }

        //watch the variable refresh count to refresh event counts
        $scope.$watch(function () {
            return vm.refreshCount;
        }, function (newVal) {
            if (newVal) {
                getEventsCountFn();
                vm.refreshCount = false;
            }
        });

        //watch the variable selected date
        $scope.$watch(function () {
            return vm.selectedDate;
        }, function (newVal, oldVal) {
            var today = moment().startOf('day');
            var startOfDayUTC = utils.getUTCTimeStamp(today);
            if (newVal && newVal != oldVal && newVal == startOfDayUTC) {
                vm.getCount();
                var day = dateSliderHelper.getTodayFromCalender(vm.calender);
                selectedDay = day;
            }
        });

        function getEventsCountFn() {
            var getEventsFn = vm.getEventsCount()(vm.calender[0]);
            getEventsFn.then(function (counts) {
                dateSliderHelper.setCounts(vm.calender, counts);
            });
        }

        function slideWeek() {
            vm.showWeek = false;
            $timeout(function () {
                vm.showWeek = true;
            }, 500);
        }
    }

    angular
        .module('clxDateSlider')
        .factory('dateSliderHelper', dateSliderHelper);

    function dateSliderHelper() {

        var weekNumber = 1,
            year = 1970,
            totalWeeks;

        return {
            getTodayFromCalender: getTodayFromCalender,
            getDateFromCalender: getDateFromCalender,
            setCurrentYear: setCurrentYear,
            goToToday: goToToday,
            goToDate: goToDate,
            getNextWeek: getNextWeek,
            getPreviousWeek: getPreviousWeek,
            setCounts: setCounts,
            isDateSelected: isDateSelected
        }

        function getTodayFromCalender(calender) {
            var today = moment().startOf('day');
            var currDate = new Date(today.toDate());
            var currTimestamp = moment(currDate.getTime()).unix();

            var todayObj = _.find(calender, function (day) {
                return day.date === currTimestamp;
            });
            return todayObj;
        }


        function getDateFromCalender(utcTimestamp, calender) {
            var date = moment.unix(utcTimestamp),
                dateObj;

            for (var i = 0; i < calender.length; i++) {
                //if date is equal to the i th calendar date set the date obj and break the loop
                if (i === calender.length - 1) {
                    dateObj = calender[i];
                    break;
                }

                var calendarDate = moment.unix(calender[i].utcTimestamp),
                    nextDate = moment.unix(calender[i + 1].utcTimestamp);
                //check if the date lies between the i th calendar date and i+1 th calendar date
                //if it is between calendar dates set the date obj and break the loop
                if (date.isSame(calendarDate) || date.isBefore(nextDate)) {
                    dateObj = calender[i];
                    break;
                }
            }

            return dateObj;
        }

        function setCurrentYear(selectedDate) {
            if (utils.isNotEmptyVal(selectedDate)) {
                var seldate = moment.unix(selectedDate);
                year = seldate.isoWeekYear();
                //year = seldate.year();
            } else {
                year = moment().isoWeekYear();
                //year = moment().get('year');
            }
            setWeeksInYear();
            weekNumber = 1;
        }

        function setWeeksInYear() {
            var d = new Date(year, 11, 31);
            var week = getWeekNumber(d)[1];
            totalWeeks = week == 1 ? getWeekNumber(d.setDate(24))[1] : week;
        }

        function getWeekNumber(d) {
            // Copy date so don't modify original
            d = new Date(+d);
            d.setHours(0, 0, 0);
            // Set to nearest Thursday: current date + 4 - current day number
            // Make Sunday's day number 7
            d.setDate(d.getDate() + 4 - (d.getDay() || 7));
            // Get first day of year
            var yearStart = new Date(d.getFullYear(), 0, 1);
            // Calculate full weeks to nearest Thursday
            var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
            // Return array of year and week number
            return [d.getFullYear(), weekNo];
        }

        //date is moment date
        function goToToday(calender) {
            var today = moment();
            year = today.isoWeekYear();
            weekNumber = today.isoWeek();//get week number from the date
            getDatesOfWeek(calender);//get array of dates for the week
        }

        function goToDate(utcTimestamp, calender) {
            var date = moment(moment.unix(utcTimestamp).utc().format('MM/DD/YYYY'));
            weekNumber = date.isoWeek();
            year = date.isoWeekYear();
            getDatesOfWeek(calender);
        }

        function getNextWeek(calender) {
            weekNumber += 1;
            if (weekNumber > totalWeeks) {
                year = year + 1;
                weekNumber = 1;
                setWeeksInYear();
            }
            getDatesOfWeek(calender);
        }

        function getPreviousWeek(calender) {
            weekNumber -= 1;
            if (weekNumber <= 0) {
                year = year - 1;
                setWeeksInYear();
                weekNumber = totalWeeks;
            }
            getDatesOfWeek(calender);
        }

        function getDatesOfWeek(calender) {

            var start = firstDayOfWeek(year, weekNumber);//get start of week date 
            var end = angular.copy(start).days(7);//get end of week date
            var range = moment().range(start, end);

            calender.length = 0;
            var date = start;

            while (range.contains(date)) {
                var currDate = new Date(angular.copy(date).toDate());
                var currTimestamp = currDate.getTime();
                currTimestamp = moment(currTimestamp).unix();

                var utcDate = new Date(date.toDate());
                // var utcTimestamp = utcDate.getTime();
                // utcTimestamp = moment(utcTimestamp).unix();
                var utcTimestamp = utils.getUTCTimeStamp(utcDate);

                var sliderDateObj = {
                    utcTimestamp: utcTimestamp,
                    date: currTimestamp,
                    displayMonth: getMonth(currTimestamp),
                    displayDate: getDisplayDate(currTimestamp),
                    isNewMonth: isNewMonth(currTimestamp),
                    taskCount: '-'
                };

                calender.push(sliderDateObj);
                date.add(1, 'days');
            }
            setmonthChangedProp(calender);
        }

        function firstDayOfWeek(year, week) {

            // Jan 1 of 'year'
            var d = new Date(year, 0, 1),
                offset = d.getTimezoneOffset();

            // ISO: week 1 is the one with the year's first Thursday 
            // so nearest Thursday: current date + 4 - current day number
            // Sunday is converted from 0 to 7
            d.setDate(d.getDate() + 4 - (d.getDay() || 7));

            // 7 days * (week - overlapping first week)
            d.setTime(d.getTime() + 7 * 24 * 60 * 60 * 1000
                * (week + (year == d.getFullYear() ? -1 : 0)));

            // daylight savings fix
            d.setTime(d.getTime()
                + (d.getTimezoneOffset() - offset) * 60 * 1000);

            // back to Monday (from Thursday)
            d.setDate(d.getDate() - 3);

            var timestamp = moment(d.getTime()).unix();

            return moment.unix(timestamp);
        }

        function getMonth(timestamp) {
            return moment.unix(timestamp).format('MMM YYYY')
        }

        function getDisplayDate(timestamp) {
            var myDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            var date = utils.convertUTCtoDate(timestamp);
            var day = date.getDay();
            return date.getDate() + ' ' + myDays[day];
        }

        function isNewMonth(timestamp) {
            var date = utils.convertUTCtoDate(timestamp);
            return date.getDate() === 1;
        }

        function setmonthChangedProp(dates) {
            for (var i = 0; i < dates.length; i++) {
                if (i === 0) {
                    dates[i].monthChanged = true;
                    continue;
                }
                //if previous date's month is not equal to [i]th days month set monthChanged to true
                dates[i].monthChanged = dates[i].displayMonth !== dates[i - 1].displayMonth;
            }
        }

        function setCounts(calender, counts) {
            if (angular.isUndefined(calender)) {
                return;
            }
            for (var i = 0; i < counts.length; i++) {
                calender[i].taskCount = counts[i] > 0 ? counts[i] : 0;
            }
        }

        function isDateSelected(day) {
            var todayTimestamp = utils.getStartOfDayTimestamp(new Date());
            return day.date === todayTimestamp;
        }
    }

})(angular);



//function setWeeksInYear() {
//    var lastDateOfYear = moment(year + '/12/31', 'YYYY/MM/DD');
//    var oneWeekBeforeLastDate = moment(year + '/12/24', 'YYYY/MM/DD');
//    var weekNo = lastDateOfYear.week();
//    totalWeeks = weekNo == 1 ? oneWeekBeforeLastDate.week() : weekNo;
//}
