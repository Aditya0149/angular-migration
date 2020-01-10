(function () {
    'use strict';

    angular.module('cloudlex.matter')
        .directive('importantDatesTimeline', importantDatesTimeline);

    function importantDatesTimeline() {
        var directive = {
            restrict: 'E',
            template: templateFn,
            scope: {
                dates: '='
            },
            link: linkFn,
            controller: importantDatesTimelineCtrl,
            controllerAs: 'impDates',
            bindToController: true // because the scope is isolated
        };
        return directive;

        function linkFn(scope, el, attr) {

        }

        function templateFn() {
            var html = '';

            html += '<div data-ng-hide="impDates.dates">Loading...</div>';
            html += '<div class="timeline" data-ng-show="impDates.dates.length==0">No important dates are available!</div>';
            html += '<div class="timeline">';
            html += '   <div class="container-fluid">';
            html += '       <div class="flex-row important-dates">';
            html += '           <div class="flex-item" data-ng-click="impDates.comply(data)"';
            html += '               data-ng-repeat="data in impDates.dates"';
            html += '               popover="{{impDates.getPopOverTxt(data)}}"';
            html += '               popover-trigger="mouseenter"';
            html += '               popover-append-to-body="true"';
            html += '               popover-placement="top">';
            html += '               <div class="text-center">{{data.name | impDatesFilter}}</div>';
            html += '               <div class=" circle text-center" data-ng-class="{\'today\': data.isComply == 1, \'cursor-pointer\' : impDates.isEvent(data)}"><strong>{{data.utcstart|utcImpDateFilter:"DD":data.allday:"start"}}</strong></div>';
            html += '               <div class="text-center">{{data.utcstart|utcImpDateFilter:"MMM YYYY":data.allday:"start"}}</div>';
            html += '           </div>';
            html += '       </div>';
            html += '   </div>';
            html += '</div>';

            return html;
        }

    }


    importantDatesTimelineCtrl.$inject = ['impDatesHelper', 'notification-service', 'modalService', 'masterData'];

    function importantDatesTimelineCtrl(impDatesHelper, notificationService, modalService, masterData) {
        var self = this;
        var permissions = masterData.getPermissions();
        self.criticalDatesPermission = _.filter(permissions[0].permissions, function (per) {
            if (per.entity_id == '2') {
                return per;
            }
        });
        self.formatDate = function (utc, format) {
            return moment.unix(utc).format(format);
        }

        self.isEvent = function (data) {
            return utils.isNotEmptyVal(data.id);
        }

        self.getPopOverTxt = function (data) {
            var isEvent = utils.isNotEmptyVal(data.id);

            if (isEvent) {
                var isComply = parseInt(data.isComply);
                if (!isComply) {
                    return "click to comply";
                } else {
                    return "click to deselect";
                }
            }

            return data.name;
        };

        self.comply = function (event) {

            var isEvent = utils.isNotEmptyVal(event.id);
            if (self.criticalDatesPermission[0].E == 0 && (event.labelid == 1 || event.labelid == 6 || event.labelid == 15)) {
                notificationService.error('You are not authorized to edit critical events. ');
                return;
            }

            if (!isEvent) {
                return;
            }

            if (event.isComply == "0") {
                var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Comply',
                    headerText: 'Comply ?',
                    bodyText: 'Are you sure you want to comply ?'
                };
                var complyvalue = 1;
            } else if (event.isComply == "1") {
                var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Deselect',
                    headerText: 'Deselect ?',
                    bodyText: 'Are you sure you want to deselect this date ?'
                };
                var complyvalue = 0;
            }
            modalService.showModal({}, modalOptions).then(function () {
                var eventid = event.id;
                impDatesHelper.comply(eventid, complyvalue)
                    .then(function (response) {
                        _.forEach(self.dates, function (date) {
                            if (date.id === eventid) {
                                date.isComply = complyvalue;
                            }
                        })
                    }, function () {
                        notificationService.error('Unable to comply.')
                    })

            });

        };

        self.isToday = function (utc) {
            return (moment.unix(utc).format('DD/MM/YYYY') == moment(new Date()).format('DD/MM/YYYY'));
        };
    }


    angular
        .module('cloudlex.matter')
        .factory('impDatesHelper', impDatesHelper);

    impDatesHelper.$inject = ['$http', 'globalConstants'];

    function impDatesHelper($http, globalConstants) {
        var complyUrl = globalConstants.webServiceBase + 'lexviacalendar/comply/';

        return {
            comply: comply
        }

        function comply(eventid, value) {
            var url = complyUrl + eventid;
            return $http.put(url, {
                "is_complied": value
            })

        }
    }

})();

(function () {

    angular.module('cloudlex.matter')
        .filter('impDatesFilter', impDatesFilter);

    function impDatesFilter() {

        var impDates = [{
            title: 'date of incident',
            shortForm: 'DOI'
        }, {
            title: 'date of intake',
            shortForm: 'DOIn'
        }, {
            title: 'statute of limitations',
            shortForm: 'SOL'
        },
        {
            title: 'discovery end date',
            shortForm: 'DED'
        },
        {
            title: 'notice of claim filing deadline',
            shortForm: 'NOC'
        }, {
            title: 'note of issue',
            shortForm: 'NOI'
        }
        ];

        return function (item) {
            if (angular.isUndefined(item)) {
                return item;
            }
            return getShortForm(item);
        };

        function getShortForm(impDateTitle) {
            var checkString = impDateTitle.toLowerCase();
            var found = _.find(impDates, function (date) {
                return date.title === checkString
            });

            if (angular.isDefined(found)) {
                return found.shortForm;
            }
            return impDateTitle;
        }
    }

})();