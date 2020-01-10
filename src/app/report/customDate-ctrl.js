angular.module('cloudlex.report')
    .controller('CustomDateCtrl', ['$scope', '$modalInstance', 'params', function ($scope, $modalInstance, params) {

        $scope.calendarEvent = {};
        $scope.viewModel = {};
        $scope.viewModel.filters = {}
        $scope.allMtrLstFlag = false;
        $scope.mtrInTookDtFlag = false;

        //set datepicker options
        $scope.dateFormat = 'MM/dd/yyyy';
        $scope.datepickerOptions = {
            formatYear: 'yyyy',
            startingDay: 1,
            'show-weeks': false

        };
        $scope.fromAndToDateFlag = false;

        if (angular.isDefined(params.filters.matterInTookByDateFlag)) {
            $scope.mtrInTookDtFlag = true;
            $scope.fromAndToDateFlag = true;
            $scope.viewModel.filters.fromdate = moment().format("MM/DD/YYYY");
            $scope.viewModel.filters.todate = moment().format("MM/DD/YYYY");

        } else {
            $scope.allMtrLstFlag = true;
            $scope.viewModel.filters.s = moment().format("MM/DD/YYYY");
            $scope.viewModel.filters.e = moment().format("MM/DD/YYYY");
        }

        // get formatter string
        function getFormattedDateString(event) {
            event.utcend = utils.getFormattedDateString(event.utcstart);
        }

        //event handlers
        $scope.openStartDate = function ($event, isOpened) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.calendarEvent[isOpened] = true; //isOpened is a string specifying the model name
        };

        $scope.resetMultiSelectFilter = function () {

            if (angular.isDefined(params.filters.matterInTookByDateFlag)) {
                $scope.viewModel.filters.fromdate = moment().format();
                $scope.viewModel.filters.todate = moment().format();

            } else {
                $scope.viewModel.filters.s = moment().format();
                $scope.viewModel.filters.e = moment().format();
            }

        };

        $scope.apply = function (viewModelFilter) {
            setDates(viewModelFilter);
            $modalInstance.close(viewModelFilter);
        };

        function setDates(viewModelFilter) {
            //date converted to string to match the api
            if ($scope.fromAndToDateFlag) {
                viewModelFilter.fromdate = new Date(viewModelFilter.fromdate);
                viewModelFilter.todate = new Date(viewModelFilter.todate);

                viewModelFilter.fromdate = formTimestamp(viewModelFilter.fromdate, 'start');
                viewModelFilter.todate = formTimestamp(viewModelFilter.todate, 'end');
            } else {
                viewModelFilter.s = new Date(viewModelFilter.s);
                viewModelFilter.e = new Date(viewModelFilter.e);

                viewModelFilter.s = formTimestamp(viewModelFilter.s, 'start');
                viewModelFilter.e = formTimestamp(viewModelFilter.e, 'end');
            }

        }

        //form utc fn accepts two date objs (which are used to form utc)
        //one for picking up date and the other for picking up time
        function formTimestamp(d, str) {
            var timestamp, start, end;

            timestamp = moment(d).unix();
            if (str == 'start') {
                start = moment.unix(timestamp).format("MM/DD/YYYY hh:mm A");
                start = moment(start).add(0, 'days');
                timestamp = moment(start).unix();
            } else if (str == 'end') {
                end = moment.unix(timestamp).format("MM/DD/YYYY hh:mm A");
                end = moment(end).add(1, 'days');
                timestamp = moment(end).unix();
            }
            return timestamp;
        }

        /* // prepare dates before sending to API
         function setDates(event) {
             event.utcstart = new Date(event.utcstart);
             event.start = event.allday == '1' ? formTimestamp(event.utcstart, event.start, true) : formTimestamp(event.utcstart, event.start, false);
         }*/

        /*// prepare dates before sending to API
        function setDates(viewModelFilter) {

            if(angular.isDefined(params.filters.matterInTookByDateFlag)){
                viewModelFilter.fromdate = new Date(viewModelFilter.fromdate);
                viewModelFilter.fromdate = formTimestamp(viewModelFilter.fromdate, event.start);

                viewModelFilter.todate = new Date(viewModelFilter.todate);
                viewModelFilter.todate  = formTimestamp(viewModelFilter.todate, event.start);

            }else{
                viewModelFilter.s = new Date(viewModelFilter.s);
                viewModelFilter.s = formTimestamp(viewModelFilter.s, 'start');

                viewModelFilter.e = new Date(viewModelFilter.e);
                viewModelFilter.e  = formTimestamp(viewModelFilter.e, 'end');
            }
        };

        //form utc fn accepts two date objs (which are used to form utc)
        //one for picking up date and the other for picking up time
        function formTimestamp(d, str) {
            //time = 0;
            var timestamp;
            if(str=='start'){
                timestamp = moment(d).unix();
            }else if(str=='end'){

            }

            return timestamp;
        }*/

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }]);
