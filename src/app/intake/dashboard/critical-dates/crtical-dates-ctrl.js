(function (angular) {

    angular
        .module('intake.dashboard')
        .controller('IntakeCriticalDatesCtrl', CriticalDatesController)

    CriticalDatesController.$inject = ["$timeout", "$state", "masterData", "intakeCriticalDatesHelper", "intakeEventsHelper", "intakeDashboardDatalayer", "globalConstants"];
    function CriticalDatesController($timeout, $state, masterData, intakeCriticalDatesHelper, intakeEventsHelper, intakeDashboardDatalayer, globalConstants) {
        var vm = this, selectedWeek, initCriticalDateLimit = 10;
        vm.isWeekSelected = isWeekSelected;
        vm.getMatterForWeek = getMatterForWeek;
        vm.getCriticalEventsData = getCriticalEventsData;
        vm.gotoEvent = gotoEvent;
        vm.printCriticalDates = printCriticalDates;
        vm.scrollReachedBottom = scrollReachedBottom;
        vm.scrollReachedTop = scrollReachedTop;


        (function () {
            vm.criticalEventsLimit = initCriticalDateLimit;
            vm.clxGridOptions = {
                headers: intakeCriticalDatesHelper.getCriticalDatesGridInfo()
            };

            vm.events = angular.copy(masterData.getEventTypes());
            setEventTypes();
            vm.events.unshift({ labelId: undefined, name: "All Events" });

            //set the persisted event
            var event = localStorage.getItem("criticalDatesEventIntake");
            if (utils.isNotEmptyVal(event)) {
                try {
                    event = JSON.parse(event);
                    vm.selectedEvent = event;
                } catch (e) {
                    vm.selectedEvent = { labelId: undefined, name: "All Events" };
                }
            } else {
                vm.selectedEvent = { labelId: undefined, name: "All Events" };
            }

            vm.display = {
                renderGrid: false,
                view: 'grid'
            };

            intakeDashboardDatalayer
                .getCriticalDates(vm.selectedEvent.labelId)
                .then(function (response) {
                    var criticalDates = response.critical_dates[0];
                    vm.criticalDates = intakeCriticalDatesHelper.setCriticalDates(criticalDates);
                    getMatterForWeek(getPersistedWeekFilter(vm.criticalDates));
                    setAssignToUser(vm.criticalDates); //Bug#8373
                    vm.display.renderGrid = true;
                });
            //persist last visited tab on dashboard
            localStorage.setItem("dashboardTab", ".critical-dates-intake");
        })();

        function setEventTypes() {
            var finalEvents = [];
            angular.forEach(vm.events, function (eType) {
                if (eType.labelId != 19) {
                    finalEvents.push(eType);
                }
            });
            vm.events = finalEvents;
        }

        function getPersistedWeekFilter(dates) {
            var persistedWeek = localStorage.getItem("criticalDatesWeeksIntake");
            if (utils.isEmptyVal(persistedWeek)) {
                return dates[0];
            }

            try {
                var isSelected = _.find(dates, function (week) {
                    var selWeekRange = week.start + "-" + week.end;
                    return (persistedWeek == selWeekRange);
                });

                return utils.isNotEmptyVal(isSelected) ? isSelected : dates[0];
            } catch (e) {
                return dates[0];
            }
        }

        function isWeekSelected(week) {
            return _.isEqual(week, selectedWeek);
        }

        //func to set assigned to user on grid Bug#8373
        function setAssignToUser(info) {
            _.forEach(info, function (currentItem) {
                _.forEach(currentItem.matters, function (data) {
                    var user = _.pluck(data.assignedTo, 'userName');
                    data.name = user.join(', ');
                    var eventType = _.filter(masterData.getMasterData().event_types, function (item) {
                        if (item.labelId == data.labelId) {
                            return item.name;
                        }
                    });
                    if (data.labelId == 19 || data.labelId == 100 || data.labelId == 32) {
                        data.title = utils.isNotEmptyVal(data.title) ? data.title : eventType[0].Name;
                    } else {
                        data.title = eventType[0].Name;
                    }
                })
            })
        }

        function getMatterForWeek(week) {
            selectedWeek = week;
            //persist selected week
            var selectedWeekRange = selectedWeek.start + "-" + selectedWeek.end;
            localStorage.setItem("criticalDatesWeeksIntake", selectedWeekRange);

            vm.weekInfo = selectedWeek;
            vm.matters = week.matters;
            vm.display.renderGrid = false;
            $timeout(function () {
                vm.display.renderGrid = true;
            }, 300);
        }

        function getCriticalEventsData(event) {
            vm.display.renderGrid = false;
            vm.selectedEvent = event;
            //persist selected event
            localStorage.setItem("criticalDatesEventIntake", JSON.stringify(vm.selectedEvent));
            intakeDashboardDatalayer
                .getCriticalDates(event.labelId)
                .then(function (response) {
                    var criticalDates = response.critical_dates[0];
                    vm.criticalDates = intakeCriticalDatesHelper.setCriticalDates(criticalDates);
                    getMatterForWeek(getPersistedWeekFilter(vm.criticalDates));
                    setAssignToUser(vm.criticalDates);
                    vm.display.renderGrid = true;
                });
        }

        function gotoEvent(event) {
            //Bug#7830:Event view page should not open when matter is not tagged for personal event.
            if (event.intakeId == null) {
                return;
            }
            event.id = event.eventId;
            intakeEventsHelper.setSelectedEvent(event);
            $state.go('intakeevents', { intakeId: event.intakeId });
        }

        function printCriticalDates(criticalDatesObj, eventName, eventData) {
            var output = getCriticalDatesTable(criticalDatesObj, eventName, eventData);
            window.open().document.write(output);
        }

        function getCriticalDatesTable(criticalDatesObj, eventName, eventData) {



            var title = [{
                name: 'intakeName',
                desc: 'Intake'
            }, {
                name: 'eventTitle',
                desc: 'Event Title'
            }, {
                name: 'eventDescription',
                desc: 'Event Description'
            }, {
                name: 'eventLocation',
                desc: 'Venue'
            }, {
                name: 'name',
                desc: 'Assigned to'
            }, {//US#7040
                name: 'start',
                desc: 'Date & Time'
            }];

            var html = "<html><head><title>Events</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style>table tr { page-break-inside: always; } </style></head>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Events</h1><div></div>";
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
            html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'><strong>Event: </strong>" + eventName + "</div>";
            html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'><strong>Date Range:</strong> " + eventData.start + " - " + eventData.end + "</div>";
            html += "<tr>";
            angular.forEach(title, function (val, key) {
                html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + val.desc + "</th>";

            });
            html += "</tr>";
            angular.forEach(criticalDatesObj, function (dat) {

                // console.log('dat', dat);
                html += "<tr>";
                angular.forEach(title, function (val) {
                    //  console.log('headers', val.name);
                    dat[val.name] = (_.isNull(dat[val.name]) || angular.isUndefined(dat[val.name]) || utils.isEmptyString(dat[val.name])) ? " - " : dat[val.name];

                    html += "<td style='border:1px solid #e2e2e2;border-collapse:collapse;text-align:left;padding:5px;word-wrap: break-word;word-break: break-all;width:16.5;'>" + dat[val.name] + "                                  </td>";

                });
                html += "</tr>";
            });
            html += "</body>";
            html += "</table>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}";
            html += "tbody {display:table-row-group;}</style>";
            html += "</html>";
            return html;
        }





        function scrollReachedBottom() {
            vm.criticalEventsLimit = vm.criticalEventsLimit + initCriticalDateLimit;
        }

        function scrollReachedTop() {
            vm.criticalEventsLimit = initCriticalDateLimit;
        }


    }

    angular
        .module('intake.dashboard')
        .factory('intakeCriticalDatesHelper', intakeCriticalDatesHelper)

    intakeCriticalDatesHelper.$inject = ['$filter'];
    function intakeCriticalDatesHelper($filter) {

        return {
            getCriticalDatesGridInfo: _getCriticalDatesGridInfo,
            setCriticalDates: _setCriticalDates

        }

        function _getCriticalDatesGridInfo() {
            return [

                {
                    field: [
                        {
                            prop: 'intakeName',
                            // href: { link: '#/intake/intake-overview', paramProp: ['intakeId'] },
                            css: 'word-wrap'
                        }],
                    displayName: 'Intake',
                    dataWidth: "20"
                },
                {
                    field: [
                        {
                            prop: 'eventTitle',
                            // href: { link: '#/intake/events', paramProp: ['intakeId'] },
                            css: 'word-wrap'
                        }],
                    displayName: 'Event Title',
                    dataWidth: "16"   //US#7040
                },
                {
                    field: [
                        {
                            prop: 'eventDescription',
                            html: '<span tooltip-append-to-body="true" tooltip-placement="bottom" tooltip="{{data.eventDescription}}" >{{data.eventDescription | cut:false:100}}</span>',
                        }],
                    displayName: 'Event Description',
                    dataWidth: "16" //US#7040
                },
                {
                    field: [
                        {
                            prop: 'eventLocation',
                            html: '<span tooltip-append-to-body="true" tooltip-placement="bottom" tooltip="{{data.eventLocation}}" >{{data.eventLocation | cut:false:100}}</span>',
                        }],
                    displayName: 'Venue',
                    dataWidth: "16"    //US#7040 
                },
                {
                    field: [
                        {
                            prop: 'name',
                        }],
                    displayName: 'Assigned to',
                    dataWidth: "16"
                },
                {  //US#7040
                    field: [
                        {
                            prop: 'start',
                        }],
                    displayName: 'Date & Time',
                    dataWidth: "16",
                },
            ];
        }

        function _setCriticalDates(criticalDatesObj) {
            var criticalDates = [];

            angular.forEach(criticalDatesObj, function (val, key) {
                var criticalDateObj = {
                    start: moment.unix(val.start).format('DD MMM'),
                    end: moment.unix(val.end).format('DD MMM'),
                    count: val.count,
                    matters: _setMatterDates(val.events)
                };
                criticalDates.push(criticalDateObj)
            })

            return criticalDates
        }


        function _setMatterDates(matters) {
            _.forEach(matters, function (matter) {
                //matter.start = moment.unix(matter.start).format('MM/DD/YYYY  hh:mm A');
                matter.start = $filter('utcDateFilter')(matter.startDate, 'MM/DD/YYYY  hh:mmA', matter.fullday, 'start');
            })
            return matters;
        }

    }







})(angular)
