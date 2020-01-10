'use strict';

angular.module('cloudlex.filters', ['cloudlex.global'])
    .filter('SentenseCase', function () {
        return function (item) {
            if (angular.isUndefined(item) || _.isNull(item)) {
                return '';
            }
            var temp_item = item.toLowerCase();
            return temp_item.charAt(0).toUpperCase() + temp_item.slice(1);
        }
    })
    .filter('filterByMultipleColumns', function () {
        function keyfind(f, obj) {
            if (obj === undefined)
                return -1;
            else {
                var sf = f.split(".");
                if (sf.length <= 1) {
                    return obj[sf[0]];
                } else {
                    var newobj = obj[sf[0]];
                    sf.splice(0, 1);
                    return keyfind(sf.join("."), newobj)
                }
            }

        }
        return function (input, clause, fields) {
            var out = [];
            if (clause && clause && clause.length > 0) {
                clause = String(clause).toLowerCase();
                angular.forEach(input, function (cp) {
                    for (var i = 0; i < fields.length; i++) {
                        var haystack = String(keyfind(fields[i], cp)).toLowerCase();
                        if (haystack.indexOf(clause) > -1) {
                            out.push(cp);
                            break;
                        }
                    }
                })
            } else {
                angular.forEach(input, function (cp) {
                    out.push(cp);
                })
            }
            return out;
        }

    })
    // FIlter to get total of a particular column from a list
    .filter('sumOfValue', function () {
        return function (data, key) {
            if (angular.isUndefined(data) || angular.isUndefined(key))
                return 0;
            var sum = 0;

            angular.forEach(data, function (v, k) {
                if (utils.isEmptyVal(v[key])) { v[key] = 0; }
                sum = sum + parseFloat(v[key]);
            });
            return sum;
        }
    }).filter('timeFormatFilter', function () {
        return function (item, format, isAllDay, startOrEnd) {
            if (utils.isEmptyVal(item)) {
                return "No data";
            }

            if (item.toString() === '0') {
                return '-';
            }

            if (utils.isNotEmptyVal(item)) {
                var todayFrom = moment(new Date()).startOf('day').unix();
                var todayTo = moment(new Date()).endOf('day').unix();
                var yesterdayFrom = moment(new Date()).subtract(1, 'days').startOf('day').unix();
                var yesterdayTo = moment(new Date()).subtract(1, 'days').endOf('day').unix();
                var intItem = parseInt(item);
                if (intItem >= todayFrom && intItem <= todayTo) {
                    return moment.unix(intItem).format('HH:mm A');
                }
                // else if (intItem >= yesterdayFrom && intItem <= yesterdayTo) {
                //     return "yesterday";
                // } 
                else {
                    return moment(moment.unix(intItem)).format("MM/DD/YYYY");
                }
            }
        }
    })
    .filter('capitalize', function () {
        return function (input) {
            return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
        }
    })
    .filter('decodeHtmlEncoding', function () {
        return function (item) {
            if (utils.isEmptyVal(item)) {
                return item;
            }

            var html = item;
            return utils.getTextFromHtml(html);
        }
    })
    .filter('showSafeHtml', ['$sce',
        function ($sce) {
            return function (val) {
                var text = utils.replaceHtmlEntites(val);
                text = text.replace(/&#(\d+);/g, function (match, dec) {
                    return String.fromCharCode(dec);
                });

                return $sce.trustAsHtml(text);
            };
        }
    ])
    .filter('unique', function () {
        // we will return a function which will take in a collection
        // and a keyname
        return function (collection, keyname) {
            // we define our output and keys array;
            var output = [],
                keys = [];

            // we utilize angular's foreach function
            // this takes in our original collection and an iterator function
            angular.forEach(collection, function (item) {
                // we check to see whether our object exists
                var key = item[keyname];
                // if it's not already part of our keys array
                if (keys.indexOf(key) === -1) {
                    // add it to our keys array
                    keys.push(key);
                    // push this item to our final output array
                    output.push(item);
                }
            });
            // return our array which should be devoid of
            // any duplicates
            return output;
        };
    })
    .filter('propsFilter', function () {
        return function (items, props) {
            var out = [];

            if (angular.isArray(items)) {
                items.forEach(function (item) {
                    var itemMatches = false;

                    var keys = Object.keys(props);
                    for (var i = 0; i < keys.length; i++) {
                        var prop = keys[i];
                        var text = props[prop].toLowerCase();
                        if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                            itemMatches = true;
                            break;
                        }
                    }

                    if (itemMatches) {
                        out.push(item);
                    }
                });
            } else {
                // Let the output be the input untouched
                out = items;
            }

            return out;
        };
    })
    .filter('replaceNonASCII', function () {
        return function (str) {
            if (str != null) {
                return str.replace(/[^\x00-\x7F]/g, "");
            }
        }
    })
    .filter('ellipsis', function () {

        return function (value, wordwise, max, tail) {
            if (!value) return '';

            max = parseInt(max, 10);
            if (!max) return value;
            if (value.length <= max) return value;

            value = value.substr(0, max);
            if (wordwise) {
                var lastspace = value.lastIndexOf(' ');
                if (lastspace != -1) {
                    value = value.substr(0, lastspace);
                }
            }

            return value + (tail || ' �');
        };
    })
    .filter("nrFormat", function () {
        return function (number) {
            var abs;
            if (number !== void 0) {
                abs = Math.abs(number);
                if (abs >= Math.pow(10, 12)) {
                    number = (number / Math.pow(10, 12)).toFixed(0) + "t";
                } else if (abs < Math.pow(10, 12) && abs >= Math.pow(10, 9)) {
                    number = (number / Math.pow(10, 9)).toFixed(0) + "b";
                } else if (abs < Math.pow(10, 9) && abs >= Math.pow(10, 6)) {
                    number = (number / Math.pow(10, 6)).toFixed(0) + "m";
                } else if (abs < Math.pow(10, 6) && abs >= Math.pow(10, 3)) {
                    number = (number / Math.pow(10, 3)).toFixed(0) + "k";
                }
                return number;
            }
        };
    })
    .filter('policylimitFilter', function ($filter) {
        return function (item) {
            if (utils.isNotEmptyVal(item)) {
                if (utils.isEmptyVal(item.policylimit) && utils.isEmptyVal(item.policylimit_max)) {
                    return ' ';
                } else {
                    var policylimit = utils.isEmptyVal(item.policylimit) ? "-" : $filter('currency')(item.policylimit, "$", 2);
                    var policylimit_max = utils.isEmptyVal(item.policylimit_max) ? "-" : $filter('currency')(item.policylimit_max, "$", 2);
                    return policylimit + '/' + policylimit_max;
                }
            } else {
                return ''
            }
        }
    })
    .filter('replaceByBlank', function () {
        return function (item) {
            if (utils.isEmptyVal(item)) {
                return '{Blank}';
            } else {
                return item;
            }
        }
    })
    // .filter('purger', function () {
    //     return function (input) {
    //         return input.replace(/[^\w\s]/gi, "");
    //     }
    // })
    .filter('emptyValDash', function () {
        return function (item, emptyVal) {
            var noDataMsg = utils.isEmptyVal(emptyVal) ? 'No data' : emptyVal;
            return utils.isEmptyVal(item) ? noDataMsg : item;
        }
    })
    .filter('emptyZeroReplace', function ($filter) {
        return function (item) {
            if (item == -1) {
                return $filter('currency')(0);
            } else {
                return utils.isEmptyVal(item) ? 0 : item;
            }
        }
    })
    .filter('emptyValDashReplace', function () {
        return function (item) {
            return utils.isEmptyVal(item) ? '-' : item;
        }
    })
    .filter('notEmptyString', function () {
        return function (item, input) {
            return (item == null || item == "null" || item == "") ? input : item;
        }
    })
    .filter('replaceBrTag', function () {
        return function (item) {
            if (item == null) return item;
            item = item.replace(/<br\/>/g, ' ');
            return item;
        }
    })

    // US#3119- filter for replace value for 0 ...start  
    .filter('replaceText', function () {
        return function (item) {
            if (item == 0) {
                return 'Event Day'
            } else if (item == 365) {
                return ' 1 Year'
            } else if (item == 730) {
                return ' 2 Years'
            } else {
                return item;
            }

        }
    })
    //---end 
    // US#5209- filter for replace value for 0 ...start  
    .filter('replaceTextTask', function () {
        return function (item) {
            return item == 0 ? item = 'Due Day' : item;
        }
    })
    //---end 

    .filter('utcDateFilter', function () {

        return function (item, format, isAllDay, startOrEnd) {

            if (utils.isEmptyVal(item)) {
                return "";
            }

            if (item.toString() === '0') {
                return '-';
            }

            if (utils.isEmptyVal(isAllDay)) {
                return moment.unix(item).format(format);
            }

            var isAllDayDate = ((isAllDay === true) || (isAllDay === '1') || isAllDay === 1);
            if (!isAllDayDate) {
                return moment.unix(item).format(format);
            }

            if (isAllDayDate && utils.isEmptyVal(startOrEnd)) {
                var date = _getUtcMoment(item);
                date = moment(date.valueOf()).unix();
                return moment.unix(date).format(format);
            }

            var fulldayTime = _setFulldayTime(item, startOrEnd);
            var date = moment.unix(fulldayTime).format(format);
            return date;

            function _setFulldayTime(timestamp, setTimeFor) {
                var date = _getUtcMoment(timestamp);
                var isCorrectFullDayTime;
                var time = _getTimeString(date);
                isCorrectFullDayTime = _isTimeValid(time, setTimeFor);
                date = isCorrectFullDayTime ? date : moment.unix(timestamp);
                return moment(date.valueOf()).unix();
            }

            function _isValidFullDayDate(timestamp, dateFor) {
                var date = _getUtcMoment(timestamp);
                var time = _getTimeString(date);
                return _isTimeValid(time, dateFor);
            }

            function _getUtcMoment(timestamp) {
                var format = 'ddd MMM DD YYYY HH:mm:ss';
                var date = moment.unix(timestamp);
                date = date.utc().format(format);
                date = moment(date, format);
                return date;
            }

            function _getTimeString(date) {
                return utils.prependZero(date.hour()) + ':' + utils.prependZero(date.minute()) + ':' + utils.prependZero(date.second());
            }

            function _isTimeValid(time, timeFor) {
                switch (timeFor) {
                    case 'start':
                        return time === '00:00:00';
                    case 'end':
                        return time === '23:59:59';
                }
            }
        }
    })


    //Added a new filter to format matter dates in UTC format, this filter will be removed in next sprint
    .filter('utcImpDateFilter', function name() {
        return function (item, format, isAllDay, startOrEnd) {

            if (utils.isEmptyVal(item)) {
                return "";
            }

            if (item.toString() === '0') {
                return '-';
            }

            if (utils.isEmptyVal(isAllDay)) {
                return moment.unix(item).utc().format(format);
            }

            var isAllDayDate = ((isAllDay === true) || (isAllDay === '1') || isAllDay === 1);
            if (!isAllDayDate) {
                return moment.unix(item).utc().format(format);
            }

            if (isAllDayDate && utils.isEmptyVal(startOrEnd)) {
                var date = _getUtcMoment(item);
                date = moment(date.valueOf()).unix();
                return moment.unix(date).utc().format(format);
            }

            var fulldayTime = _setFulldayTime(item, startOrEnd);
            var date = moment.unix(fulldayTime).format(format);
            return date;

            function _setFulldayTime(timestamp, setTimeFor) {
                var date = _getUtcMoment(timestamp);
                var isCorrectFullDayTime;
                var time = _getTimeString(date);
                isCorrectFullDayTime = _isTimeValid(time, setTimeFor);
                date = isCorrectFullDayTime ? date : moment.unix(timestamp);
                return moment(date.valueOf()).unix();
            }

            function _isValidFullDayDate(timestamp, dateFor) {
                var date = _getUtcMoment(timestamp);
                var time = _getTimeString(date);
                return _isTimeValid(time, dateFor);
            }

            function _getUtcMoment(timestamp) {
                var format = 'ddd MMM DD YYYY HH:mm:ss';
                var date = moment.unix(timestamp);
                date = date.utc().format(format);
                date = moment(date, format);
                return date;
            }

            function _getTimeString(date) {
                return utils.prependZero(date.hour()) + ':' + utils.prependZero(date.minute()) + ':' + utils.prependZero(date.second());
            }

            function _isTimeValid(time, timeFor) {
                switch (timeFor) {
                    case 'start':
                        return time === '00:00:00';
                    case 'end':
                        return time === '23:59:59';
                }
            }
        }
    })

    //Ends here

    .filter('dateStringFilter', function () {

        return function (item, format) {
            if (angular.isUndefined(item)) {
                return "no data available";
            }
            return moment(item).format(format)
        }

    })
    .filter('LablYesNo', function () {
        var LabelObj = [{
            value: 1,
            label: 'Yes'
        }, {
            value: 2,
            label: 'No'
        }];
        return function (item, param) {
            switch (item) {
                case '2':
                    {
                        return param === 'yesNo' ? 'No' : 'False';
                        break;
                    };
                case '1':
                    {
                        return param === 'yesNo' ? 'Yes' : 'True'
                    }

            }

        }
    })
    .filter('yesNo', function () {
        var LabelObj = [{
            value: 1,
            label: 'Yes'
        }, {
            value: 2,
            label: 'No'
        }];
        return function (item) {

            if (utils.isEmptyVal(item)) {
                return ' - ';
            }

            if (item.toUpperCase() === 'YES' || item === true || item === 'true' || parseInt(item) === 1) {
                return "Yes";
            }

            if (item.toUpperCase() === 'NO' || item === false || item === 'false' || parseInt(item) === 0) {
                return "No"
            }
            console.error('Invalid value for yes/no filter. Boolean value expected.');
            return item;
        }
    })
    .filter('yesNo1', function () {
        var LabelObj = [{
            value: 1,
            label: 'Yes'
        }, {
            value: 2,
            label: 'No'
        }];
        return function (item) {

            if (utils.isEmptyVal(item) || item == null) {
                return ' - ';
            }

            if (item === true || item === 'true' || parseInt(item) === 1) {
                return "Yes";
            }

            if (item === false || item === 'false' || parseInt(item) === 0) {
                return "No"
            }
            console.error('Invalid value for yes/no filter. Boolean value expected.');
            return item;
        }
    })

    //US 4553 - Filter for changing value with 0 & 1 with Yes & No 
    //For existing Users value Null Its also replace with No... Start 
    .filter('userMgmtYesNo', function () {
        var LabelObj = [{
            value: 1,
            label: 'Yes'
        }, {
            value: 2,
            label: 'No'
        }];
        return function (item) {

            if (utils.isEmptyVal(item)) {
                return "No";
            }

            if (item.toUpperCase() === 'YES' || item === true || item === 'true' || parseInt(item) === 1) {
                return "Yes";
            }

            if (item.toUpperCase() === 'NO' || item === false || item === 'false' || parseInt(item) === 0) {
                return "No"
            }
            console.error('Invalid value for yes/no filter. Boolean value expected.');
            return item;
        }
    })
    //... End 
    .filter('priorityFilter', function () {
        var priority = [{
            value: 'high',
            short: 'P1'
        }, {
            value: 'normal',
            short: 'P2'
        }, {
            value: 'low',
            short: 'P3'
        }];

        return function (item) {
            if (angular.isUndefined(item)) {
                return "";
            }
            var currPriority = _.find(priority, function (p) {
                return p.value === item.toLowerCase()
            });
            return currPriority.short;
        }

    })
    .filter('replaceByDash', function () {
        return function (item) {
            if (angular.isUndefined(item)) {
                return " - ";
            }
            if (_.isNull(item) || utils.isEmptyString(item)) {
                return " - ";
            }
            return item;
        }
    })
    .filter('removeNbsp', function () {
        return function (item) {
            return utils.isEmptyVal(item) ? item : item.replace(/[&]nbsp[;]/gi, " ");;
        };
    })
    .filter('replaceTagsBy', function () {
        return function (item, replaceBy) {
            var toBeReplacedBy = utils.isEmptyVal(replaceBy) ? " " : replaceBy;
            return utils.isEmptyVal(item) ? item : item.replace(/<\/?[^>]+>/gi, toBeReplacedBy);
        };
    })
    .filter('unsafe', ['$sce',
        function ($sce) {
            return function (val) {
                return $sce.trustAsHtml(val);
            };
        }
    ])
    .directive('scrollNewToBottom', function ($timeout, $window) {
        return {
            scope: {
                scrollNewToBottom: "="
            },
            restrict: 'A',
            link: function (scope, element, attr) {
                scope.$watchCollection('scrollNewToBottom', function (newVal) {
                    if (newVal) {
                        $timeout(function () {
                            element[0].scrollTop = element[0].scrollHeight;
                        }, 0);
                    }
                });
            }
        };
    })
    .directive('stripExtendedAscii', function () {
        return {
            link: linkfn,
            require: 'ngModel'
        };

        function linkfn(scope, el, attr, ngModel) {
            ngModel.$parsers.push(function (viewVal) {
                if (utils.isEmptyVal(viewVal)) { return; }
                var ascii = /^[ -~]+$/;
                if (!ascii.test(viewVal)) {
                    var strippedValue = viewVal.replace(/[^\x00-\x7F]/g, "");
                    ngModel.$setViewValue(strippedValue);
                    ngModel.$render();
                    return strippedValue;
                } else {
                    return viewVal;
                }
            });
        }
    })
    .filter('usphoneNumberFormat', function () {
        return function (num) {
            if (!num) { return num; }
            num = num.replace(/[^0-9]/g, '');
            var number = String(num);

            // Will return formattedNumber. 
            // If phonenumber isn't longer than an area code, just show number
            var formattedNumber = number;

            // if the first character is '1', strip it out and add it back
            //var c = (number[0] == '1') ? '1 ' : '';
            //number = number[0] == '1' ? number.slice(1) : number;

            // # (###) ###-#### as c (area) front-end
            var area = number.substring(0, 3);
            var front = number.substring(3, 6);
            var end = number.substring(6, 10);

            if (front) {
                //formattedNumber = (c + "(" + area + ") " + front);	
                formattedNumber = ("(" + area + ") " + front);
            }
            if (end) {
                formattedNumber += ("-" + end);
            }
            return formattedNumber;
        }
    })
    .filter('noteCategoryFilter', function () {
        return function (category) {
            return utils.isNotEmptyVal(category) ? category : "Note";
        }
    })
    .directive("maxDigits", [function () { /*directive for Restrict input to max Limit*/
        return {
            restrict: "A",
            link: function (scope, elem, attrs) {
                var limit = parseInt(attrs.maxDigits);
                angular.element(elem).on("keypress", function (e) {
                    var decimalArray = this.value.split('.');
                    var decimalLength = utils.isNotEmptyVal(decimalArray[1]) ? decimalArray[1].length : 0;
                    if ((decimalArray[0].length + decimalLength) == limit) {
                        e.preventDefault();
                    }
                });
            }
        }
    }])
    .directive('inputEmpty', function () {
        return {
            restrict: 'A',
            link: function link(scope, element, attributes) {
                setTimeout(function () { //wait for DOM to load
                    var inputs = element.find('input');
                    inputs.val('');

                    scope.$watch(attributes.inputEmpty, function (val) {
                        if (!val) { inputs.val(''); }
                    });
                });
            }
        };
    })
    .directive('positionCenter', ['$timeout',
        function ($timeout) {
            return {
                restrict: 'A',
                link: function (scope, el, attr) {

                    // if (angular.isDefined(attr.delayrender)) {
                    //     el.addClass('ng-hide');
                    //     $timeout(function () {
                    //         el.removeClass('ng-hide');
                    //         position();
                    //     }, 1000)
                    // } else {
                    //     position();
                    // }

                    function position() {
                        var offsetw = el[0].offsetWidth;
                        el[0].style.left = '50%';
                        el[0].style.marginLeft = -(offsetw / 2) + 'px';
                    }
                }
            }

        }
    ])
    .directive('requires', ['$parse',
        function ($parse) {
            return {
                restrict: 'A',
                require: "ngModel",
                link: function (scope, el, attr, ngModel) {
                    ngModel.$validators.requires = function (modelVal) {
                        //make the field dirty
                        ngModel.$setDirty();

                        if (utils.isEmptyVal(modelVal)) {
                            return true;
                        }

                        var requiresVal = $parse(attr.requires)(scope);
                        return utils.isNotEmptyVal(requiresVal);
                    }
                }
            }
        }
    ])
    .directive('script', function () {
        return {
            restrict: 'E',
            scope: false,
            link: function (scope, elem, attr) {
                if (attr.type === 'text/javascript-lazy') {
                    var s = document.createElement("script");
                    s.type = "text/javascript";
                    var src = elem.attr('src');
                    if (src !== undefined) {
                        s.src = src;
                    } else {
                        var code = elem.text();
                        s.text = code;
                    }
                    document.head.appendChild(s);
                    elem.remove();
                }
            }
        };
    })
    .directive('openDoc', ['documentsDataService', 'notification-service',
        function (documentsDataService, notificationService) {
            return {
                restrict: 'E',
                template: '<a ng-click="openDoc.getDocument()"><span ng-class="openDoc.iconClass" tooltip="View Document" tooltip-append-to-body="true" tooltip-placement="right">&nbsp;</span></a>',
                replace: true,
                scope: {
                    docId: '@',
                    matterId: '@',
                    searchDoc: '@',
                    someCallFunc: '&callFunc',
                    callSearchtext: '@'
                },
                controllerAs: 'openDoc',
                bindToController: true,
                controller: ['$state', 'globalConstants',
                    function ($state, globalConstants) {
                        var vm = this;
                        vm.getDocument = getDocument;

                        //set icon

                        vm.iconClass = 'sprite ' + (utils.isNotEmptyVal(vm.matterId) ? 'default-linked-document' : 'default-view-document-big');


                        function getDocument() {
                            var documents = JSON.parse(vm.docId);
                            //Bug#7196 : searched document should get view
                            var search = angular.isDefined(vm.searchDoc) ? JSON.parse(vm.searchDoc) : '';
                            if (utils.isNotEmptyVal(vm.callSearchtext) && vm.someCallFunc()) {
                                var documentSearch = _.filter(search, function (data) {
                                    return data.islocked == 0;
                                });
                                documents = documentSearch;
                                if (documents.length == 0) {
                                    notificationService.error('Please select document(s) to download');
                                    return;
                                }
                            }
                            var docarray = _.pluck(documents, 'doc_id');
                            // check download limit...
                            // if (docarray.length > globalConstants.documentLimit) {
                            //     notificationService.warning('Maximum ' + globalConstants.documentLimit + ' documents are allowed to view!');
                            //     return;
                            // }

                            _.forEach(docarray, function (documentid) {
                                if (utils.isNotEmptyVal(vm.matterId)) {
                                    $state.go('document-view', {
                                        matterId: vm.matterId,
                                        documentId: documentid
                                    });
                                } else {
                                    documentsDataService.viewdocument(documentid)
                                        .then(function (response) {
                                            window.open(response, '_blank');
                                        }, function () {
                                            notificationService.error('Could not download');
                                        });
                                }
                            });

                        }

                    }
                ]
            };

        }
    ])
    .directive('openDocIntake', ['inatkeDocumentsDataService', 'notification-service',
        function (inatkeDocumentsDataService, notificationService) {
            return {
                restrict: 'E',
                template: '<a ng-click="openDoc.getDocument()"><span ng-class="openDoc.iconClass" tooltip="View Document" tooltip-append-to-body="true" tooltip-placement="right">&nbsp;</span></a>',
                replace: true,
                scope: {
                    docId: '@',
                    matterId: '@',
                    searchDoc: '@',
                    someCallFunc: '&callFunc',
                    callSearchtext: '@'
                },
                controllerAs: 'openDoc',
                bindToController: true,
                controller: ['$state', 'globalConstants',
                    function ($state, globalConstants) {
                        var vm = this;
                        vm.getDocument = getDocument;

                        //set icon

                        vm.iconClass = 'sprite ' + (utils.isNotEmptyVal(vm.matterId) ? 'default-linked-document' : 'default-view-document-big');


                        function getDocument() {
                            var documents = JSON.parse(vm.docId);
                            //Bug#7196 : searched document should get view
                            var search = angular.isDefined(vm.searchDoc) ? JSON.parse(vm.searchDoc) : '';
                            if (utils.isNotEmptyVal(vm.callSearchtext) && vm.someCallFunc()) {
                                var documentSearch = _.filter(search, function (data) {
                                    return data.islocked == 0;
                                });
                                documents = documentSearch;
                                if (documents.length == 0) {
                                    notificationService.error('Please select document(s) to download');
                                    return;
                                }
                            }
                            var docarray = _.pluck(documents, 'intake_document_id');
                            // check download limit...
                            // if (docarray.length > globalConstants.documentLimit) {
                            //     notificationService.warning('Maximum ' + globalConstants.documentLimit + ' documents are allowed to view!');
                            //     return;
                            // }

                            _.forEach(docarray, function (documentid) {
                                if (utils.isNotEmptyVal(vm.matterId)) {
                                    $state.go('document-view', {
                                        matterId: vm.matterId,
                                        documentId: documentid
                                    });
                                } else {
                                    inatkeDocumentsDataService.viewdocument(documentid)
                                        .then(function (response) {
                                            window.open(response, '_blank');
                                        }, function () {
                                            notificationService.error('Could not download');
                                        });
                                }
                            });

                        }

                    }
                ]
            };

        }
    ])
    .directive('enterSubmit', function () {
        return {
            restrict: 'A',
            link: function (scope, elem, attrs) {
                elem.bind('keydown', function (event) {
                    var code = event.keyCode || event.which;
                    if (code === 13) {
                        if (!event.shiftKey) {
                            event.preventDefault();
                            scope.$apply(attrs.enterSubmit);
                        }
                    }
                });
            }
        }
    })
    .directive('utcManager', function () {
        return {
            restrict: 'A',
            link: linkFn,
            require: 'ngModel'
        };

        function linkFn(scope, el, attr, ngModel) {
            ngModel.$parsers.push(function (viewVal) {
                //if view val is empty string or undefined return the view val as is
                if (utils.isEmptyVal(viewVal)) {
                    return viewVal;
                }

                var date = viewVal;
                var d = new Date(viewVal);
                var now = new Date();
                //add current time to the date
                d = new Date(d.getFullYear(), d.getMonth(), d.getDate(), now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
                //convert the date to utc date
                d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()));
                //get timestamp for utc date
                var timestamp = d.getTime();
                //return unix timestamp of the utc date 
                return moment(timestamp).unix();
            });

            ngModel.$formatters.push(function (modelVal) {
                //if model val is empty string or undefined return the model val as is
                if (utils.isEmptyVal(modelVal) || parseInt(modelVal) === 0) {
                    return "";
                }

                var viewFormat = attr.viewFormat || "MM-DD-YYYY hh:mm:ss A";
                var isFullDay = attr.fullDayDate;

                return isFullDay == 1 ? moment.unix(modelVal).utc().format(viewFormat) : moment.unix(modelVal).format(viewFormat);
            });
        }
    })

    .directive('validateDate', function () {
        return {
            restrict: 'A',
            link: linkFn,
            require: 'ngModel'
        };

        function linkFn(scope, ele, attrs, ctrl) {

            function validate(viewValue) {
                //var dateformate = /^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/;
                var errordiv = attrs.errorDiv;
                var datediv = "#" + attrs.id;
                var allFutureDates = attrs.allowfuturedate;
                var datestring = $(datediv).val();
                var futuredateCheckdiv = (datediv == '#DobDatediv') ? true : (datediv == '#DoDDatediv') ? true : (datediv == '#defDoBDatediv') ? true : false;
                if (!futuredateCheckdiv && allFutureDates && (allFutureDates == "n" || allFutureDates == "N")) {
                    futuredateCheckdiv = true;
                }
                //to allow only digits
                $(datediv).keypress(function (e) {
                    var a = [];
                    var k = e.which;

                    for (var i = 48; i < 58; i++) {
                        a.push(i);
                    }

                    var datestr = $(datediv).val();
                    if (!(a.indexOf(k) >= 0) || datestr.length >= 10) {
                        e.preventDefault();
                    }
                });


                if (utils.isEmptyVal(viewValue)) {
                    $(errordiv).parent().parent().children().eq(2).css("display", "none");
                    return;
                } else if (isNaN(datestring)) {
                    $(datediv).val(datestring);
                    datestring = putslashestoDate(datestring, datediv);
                    showError(datestring, errordiv);
                    if (futuredateCheckdiv && $(errordiv).parent().parent().children().eq(2).css("display") == 'none') {
                        checkFuturedate(datestring, errordiv);
                    }

                } else {
                    datestring = putslashestoDate(datestring, datediv);
                    showError(datestring, errordiv);
                    if (futuredateCheckdiv && $(errordiv).parent().parent().children().eq(2).css("display") == 'none') {
                        checkFuturedate(datestring, errordiv);
                    }
                }

            };

            function showError(datestring, errordiv) {
                if (moment(datestring, "MM/DD/YYYY", true).isValid()) {
                    var datearray = datestring.split('/');
                    if (parseInt(datearray[1]) > 31 || parseInt(datearray[2]) > 2050 || parseInt(datearray[2]) < 1902) {
                        $(errordiv).parent().parent().children().eq(2).css("display", "block");
                    } else {
                        $(errordiv).parent().parent().children().eq(2).css("display", "none");
                    }
                } else {
                    $(errordiv).parent().parent().children().eq(2).css("display", "block");
                }
            }

            function checkFuturedate(datestring, errordiv) {
                var dt = new Date(datestring);
                var date = moment(dt).utc();
                var today = moment(new Date).utc();
                if (date.isAfter(today)) {
                    $(errordiv).parent().parent().children().eq(2).css("display", "block");
                } else {
                    $(errordiv).parent().parent().children().eq(2).css("display", "none");
                }
            }

            function putslashestoDate(datestring, datediv) {
                if (datestring.length == 2 || datestring.length == 5) {
                    $(datediv).val(datestring + '/');
                    return $(datediv).val();
                } else if (datestring.length >= 10) {
                    $(datediv).val(datestring.substr(0, 10));
                    return $(datediv).val();
                } else {
                    return $(datediv).val();
                }
            }



            // Watch the value to compare - trigger validate()
            scope.$watch(attrs.ngModel, function () {
                validate(ctrl.$viewValue);
            });

            ctrl.$parsers.unshift(function (value) {
                validate(value);
                return value;
            })

        }
    })

    .directive('datepickerLocaldate', ['$parse',
        function ($parse) {
            var directive = {
                restrict: 'A',
                require: ['ngModel'],
                link: link
            };
            return directive;

            function link(scope, element, attr, ctrls) {
                var ngModelController = ctrls[0];

                // called with a JavaScript Date object when picked from the datepicker
                ngModelController.$parsers.push(function (viewValue) {
                    // undo the timezone adjustment we did during the formatting
                    viewValue.setMinutes(viewValue.getMinutes() - viewValue.getTimezoneOffset());
                    // we just want a local date in ISO format
                    return viewValue.toISOString().substring(0, 10);
                });

                // called with a 'yyyy-mm-dd' string to format
                ngModelController.$formatters.push(function (modelValue) {
                    if (!modelValue) {
                        return undefined;
                    }
                    // date constructor will apply timezone deviations from UTC (i.e. if locale is behind UTC 'dt' will be one day behind)
                    var dt = new Date(modelValue);
                    // 'undo' the timezone offset again (so we end up on the original date again)
                    dt.setMinutes(dt.getMinutes() + dt.getTimezoneOffset());
                    return dt;
                });
            }
        }
    ])
    .directive('clxBtnGroup', function () {

        //here we are using angular ui bootstrap buttons (https://angular-ui.github.io/bootstrap/)
        //to have the selected button highligted we need to have the label and the btn-radio to have the same value
        //hence an internal model is maintained and an external model is updated when the internal model changes

        return {
            restrict: "E",
            link: linkFn,
            scope: {
                value: '=',
                btnList: '=', // array of {value:"",label:""} objects
                btnClick: '&',
                btnSmall: '='
            },
            templateUrl: "app/utils/custom-templates/btnGrp-template.html",
            controllerAs: 'btnGrp',
            bindToController: true,
            controller: controller
        };

        function linkFn(scope, el, attr) {

        }

        controller.$inject = ['$scope'];

        function controller($scope) {
            var vm = this;

            //look out for preselected value
            $scope.$watch(function () {
                return vm.value;
            }, function (newVal) {
                if (utils.isNotEmptyVal(newVal)) {
                    //find from the list the preselected value
                    var selectedObj = _.find(vm.btnList, function (btn) {
                        return _.isEqual(newVal, btn.value);
                    });
                    //set internal model
                    //assigin the label to the internal model
                    if (utils.isNotEmptyVal(selectedObj)) {
                        vm.internalModel = selectedObj.label;
                    }
                    //call the click fn when the model changes
                    if (utils.isNotEmptyVal(vm.btnClick())) {
                        vm.btnClick()(vm.value);
                    }
                } else {
                    vm.internalModel = "";
                }
            });

            //watch for change in internal model and set the external(page model) model value
            $scope.$watch(function () {
                return vm.internalModel
            }, function (newVal, oldVal) {
                //find from the list obj having selected label
                var selectedObj = _.find(vm.btnList, function (btn) {
                    return _.isEqual(btn.label, newVal);
                });
                //if found set the value of the selected label to the external(page model) model
                if (utils.isNotEmptyVal(selectedObj)) {
                    vm.value = selectedObj.value;
                }
            });

            //watch for change in the list and update the labels
            $scope.$watch(function () {
                return vm.btnList;
            }, function (newList) {
                if (utils.isNotEmptyVal(vm.value)) {
                    var selectedObj = _.find(newList, function (data) {
                        return data.value === vm.value;
                    });
                    if (utils.isNotEmptyVal(selectedObj)) {
                        vm.internalModel = selectedObj.label;
                    }
                }
            });
        }

        function templateFn() {
            var html = '';
            html += '<div class="btn-group btn-group-flex">';
            html += '<label data-ng-repeat="data in btnGrp.btnList"';
            html += ' ng-model="btnGrp.internalModel" class="btn btn-default" btn-radio="\'{{data.label}}\'">{{data.label}}</label>';
            html += '</div>';
            return html;
        }

    })

    .directive('bottomNavBar', function () {
        return {
            restrict: "E",
            link: linkFn,
            template: templateFn,
            //controllerAs: 'btnGrp',
            //bindToController: true,
            controller: controller
        };

        function linkFn(scope, el, attr) {

        }

        controller.$inject = ['$state'];

        function templateFn() {
            var html = '';
            html += '<footer position-center>';
            html += '<ul>'
            html += '<li><a href="#/matter-overview/{{matterDetail.matterId}}">Overview</a>';
            html += '</li>';
            html += '</ul>';
            html += '</footer>';
            return html;
        }

        function controller($state) {
        }
    })

    .directive('format', ['$filter',
        function ($filter) {
            return {
                require: '?ngModel',
                link: function (scope, elem, attrs, ctrl) {
                    if (!ctrl) return;

                    //ctrl.$formatters.unshift(function (a) {
                    //    return $filter(attrs.format)(ctrl.$modelValue)
                    //});

                    //ctrl.$parsers.unshift(function (viewValue) {
                    //    var plainNumber = viewValue.replace(/[^\d|\-+|\.+]/g, '');
                    //    elem.val($filter(attrs.format)(plainNumber));
                    //    return plainNumber;
                    //});

                    ctrl.$parsers.push(function (val) {
                        if (angular.isUndefined(val)) {
                            var val = '';
                        }

                        var clean = val.replace(/[^-0-9\.]/g, '');
                        var negativeCheck = clean.split('-');
                        var decimalCheck = clean.split('.');
                        if (!angular.isUndefined(negativeCheck[1])) {
                            negativeCheck[1] = negativeCheck[1].slice(0, negativeCheck[1].length);
                            clean = negativeCheck[0] + '-' + negativeCheck[1];
                            if (negativeCheck[0].length > 0) {
                                clean = negativeCheck[0];
                            }
                        }

                        if (!angular.isUndefined(decimalCheck[1])) {
                            decimalCheck[1] = decimalCheck[1].slice(0, 2);
                            clean = decimalCheck[0] + '.' + decimalCheck[1];
                        }

                        if (val !== clean) {
                            ctrl.$setViewValue(clean);
                            ctrl.$render();
                        }
                        return clean;
                    });
                }
            };
        }
    ])
    .directive('allowOnlyNumbers', function () {
        return {
            restrict: 'A',
            link: function (scope, elm, attrs, ctrl) {
                elm.on('keydown', function (event) {
                    var $input = $(this);
                    var value = $input.val();
                    value = value.replace(/[^0-9]/g, '')
                    $input.val(value);
                    if (event.which == 64 || event.which == 16) {
                        // to allow numbers  
                        return false;
                    } else if (event.which >= 48 && event.which <= 57) {
                        // to allow numbers  
                        return true;
                    } else if (event.which >= 96 && event.which <= 105) {
                        // to allow numpad number  
                        return true;
                    } else if ([8, 13, 27, 37, 38, 39, 40].indexOf(event.which) > -1) {
                        // to allow backspace, enter, escape, arrows  
                        return true;
                    } else {
                        event.preventDefault();
                        // to stop others  
                        //alert("Sorry Only Numbers Allowed");  
                        return false;
                    }
                });
            }
        }
    })
    .directive("percent", function ($filter, $locale, $window) {

        var stringToNumber = function (value) {
            if (!_.isNaN(parseFloat(value)) && angular.isNumber(parseFloat(value))) {
                value = value.replace(/[^\d|\.]/g, '');

                var newCleanVal = value;
                var decimalCheck = value.split('.');
                if (decimalCheck[0] && decimalCheck[0].length > 2) {
                    if (decimalCheck[0] == 100) { } else {
                        if (decimalCheck[0] % 100 > 0) {


                            var maxLength = decimalCheck[0].match(/\d{0,2}/g, "");
                            decimalCheck[0] = maxLength[0];
                        }
                    }
                    newCleanVal = decimalCheck[0];
                }

                if (decimalCheck[1] && decimalCheck[1].length > 2) {
                    var maxDecimalLength = decimalCheck[1].match(/\d{0,2}/g, "");
                    decimalCheck[1] = maxDecimalLength[0];
                    newCleanVal = decimalCheck[0] + '.' + decimalCheck[1];
                }
                if (decimalCheck.length > 2) {
                    newCleanVal = decimalCheck[0] + '.' + decimalCheck[1];
                }

                if (decimalCheck[0] % 100 == 0 && decimalCheck[0] != 0) {
                    newCleanVal = "100";
                }
                return newCleanVal;
            } else {
                return '';
            }
        }

        return {
            require: 'ngModel',
            link: function (scope, ele, attr, ctrl) {
                ctrl.$parsers.unshift(function (viewValue) {
                    if (viewValue == '') {
                        return "";
                    }
                    var value = stringToNumber(viewValue);
                    if (utils.isEmptyString(value)) {
                        ctrl.$setViewValue("");
                        ctrl.$render();
                        return "";
                    }
                    ctrl.$setViewValue(value);
                    ctrl.$render();
                    return value; // / 100;

                });
                ctrl.$formatters.unshift(function (modelValue) {
                    if (angular.isDefined(modelValue) && !utils.isEmptyString(modelValue)) {
                        var newVal = $filter('number')(modelValue, 2)
                        //ctrl.$setViewValue(newVal);
                        //ctrl.$render();
                        return newVal;
                    }
                });
                ele.on('blur', function () {
                    if (angular.isDefined(ctrl.$modelValue)) {
                        var newVal = !_.isNaN(ctrl.$modelValue) && _.isNumber(ctrl.$modelValue) ? $filter('number')(ctrl.$modelValue * 100, 2) : "";
                        //ele.val(newVal);
                        if (utils.isEmptyString(ctrl.$modelValue)) {
                            ele.val();
                        } else {
                            ele.val($filter('number')(ctrl.$modelValue, 2));
                        }

                        //ele.val($filter('number')(ctrl.$modelValue * 100, 3) + ' %');
                    }
                });
            }
        };
    })
    .directive("percentSixDecimal", function ($filter, $locale, $window) {

        var stringToNumber = function (value) {
            if (!_.isNaN(parseFloat(value)) && angular.isNumber(parseFloat(value))) {
                value = value.replace(/[^\d|\.]/g, '');

                var newCleanVal = value;
                var decimalCheck = value.split('.');
                if (decimalCheck[0] && decimalCheck[0].length > 2) {
                    if (decimalCheck[0] == 100) { } else {
                        if (decimalCheck[0] % 100 > 0) {


                            var maxLength = decimalCheck[0].match(/\d{0,2}/g, "");
                            decimalCheck[0] = maxLength[0];
                        }
                    }
                    newCleanVal = decimalCheck[0];
                }

                if (decimalCheck[1] && decimalCheck[1].length > 6) {
                    var maxDecimalLength = decimalCheck[1].match(/\d{0,6}/g, "");
                    decimalCheck[1] = maxDecimalLength[0];
                    newCleanVal = decimalCheck[0] + '.' + decimalCheck[1];
                }
                if (decimalCheck.length > 2) {
                    newCleanVal = decimalCheck[0] + '.' + decimalCheck[1];
                }

                if (decimalCheck[0] % 100 == 0 && decimalCheck[0] != 0) {
                    newCleanVal = "100";
                }
                return newCleanVal;
            } else {
                return '';
            }
        }

        return {
            require: 'ngModel',
            link: function (scope, ele, attr, ctrl) {
                ctrl.$parsers.unshift(function (viewValue) {
                    if (viewValue == '') {
                        return "";
                    }
                    var value = stringToNumber(viewValue);
                    if (utils.isEmptyString(value)) {
                        ctrl.$setViewValue("");
                        ctrl.$render();
                        return "";
                    }
                    ctrl.$setViewValue(value);
                    ctrl.$render();
                    return value; // / 100;

                });
                ctrl.$formatters.unshift(function (modelValue) {
                    if (angular.isDefined(modelValue) && !utils.isEmptyString(modelValue)) {
                        var newVal = $filter('number')(modelValue, 6)
                        //ctrl.$setViewValue(newVal);
                        //ctrl.$render();
                        return newVal;
                    }
                });
                ele.on('blur', function () {
                    if (angular.isDefined(ctrl.$modelValue)) {
                        var newVal = !_.isNaN(ctrl.$modelValue) && _.isNumber(ctrl.$modelValue) ? $filter('number')(ctrl.$modelValue * 100, 2) : "";
                        //ele.val(newVal);
                        if (utils.isEmptyString(ctrl.$modelValue)) {
                            ele.val();
                        } else {
                            ele.val($filter('number')(ctrl.$modelValue, 6));
                        }

                        //ele.val($filter('number')(ctrl.$modelValue * 100, 3) + ' %');
                    }
                });
            }
        };
    })
    .directive('customCurrencyFilter', ['$filter',
        function ($filter) {
            return {
                require: '?ngModel',
                link: function (scope, elem, attrs, ctrl) {

                    if (!ctrl) return;

                    elem.on("keyup", function () {
                        var val = elem.val();
                        val = val.replace(/[^-0-9\.]/g, '');
                        parserfn(val);
                    });

                    ctrl.$formatters.push(function (val) {

                        if (angular.isUndefined(val)) {
                            var val = '';
                        }
                        var val = String(val);
                        var clean = val.replace(/[^-0-9\.]/g, '');
                        var negativeCheck = clean.split('-');
                        var decimalCheck = clean.split('.');


                        if (angular.isUndefined(negativeCheck[1])) {
                            if (decimalCheck[0].length > 14) {
                                var maxLength = decimalCheck[0].match(/\d{0,14}/g, "");
                                decimalCheck[0] = maxLength[0];
                                clean = maxLength[0];
                            }
                        }

                        if (!angular.isUndefined(negativeCheck[1])) {
                            negativeCheck[1] = negativeCheck[1].slice(0, negativeCheck[1].length);
                            clean = negativeCheck[0] + '-' + negativeCheck[1];
                            if (negativeCheck[0].length > 0) {
                                // clean = negativeCheck[0];
                                if (decimalCheck[0].length > 14) {
                                    var maxLength = decimalCheck[0].match(/\d{0,14}/g, "");
                                    decimalCheck[0] = maxLength[0];
                                    clean = negativeCheck[0] + maxLength[0];
                                } else {
                                    clean = negativeCheck[0];
                                }
                            }
                        }

                        if (!angular.isUndefined(decimalCheck[1])) {
                            decimalCheck[1] = decimalCheck[1].slice(0, 2);
                            clean = decimalCheck[0] + '.' + decimalCheck[1];
                            // val = clean;
                        }


                        var n = clean.toString(),
                            p = n.indexOf('.');
                        clean = n.replace(/\d(?=(?:\d{3})+(?:\.|$))/g, function ($0, i) {
                            return p < 0 || i < p ? ($0 + ',') : $0;
                        });

                        if (val !== clean) {
                            // to set model value
                            ctrl.$setViewValue(clean);
                            ctrl.$render();
                        }
                        // to set view value
                        return clean;
                    });

                    ctrl.$parsers.push(parserfn);

                    function parserfn(val) {
                        var clean = checkValue(val);
                        if (val !== clean) {
                            // to set view value
                            ctrl.$setViewValue(clean);
                            ctrl.$render();
                        } else {
                            // to set view value
                            ctrl.$setViewValue(clean);
                            ctrl.$render();
                        }
                        // to set model value
                        val = clean.replace(/[^-0-9\.]/g, '');
                        return val;
                    }

                    function checkValue(val) {
                        if (angular.isUndefined(val)) {
                            var val = '';
                        }

                        var val = String(val);
                        if (val.length > 1) {
                            if (val.charAt(0) == 0) {
                                if (val.charAt(1) != '.') {
                                    val = val.replace(/^0+/, '');
                                } else {
                                    val = val;
                                }
                            }
                        }

                        var clean = val.replace(/[^-0-9\.]/g, '');
                        var negativeCheck = clean.split('-');
                        var decimalCheck = clean.split('.');

                        if (angular.isUndefined(negativeCheck[1])) {
                            if (decimalCheck[0].length > 14) {
                                var maxLength = decimalCheck[0].match(/\d{0,14}/g, "");
                                decimalCheck[0] = maxLength[0];
                                clean = maxLength[0];
                            }
                        }

                        if (!angular.isUndefined(negativeCheck[1])) {
                            negativeCheck[1] = negativeCheck[1].slice(0, negativeCheck[1].length);
                            var negativeCheckArr = negativeCheck[1].match(/\d{0,14}/g, "");
                            clean = negativeCheck[0] + '-' + negativeCheckArr[0];
                            if (negativeCheck[0].length > 0) {
                                // clean = negativeCheck[0];
                                if (decimalCheck[0].length > 14) {
                                    var maxLength = decimalCheck[0].match(/\d{0,14}/g, "");
                                    decimalCheck[0] = maxLength[0];
                                    clean = negativeCheck[0] + maxLength[0];
                                } else {
                                    clean = negativeCheck[0];
                                }
                            }
                        }

                        if (!angular.isUndefined(decimalCheck[1])) {
                            if (decimalCheck[0] == "") { decimalCheck[0] = "0"; }
                            if (decimalCheck[0].length <= 12) {
                                decimalCheck[1] = decimalCheck[1].slice(0, 2);
                                clean = decimalCheck[0] + '.' + decimalCheck[1];
                            } else if (decimalCheck[0].length == 13) {
                                if (decimalCheck[0].indexOf('-') !== -1) {
                                    decimalCheck[1] = decimalCheck[1].slice(0, 2);
                                } else {
                                    decimalCheck[1] = decimalCheck[1].slice(0, 1);
                                }
                                clean = decimalCheck[0] + '.' + decimalCheck[1];
                            } else {
                                clean = decimalCheck[0]
                            }
                        }


                        var n = clean.toString(),
                            p = n.indexOf('.');
                        clean = n.replace(/\d(?=(?:\d{3})+(?:\.|$))/g, function ($0, i) {
                            return p < 0 || i < p ? ($0 + ',') : $0;
                        });
                        return clean;
                    }

                }
            };
        }
    ])

    .directive('customCurrencyFilterIntake', ['$filter',
        function ($filter) {
            return {
                require: '?ngModel',
                link: function (scope, elem, attrs, ctrl) {

                    if (!ctrl) return;

                    elem.on("keyup", function () {
                        var val = elem.val();
                        val = val.replace(/[^-0-9\.]/g, '');
                        parserfn(val);
                    });

                    ctrl.$formatters.push(function (val) {

                        if (angular.isUndefined(val)) {
                            var val = '';
                        }
                        var val = String(val);
                        var clean = val.replace(/[^-0-9\.]/g, '');
                        var negativeCheck = clean.split('-');
                        var decimalCheck = clean.split('.');


                        if (angular.isUndefined(negativeCheck[1])) {
                            if (decimalCheck[0].length > 11) {
                                var maxLength = decimalCheck[0].match(/\d{0,11}/g, "");
                                decimalCheck[0] = maxLength[0];
                                clean = maxLength[0];
                            }
                        }

                        if (!angular.isUndefined(negativeCheck[1])) {
                            negativeCheck[1] = negativeCheck[1].slice(0, negativeCheck[1].length);
                            clean = negativeCheck[0] + '-' + negativeCheck[1];
                            if (negativeCheck[0].length > 0) {
                                // clean = negativeCheck[0];
                                if (decimalCheck[0].length > 14) {
                                    var maxLength = decimalCheck[0].match(/\d{0,11}/g, "");
                                    decimalCheck[0] = maxLength[0];
                                    clean = negativeCheck[0] + maxLength[0];
                                } else {
                                    clean = negativeCheck[0];
                                }
                            }
                        }

                        if (!angular.isUndefined(decimalCheck[1])) {
                            decimalCheck[1] = decimalCheck[1].slice(0, 2);
                            clean = decimalCheck[0] + '.' + decimalCheck[1];
                            // val = clean;
                        }


                        var n = clean.toString(),
                            p = n.indexOf('.');
                        clean = n.replace(/\d(?=(?:\d{3})+(?:\.|$))/g, function ($0, i) {
                            return p < 0 || i < p ? ($0 + ',') : $0;
                        });

                        if (val !== clean) {
                            // to set model value
                            ctrl.$setViewValue(clean);
                            //ctrl.$viewValue = clean;
                            ctrl.$render();
                        }
                        // to set view value
                        return clean;
                    });

                    ctrl.$parsers.push(parserfn);

                    function parserfn(val) {
                        var clean = checkValue(val);
                        if (val !== clean) {
                            // to set view value
                            ctrl.$setViewValue(clean);
                            //ctrl.$viewValue = clean;
                            ctrl.$render();
                        } else {
                            // to set view value
                            ctrl.$setViewValue(clean);
                            //ctrl.$viewValue = clean;
                            ctrl.$render();
                        }
                        // to set model value
                        val = clean.replace(/[^-0-9\.]/g, '');
                        return val;
                    }

                    function checkValue(val) {
                        if (angular.isUndefined(val)) {
                            var val = '';
                        }

                        var val = String(val);
                        if (val.length > 1) {
                            if (val.charAt(0) == 0) {
                                if (val.charAt(1) != '.') {
                                    val = val.replace(/^0+/, '');
                                } else {
                                    val = val;
                                }
                            }
                        }

                        var clean = val.replace(/[^-0-9\.]/g, '');
                        var negativeCheck = clean.split('-');
                        var decimalCheck = clean.split('.');

                        if (angular.isUndefined(negativeCheck[1])) {
                            if (decimalCheck[0].length > 11) {
                                var maxLength = decimalCheck[0].match(/\d{0,11}/g, "");
                                decimalCheck[0] = maxLength[0];
                                clean = maxLength[0];
                            }
                        }

                        if (!angular.isUndefined(negativeCheck[1])) {
                            negativeCheck[1] = negativeCheck[1].slice(0, negativeCheck[1].length);
                            var negativeCheckArr = negativeCheck[1].match(/\d{0,11}/g, "");
                            clean = negativeCheck[0] + '-' + negativeCheckArr[0];
                            if (negativeCheck[0].length > 0) {
                                // clean = negativeCheck[0];
                                if (decimalCheck[0].length > 11) {
                                    var maxLength = decimalCheck[0].match(/\d{0,11}/g, "");
                                    decimalCheck[0] = maxLength[0];
                                    clean = negativeCheck[0] + maxLength[0];
                                } else {
                                    clean = negativeCheck[0];
                                }
                            }
                        }

                        if (!angular.isUndefined(decimalCheck[1])) {
                            if (decimalCheck[0] == "") { decimalCheck[0] = "0"; }
                            if (decimalCheck[0].length <= 11) {
                                decimalCheck[1] = decimalCheck[1].slice(0, 2);
                                clean = decimalCheck[0] + '.' + decimalCheck[1];
                            } else if (decimalCheck[0].length == 11) {
                                if (decimalCheck[0].indexOf('-') !== -1) {
                                    decimalCheck[1] = decimalCheck[1].slice(0, 2);
                                } else {
                                    decimalCheck[1] = decimalCheck[1].slice(0, 1);
                                }
                                clean = decimalCheck[0] + '.' + decimalCheck[1];
                            } else {
                                clean = decimalCheck[0]
                            }
                        }


                        var n = clean.toString(),
                            p = n.indexOf('.');
                        clean = n.replace(/\d(?=(?:\d{3})+(?:\.|$))/g, function ($0, i) {
                            return p < 0 || i < p ? ($0 + ',') : $0;
                        });
                        return clean;
                    }

                }
            };
        }
    ])

    .directive('focusMe', ['$timeout', '$parse',
        function ($timeout, $parse) {
            return {
                link: function (scope, element, attrs) {
                    var model = $parse(attrs.focusMe);
                    scope.$watch(model, function (value) {
                        if (value === true) {
                            $timeout(function () {
                                element[0].focus();
                            });
                        }
                    });
                    // to address @blesh's comment, set attribute value to 'false'
                    // on blur event:
                    element.bind('blur', function () {
                        if (element[0].value == "") {
                            //scope.$apply(model.assign(scope, false));
                        }
                    });
                }
            };
        }
    ])
    .directive('numericOnly', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, modelCtrl) {

                modelCtrl.$parsers.push(function (inputValue) {
                    var transformedInput = inputValue ? inputValue.replace(/[^\d.-]/g, '') : null;

                    if (transformedInput != inputValue) {
                        modelCtrl.$setViewValue(transformedInput);
                        modelCtrl.$render();
                    }

                    return transformedInput;
                });
            }
        };
    })
    .directive('reportNav', ['$timeout', '$parse', '$rootScope', '$window', '$document',
        function ($timeout, $parse, $rootScope, $window, $document) {
            return {
                link: function (scope, element, attr) {
                    // if mouse is in between 0-200 co-ordinate
                    $document.bind('mousemove', function (event) {
                        if ($('#sidebartoggler').is(':checked')) {
                            if (event.pageX < $('.accordion-height-adjust').width()) {
                                element.prop('checked', 'checked');
                                scope.$apply(function () { scope.master = true; });
                                return false;
                            } else {
                                element.prop('checked', false);
                                //timeout to allow the menu to close and then change the tooltip
                                $timeout(function () {
                                    scope.$apply(function () { scope.master = false; });
                                }, 300);
                            }
                        }
                    });

                    // On click any sidemenu link close the sidemenu
                    $('body').on("click", '.sidebar .panel-body a', function () {
                        angular.element(document.querySelector('#sidebartoggler')).prop('checked', false);
                        $timeout(function () {
                            scope.$apply(function () { scope.master = false; });
                        }, 300);
                    });

                    // on click hamburger and if the menu is open then close it and restore vertical scroll
                    // on click the checkbox immediately becomes checked and open menu
                    // sothe if becomes true, clicking again does it reverse
                    $('body').on("click", '#sidebartoggler', function () {
                        if ($('#sidebartoggler').is(':checked')) {
                            element.prop('checked', true);
                        } else {
                            element.prop('checked', false);
                        }
                    });

                    // Auto close sidemenu if user looses the focus on it
                    $('.accordion-height-adjust').off('mouseleave'); //remove multiple attachments
                    function mouseMove() {
                        element.prop('checked', false);
                        scope.$apply(function () { scope.master = true; });
                    }
                }
            }
        }
    ])
    .directive('calWidth',
        function () {
            return {
                link: function (scope, element, attr) {
                    var contentWidth;
                    var isSidepanelOpen = $('#nav').attr('data-panel-state');

                    if (!isSidepanelOpen || isSidepanelOpen == "false") { //if the sidepanel is not open
                        if (document.getElementsByClassName('page-content').length != 0) { // it could be either report grid or non-report grid; if it is non-report
                            contentWidth = document.getElementsByClassName('page-content'); //width of the parent
                            var perColumn = Math.floor(contentWidth[0].clientWidth) / 100;
                        } else { // if it is report grid
                            contentWidth = $('#report-content'); //width of the parent
                            var perColumn = (contentWidth.width()) / 100; // unit value
                        }
                    } else {
                        contentWidth = $('.content-class-popup'); //width of the parent
                        var perColumn = (contentWidth.width()) / 100; // unit value
                    }

                    var calculatedWidth = 0;
                    calculatedWidth = attr.width * perColumn + 'px;';
                    $(element).attr("style", "max-width:" + calculatedWidth + "min-width:" + calculatedWidth + "width:" + calculatedWidth);

                }
            }
        }
    )

    .directive('gridSizeUpdated', ['$rootScope',
        function ($rootScope) {
            return {
                link: function (scope, element, attr) {
                    $rootScope.responsiveGrid = responsiveGrid;
                    //check if the last element of the grid is rendered
                    if ((scope.$last === true)) {
                        setTimeout(function () {
                            if ($("footer").length > 0 && scope.$index > 6) {
                                $(".report-responsive").css({ "padding-bottom": "65px" });
                            }
                            responsiveGrid();
                        }, 1);

                    } else { }
                    // Resize window- re-render grid
                    window.onresize = function () {
                        responsiveGrid()
                    };

                    // Set width for header cells and body cells
                    function responsiveGrid() {
                        $('.report-responsive').css('visibility', 'hidden');
                        $('.report-responsive').css('visibility', 'visible').animate({
                            opacity: 1
                        }, 'slow');
                    }

                    //side panel
                    var sidepanelscroll = function () {
                        var totalHeight = 0;
                        $("#globalNote").children().each(function () {
                            totalHeight = totalHeight + $(this).outerHeight(true);
                        });

                        $("#workflowTemplate").children().each(function () {
                            totalHeight = totalHeight + $(this).outerHeight(true);
                        });

                        if ($("#globalFilterFlag").find('ul li').length > 0) {
                            totalHeight = (totalHeight != 0) ? totalHeight + 70 : totalHeight;
                        } else if ($("#workflowTemplate").find('ul li').length > 0) {
                            totalHeight = (totalHeight != 0) ? totalHeight + 17 : totalHeight;
                        } else {
                            totalHeight = (totalHeight != 0) ? totalHeight + 60 : totalHeight;
                        }
                        var noteFilterFlag = $("#note-filter-flag").hasClass('ng-hide');
                        var noteFilterScrollPos = (noteFilterFlag) ? 300 : 150;
                        if ($('.panel-content-overflow').scrollTop() >= noteFilterScrollPos) {
                            $('.content-class-popup .report-responsive .header-row').css('position', 'fixed'); // stick
                            $('.content-class-popup #globalNote').css('position', 'fixed'); // stick
                            $('.content-class-popup .report-responsive .header-row').css('top', totalHeight + 12 + "px");
                            $('.content-class-popup #globalNote').css('top', '83px');
                            $('.content-class-popup #dailyMailFlag').find('.header-row').css('top', '83px');
                            $('.content-class-popup .report-responsive .header-row').css('right', '47px');
                            $('.content-class-popup #globalNote').css('right', '32px');
                            $('.content-class-popup .report-responsive .header-row').css('z-index', '99');
                            $('.content-class-popup #globalNote').css('z-index', '999');
                            $('.content-class-popup #globalNote').css('width', '80.2%');
                            $('.content-class-popup #globalNote').css('background-color', '#e9eef0');

                            /* Start: Sticky Scroll for Workflow */
                            $('.content-class-popup #workflow-header-icon').css('position', 'fixed');
                            $('.content-class-popup #workflow-header-icon').css('padding', '5px');
                            $('.content-class-popup #workflow-header-icon').css('width', '80%');
                            $('.content-class-popup #workflow-header-icon').css('z-index', '9999');
                            $('.content-class-popup #workflow-header-icon').css('background-color', '#e9eef0');
                            $('.content-class-popup #workflow-header-icon').css('top', '83px');
                            $('.content-class-popup #workflow-header-row').css('top', '127px');
                            $('.content-class-popup #workflow-header-row').css('z-index', '999');
                            /* End: Sticky Scroll for Workflow */
                            responsiveGrid();
                        } else {
                            $('.report-responsive .header-row').css('position', 'static'); // sticky not required
                            $('#globalNote').css('position', 'static'); // sticky not required
                            $('.content-class-popup #globalNote').css('width', '100%');
                            $('.content-class-popup #globalNote').css('background-color', '');
                            /* Start: Sticky Scroll for Workflow */
                            $('.content-class-popup #workflow-header-icon').css('position', 'static');
                            $('.content-class-popup #workflow-header-icon').css('padding', '0px');
                            $('.content-class-popup #workflow-header-icon').css('width', '100%');
                            $('.content-class-popup #workflow-header-icon').css('background-color', '#e9eef0');
                            $('.content-class-popup #workflow-header-row').css('top', '127px');
                            /* End: Sticky Scroll for Workflow */
                        }
                    }

                    var myEfficientFn = function () {
                        var totalHeight = 0;
                        $(".gridSec").children().each(function () {
                            totalHeight = totalHeight + $(this).outerHeight(true);
                        });
                        totalHeight = (totalHeight != 0) ? totalHeight + 15 : totalHeight;
                        var matterNoteFilterHeightFlag = 0;
                        if ($("#matterNoteFilter").find('ul li').length > 0) {
                            matterNoteFilterHeightFlag = $("#matterNoteFilter").height();
                        }
                        var OSName = "";
                        if (navigator.appVersion.indexOf("Mac") != -1) {
                            OSName = "MacOS";
                        };

                        var isChrome = !!window.chrome;
                        var isMacChrome = false;
                        if (OSName == "MacOS" && isChrome == true) {
                            isMacChrome = true;
                        } else {
                            isMacChrome = false;
                        }
                        if ((!isMacChrome && $("#report-content").offset().top < -250 || (isMacChrome && window.pageYOffset > 200 + matterNoteFilterHeightFlag))) {
                            if ($('#sidebartoggler').is(':checked')) { //check if sidebar is open
                                $('.report-responsive .header-row').css('left', '19.66666667%'); // if open apply this value
                                $('.gridSec').css('left', '19.66666667%'); // if open apply this value

                            } else {
                                $('.report-responsive .header-row').css('left', '35px'); // else this
                                $('.report-responsive .header-row').css('top', '-100px');
                                $('.report-responsive .header-row').css('top', '120px');
                                $('.gridSec').css('top', '-100px');
                            }
                            $('.report-responsive .header-row').css('position', 'fixed'); // stick
                            $('.gridSec').css('position', 'fixed');
                            $('.fixed-grid-report').css('position', 'fixed');
                            $('.report-responsive .cust-header-otherparty').css('position', 'static'); // stick
                            $('.fixed-grid-report').css('width', '92.5%');
                            $('.report-responsive .header-row').css('top', totalHeight + "px");
                            $('#all-matter .header-row').css('top', $('.fixed-grid-report').height() + "px");
                            $('.report-responsive .cust-header-doc').css('top', (totalHeight - 5) + "px");
                            $('#dirV .header-row').css('top', (totalHeight - 5) + "px");
                            $('.all-matter-list .header-row').css('top', (totalHeight - 5) + "px");
                            //all-matter-list
                            $('.gridSec').css('top', '0');
                            $('.fixed-grid-report').css('top', '0');
                            $('.gridSec, .paddingRLR').css('background-color', 'white');
                            $('.gridSec').css('width', '91.8%');
                            $('.gridSec').css('padding', '10px 0');
                            $(".matterGridSecStyle").css('width', '93.5%');
                            $(".matterGridSecStyle").css('padding-right', '10px');
                            $("#refGridStyle").css('width', '98.5%');
                            $(".archiveGridSecStyle").css('width', '98.5%');
                            $('.report-responsive .archival-header .cell').css('height', "76px");
                            $("#documentListStyle").css('width', '93%');
                            $("#contactListStyle").css('width', '93%');
                            $('.report-responsive .header-row').css('z-index', '99');
                            $('.gridSec').css('z-index', '998');
                            $('.report-responsive .header-row').css('width', $('.page-content').width()); //assign width of parent to header
                            $('.gridSec').css('width', $('.page-content').width()); //assign width of parent to header

                        } else {
                            $('.report-responsive .header-row').css('position', 'static'); // sticky not required
                            $('.gridSec').css('position', 'static');
                            //$('.report-responsive .header-row').css('transition', '0.5s all');
                            //$('.gridSec').css('transition', '0.5s all');
                            $('.report-responsive .header-row').css('top', '-100px');
                            $('.gridSec').css('top', '-100px');
                            $('.gridSec').css('width', '100%');

                            $('.fixed-grid-report').css('position', 'static');
                            $('.fixed-grid-report').css('width', '100%');

                        }
                    };

                    var setGrid = function () {
                        var totalHeight = 0;
                        $(".gridSec").children().each(function () {
                            totalHeight = totalHeight + $(this).outerHeight(true);
                        });
                        totalHeight = (totalHeight != 0) ? totalHeight + 15 : totalHeight;
                        var matterNoteFilterHeightFlag = 0;
                        if ($("#matterNoteFilter").find('ul li').length > 0) {
                            matterNoteFilterHeightFlag = $("#matterNoteFilter").height();
                        }
                        if ($("#report-content").offset().top < -250) {
                            if ($('#sidebartoggler').is(':checked')) { //check if sidebar is open
                                $('.report-responsive .header-row').css('left', '19.66666667%'); // if open apply this value
                                $('.gridSec').css('left', '19.66666667%'); // if open apply this value

                            } else {
                                $('.report-responsive .header-row').css('left', '35px'); // else this
                                //$('.gridSec').css('left', '12px'); // else this
                                //$('.report-responsive .header-row').css('transition', '0.5s all');
                                //$('.gridSec').css('transition', '0.5s all');
                                $('.report-responsive .header-row').css('top', '-100px');
                                $('.gridSec').css('top', '-100px');
                            }
                            $('.report-responsive .header-row').css('position', 'fixed'); // stick
                            $('.gridSec').css('position', 'fixed');
                            //$('.report-responsive .header-row').css('transition', '0.5s all');
                            //$('.gridSec').css('transition', '0.5s all');

                            $('.report-responsive .header-row').css('top', (totalHeight - 5) + "px");
                            //$('#dirV .header-row').css('top', (totalHeight - 5) + "px");
                            //$('.all-matter-list .header-row').css('top', (totalHeight - 5) + "px");
                            //all-matter-list
                            $('.gridSec').css('top', '0');
                            $('.gridSec, .paddingRLR').css('background-color', 'white');
                            $('.gridSec').css('width', '91.8%');
                            $('.gridSec').css('padding', '10px 0');
                            $(".matterGridSecStyle").css('width', '93.5%');
                            $(".matterGridSecStyle").css('padding-right', '10px');
                            $("#documentListStyle").css('width', '93%');
                            $("#contactListStyle").css('width', '93%');
                            $('.report-responsive .header-row').css('z-index', '99');
                            $('.gridSec').css('z-index', '998');
                            $('.report-responsive .header-row').css('width', $('.page-content').width()); //assign width of parent to header
                            $('.gridSec').css('width', $('.page-content').width()); //assign width of parent to header

                        } else {
                            $('.report-responsive .header-row').css('position', 'static'); // sticky not required
                            $('.gridSec').css('position', 'static');
                            $('.fixed-grid-report').css('position', 'static');
                            $('.fixed-grid-report').css('width', '100%');
                            $('.report-responsive .header-row').css('top', '-100px');
                            $('.gridSec').css('top', '-100px');
                            $('.gridSec').css('width', '100%');
                        }
                    };

                    // Sticky header
                    $(window).scroll(_.debounce(function () {
                        if (attr.noSticky) { } else {
                            $rootScope.onIntake ? setGrid() : myEfficientFn();
                        }
                    }, 100));

                    $('.panel-content-overflow').scroll(_.debounce(function () {
                        sidepanelscroll();
                    }, 100));

                    $('.page-content').css('width', '97%'); //onload make grid full

                }
            }
        }
    ])
    .directive('gridSize', ['$rootScope',
        function ($rootScope) {
            return {
                link: function (scope, element, attr) {
                    $rootScope.responsiveGrid = responsiveGrid;
                    //check if the last element of the grid is rendered
                    if ((scope.$last === true)) {
                        setTimeout(function () {
                            if ($("footer").length > 0 && scope.$index > 6) {
                                if (!attr.noPaddingForReportResponsive) {
                                    $(".report-responsive").css({ "padding-bottom": "65px" });
                                }
                            }
                            responsiveGrid();
                        }, 1);

                    }

                    // Resize window- re-render grid
                    window.onresize = function () {
                        responsiveGrid()
                    };


                    // Set width for header cells and body cells
                    function responsiveGrid() {
                        $('.report-responsive').css('visibility', 'hidden');

                        var contentWidth;
                        var isSidepanelOpen = $('#nav').attr('data-panel-state');

                        if (!isSidepanelOpen || isSidepanelOpen == "false") { //if the sidepanel is not open
                            if (document.getElementsByClassName('page-content').length != 0) { // it could be either report grid or non-report grid; if it is non-report
                                contentWidth = document.getElementsByClassName('page-content'); //width of the parent
                                var perColumn = Math.floor(contentWidth[0].clientWidth) / 100;
                                var headerCells = document.querySelectorAll('.page-content .report-responsive .header-row div.cell');
                                var bodyCells = document.querySelectorAll('.page-content .report-responsive .body-row > div.cell');
                            } else { // if it is report grid
                                contentWidth = $('#report-content'); //width of the parent
                                var perColumn = (contentWidth.width()) / 100; // unit value
                                var headerCells = document.querySelectorAll('#report-content .report-responsive .header-row div.cell');
                                var bodyCells = document.querySelectorAll('#report-content .report-responsive .body-row > div.cell');
                            }
                        } else {
                            contentWidth = $('.content-class-popup'); //width of the parent
                            var perColumn = (contentWidth.width()) / 100; // unit value
                            var headerCells = document.querySelectorAll('.content-class-popup .report-responsive .header-row div.cell');
                            var bodyCells = document.querySelectorAll('.content-class-popup .report-responsive .body-row > div.cell');
                        }
                        var calculatedWidth = 0;
                        _.forEach(headerCells, function (header) {
                            calculatedWidth = header.getAttribute('data-width') * perColumn + 'px;';
                            $(header).attr("style", "max-width:" + calculatedWidth + "min-width:" + calculatedWidth + "width:" + calculatedWidth);
                        });

                        calculatedWidth = 0;
                        _.forEach(bodyCells, function (body) {
                            calculatedWidth = body.getAttribute('data-width') * perColumn + 'px;';
                            $(body).attr("style", "max-width:" + calculatedWidth + "min-width:" + calculatedWidth + "width:" + calculatedWidth);
                        });


                        $('.report-responsive').css('visibility', 'visible').animate({
                            opacity: 1
                        }, 'slow');

                    }

                    //side panel
                    var sidepanelscroll = function () {
                        var totalHeight = 0;
                        $("#globalNote").children().each(function () {
                            totalHeight = totalHeight + $(this).outerHeight(true);
                        });

                        $("#workflowTemplate").children().each(function () {
                            totalHeight = totalHeight + $(this).outerHeight(true);
                        });

                        if ($("#globalFilterFlag").find('ul li').length > 0) {
                            totalHeight = (totalHeight != 0) ? totalHeight + 70 : totalHeight;
                        } else if ($("#workflowTemplate").find('ul li').length > 0) {
                            totalHeight = (totalHeight != 0) ? totalHeight + 17 : totalHeight;
                        } else {
                            totalHeight = (totalHeight != 0) ? totalHeight + 60 : totalHeight;
                        }
                        var noteFilterFlag = $("#note-filter-flag").hasClass('ng-hide');
                        var noteFilterScrollPos = (noteFilterFlag) ? 300 : 150;
                        if ($('.panel-content-overflow').scrollTop() >= noteFilterScrollPos) {
                            $('.content-class-popup .report-responsive .header-row').css('position', 'fixed'); // stick
                            $('.content-class-popup #globalNote').css('position', 'fixed'); // stick
                            $('.content-class-popup .report-responsive .header-row').css('top', totalHeight + 12 + "px");
                            $('.content-class-popup #globalNote').css('top', '83px');
                            $('.content-class-popup #dailyMailFlag').find('.header-row').css('top', '83px');
                            $('.content-class-popup .report-responsive .header-row').css('right', '47px');
                            $('.content-class-popup #globalNote').css('right', '32px');
                            $('.content-class-popup .report-responsive .header-row').css('z-index', '99');
                            $('.content-class-popup #globalNote').css('z-index', '999');
                            $('.content-class-popup #globalNote').css('width', '80.2%');
                            $('.content-class-popup #globalNote').css('background-color', '#e9eef0');

                            /* Start: Sticky Scroll for Workflow */
                            $('.content-class-popup #workflow-header-icon').css('position', 'fixed');
                            $('.content-class-popup #workflow-header-icon').css('padding', '5px');
                            $('.content-class-popup #workflow-header-icon').css('width', '80%');
                            $('.content-class-popup #workflow-header-icon').css('z-index', '9999');
                            $('.content-class-popup #workflow-header-icon').css('background-color', '#e9eef0');
                            $('.content-class-popup #workflow-header-icon').css('top', '83px');
                            $('.content-class-popup #workflow-header-row').css('top', '127px');
                            $('.content-class-popup #workflow-header-row').css('z-index', '999');
                            /* End: Sticky Scroll for Workflow */
                            responsiveGrid();
                        } else {
                            $('.report-responsive .header-row').css('position', 'static'); // sticky not required
                            $('#globalNote').css('position', 'static'); // sticky not required
                            $('.content-class-popup #globalNote').css('width', '100%');
                            $('.content-class-popup #globalNote').css('background-color', '');

                            /* Start: Sticky Scroll for Workflow */
                            $('.content-class-popup #workflow-header-icon').css('position', 'static');
                            $('.content-class-popup #workflow-header-icon').css('padding', '0px');
                            $('.content-class-popup #workflow-header-icon').css('width', '100%');
                            $('.content-class-popup #workflow-header-icon').css('background-color', '#e9eef0');
                            $('.content-class-popup #workflow-header-row').css('top', '127px');
                            /* End: Sticky Scroll for Workflow */

                        }
                    }

                    var myEfficientFn = function () {
                        var totalHeight = 0;
                        $(".gridSec").children().each(function () {
                            totalHeight = totalHeight + $(this).outerHeight(true);
                        });
                        totalHeight = (totalHeight != 0) ? totalHeight + 15 : totalHeight;
                        var matterNoteFilterHeightFlag = 0;
                        if ($("#matterNoteFilter").find('ul li').length > 0) {
                            matterNoteFilterHeightFlag = $("#matterNoteFilter").height();
                        }
                        var OSName = "";
                        if (navigator.appVersion.indexOf("Mac") != -1) {
                            OSName = "MacOS";
                        };

                        var isChrome = !!window.chrome;
                        var isMacChrome = false;
                        if (OSName == "MacOS" && isChrome == true) {
                            isMacChrome = true;
                        } else {
                            isMacChrome = false;
                        }
                        if ((!isMacChrome && $("#report-content") && $("#report-content").offset() && $("#report-content").offset().top < -250 || (isMacChrome && window.pageYOffset > 200 + matterNoteFilterHeightFlag))) {
                            if ($('#sidebartoggler').is(':checked')) { //check if sidebar is open
                                $('.report-responsive .header-row').css('left', '19.66666667%'); // if open apply this value
                                $('.gridSec').css('left', '19.66666667%'); // if open apply this value

                            } else {
                                $('.report-responsive .header-row').css('left', '35px'); // else this
                                $('.report-responsive .header-row').css('top', '-100px');
                                $('.report-responsive .header-row').css('top', '120px');
                                $('.gridSec').css('top', '-100px');
                            }
                            $('.report-responsive .header-row').css('position', 'fixed'); // stick
                            $('.gridSec').css('position', 'fixed');
                            $('.fixed-grid-report').css('position', 'fixed');
                            $('.report-responsive .cust-header-otherparty').css('position', 'static'); // stick
                            $('.fixed-grid-report').css('width', '92.5%');
                            $('.report-responsive .header-row').css('top', totalHeight + "px");
                            $('#all-matter .header-row').css('top', $('.fixed-grid-report').height() + "px");
                            $('.report-responsive .cust-header-doc').css('top', (totalHeight - 5) + "px");
                            $('#dirV .header-row').css('top', (totalHeight - 5) + "px");
                            $('.all-matter-list .header-row').css('top', (totalHeight - 5) + "px");
                            //all-matter-list
                            $('.gridSec').css('top', '0');
                            $('.fixed-grid-report').css('top', '0');
                            $('.gridSec, .paddingRLR').css('background-color', 'white');
                            $('.gridSec').css('width', '91.8%');
                            $('.gridSec').css('padding', '10px 0');
                            $(".matterGridSecStyle").css('width', '93.5%');
                            $(".matterGridSecStyle").css('padding-right', '10px');
                            $("#refGridStyle").css('width', '98.5%');
                            $(".archiveGridSecStyle").css('width', '98.5%');
                            $('.report-responsive .archival-header .cell').css('height', "76px");
                            $("#documentListStyle").css('width', '93%');
                            $("#contactListStyle").css('width', '93%');
                            $('.report-responsive .header-row').css('z-index', '99');
                            $('.gridSec').css('z-index', '998');
                            $('.report-responsive .header-row').css('width', $('.page-content').width()); //assign width of parent to header
                            $('.gridSec').css('width', $('.page-content').width()); //assign width of parent to header

                        } else {
                            $('.report-responsive .header-row').css('position', 'static'); // sticky not required
                            $('.gridSec').css('position', 'static');
                            //$('.report-responsive .header-row').css('transition', '0.5s all');
                            //$('.gridSec').css('transition', '0.5s all');
                            $('.report-responsive .header-row').css('top', '-100px');
                            $('.gridSec').css('top', '-100px');
                            $('.gridSec').css('width', '100%');

                            $('.fixed-grid-report').css('position', 'static');
                            $('.fixed-grid-report').css('width', '100%');

                        }
                    };

                    var setGrid = function () {
                        var totalHeight = 0;
                        $(".gridSec").children().each(function () {
                            totalHeight = totalHeight + $(this).outerHeight(true);
                        });
                        totalHeight = (totalHeight != 0) ? totalHeight + 15 : totalHeight;
                        var matterNoteFilterHeightFlag = 0;
                        if ($("#matterNoteFilter").find('ul li').length > 0) {
                            matterNoteFilterHeightFlag = $("#matterNoteFilter").height();
                        }
                        if ($("#report-content").offset().top < -250) {
                            if ($('#sidebartoggler').is(':checked')) { //check if sidebar is open
                                $('.report-responsive .header-row').css('left', '19.66666667%'); // if open apply this value
                                $('.gridSec').css('left', '19.66666667%'); // if open apply this value

                            } else {
                                $('.report-responsive .header-row').css('left', '35px'); // else this
                                //$('.gridSec').css('left', '12px'); // else this
                                //$('.report-responsive .header-row').css('transition', '0.5s all');
                                //$('.gridSec').css('transition', '0.5s all');
                                $('.report-responsive .header-row').css('top', '-100px');
                                $('.gridSec').css('top', '-100px');
                            }
                            $('.report-responsive .header-row').css('position', 'fixed'); // stick
                            $('.gridSec').css('position', 'fixed');
                            //$('.report-responsive .header-row').css('transition', '0.5s all');
                            //$('.gridSec').css('transition', '0.5s all');

                            $('.report-responsive .header-row').css('top', (totalHeight - 5) + "px");
                            //$('#dirV .header-row').css('top', (totalHeight - 5) + "px");
                            //$('.all-matter-list .header-row').css('top', (totalHeight - 5) + "px");
                            //all-matter-list
                            $('.gridSec').css('top', '0');
                            $('.gridSec, .paddingRLR').css('background-color', 'white');
                            $('.gridSec').css('width', '91.8%');
                            $('.gridSec').css('padding', '10px 0');
                            $(".matterGridSecStyle").css('width', '93.5%');
                            $(".matterGridSecStyle").css('padding-right', '10px');
                            $("#documentListStyle").css('width', '93%');
                            $("#contactListStyle").css('width', '93%');
                            $('.report-responsive .header-row').css('z-index', '99');
                            $('.gridSec').css('z-index', '998');
                            $('.report-responsive .header-row').css('width', $('.page-content').width()); //assign width of parent to header
                            $('.gridSec').css('width', $('.page-content').width()); //assign width of parent to header

                        } else {
                            $('.report-responsive .header-row').css('position', 'static'); // sticky not required
                            $('.gridSec').css('position', 'static');
                            $('.fixed-grid-report').css('position', 'static');
                            $('.fixed-grid-report').css('width', '100%');
                            $('.report-responsive .header-row').css('top', '-100px');
                            $('.gridSec').css('top', '-100px');
                            $('.gridSec').css('width', '100%');
                        }
                    };

                    // Sticky header
                    $(window).scroll(_.debounce(function () {
                        if (attr.noSticky) { } else {
                            $rootScope.onIntake ? setGrid() : myEfficientFn();
                        }
                    }, 100));
                    $('.panel-content-overflow').scroll(_.debounce(function () {
                        sidepanelscroll();
                    }, 100));

                    $('.page-content').css('width', '97%'); //onload make grid full

                }
            }
        }
    ])
    .directive('clxStickyHead', ['$window',
        function ($window) {
            var directive = {
                restrict: 'A',
                link: function (scope, el, attrs) {
                    var arr = attrs.clxStickyHead.split('.');
                    var topDistance = attrs.clxStickyHead;

                    function moveObject() {
                        if (Math.abs(parseInt(document.getElementsByClassName('ngscroll-container')[0].style.marginTop)) > 120) {
                            el[0].style.position = 'fixed';
                            el[0].style.top = arr[1] + 'px';
                            el[0].style.zIndex = '100';
                            el[0].style.margin = '0px';
                            if (document.getElementsByClassName("content-class-popup")[0]) {
                                el[0].style.width = document.getElementsByClassName("content-class-popup")[0].clientWidth + 'px';
                            }
                        } else {
                            el[0].style.position = 'static';
                            el[0].style.width = 'auto';
                        }
                    }

                    function scrollme() {

                        if (window.pageYOffset >= arr[0]) {
                            el[0].style.position = 'fixed';
                            el[0].style.top = arr[1];
                            el[0].style.zIndex = '100';
                            el[0].style.margin = '0px';
                            if (document.getElementsByClassName("body-row")[0]) {
                                el[0].style.width = document.getElementsByClassName("body-row")[0].clientWidth + 'px';
                            }
                        } else {
                            el[0].style.position = 'static';
                            el[0].style.width = 'auto';
                        }
                    }

                    if (!arr[1]) {
                        arr[1] = 0;
                        $window.onscroll = scrollme;
                        $window.onresize = scrollme;
                    } else {
                        document.addEventListener('DOMMouseScroll', moveObject, false);
                        //for IE/OPERA etc
                        document.onmousewheel = moveObject;
                    }

                }
            };

            return directive;
        }
    ])
    .directive('valMessage', ['validationMessages', 'valMessageGenerator',
        function (validationMessages, valMessageGenerator) {

            return {
                restrict: 'E',
                link: linkFn,
                scope: {
                    params: '@',
                    type: '@'
                }
            }

            function linkFn(scope, el, attr) {
                var message = valMessageGenerator.getMessage(scope.type, scope.params);
                var newEl = angular.element('<div>' + message + '</div>');
                el.replaceWith(newEl);
            }

        }
    ])
    .factory('renderCellHelper', ['$filter',
        function ($filter) {
            return {
                generateCellHtml: _generateCellHtml,
                setTooltip: _setTooltip
            };

            function _generateCellHtml(field, cellData) {

                var html = '';

                if (utils.isNotEmptyVal(field.label)) {
                    html += _getLabel(field);
                }

                if (field.href) {
                    html += _setAnchorTag(field, cellData);
                    return html;
                }

                if (utils.isNotEmptyVal(field.template)) {
                    html += _setTemplate(field, cellData);
                    return html;
                }

                html += '<span ';
                html += _addClass(field);
                if (cellData[field.prop]) {
                    cellData[field.prop] = cellData[field.prop].toString();
                    html += ' data-toggle="' + field.prop + '-' + 'tooltip" data-placement="bottom" title="' + (cellData[field.prop]).replace(/[<]br[^>]*[>]/gi, "") + '"';
                } else {
                    html += ' data-toggle="' + field.prop + '-' + 'tooltip" data-placement="bottom" title="' + (cellData[field.prop]) + '"';
                }
                html += '>' + _applyFilterToData(field, cellData) + '</span>';

                return html;
            }

            function _applyFilterToData(field, cellData) {
                var data = utils.isNotEmptyVal(field.filter) ? $filter(field.filter)(cellData[field.prop]) : cellData[field.prop];
                if (utils.isHTML(data)) {
                    data = utils.replaceHtmlEntites(data.replace(/<\/?[^>]+>/gi, ''));
                }

                return data;
            }

            function _getLabel(field) {
                var html = '';
                switch (field.labelTemplate) {
                    case 'bold':
                        html += '<strong>' + field.label + '</strong>';
                        break;
                    default:
                        html += '<span>' + field.label + '</span>';
                }
                return html;
            }

            function _setAnchorTag(field, cellData) {
                var data = cellData[field.prop];
                if (utils.isHTML(data)) {
                    data = utils.replaceHtmlEntites(data.replace(/<\/?[^>]+>/gi, ''));
                }
                var html = "";
                html += '<a href="' + _getLink(field.href, cellData) + '"';
                html += utils.isNotEmptyVal(field.template) ? ">" :
                    ' data-toggle="' + field.prop + '-' + 'tooltip" data-placement="bottom"  title="' + data + '"' + '>';
                if (utils.isNotEmptyVal(field.template)) {
                    html += _setTemplate(field, cellData);
                } else {
                    html += _applyFilterToData(field, cellData);
                }
                html += '</a>';
                return html;
            }

            function _getLink(href, cellData) {
                var link = href.link;
                _.forEach(href.paramProp, function (prop) {
                    link += '/' + cellData[prop];
                });
                return link;
            }

            function _setTemplate(field, cellData) {
                var html = '';
                switch (field.template) {
                    case 'bold':
                        html += _getStrongTag(field, cellData);
                        break;
                    case 'custom':
                        html += _setCustomTemplate(field, cellData);
                        break;
                    default:
                        throw field.template + " is not supported";
                }
                return html;
            }

            function _getStrongTag(field, cellData) {
                var html = '';
                html += '<strong';
                html += ' data-toggle="' + field.prop + '-' + 'tooltip" data-placement="bottom"  title="' + cellData[field.prop] + '"' + '>';
                html += _applyFilterToData(field, cellData) + '</strong>';
                return html;
            }

            function _setCustomTemplate(field, cellData) {
                var html = field.customTemplate;
                html = html.replace(/{cellData}/g, _applyFilterToData(field, cellData));
                return html;
            }

            function _addClass(field) {
                var html = '';
                html += ' class="' + (field.showBig ? "big-num-val-grid" : "") + '"';
                //html += ' ' + utils.isNotEmptyVal(field.class) ? field.class : '' + '"';
                return html;
            }

            function _setTooltip(field) {
                var defaultTooltipOption = {
                    template: '<span class="tooltip" style="width:auto" role="tooltip">' +

                        //tooltip's tip removed because of long data
                        //'<span class="tooltip-arrow"></span>' +

                        '<span class="tooltip-inner"></span>' +
                        '</span>',
                    container: 'body',
                    html: false
                };

                var tooltipOption = utils.isEmptyObj(field.tooltipOption) ? {} : field.tooltipOption;
                tooltipOption = angular.extend({}, defaultTooltipOption, tooltipOption);

                $('[data-toggle="' + field.prop + '-' + 'tooltip"]').tooltip(tooltipOption);
            }
        }
    ])
    .directive('renderCell', ['$rootScope', '$compile', '$parse', 'renderCellHelper',
        function ($rootScope, $compile, $parse, renderCellHelper) {

            return {
                restrict: 'A',
                link: linkFn
            };

            function linkFn(scope, el, attr) {
                var field = JSON.parse(attr.field);
                var cellData = JSON.parse(attr.cellData);
                var modifyCellElement = $parse(attr.modifyCell)(scope);
                var html = "",
                    newEl;

                cellData[field.prop] = _.isNull(cellData[field.prop]) ? "" : cellData[field.prop];
                if (utils.isNotEmptyVal(cellData[field.prop]) && isNaN(cellData[field.prop])) {
                    cellData[field.prop] = (cellData[field.prop].indexOf('"') > -1) ? cellData[field.prop] = cellData[field.prop].replace(/"/g, '&#34;') : cellData[field.prop];
                    cellData[field.prop] = (cellData[field.prop].indexOf("'") > -1) ? cellData[field.prop] = cellData[field.prop].replace(/'/g, '&#39;') : cellData[field.prop];
                }


                if (angular.isDefined(field.html)) {
                    html = scope.field.html;
                    newEl = angular.element(html);
                    field.modifyCellElement ? modifyCellElement(newEl, field, cellData) : angular.noop();
                    if (field.underline) {
                        newEl.attr("style", "color: #2a83b1;");
                    }
                    $compile(newEl)(scope);
                    el.append(newEl);
                } else {
                    html = renderCellHelper.generateCellHtml(field, cellData);
                    newEl = angular.element(html);

                    //last custom change to the cell
                    field.modifyCellElement ? modifyCellElement(newEl, field, cellData) : angular.noop();

                    //add functions
                    if (field.onClick) {
                        newEl.attr("ng-click", field.onClick);
                        field.compile = true;
                    }

                    if (field.underline) {
                        newEl.attr("style", "color: #2a83b1;");
                        field.compile = true;
                    }

                    if (field.compile) {
                        $compile(newEl)(scope);
                    }

                    el.append(newEl);
                    //add class to the cell
                    utils.isNotEmptyVal(field.css) ? el.addClass(field.css) : angular.noop();

                    //initialize the bootstrap js tooltip
                    renderCellHelper.setTooltip(field);
                }
            }

        }
    ])
    .directive('renderHeader', function () {
        return {
            restrict: 'A',
            link: linkFn
        };

        function linkFn(scope, el, attr) {
            var header = '<span>' + attr.header + '</span>';
            var newEl = angular.element(header);

            var align = attr.headerAlign;
            var alignClass = utils.isNotEmptyVal(align) ? 'text' + align : null;

            utils.isNotEmptyVal(alignClass) ? el.addClass(alignClass) : angular.noop();

            el.append(newEl);
        }
    })
    .directive('creditCardType', function () {
        var directive = {
            require: 'ngModel',
            link: function (scope, elm, attrs, ctrl) {
                ctrl.$parsers.unshift(function (value) {
                    scope.practiceAndBillingCtrl.cardInfo.credit_card_type =
                        (/^5[1-5]/.test(value)) ? "MasterCard" : (/^4/.test(value)) ? "Visa" : (/^3[47]/.test(value)) ? 'AmericanExpress' : undefined
                    ctrl.$setValidity('invalid', !!scope.practiceAndBillingCtrl.cardInfo.credit_card_type)
                    return value
                })
            }
        }
        return directive
    })
    .directive('myMaxlength', [

        function () {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function (scope, elem, attrs, ctrl) {
                    attrs.$set("ngTrim", "false");
                    var maxlength;

                    attrs.$observe('myMaxlength', function (val) {
                        maxlength = val;
                    });


                    ctrl.$parsers.push(function (value) {
                        if (value.length > maxlength) {
                            value = value.substr(0, maxlength);
                            ctrl.$setViewValue(value);
                            ctrl.$render();
                        }

                        return value;
                    });
                }
            };
        }
    ])
    .directive('creditCardNumber', function () {
        var directive = {
            require: 'ngModel',
            link: function (scope, elm, attrs, ngModel) {

                elm.bind('blur', function () {
                    /* ngModel.$viewValue = '*******************8';
                 ngModel.$render();*/
                    var currentValue = ngModel.$modelValue;
                    //scope.practiceAndBillingCtrl.newCreditCardNumber = value;

                    if (angular.isDefined(currentValue)) {
                        if (currentValue.length == 15) {
                            currentValue = "***********" + currentValue.substr(11);
                        }

                        if (currentValue.length == 16) {
                            currentValue = "************" + currentValue.substr(12);
                        }
                        if (currentValue.length == 17) {
                            currentValue = "*************" + currentValue.substr(13);
                        }
                        if (currentValue.length == 18) {
                            currentValue = "**************" + currentValue.substr(14);
                        }
                        if (currentValue.length == 19) {
                            currentValue = "***************" + currentValue.substr(15);
                        }

                    }

                    ngModel.$viewValue = currentValue;
                    ngModel.$render();
                });

                elm.bind('focus', function (newValue) {
                    if (ngModel.$viewValue && ngModel.$viewValue.indexOf("******") != 0) {
                        ngModel.$viewValue = ngModel.$modelValue;
                    }

                    ngModel.$render();
                });

            }
        }
        return directive
    })
    .directive('creditCvvNumber', function () {
        var directive = {
            require: 'ngModel',
            link: function (scope, elm, attrs, ngModel) {

                elm.bind('blur', function () {
                    var currentValue = ngModel.$modelValue;
                    if (currentValue && currentValue.length == 3) {
                        currentValue = "**" + currentValue.substr(2);
                    }

                    if (currentValue && currentValue.length == 4) {
                        currentValue = "***" + currentValue.substr(3);
                    }
                    ngModel.$viewValue = currentValue;
                    ngModel.$render();
                });

                elm.bind('focus', function () {

                    if (ngModel.$viewValue && ngModel.$viewValue.indexOf("**") != 0) {
                        ngModel.$viewValue = ngModel.$modelValue;
                    }

                    //ngModel.$viewValue = ngModel.$modelValue;
                    ngModel.$render();
                });

            }
        }
        return directive
    })
    .directive('stringToNumber', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {
                ngModel.$parsers.push(function (value) {
                    return '' + value;
                });
                ngModel.$formatters.push(function (value) {
                    return parseFloat(value, 10);
                });
            }
        };
    })
    .directive('phoneNumberFormat', function () {
        var directive = {
            require: 'ngModel',
            link: function (scope, elm, attrs, ctrl) {



                ctrl.$parsers.unshift(function (value) {

                    value = value.replace(/-/g, '');

                    if (value.length >= 7) {
                        value = [value.slice(0, 3), '-', value.slice(3, 6), '-', value.slice(6)].join('');
                    }

                    if (value.length >= 3 && value.length < 7) {
                        value = [value.slice(0, 3), '-', value.slice(3)].join('');
                    }

                    ctrl.$setViewValue(value);
                    ctrl.$render();
                    return value

                });
            }
        }
        return directive
    })
    .directive('usphoneNumberFormat', function () {
        var directive = {
            require: 'ngModel',
            link: function (scope, elem, attrs, ctrl) {

                elem.on("keyup", function () {
                    var val = elem.val();
                    //val = val.replace(/[^0-9]/g, '');
                    parserfn(val);
                });

                function USFormattedNumber(num) {
                    num = num.replace(/[^0-9]/g, '');
                    var number = String(num);

                    // Will return formattedNumber. 
                    // If phonenumber isn't longer than an area code, just show number
                    var formattedNumber = number;

                    // if the first character is '1', strip it out and add it back
                    //var c = (number[0] == '1') ? '1 ' : '';
                    //number = number[0] == '1' ? number.slice(1) : number;

                    // # (###) ###-#### as c (area) front-end
                    var area = number.substring(0, 3);
                    var front = number.substring(3, 6);
                    var end = number.substring(6, 10);

                    if (front) {
                        // formattedNumber = (c + "(" + area + ") " + front);
                        formattedNumber = ("(" + area + ") " + front);
                    }
                    if (end) {
                        formattedNumber += ("-" + end);
                    }
                    return formattedNumber;
                }

                ctrl.$formatters.push(function (number) {
                    if (!number) { return ''; }
                    number = number.replace(/[^0-9 ]/g, '');
                    var formattedNumber = USFormattedNumber(number);
                    //number = formattedNumber.replace(/[^0-9 ]/g, '');
                    // to set model value
                    ctrl.$setViewValue(formattedNumber);
                    //ctrl.$viewValue = formattedNumber;
                    ctrl.$render();
                    // to set view value
                    return formattedNumber;
                });


                ctrl.$parsers.unshift(parserfn)

                function parserfn(number) {
                    /* 
                    @param {Number | String} number - Number that will be formatted as telephone number
                    Returns formatted number: (###) ###-####
                        if number.length < 4: ###
                        else if number.length < 7: (###) ###
                    Does not handle country codes that are not '1' (USA)
                    */
                    //if (!number) { return ''; }

                    number = number.replace(/[^0-9 ]/g, '');
                    var formattedNumber = USFormattedNumber(number);

                    //to set view value
                    ctrl.$setViewValue(formattedNumber);
                    //ctrl.$viewValue = formattedNumber;
                    ctrl.$render();

                    //to set model value
                    // formattedNumber = formattedNumber.replace(/\s/g, '-');
                    // number = formattedNumber.replace(/[^0-9-]/g, '');
                    // return number;
                    return formattedNumber;
                };
            }
        }
        return directive
    })
    .directive('ssnFormat', function () {
        var directive = {
            require: 'ngModel',
            link: function (scope, elm, attrs, ctrl) {

                function processValue(value) {
                    value = value.toString().replace(/\D/g, "");
                    if (value.length >= 6) {
                        value = [value.slice(0, 3), '-', value.slice(3, 5), '-', value.slice(5)].join('');
                    }
                    if (value.length > 3 && value.length < 6) {
                        value = [value.slice(0, 3), '-', value.slice(3)].join('');
                    }
                    return value;
                };

                ctrl.$parsers.unshift(function (value) {
                    value = processValue(value);

                    ctrl.$setViewValue(value);
                    ctrl.$render();
                    return value;
                });

                ctrl.$formatters.push(function (value) {
                    if (!value) { return ''; }
                    var formattedNumber = processValue(value);
                    // to set model value
                    ctrl.$setViewValue(formattedNumber);
                    ctrl.$render();
                    // to set view value
                    return formattedNumber;
                });
            }
        }
        return directive;
    })

    .directive('restrictTo', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var re = RegExp(attrs.restrictTo);
                var exclude = /Backspace|Enter|Tab|Delete|Del|ArrowUp|Up|ArrowDown|Down|ArrowLeft|Left|ArrowRight|Right/;

                element[0].addEventListener('keydown', function (event) {
                    var v = element[0].value + event.key;
                    if (!exclude.test(event.key) && !re.test(v)) {
                        event.preventDefault();
                    }
                });
            }
        }
    })

    .directive('taMaxlength', function ($timeout, textAngularManager) {
        return {
            restrict: 'A',
            link: function ($scope, element, attrs) {
                var editor, maxLength = parseInt(attrs.taMaxlength);

                var getTruncatedContent = function (content) {
                    return $.truncate(content, {
                        length: maxLength + 1,
                        ellipsis: ''
                    });
                };

                var getEditor = function () {
                    return editor.scope.displayElements.text[0];
                };

                var getContentLength = function () {
                    return angular.element(getEditor()).text().length;
                };

                var isNavigationKey = function (keyCode) {
                    return ((keyCode >= 33) && (keyCode <= 40)) || ([8, 46].indexOf(keyCode) !== -1);
                };

                var isCopying = function (event) {
                    return event.ctrlKey && ([65, 67, 88].indexOf(event.keyCode) !== -1);
                };

                $scope.$watch(function () {
                    var editorInstance = textAngularManager.retrieveEditor(attrs.name);

                    if ((editorInstance !== undefined) && (editor === undefined)) {
                        editor = editorInstance;

                        getEditor().addEventListener('keydown', function (e) {
                            if (!isNavigationKey(e.keyCode) && !isCopying(e) && (getContentLength() >= maxLength)) {
                                e.preventDefault();
                                return false;
                            }
                        });
                    }

                    return editorInstance === undefined ? '' : editor.scope.html;
                }, function (modifiedContent) {
                    if (getContentLength() > maxLength) {
                        $timeout(function () {
                            editor.scope.html = getTruncatedContent(modifiedContent);
                        });
                    }
                });
            }
        };
    })

    .directive('amountFormat', function () {
        var directive = {
            require: 'ngModel',
            link: function (scope, elm, attrs, ctrl) {

                ctrl.$parsers.unshift(function (value) {

                    value = value.replace(/-/g, '');

                    ctrl.$setViewValue(value);
                    ctrl.$render();
                    return value

                });
            }
        }
        return directive
    })
    .directive('onClassChange', function () {
        return {
            link: function (scope, element, attrs) {
                var currentScrollPos = 0;
                scope.$watch(function () {
                    return element.hasClass('modal-open');
                }, function (newValue, oldValue) {
                    // var nice = $("body").getNiceScroll()[0];
                    // if (oldValue == false && newValue == true) {
                    //     currentScrollPos = nice.scroll.y;
                    // } else if (oldValue == true && newValue == false) {
                    //     nice.doScrollTo(currentScrollPos + 10);
                    //     currentScrollPos = 0;
                    // }
                });
            }
        };

    })
    .directive('scrolly', ['$window',
        function ($window) {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {
                    var windowEl = angular.element($window);
                    windowEl.bind("scroll", _.throttle(function () {
                        // If OS the MAC then use bufferval of 150
                        var OSName = "";
                        if (navigator.appVersion.indexOf("Mac") != -1) {
                            OSName = "MacOS";
                        };

                        var bufferVal = 0;
                        if (OSName == "MacOS") {
                            bufferVal = 150;
                        }
                        var nice = $("body").getNiceScroll()[0];
                        var windowHeight = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
                        var maxHeight = nice && nice.scrollvaluemax ? nice.scrollvaluemax : windowHeight;
                        maxHeight -= bufferVal;
                        if ((nice && nice.scroll) && nice.scroll.y >= maxHeight) {
                            scope.$apply(attrs.scrolly);
                            $("body").getNiceScroll().resize()
                        } else if ((nice && nice.scroll) && (nice.scroll.y === 0 || nice.scroll.y === 20)) {
                            scope.$apply(attrs.reachedTop);
                            $("body").getNiceScroll().resize()
                        }

                        // var windowHeight = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
                        // var scrollNode = document.scrollingElement ?
                        //     document.scrollingElement : document.body;
                        // var html = document.documentElement;
                        // var docHeight = Math.max(scrollNode.scrollHeight, scrollNode.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
                        // var windowBottom = windowHeight + window.pageYOffset;
                        // if (windowBottom >= docHeight * (95 / 100)) {
                        //     scope.$apply(attrs.scrolly);
                        // } else if (scrollNode.scrollTop === 0 || scrollNode.scrollTop === 20) {
                        //     //detect scroll top
                        //     scope.$apply(attrs.reachedTop);
                        // }
                    }));
                }
            }
        }
    ])

    .directive('showHideRightPanel', ['$window', '$document',
        function ($window, $document) {
            return {
                restrict: 'A',
                link: function (scope, element) {
                    angular.element($document).on('mouseover', function (e) {
                        //if (window.location.hash.indexOf("#/notifications") == -1) {
                        if (!window.isDrawerOpen) {
                            if ($window.innerWidth - e.pageX < 140) {
                                element.css('right', '0px');
                            } else {
                                element.css('right', '-75px'); //changes for when user clicks from notification
                            }
                        } else {
                            element.css('right', '0px');
                        }
                        //}
                    });

                }
            }
        }
    ])
    .directive('showSideNavpage', ['$window', '$document',
        function ($window, $document) {
            return {
                restrict: 'A',
                link: function (scope, element) {
                    angular.element($document).on('mouseover', function (e) {
                        if (window.isDrawerOpen) {
                            element.css('right', '0px');
                        }
                    });
                }
            }
        }
    ])
    .service('paginationService', function () {
        // service definition
        var service = {};

        service.GetPager = GetPager;

        return service;

        // service implementation
        function GetPager(totalItems, currentPage, pageSize) {
            // default to first page
            currentPage = currentPage || 1;

            // default page size is 250
            pageSize = pageSize || 250;

            // calculate total pages
            var totalPages = Math.ceil(totalItems / pageSize);

            // calculate start and end item indexes
            var startIndex = (currentPage - 1) * pageSize;
            var endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

            // return object with all pager properties required by the view
            return {
                totalItems: totalItems,
                currentPage: currentPage,
                pageSize: pageSize,
                totalPages: totalPages,
                startIndex: startIndex,
                endIndex: endIndex
            };
        }
    })
    .service('pendingRequests', function () {
        var pending = [];
        this.get = function () {
            return pending;
        };
        this.add = function (request) {
            pending.push(request);
        };
        this.remove = function (request) {
            pending = _.filter(pending, function (p) {
                return p.url !== request;
            });
        };
        this.cancelAll = function () {
            angular.forEach(pending, function (p) {
                p.canceller.resolve();
            });
            pending.length = 0;
        };
    })
    .service('HierarchyNodeService', function () {

        function lowerCase(str) {
            return str.split(' ').map(function (e) {
                return e.toString().toLowerCase();
            }).join(' ');
        }

        function treeSearch(tree, query) {
            if (!tree) {
                return {};
            }

            if (lowerCase(tree.title).indexOf(lowerCase(query)) > -1) {
                tree.match = true;
                return tree;
            }

            var branches = _.reduce(tree.items, function (acc, leaf) {
                var newLeaf = treeSearch(leaf, query);

                if (!_.isEmpty(newLeaf)) {
                    acc.push(newLeaf);
                }

                return acc;
            }, []);

            if (_.size(branches) > 0) {
                var trunk = _.omit(tree, 'items');
                trunk.items = branches;

                return trunk;
            }

            return {};
        }

        function getAllChildren(node, arr) {
            if (!node) return;
            arr.push(node);

            if (node.items) {
                //if the node has children call getSelected for each and concat to array
                node.items.forEach(function (childNode) {
                    arr = arr.concat(getAllChildren(childNode, []))
                })
            }
            return arr;
        }



        function findParent(node, parent, targetNode, cb) {
            if (_.isEqual(node, targetNode)) {
                cb(parent);
                return;
            }

            if (node.items) {
                node.items.forEach(function (item) {
                    findParent(item, node, targetNode, cb);
                });
            }
        }


        function getSelected(node, arr) {
            //if(!node) return [];
            //if this node is selected add to array
            if (node.isSelected) {
                arr.push(node);
                return arr;
            }

            if (node.items) {
                //if the node has children call getSelected for each and concat to array
                node.items.forEach(function (childNode) {
                    arr = arr.concat(getSelected(childNode, []))
                })
            }
            return arr;
        }

        function selectChildren(children, val) {

            //set as selected
            children.isSelected = val;
            if (children.items) {
                //recursve to set all children as selected
                children.items.forEach(function (el) {
                    selectChildren(el, val);
                })
            }
        }

        function trimLeafs(node, parent) {

            if (!node.items) {
                //da end of the road
                delete parent.items;
            } else {
                node.items.forEach(function (item) {
                    trimLeafs(item, node);
                })
            }

        }


        return {
            getAllChildren: getAllChildren,
            getSelected: getSelected,
            selectChildren: selectChildren,
            trimLeafs: trimLeafs,
            treeSearch: treeSearch,
            findParent: findParent
        };

    })
    .directive('cancelPendingRequests', ['pendingRequests',
        function (pendingRequests) {
            return {
                link: function (scope) {
                    scope.$on('$destroy', function () {
                        pendingRequests.cancelAll();
                    })
                }
            }
        }
    ])
    .directive('ngRightClick', function ($parse) {
        return function (scope, element, attrs) {
            var fn = $parse(attrs.ngRightClick);
            element.bind('contextmenu', function (event) {
                scope.$apply(function () {
                    event.preventDefault();
                    fn(scope, {
                        $event: event
                    });
                });
            });
        };
    })
    .directive('highlightClickedRow', ['$parse',
        function ($parse) {
            return {
                restrict: 'A',
                link: linkFn
            };

            function linkFn(scope, el, attr) {

                //params : prop names array
                //[0] : value to be set
                //[1] : obj into which we have to set the value

                var props = attr.highlightClickedRow.split(',');
                var value = props[0];
                var objGetter = $parse(props[1]);
                var objSetter = objGetter.assign;

                el.bind('click', function () {
                    scope.$apply(function () {
                        objSetter(scope, value);
                    })
                })

            }
        }
    ])
    .directive('requestPending', ['$http', 'globalConstants',
        function ($http, globalConstants) {
            return {
                restrict: 'A',
                scope: {
                    'requestPending': '='
                },
                link: function (scope, el, attr) {
                    scope.$watch(function () {

                        if ($http.pendingRequests.length > 0) {
                            // Create variable of url which we want to skip
                            var skipUrl1 = globalConstants.javaWebServiceBaseV4 + "notification/all_notification";

                            var reqs = _.filter($http.pendingRequests, function (v) {
                                return v.url.indexOf(skipUrl1) == -1;
                            });
                            var reqToSkip = _.filter($http.pendingRequests, function (v) {
                                return v.url.indexOf(skipUrl1) > -1 && v.url.indexOf("&hideLoader=true") > -1;
                            });
                            if (reqs.length == 0 && reqToSkip.length > 0) {
                                return 0;
                            } else {
                                return $http.pendingRequests.length;
                            }
                        } else {
                            return $http.pendingRequests.length;
                        }
                    }, function (requests) {
                        if (requests == 0) {
                            setTimeout(function () {
                                $("body").getNiceScroll().resize();
                            }, 1000);
                        }
                        scope.requestPending = requests > 0;
                    })
                }
            }
        }
    ])
    .directive('watchStorage', ['$http', '$state', 'globalConstants', 'notification-service',
        function ($http, $state, globalConstants, notificationService) {

            return {
                restrict: 'E',
                link: function () {

                    if (window.addEventListener) {
                        window.addEventListener("storage", handler, false);
                    } else {
                        // for IE (why make your life more difficult)
                        window.attachEvent("onstorage", handler);
                    };

                    function handler() {
                        var loggedIn = localStorage.getItem("loggedIn");
                        (loggedIn == 'true') ? angular.noop() : logout();
                    }

                    function logout() {
                        $state.go('login');
                        var RferredMatterLink = localStorage.getItem('fromReferredMatterLink');
                        (RferredMatterLink == 'true') ? angular.noop() : localStorage.clear();

                    }
                }
            }

        }
    ])
    .directive('detectChangeEditorTextAngular', function () {
        return {
            restrict: 'A',
            link: linkFn,
            require: 'ngModel'
        };

        function linkFn(scope, el, attr, ngModel) {

            el.bind('blur', function () {
                var textArea = $(el[0].querySelector("div[id^='taTextElement']"));
                ngModel.$setViewValue(textArea.html());
                ngModel.$validate();
            });
        }
    })
    .directive('detectChangeEditorWysiwyg', function () {
        return {
            restrict: 'A',
            link: linkFn,
            require: 'ngModel'
        };

        function linkFn(scope, el, attr, ngModel) {

            el.bind('blur', function () {
                ngModel.$setViewValue(el.html());
                ngModel.$validate();
            });
        }
    })
    .directive('clxMaxSizeEditorWysiwyg', function () {
        return {
            restrict: 'A',
            link: linkFn,
            require: 'ngModel'
        };

        function linkFn(scope, el, attr, ngModel) {

            var maxSize = 0;
            scope.$watch(attr.maxSize, function (val) {
                maxSize = parseInt(attr.maxSize);
                ngModel.$validate();
            });
            ngModel.$validators.maxSize = function (modelVal) {
                if (utils.isEmptyVal(modelVal)) {
                    return true;
                }
                var size = utils.byteCount(modelVal);
                return size < maxSize;
            };
        }

    })
    .directive('clxMaxSize', function () {
        return {
            restrict: 'A',
            link: linkFn,
            require: 'ngModel'
        };

        function linkFn(scope, el, attr, ngModel) {
            var maxSize = parseInt(attr.clxMaxSize);

            ngModel.$validators.maxSize = function (modelVal) {
                if (utils.isEmptyVal(modelVal)) {
                    return true;
                }
                var size = utils.byteCount(modelVal);
                return size < maxSize;
            };
        }

    }).directive('paginationCtrl', function () {
        return {
            restrict: 'E',
            scope: {
                totalCount: '=',
                tagList: "=",
                getData: '&'
            },
            controllerAs: 'pagerCtrl',
            bindToController: true,
            templateUrl: "app/utils/custom-templates/pagination-template.html",
            controller: ['paginationService', '$scope',
                function controllerFn(paginationService, $scope) {
                    var vm = this;

                    vm.setPage = function (pageNumber) {

                        // get pager object from service
                        vm.pager = paginationService.GetPager(vm.totalCount, pageNumber);

                        vm.getData({ data: vm.pager });
                    };
                    $scope.$watch(function () {
                        return vm.tagList;
                    }, function (newVal, oldVal) {
                        vm.cp = 1;
                        angular.isDefined(vm.pager) ? vm.pager.currentPage = 1 : " ";
                    });

                    $scope.$watch(function () {
                        return vm.totalCount;
                    }, function (newVal, oldVal) {
                        if (newVal && newVal > 0) {
                            vm.showPageLable = true;
                        }
                        vm.cp = angular.isDefined(vm.pager) ? vm.pager.currentPage : 1;
                        vm.ps = angular.isDefined(vm.pager) ? vm.pager.pageSize : 250;
                        vm.pager = paginationService.GetPager(newVal, vm.cp, vm.ps);
                    });
                }
            ]
        };
    })
    .directive('matterInfoHeader', function () {
        return {
            restrict: 'E',
            scope: {
                matterInfo: '=',
                isMatterOverview: '=',
                matterOverview: '='
            },
            controllerAs: 'matter',
            bindToController: true,
            templateUrl: "app/utils/custom-templates/matter-info-header.html",
            controller: ['contactFactory', 'matterFactory', '$modal', 'modalService', '$state', 'masterData',
                function controllerFn(contactFactory, matterFactory, $modal, modalService, $state, masterData) {
                    var vm = this;
                    vm.retrievePending = false;

                    var role = masterData.getUserRole();
                    vm.isSubsriber = (role.is_subscriber == "1") ? true : false;
                    vm.isAdmin = (role.is_admin == "1") ? true : false;
                    vm.userMsg = (vm.isSubsriber) ? 'You have reached the matter hosting limit for your current subscription.' : 'You have reached the matter hosting limit for your current subscription. Please contact the subscribing managing partner to increase the matter hosting capacity.';

                    vm.openContactCard = function (contact) {
                        contactFactory.displayContactCard1(contact.contactid);
                    }

                    vm.goToMatterCollaboration = function () {
                        $state.go('matter-sharing', { matterId: vm.matterOverview.matterInfo.matter_id, matterName: vm.matterOverview.matterInfo.matter_name, fromMatterList: true });

                    }

                    vm.retrieveMatter = function (id) {

                        var modalOptions = {
                            closeButtonText: 'Cancel',
                            actionButtonText: 'Retrieve',
                            headerText: 'Retrieve matters?',
                            bodyText: "To confirm, click Retrieve."
                        };

                        //confirm before Retrieve matter
                        modalService.showModal({}, modalOptions).then(function () {
                            var promesa = matterFactory.setRetrieveArchivedMatter(id);
                            promesa.then(function (data) {
                                vm.matterInfo['matter_archive_status'] = 3;
                                matterFactory.setMatterData(vm.matterInfo);
                                vm.matterInfo = matterFactory.getMatterData(id);
                                vm.retrievePending = true;
                            }, function (error) {
                                notificationService.error('Unable to retrieve selected matters');
                            });
                        });
                    }

                }
            ]
        };
    })
    .directive('selectMatter', function () {
        return {
            link: link,
            restrict: 'E',
            scope: {
                selectedmatt: '=',
            },
            controllerAs: 'mattselction',
            bindToController: true,
            templateUrl: "app/utils/custom-templates/select-matter-template.html",
            controller: ['matterFactory', 'notification-service',
                function controllerFn(matterFactory, notificationService) {
                    var vm = this;

                    vm.searchMatters = searchMatters;
                    vm.formatTypeaheadDisplay = formatTypeaheadDisplay;

                    /* Formate the matter id and name */
                    function formatTypeaheadDisplay(matter) {
                        if (angular.isUndefined(matter) || utils.isEmptyString(matter)) {
                            return undefined;
                        } else {
                            return matter.name
                        }
                    }

                    function searchMatters(matterName) {
                        if (matterName) {
                            return matterFactory.searchMatters(matterName).then(
                                function (response) {
                                    return response.data;
                                },
                                function (error) {
                                    notificationService.error('Matters not loaded');
                                });
                        }
                    }
                }
            ]
        };

        function link(scope, element, attrs) {

        };

    })
    .directive('showRecordCountOnly', function () {
        return {
            restrict: 'E',
            scope: {
                total: '=',
                displayed: '=',
                more: '&',
                all: '&',
                hidePager: '@'
            },
            controllerAs: 'recordsCount',
            bindToController: true,
            controller: ['$scope', '$attrs', function ($scope, $attrs) {
                var vm = this;

                $attrs.$observe('hidePager', function (val) {
                    vm.hidePager = !(val == "true");
                });

                (function () {
                    if (utils.isEmptyVal(vm.hidePager)) {
                        vm.hidePager = false;
                    }
                })();

            }],
            template: "<div class='col-md-12 relative-container '>" +

                "<div class='text-right pull-left width-54per'>" +

                "</div>" +
                "<div class='text-right pull-right'>" +
                "<span>{{recordsCount.displayed |number}}</span> of <span>{{recordsCount.total |number}}</span>" +
                "</div>" +


                "</div>"
        }
    })
    .directive('showRecordMoreAndAll', function () {
        return {
            restrict: 'E',
            scope: {
                total: '=',
                displayed: '=',
                more: '&',
                all: '&',
                hidePager: '@'
            },
            controllerAs: 'recordsCount',
            bindToController: true,
            controller: ['$scope', '$attrs', function ($scope, $attrs) {
                var vm = this;

                $attrs.$observe('hidePager', function (val) {
                    vm.hidePager = !(val == "true");
                });

                (function () {
                    if (utils.isEmptyVal(vm.hidePager)) {
                        vm.hidePager = false;
                    }
                })();

            }],
            template: "<div class='col-md-12 relative-container '>" +

                "<div class='text-right pull-left width-54per'>" +
                "<a href='javascript:void(0)'  data-ng-hide='recordsCount.hidePager' data-ng-click='recordsCount.more()'>" +
                "   More " +
                "</a> <span class='paddingLR-10px' data-ng-hide='recordsCount.hidePager'>|</span>" +
                "<a href='javascript:void(0)' data-ng-hide='recordsCount.hidePager' data-ng-click='recordsCount.all()' >" +
                "   All" +
                "</a>" +
                "</div>" +
                "<div class='text-right pull-right'>" +
                "<span></span>" +
                "</div>" +


                "</div>"
        }
    })
    .directive('showRecordCount', function () {
        return {
            restrict: 'E',
            scope: {
                total: '=',
                displayed: '=',
                more: '&',
                all: '&',
                hidePager: '@'
            },
            controllerAs: 'recordsCount',
            bindToController: true,
            controller: ['$scope', '$attrs', function ($scope, $attrs) {
                var vm = this;

                $attrs.$observe('hidePager', function (val) {
                    vm.hidePager = !(val == "true");
                });

                (function () {
                    if (utils.isEmptyVal(vm.hidePager)) {
                        vm.hidePager = false;
                    }
                })();

            }],
            template: "<div class='col-md-12 relative-container '>" +

                "<div class='text-right pull-left width-54per'>" +
                "<a href='javascript:void(0)'  data-ng-hide='recordsCount.hidePager' data-ng-click='recordsCount.more()'>" +
                "   More " +
                "</a> <span class='paddingLR-10px' data-ng-hide='recordsCount.hidePager'>|</span>" +
                "<a href='javascript:void(0)' data-ng-hide='recordsCount.hidePager' data-ng-click='recordsCount.all()' >" +
                "   All" +
                "</a>" +
                "</div>" +
                "<div class='text-right pull-right'>" +
                "<span>{{recordsCount.displayed |number}}</span> of <span>{{recordsCount.total |number}}</span>" +
                "</div>" +


                "</div>"
        }
    })
    .directive('showRecordCount3', function () {
        return {
            restrict: 'E',
            scope: {
                total: '=',
                displayed: '=',
                more: '&',
                all: '&',
                hidePager: '@'
            },
            controllerAs: 'recordsCount3',
            bindToController: true,
            controller: ['$scope', '$attrs', function ($scope, $attrs) {
                var vm = this;

                $attrs.$observe('hidePager', function (val) {
                    vm.hidePager = !(val == "true");
                });

                (function () {
                    if (utils.isEmptyVal(vm.hidePager)) {
                        vm.hidePager = false;
                    }
                })();
            }],
            template: "<div class='col-md-12 relative-container '>" +

                "<div class='text-right pull-left width-54per'>" +
                "<a href='javascript:void(0)'  data-ng-hide='recordsCount3.hidePager' data-ng-click='recordsCount3.more()'>" +
                "   More " +
                "</a> <span class='paddingLR-10px' data-ng-hide='recordsCount3.hidePager'>|</span>" +
                "<a href='javascript:void(0)' data-ng-hide='recordsCount3.hidePager' data-ng-click='recordsCount3.all()' >" +
                "   All" +
                "</a>" +
                "</div>" +
                "<div class='text-right pull-right'>" +
                "<span> Showing 1 to {{recordsCount3.displayed |number}}</span>" +
                "</div>" +


                "</div>"
        }
    })
    .directive('showRecordCount4', function () {
        return {
            restrict: 'E',
            scope: {
                total: '=',
                displayed: '=',
                more: '&',
                all: '&',
                hidePager: '@'
            },
            controllerAs: 'recordsCount4',
            bindToController: true,
            controller: ['$scope', '$attrs', function ($scope, $attrs) {
                var vm = this;

                $attrs.$observe('hidePager', function (val) {
                    vm.hidePager = !(val == "true");
                });

                (function () {
                    if (utils.isEmptyVal(vm.hidePager)) {
                        vm.hidePager = false;
                    }
                })();
            }],
            template: "<div class='col-md-12 relative-container '>" +

                "<div class='text-right pull-left width-54per'>" +
                "<a href='javascript:void(0)'  data-ng-hide='recordsCount4.hidePager' data-ng-click='recordsCount4.more()'>" +
                "   More " +
                "</a> <span class='paddingLR-10px' data-ng-hide='recordsCount4.hidePager'></span>" +
                "</a>" +
                "</div>" +
                "<div class='text-right pull-right'>" +
                "<span> Showing 1 to {{recordsCount4.displayed |number}}</span>" +
                "</div>" +


                "</div>"
        }
    })
    .directive('showRecordCount2', function () {
        return {
            restrict: 'E',
            scope: {
                total: '=',
                displayed: '=',
                more: '&',
                all: '&',
                hidePager: '@'
            },
            controllerAs: 'recordsCount2',
            bindToController: true,
            controller: ['$scope', '$attrs', function ($scope, $attrs) {
                var vm = this;

                $attrs.$observe('hidePager', function (val) {
                    vm.hidePager = !(val == "true");
                });

                (function () {
                    if (utils.isEmptyVal(vm.hidePager)) {
                        vm.hidePager = false;
                    }
                })();
            }],
            template: "<div class='col-md-12 relative-container '>" +

                "<div class='text-right pull-left width-54per'>" +
                "<a href='javascript:void(0)'  data-ng-hide='recordsCount2.hidePager' data-ng-click='recordsCount2.more()'>" +
                "   More " +
                "</a> <span class='paddingLR-10px' data-ng-hide='recordsCount2.hidePager'>|</span>" +
                "<a href='javascript:void(0)' data-ng-hide='recordsCount2.hidePager' data-ng-click='recordsCount2.all()' >" +
                "   All" +
                "</a>" +
                "</div>" +
                "<div class='text-right pull-right'>" +
                "<span> Showing 1 to {{recordsCount2.displayed |number}}</span>" +
                "</div>" +


                "</div>"
        }
    })
    .directive('allNotification', ['$timeout', function ($timeout) {

        return {
            replace: true,
            templateUrl: 'notificationshtml',
            scope: {
                dataset: '='
            }
        }
    }])
    .factory('notificationUtils', function ($state, $rootScope, notificationDatalayer, tasksHelper, IntakeTasksHelper, intakeEventsHelper, eventsHelper, toaster) {

        return {
            goTo: goTo,
            goToMatter: goToMatter,
            goToIntake: goToIntake,
            goToEventTask: goToEventTask,
            goToClientMessenger: goToClientMessenger,
            goToSidebarPost: goToSidebarPost,
            goToEmail: goToEmail
        };

        function goTo(noti, e, fromToast, fromBell) {
            if (noti.notification_type == "Event_Reminder" || noti.notification_type == "Task_Reminder" ||
                noti.notification_type == "Event" || noti.notification_type == "Task") {
                if (noti.matter_id > 0) {
                    goToEventTask(noti);
                    markRead(noti, fromToast);
                }
            }

            if (noti.notification_type == "Matter") {
                if (noti.matter_id > 0) {
                    goToMatter(noti);
                    markRead(noti, fromToast);
                }
            }

            if (noti.notification_type == "Intake") {
                if (noti.matter_id > 0) {
                    goToIntake(noti);
                    markRead(noti, fromToast);
                }
            }

            if (noti.notification_type == "Sidebar_Comment") {
                goToSidebarPost(noti, e);
                markRead(noti, fromToast);
            }
            if (noti.notification_type == "Sidebar_Post") {
                goToSidebarPost(noti, e);
                markRead(noti, fromToast);
            }

            if (noti.notification_type == "Email") {
                goToEmail(noti, e);
                markRead(noti, fromToast);
            }
            if (noti.notification_type == "Client_Messenger") {
                goToClientMessenger(noti, e);
                markRead(noti, fromToast);
            }
            if (fromBell && noti.matter_id > 0) {
                $rootScope.$broadcast("closeBell");
            }

        }

        function markRead(noti, fromToast) {
            if (noti.toast) {
                toaster.clear(null, noti.toast.toastId);
            }
            if (noti.is_seen == 0) {
                notificationDatalayer.markRead(noti.notification_id).then(function () {
                    if (fromToast) {
                        $rootScope.$broadcast("notificationToastViewed", noti, fromToast);
                    } else {
                        $rootScope.$broadcast("notificationToastViewed", noti);
                    }
                }, function (res) { });
            }
        }

        function goToMatter(matterId) {
            $state.go('add-overview', { matterId: matterId.matter_id }, { reload: true });
        }

        function goToIntake(intakeId) {
            $state.go('intake-overview', { intakeId: intakeId.matter_id }, { reload: true });
        }

        function goToEventTask(selectedTask) {
            if (selectedTask.type == "task") {
                if (selectedTask.is_intake == '1') {
                    selectedTask.percentagecomplete = 0;
                    selectedTask.percentage_complete = 0;
                    selectedTask['intake_task_id'] = parseInt(selectedTask.id);
                    selectedTask['due_date'] = selectedTask.start_date;
                    IntakeTasksHelper.setSavedTask(selectedTask);
                    $state.go('intaketasks', { intakeId: selectedTask.matter_id }, {
                        reload: true
                    });
                } else if (selectedTask.is_intake == '0') {
                    selectedTask.percentagecomplete = 0;
                    selectedTask.percentage_complete = 0;
                    selectedTask.task_id = selectedTask.id;
                    selectedTask.due_date = selectedTask.start_date;
                    tasksHelper.setSavedTask_notification(selectedTask);
                    $state.go('tasks', { matterId: selectedTask.matter_id }, {
                        reload: true
                    });
                }

            } else if (selectedTask.type == "event") {
                if (selectedTask.is_intake == '1') {
                    selectedTask.event_id = selectedTask.id;
                    intakeEventsHelper.setSelectedEvent(selectedTask);
                    $state.go('intakeevents', { intakeId: selectedTask.matter_id }, {
                        reload: true
                    });
                } else if (selectedTask.is_intake == '0') {
                    selectedTask.event_id = selectedTask.id;
                    eventsHelper.setSelectedEvent(selectedTask);
                    $state.go('events', { matterId: selectedTask.matter_id }, {
                        reload: true
                    });
                }

            }


        }

        function goToClientMessenger(notify, e) {
            $rootScope.$emit("closeBell");
            if ($state.current.name == 'launcher') {
                sessionStorage.setItem('fromNotification', true);
                $rootScope.loadPage('Sidebar', { nid: notify.sub_event_id }, 'fromNotification');
            } else {
                $state.go('launcher');
                setTimeout(function () {
                    sessionStorage.setItem('fromNotification', true);
                    $rootScope.loadPage('Sidebar', { nid: notify.sub_event_id}, 'fromNotification');
                }, 1700);

            }
        }

        function goToSidebarPost(notify, e) {
            if ($state.current.name == 'launcher') {
                sessionStorage.setItem('fromNotification', true);
                $rootScope.loadPage('Sidebar', { nid: notify.nid });
            } else {
                $state.go('launcher');
                setTimeout(function () {
                    sessionStorage.setItem('fromNotification', true);
                    $rootScope.loadPage('Sidebar', { nid: notify.nid });
                }, 1700);
            }
        }

        function goToEmail(notify, e) {
            if ($state.current.name == 'launcher') {
                sessionStorage.setItem('fromNotificationtab', true);
                $rootScope.loadPage('Mailbox', { eid: notify.id });
            } else {
                $state.go('launcher');
                setTimeout(function () {
                    sessionStorage.setItem('fromNotificationtab', true);
                    $rootScope.loadPage('Mailbox', { eid: notify.id });
                }, 1700);
            }


        }

    })
    .directive('notificationListHtml', ['notification-service', function (notificationService) {
        return {
            replace: true,
            templateUrl: 'app/components/header/notification-list.html',
            scope: {
                dataset: '=',
                selectedNotifications: '=',
                showSelect: '=',
                searchTerm: '='
            },
            controller: function ($rootScope, $scope, notificationDatalayer, notificationUtils, modalService) {
                var vm = this;
                $scope.goTo = notificationUtils.goTo;

                $scope.isNotificationSelected = function (id) {
                    if ($scope.selectedNotifications) {
                        return $scope.selectedNotifications.indexOf(id) > -1;
                    } else {
                        return false;
                    }
                }

                $scope.toggleMenu = function (rec) {
                    _.forEach($scope.dataset, function (it) {
                        if (it.notification_id != rec.notification_id) {
                            it.notiDots = false;
                        }
                    });
                    rec.notiDots = !rec.notiDots;
                }

                $scope.dismissAllNotification = function () {
                    var actionButton = 'Dismiss';
                    var msg = 'Are you sure you want to dismiss ?';

                    var modalOptions = {
                        closeButtonText: 'Cancel',
                        actionButtonText: actionButton,
                        headerText: 'Confirmation!',
                        bodyText: msg
                    };

                    if ($scope.selectedNotifications && $scope.selectedNotifications.length > 0) {

                        modalService.showModal({}, modalOptions).then(function () {
                            notificationDatalayer.markDismiss($scope.selectedNotifications).then(function () {
                                notificationService.success("Dismissed successfully.");
                                $scope.dataset = _.filter($scope.dataset, function (v) {
                                    return !_.contains($scope.selectedNotifications, v.notification_id);
                                });
                                $scope.selectedNotifications = [];
                            }, function (res) { notificationService.error("Unable to dismiss.") });
                        });
                    } else {
                        notificationService.error("Please select a notification to dismiss.");
                    }
                }

                $scope.dismissNotification = function (rec) {
                    rec.notiDots = false;
                    notificationDatalayer.markDismiss(rec.notification_id).then(function () {
                        notificationService.success("Dismissed successfully.");
                        $scope.dataset = _.filter($scope.dataset, function (v) {
                            return rec.notification_id != v.notification_id;
                        });
                        $scope.selectedNotifications = [];
                    }, function (res) { notificationService.error("Unable to dismiss.") });
                }

                $scope.markReadNotification = function (rec) {
                    rec.notiDots = false;
                    notificationDatalayer.markRead(rec.notification_id).then(function () {
                        notificationService.success("Marked as read successfully.");
                        _.forEach($scope.dataset, function (item) {
                            if (item.notification_id == rec.notification_id) {
                                item.is_seen = 1;
                            }
                        });
                        $scope.selectedNotifications = [];
                    }, function (res) { notificationService.error("Unable to mark as read.") });
                }
            }
        }
    }])
    .directive('toastHtml', [function () {
        return {
            replace: true,
            templateUrl: 'toast.tpl.html',
            controller: ['$scope', 'toaster', 'notificationUtils', function ($scope, toaster, notificationUtils) {
                $scope.gotoNotifications = function (data, e) {
                    toaster.clear(null, $scope.toastInstance.toastId);
                    notificationUtils.goTo(data, e, true, false);
                }
            }]
        };
    }])
    .directive('showPagination2', function () {
        return {
            restrict: 'E',
            scope: {
                currentPage: '=',
                displayed: '=',
                more: '&'
            },
            controllerAs: 'recordsCount2',
            controller: ['$scope', function ($scope) {
                var vm = this;

                $scope.$watch('displayed', function (val) {
                    if (val && val.length > 0) {
                        val = val.length;
                        vm.start = $scope.currentPage == 1 ? 1 : (($scope.currentPage * 250) + 1);
                        vm.end = ($scope.currentPage == 1 ? 0 : ($scope.currentPage * 250)) + val;
                    }
                });
            }],
            templateUrl: "app/utils/custom-templates/pagination-2.html"
        }
    })
    .directive('validateExtension', function () {
        return {
            restrict: 'A',
            link: linkFn,
            require: 'ngModel'
        };

        function linkFn(scope, el, attr, ngModel) {
            var maxSize = parseInt(attr.clxMaxSize);

            ngModel.$validators.extension = function (modelVal) {
                if (utils.isEmptyVal(modelVal)) {
                    return false;
                }
                var pattern = new RegExp(/^(.+)\.(.+)$/);
                var res = pattern.test(modelVal);
                return res;
            };
        }

    }).directive('typeaheadRemoveParseError', function () {
        return {
            restrict: 'A',
            link: linkFn,
            require: 'ngModel'
        };

        function linkFn(scope, el, attr, ngModel) {
            scope.$watch(function () {
                return ngModel.$modelValue;
            }, function (newVal) {
                ngModel.$setValidity('parse', true);
            });
        }

    }).directive('hasAccess', function ($compile) {
        return {
            restrict: 'A',
            // priority: 10000,
            terminal: true,
            link: function (scope, element, attrs) {
                if (attrs.hasAccess == '0') {
                    attrs.$set('ngHide', true);
                    attrs.$set('hasAccess', null);
                    $compile(element)(scope);
                } else {
                    //   $compile(element)(scope);
                    return element;
                }
            }
        };
    }).directive('onFinishRender', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                if (scope.$last === true) {
                    $timeout(function () {
                        scope.$emit(attr.onFinishRender);
                    });
                }
            }
        }
    }).directive('isolateFormValidation', function () {
        return {
            restrict: 'A',
            require: '?form',
            link: function (scope, elm, attrs, ctrl) {
                if (!ctrl) {
                    return;
                }

                // Do a copy of the controller
                var ctrlCopy = {};
                angular.copy(ctrl, ctrlCopy);

                // Get the parent of the form
                var parent = elm.parent().controller('form');
                // Remove parent link to the controller
                parent.$removeControl(ctrl);

                // Replace form controller with a "isolated form"
                var isolatedFormCtrl = {
                    $setValidity: function (validationToken, isValid, control) {
                        ctrlCopy.$setValidity(validationToken, isValid, control);
                        parent.$setValidity(validationToken, true, ctrl);
                    },
                    $setDirty: function () {
                        elm.removeClass('ng-pristine').addClass('ng-dirty');
                        ctrl.$dirty = true;
                        ctrl.$pristine = false;
                    },
                };
                angular.extend(ctrl, isolatedFormCtrl);
            }
        };
    })
    .directive('hierarchySearch', ['HierarchyNodeService', '$timeout', '$rootScope', function (HierarchyNodeService, $timeout, $rootScope) {

        return {
            restrict: 'E',
            templateUrl: 'app/utils/custom-templates/hierarchySearch.tpl.html',
            scope: {
                dataset: '=',
                ngModel: '=',
            },
            controller: function ($scope) {
                $scope.numSelected = 0;
                //$scope.list is used by ng-tree, dataset should never be modified
                //$scope.list = angular.copy($scope.dataset);
                $scope.list = $scope.dataset;

                $scope.options = {};

                $scope.expandNode = function (n, $event) {
                    $event.stopPropagation();
                    n.toggle();
                }


                $scope.itemSelect = function (item) {
                    var rootVal = !item.isSelected;
                    HierarchyNodeService.selectChildren(item, rootVal)

                    HierarchyNodeService.findParent($scope.list[0], null, item, selectParent);
                    var s = _.compact(HierarchyNodeService.getAllChildren($scope.list[0], []).map(function (c) { return c.isSelected && !c.items; }));
                    $scope.numSelected = s.length;
                }

                function selectParent(parent) {
                    var children = HierarchyNodeService.getAllChildren(parent, []);

                    if (!children) return;
                    children = children.slice(1).map(function (c) { return c.isSelected; });

                    parent.isSelected = children.length === _.compact(children).length;
                    HierarchyNodeService.findParent($scope.list[0], null, parent, selectParent)
                }

                $scope.nodeStatus = function (node) {
                    var flattenedTree = getAllChildren(node, []);
                    flattenedTree = flattenedTree.map(function (n) { return n.isSelected });

                    return flattenedTree.length === _.compact(flattenedTree);
                }

            },
            link: function (scope, el, attr) {

                scope.$watch('pastUsersFilter', function (nv) {
                    if (_.isUndefined(nv)) return;

                    if (nv) {
                        HierarchyNodeService.trimLeafs(scope.list[0]);
                    } else {
                        scope.list = angular.copy(scope.dataset);
                    }

                });
                var inputTimeout;
                var time = 300;
                scope.$watch('searchValue', function (nv) {
                    if (!nv && nv !== '') {
                        return;
                    }
                    var previousDataset = angular.copy(scope.list);
                    var newData = (scope.searchValue === '') ? angular.copy(scope.dataset) : [HierarchyNodeService.treeSearch(angular.copy(scope.dataset[0]), scope.searchValue)];

                    if (newData.length === 1 && _.isEmpty(newData[0])) {
                        scope.emptyData = true;
                        return;
                    }

                    scope.emptyData = false;
                    if (_.isEqual(previousDataset, newData)) {
                        clearTimeout(inputTimeout);
                        return;
                    }

                    scope.list = newData;


                    $timeout.cancel(inputTimeout);
                    inputTimeout = $timeout(function () {

                        var els = document.querySelectorAll('[ui-tree-node]');

                        Array.prototype.forEach.call(els, function (el) {
                            el = angular.element(el);
                            var elScope = el.scope();
                            if (elScope.$modelValue.match) {

                                elScope.expand();

                                //loop through all parents and keep expanding until no more parents are found
                                var p = elScope.$parentNodeScope;
                                while (p) {
                                    p.expand();
                                    p = p.$parentNodeScope;

                                }
                            }
                        });
                    }, 500);
                });
                scope.$watch('list', function (nv, ov) {
                    if (!nv) return;
                    if (nv && !ov) { scope.$apply(); }

                    var arrr = [];
                    nv.forEach(function (node) {
                        arrr = arrr.concat(HierarchyNodeService.getSelected(node, []));
                    })

                    //get the ids of each element
                    scope.selected = _.pluck(arrr, 'entity');
                    //US#12586
                    scope.ngModel = scope.selected;
                    if (scope.selected.length == 5) {
                        var checked = _.every(scope.selected, function (item) {
                            return item == 'AP' || item == 'D' || item == 'MN' || item == 'MS' || item == 'DM';
                        })
                        if (checked) {
                            $rootScope.$emit('checkAll', true);
                        } else {
                            $rootScope.$emit('checkAll', false);
                        }
                    } else {
                        $rootScope.$emit('checkAll', false);
                    }

                }, true);
            }
        }
    }])
    .directive('indeterminateCheckbox', function (HierarchyNodeService) {
        return {
            restrict: 'A',
            scope: {
                node: '='
            },
            link: function (scope, element, attr) {

                scope.$watch('node', function (nv) {
                    var flattenedTree = HierarchyNodeService.getAllChildren(scope.node, []);
                    //US#12586
                    if (angular.isDefined(scope.node.isSelected)) {
                        if (scope.node.items && scope.node.items.length > 0) {
                            var checkAll = _.some(scope.node.items, function (item) {
                                return item.isSelected == false;
                            });
                            if (checkAll) {
                                scope.node.isSelected = false;
                            } else {
                                scope.node.isSelected = true;
                            }
                        }

                    }
                    flattenedTree = flattenedTree.map(function (n) { return n.isSelected });
                    var initalLength = flattenedTree.length;
                    var compactedTree = _.compact(flattenedTree);
                    var r = compactedTree.length > 0 && compactedTree.length < flattenedTree.length;
                    element.prop('indeterminate', r);

                }, true);

            }
        }
    })
    .directive('intakeHierarchySearch', ['HierarchyNodeService', '$timeout', '$rootScope', function (IntakeHierarchyNodeService, $timeout, $rootScope) {

        return {
            restrict: 'E',
            templateUrl: 'app/utils/custom-templates/intakeHierarchySearch.tpl.html',
            scope: {
                dataset: '=',
                ngModel: '=',
            },
            controller: function ($scope) {
                $scope.numSelected = 0;
                //$scope.list is used by ng-tree, dataset should never be modified
                //$scope.list = angular.copy($scope.dataset);
                $scope.intakeList = $scope.dataset;

                $scope.options = {};

                $scope.expandNode = function (n, $event) {
                    $event.stopPropagation();
                    n.toggle();
                }


                $scope.itemSelect = function (item) {
                    var rootVal = !item.isSelected;
                    IntakeHierarchyNodeService.selectChildren(item, rootVal)

                    IntakeHierarchyNodeService.findParent($scope.intakeList[0], null, item, selectParent);
                    var s = _.compact(IntakeHierarchyNodeService.getAllChildren($scope.intakeList[0], []).map(function (c) { return c.isSelected && !c.items; }));
                    $scope.numSelected = s.length;
                }

                function selectParent(parent) {
                    var children = IntakeHierarchyNodeService.getAllChildren(parent, []);

                    if (!children) return;
                    children = children.slice(1).map(function (c) { return c.isSelected; });

                    parent.isSelected = children.length === _.compact(children).length;
                    IntakeHierarchyNodeService.findParent($scope.intakeList[0], null, parent, selectParent)
                }

                $scope.nodeStatus = function (node) {
                    var flattenedTree = getAllChildren(node, []);
                    flattenedTree = flattenedTree.map(function (n) { return n.isSelected });

                    return flattenedTree.length === _.compact(flattenedTree);
                }

            },
            link: function (scope, el, attr) {

                scope.$watch('pastUsersFilter', function (nv) {
                    if (_.isUndefined(nv)) return;

                    if (nv) {
                        IntakeHierarchyNodeService.trimLeafs(scope.intakeList[0]);
                    } else {
                        scope.intakeList = angular.copy(scope.dataset);
                    }

                });
                var inputTimeout;
                var time = 300;
                scope.$watch('searchValue', function (nv) {
                    if (!nv && nv !== '') {
                        return;
                    }
                    var previousDataset = angular.copy(scope.intakeList);
                    var newData = (scope.searchValue === '') ? angular.copy(scope.dataset) : [HierarchyNodeService.treeSearch(angular.copy(scope.dataset[0]), scope.searchValue)];

                    if (newData.length === 1 && _.isEmpty(newData[0])) {
                        scope.emptyData = true;
                        return;
                    }

                    scope.emptyData = false;
                    if (_.isEqual(previousDataset, newData)) {
                        clearTimeout(inputTimeout);
                        return;
                    }

                    scope.intakeList = newData;


                    $timeout.cancel(inputTimeout);
                    inputTimeout = $timeout(function () {

                        var els = document.querySelectorAll('[ui-tree-node]');

                        Array.prototype.forEach.call(els, function (el) {
                            el = angular.element(el);
                            var elScope = el.scope();
                            if (elScope.$modelValue.match) {

                                elScope.expand();

                                //loop through all parents and keep expanding until no more parents are found
                                var p = elScope.$parentNodeScope;
                                while (p) {
                                    p.expand();
                                    p = p.$parentNodeScope;

                                }
                            }
                        });
                    }, 500);
                });
                scope.$watch('intakeList', function (nv, ov) {
                    if (!nv) return;
                    if (nv && !ov) { scope.$apply(); }

                    var arrr = [];
                    nv.forEach(function (node) {
                        arrr = arrr.concat(IntakeHierarchyNodeService.getSelected(node, []));
                    })

                    //get the ids of each element
                    scope.selected = _.pluck(arrr, 'entity');
                    //US#12586
                    scope.ngModel = scope.selected;
                    if (scope.selected.length == 3) {
                        var checked = _.every(scope.selected, function (item) {
                            return item == 'INTMT' || item == 'INTD' || item == 'INT';
                        })
                        if (checked) {
                            $rootScope.$emit('checkAllIntake', true);
                        } else {
                            $rootScope.$emit('checkAllIntake', false);
                        }
                    } else {
                        $rootScope.$emit('checkAllIntake', false);
                    }

                }, true);
            }
        }
    }])
    .directive('intakeindeterminateCheckbox', ['HierarchyNodeService', function (IntakeHierarchyNodeService) {
        return {
            restrict: 'A',
            scope: {
                node: '='
            },
            link: function (scope, element, attr) {

                scope.$watch('node', function (nv) {
                    var flattenedTree = IntakeHierarchyNodeService.getAllChildren(scope.node, []);
                    //US#12586
                    if (angular.isDefined(scope.node.isSelected)) {
                        if (scope.node.items && scope.node.items.length > 0) {
                            var checkAll = _.some(scope.node.items, function (item) {
                                return item.isSelected == false;
                            });
                            if (checkAll) {
                                scope.node.isSelected = false;
                            } else {
                                scope.node.isSelected = true;
                            }
                        }

                    }
                    flattenedTree = flattenedTree.map(function (n) { return n.isSelected });
                    var initalLength = flattenedTree.length;
                    var compactedTree = _.compact(flattenedTree);
                    var r = compactedTree.length > 0 && compactedTree.length < flattenedTree.length;
                    element.prop('indeterminate', r);

                }, true);

            }
        }
    }]);

// .directive('disableForm',function(){

//     return{
//        scope:{
//          disableForm:'=' 

//        },
//        link: function(scope, element ){
//          if(scope.disableForm){
//           angular.element('input',element).attr('disabled','disabled') ;
//          }
//        }
//      };
// });






//.service('httpService', ['$http', '$q', 'pendingRequests', function ($http, $q, pendingRequests) {
//    this.get = function (url) {
//        var canceller = $q.defer();
//        pendingRequests.add({
//            url: url,
//            canceller: canceller
//        });
//        //Request gets cancelled if the timeout-promise is resolved
//        var requestPromise = $http.get(url, { timeout: canceller.promise });
//        //Once a request has failed or succeeded, remove it from the pending list
//        requestPromise.finally(function () {
//            pendingRequests.remove(url);
//        });
//        return requestPromise;
//    }
//}]);

(function ($) {

    $.fn.clickOff = function (callback, selfDestroy) {
        var clicked = false;
        var parent = this;
        var destroy = selfDestroy || true;

        parent.click(function () {
            clicked = true;
        });

        $(document).click(function (event) {
            if (!clicked) {
                callback(parent, event);
            }
            clicked = false;
        });
    };

    // Matches trailing non-space characters.
    var chop = /(\s*\S+|\s)$/;

    // Return a truncated html string.  Delegates to $.fn.truncate.
    $.truncate = function (html, options) {
        return $('<div></div>').append(html).truncate(options).html();
    };

    // Truncate the contents of an element in place.
    $.fn.truncate = function (options) {
        if ($.isNumeric(options)) options = { length: options };
        var o = $.extend({}, $.truncate.defaults, options);

        return this.each(function () {
            var self = $(this);

            if (o.noBreaks) self.find('br').replaceWith(' ');

            var text = self.text();
            var excess = text.length - o.length;

            if (o.stripTags) self.text(text);

            // Chop off any partial words if appropriate.
            if (o.words && excess > 0) {
                excess = text.length - text.slice(0, o.length).replace(chop, '').length - 1;
            }

            if (excess < 0 || !excess && !o.truncated) return;

            // Iterate over each child node in reverse, removing excess text.
            $.each(self.contents().get().reverse(), function (i, el) {
                var $el = $(el);
                var text = $el.text();
                var length = text.length;

                // If the text is longer than the excess, remove the node and continue.
                if (length <= excess) {
                    o.truncated = true;
                    excess -= length;
                    $el.remove();
                    return;
                }

                // Remove the excess text and append the ellipsis.
                if (el.nodeType === 3) {
                    $(el.splitText(length - excess - 1)).replaceWith(o.ellipsis);
                    return false;
                }

                // Recursively truncate child nodes.
                $el.truncate($.extend(o, { length: length - excess }));
                return false;
            });
        });
    };

    $.truncate.defaults = {

        // Strip all html elements, leaving only plain text.
        stripTags: false,

        // Only truncate at word boundaries.
        words: false,

        // Replace instances of <br> with a single space.
        noBreaks: false,

        // The maximum length of the truncated html.
        length: Infinity,
        ellipsis: '\u2026' // '\u2060\u2026'

    };

})(jQuery);

(function (angular) {
    'use strict';

    var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    angular.module('scrollable-table', [])
        .directive('scrollableTable', ['$timeout', '$q', '$parse', function ($timeout, $q, $parse) {
            return {
                transclude: true,
                restrict: 'E',
                scope: {
                    rows: '=watch',
                    sortFn: '=',
                    tableid: '@',
                    to: '@',
                    from: '@'
                },
                template: '<div class="scrollableContainer" style="width:100%" id="{{tableid}}">' +
                    '<div class="headerSpacer"></div>' +
                    '<div class="scrollArea dashboard-tasks-due" ng-transclude></div>' +
                    '</div>',
                controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                    // define an API for child directives to view and modify sorting parameters

                    // Set fixed widths for the table headers in case the text overflows.
                    // There's no callback for when rendering is complete, so check the visibility of the table
                    // periodically -- see http://stackoverflow.com/questions/11125078
                    function waitForRender() {
                        var deferredRender = $q.defer();

                        function wait() {
                            if ($element.find("table:visible").length === 0) {
                                $timeout(wait, 100);
                            } else {
                                deferredRender.resolve();
                            }
                            if ($scope.rows && $scope.rows.length > 0) {
                                if ($($scope.from).offset() && $($scope.to).offset()) {
                                    var heightForGrid = ($($scope.from).offset().top - $($scope.to).offset().top);
                                    var heightToMinus = ($($scope.from).height() == 0) ? 50 : $($scope.from).height();
                                    heightForGrid = heightForGrid - heightToMinus;
                                    $('#' + $scope.tableid).css("max-height", heightForGrid + "px");
                                    $('#' + $scope.tableid).css("height", heightForGrid + "px");
                                }

                                $('[data-toggle*="-tooltip"]').tooltip();
                            } else {
                                // $('#' + $scope.tableid).css("max-height", 0 + "px");
                                // $('#' + $scope.tableid).css("height", 0 + "px");
                            }

                        }

                        $timeout(wait);
                        return deferredRender.promise;
                    }

                    var headersAreFixed = $q.defer();

                    function fixHeaderWidths() {
                        if (!$element.find("thead th .th-inner").length) {
                            $element.find("thead th").wrapInner('<div class="th-inner"></div>');
                        }
                        if ($element.find("thead th .th-inner:not(:has(.box))").length) {
                            $element.find("thead th .th-inner:not(:has(.box))").wrapInner('<div class="box"></div>');
                        }

                        $element.find("table th .th-inner:visible").each(function (index, el) {
                            el = angular.element(el);
                            var width = el.parent().width(),
                                lastCol = $element.find("table th:visible:last"),
                                headerWidth = width;
                            if (lastCol.css("text-align") !== "center") {
                                var hasScrollbar = $element.find(".scrollArea").height() < $element.find("table").height();
                                if (lastCol[0] == el.parent()[0] && hasScrollbar) {
                                    headerWidth += $element.find(".scrollArea").width() - $element.find("tbody tr").width();
                                    headerWidth = Math.max(headerWidth, width);
                                }
                            }
                            var minWidth = _getScale(el.parent().css('min-width')),
                                title = el.parent().attr("title");
                            headerWidth = Math.max(minWidth, headerWidth);
                            el.css("width", headerWidth);
                            // if (!title) {
                            //   // ordinary column(not sortableHeader) has box child div element that contained title string.
                            //   title = el.find(".title .ng-scope").text() || el.find(".box").text();
                            // }
                            // el.attr("title", title.trim());
                        });
                        headersAreFixed.resolve();
                    }

                    // when the data model changes, fix the header widths.  See the comments here:
                    // http://docs.angularjs.org/api/ng.$timeout
                    $scope.$watch('rows', function (newValue, oldValue) {
                        if (newValue && newValue.length > 0) {
                            renderChains($element.find('.scrollArea').width());
                            // FIXME what is the reason here must scroll to top? This may cause confusing if using scrolling to implement pagination.
                            $element.find('.scrollArea').scrollTop(0);
                        } else {
                            $('#' + $scope.tableid).css("max-height", 0 + "px");
                            $('#' + $scope.tableid).css("height", 0 + "px");
                        }
                    });

                    var headerElementToFakeScroll = isFirefox ? "thead" : "thead th .th-inner";
                    $element.find(".scrollArea").on("scroll", function (event) {
                        $element.find(headerElementToFakeScroll).css('margin-left', 0 - event.target.scrollLeft);
                    });

                    var onResizeCallback = function () {
                        $timeout(function () {
                            $scope.$apply();
                        });
                    };
                    angular.element(window).on('resize', onResizeCallback);
                    $scope.$on('$destroy', function () {
                        angular.element(window).off('resize', onResizeCallback);
                    });

                    function renderChains() {
                        var resizeQueue = waitForRender().then(fixHeaderWidths),
                            customHandlers = $scope.headerResizeHanlers || [];
                        return resizeQueue;
                    }
                }]
            };
        }])
        .directive('scrollTable', ['$timeout', '$q', function ($timeout, $q) {
            return {
                transclude: true,
                restrict: 'E',
                scope: {
                    rows: '=watch',
                    tableid: '@',
                    to: '@',
                    from: '@',
                    tagList: '=tag',
                    sort: '=sort',
                    tabselected: "=tabselected"
                },
                template: '<div ng-transclude class="" style="width:100%" id="{{tableid}}">' +
                    '</div>',
                controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {

                    function waitForRender() {
                        var deferredRender = $q.defer();

                        function wait() {
                            if ($element.find("table:visible").length === 0) {
                                $timeout(wait, 100);
                            } else {
                                deferredRender.resolve();
                            }
                            if ($scope.rows && $scope.rows.length > 0) {
                                if ($($scope.from).offset() && $($scope.to).offset()) {
                                    var heightForGrid = ($($scope.from).offset().top - $($scope.to).offset().top) - 32;
                                    heightForGrid = heightForGrid - $($scope.from).height() - $('#' + $scope.tableid + ' thead').height();
                                    $('#' + $scope.tableid + ' tbody').css("max-height", heightForGrid + "px");
                                    $('#' + $scope.tableid + ' tbody').css("height", heightForGrid + "px");
                                }

                                $('[data-toggle*="-tooltip"]').tooltip();
                            }
                        }
                        $timeout(wait);
                        return deferredRender.promise;
                    }

                    $scope.$watch('tagList', function (newValue, oldValue) {
                        var id = '#' + $scope.tableid;
                        $(id + ' .dashboard-tasks-due').animate({ scrollTop: 0 }, "slow");
                    });

                    $scope.$watch('sort', function (newValue, oldValue) {
                        var id = '#' + $scope.tableid;
                        $(id + ' .dashboard-tasks-due').animate({ scrollTop: 0 }, "slow");
                    });

                    $scope.$watch('tabselected', function (newValue, oldValue) {
                        var id = '#' + $scope.tableid;
                        $(id + ' .dashboard-tasks-due').animate({ scrollTop: 0 }, "slow");
                    });

                    $scope.$watch('rows', function (newValue, oldValue) {
                        if (newValue && newValue.length > 0) {
                            renderChains();
                        } else {
                            $('#' + $scope.tableid + ' tbody').css("max-height", 0 + "px");
                            $('#' + $scope.tableid + ' tbody').css("height", 0 + "px");
                        }
                    });

                    function renderChains() {
                        var resizeQueue = waitForRender();
                        return resizeQueue;
                    }
                }]
            };
        }])

        .directive('scrollTableIntake', ['$timeout', '$q', function ($timeout, $q) {
            return {
                transclude: true,
                restrict: 'E',
                scope: {
                    rows: '=watch',
                    tableid: '@',
                    to: '@',
                    from: '@',
                    tagList: '=tag',
                    sort: '=sort',
                    tabselected: "=tabselected"
                },
                template: '<div ng-transclude class="" style="width:100%" id="{{tableid}}">' +
                    '</div>',
                controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {

                    function waitForRender() {
                        var deferredRender = $q.defer();

                        function wait() {
                            if ($element.find("table:visible").length === 0) {
                                $timeout(wait, 100);
                            } else {
                                deferredRender.resolve();
                            }
                            if ($scope.rows && $scope.rows.length > 0) {
                                if ($($scope.from).offset() && $($scope.to).offset()) {
                                    var heightForGrid = ($($scope.from).offset().top - $($scope.to).offset().top);
                                    heightForGrid = heightForGrid - $($scope.from).height() - $('#' + $scope.tableid + ' thead').height();
                                    $('#' + $scope.tableid + ' tbody').css("max-height", heightForGrid + "px");
                                    $('#' + $scope.tableid + ' tbody').css("height", heightForGrid + "px");
                                }

                                $('[data-toggle*="-tooltip"]').tooltip();
                            }
                        }
                        $timeout(wait);
                        return deferredRender.promise;
                    }

                    $scope.$watch('tagList', function (newValue, oldValue) {
                        var id = '#' + $scope.tableid;
                        $(id + ' .dashboard-tasks-due').animate({ scrollTop: 0 }, "slow");
                    });

                    $scope.$watch('sort', function (newValue, oldValue) {
                        var id = '#' + $scope.tableid;
                        $(id + ' .dashboard-tasks-due').animate({ scrollTop: 0 }, "slow");
                    });

                    $scope.$watch('tabselected', function (newValue, oldValue) {
                        var id = '#' + $scope.tableid;
                        $(id + ' .dashboard-tasks-due').animate({ scrollTop: 0 }, "slow");
                    });

                    $scope.$watch('rows', function (newValue, oldValue) {
                        if (newValue && newValue.length > 0) {
                            renderChains();
                        } else {
                            $('#' + $scope.tableid + ' tbody').css("max-height", 0 + "px");
                            $('#' + $scope.tableid + ' tbody').css("height", 0 + "px");
                        }
                    });

                    function renderChains() {
                        var resizeQueue = waitForRender();
                        return resizeQueue;
                    }
                }]
            };
        }]);

    function _getScale(sizeCss) {
        return parseInt(sizeCss.replace(/px|%/, ''), 10);
    }
})(angular);

(function (angular) {
    'use strict';

    var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    angular.module('cloudlex.filters')
        .directive('dynamicHeight', function () {
            return {
                restrict: 'A',
                link: function link(scope, element, attributes) {
                    setTimeout(function () {

                        scope.$watch(attributes.trigger, function (val) {
                            var finalHeight = "75vh;"
                            if (val > 0) {
                                var heightForGrid = ($(attributes.to).offset().top - $(attributes.from).offset().top);
                                heightForGrid = heightForGrid - $(attributes.to).height();
                                finalHeight = heightForGrid + "px";

                            } else if (val == 0) {
                                var heightForGrid = ($(attributes.to).offset().top - $(attributes.from).offset().top);
                                heightForGrid = heightForGrid - $(attributes.to).height();
                                finalHeight = heightForGrid + "px";
                            }
                            $('#' + attributes.id).css("max-height", finalHeight);
                            $('#' + attributes.id).css("height", finalHeight);
                        });
                    });
                }
            };
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('colorpicker.module', [])
        .factory('Helper', function () {
            return {
                closestSlider: function (elem) {
                    var matchesSelector = elem.matches || elem.webkitMatchesSelector || elem.mozMatchesSelector || elem.msMatchesSelector;
                    if (matchesSelector.bind(elem)('I')) {
                        return elem.parentNode;
                    }
                    return elem;
                },
                getOffset: function (elem, fixedPosition) {
                    var
                        x = 0,
                        y = 0,
                        scrollX = 0,
                        scrollY = 0;
                    while (elem && !isNaN(elem.offsetLeft) && !isNaN(elem.offsetTop)) {
                        x += elem.offsetLeft;
                        y += elem.offsetTop;
                        if (!fixedPosition && elem.tagName === 'BODY') {
                            scrollX += document.documentElement.scrollLeft || elem.scrollLeft;
                            scrollY += document.documentElement.scrollTop || elem.scrollTop;
                        } else {
                            scrollX += elem.scrollLeft;
                            scrollY += elem.scrollTop;
                        }
                        elem = elem.offsetParent;
                    }
                    return {
                        top: y,
                        left: x,
                        scrollX: scrollX,
                        scrollY: scrollY
                    };
                },
                // a set of RE's that can match strings and generate color tuples. https://github.com/jquery/jquery-color/
                stringParsers: [{
                    re: /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
                    parse: function (execResult) {
                        return [
                            execResult[1],
                            execResult[2],
                            execResult[3],
                            execResult[4]
                        ];
                    }
                },
                {
                    re: /rgba?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
                    parse: function (execResult) {
                        return [
                            2.55 * execResult[1],
                            2.55 * execResult[2],
                            2.55 * execResult[3],
                            execResult[4]
                        ];
                    }
                },
                {
                    re: /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/,
                    parse: function (execResult) {
                        return [
                            parseInt(execResult[1], 16),
                            parseInt(execResult[2], 16),
                            parseInt(execResult[3], 16)
                        ];
                    }
                },
                {
                    re: /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/,
                    parse: function (execResult) {
                        return [
                            parseInt(execResult[1] + execResult[1], 16),
                            parseInt(execResult[2] + execResult[2], 16),
                            parseInt(execResult[3] + execResult[3], 16)
                        ];
                    }
                }
                ]
            };
        })
        .factory('Color', ['Helper', function (Helper) {
            return {
                value: {
                    h: 1,
                    s: 1,
                    b: 1,
                    a: 1
                },
                // translate a format from Color object to a string
                'rgb': function () {
                    var rgb = this.toRGB();
                    return 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
                },
                'rgba': function () {
                    var rgb = this.toRGB();
                    return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + rgb.a + ')';
                },
                'hex': function () {
                    return this.toHex();
                },

                // HSBtoRGB from RaphaelJS
                RGBtoHSB: function (r, g, b, a) {
                    r /= 255;
                    g /= 255;
                    b /= 255;

                    var H, S, V, C;
                    V = Math.max(r, g, b);
                    C = V - Math.min(r, g, b);
                    H = (C === 0 ? null :
                        V == r ? (g - b) / C :
                            V == g ? (b - r) / C + 2 :
                                (r - g) / C + 4
                    );
                    H = ((H + 360) % 6) * 60 / 360;
                    S = C === 0 ? 0 : C / V;
                    return { h: H || 1, s: S, b: V, a: a || 1 };
                },

                //parse a string to HSB
                setColor: function (val) {
                    val = val.toLowerCase();
                    for (var key in Helper.stringParsers) {
                        if (Helper.stringParsers.hasOwnProperty(key)) {
                            var parser = Helper.stringParsers[key];
                            var match = parser.re.exec(val),
                                values = match && parser.parse(match),
                                space = parser.space || 'rgba';
                            if (values) {
                                this.value = this.RGBtoHSB.apply(null, values);
                                return false;
                            }
                        }
                    }
                },

                setHue: function (h) {
                    this.value.h = 1 - h;
                },

                setSaturation: function (s) {
                    this.value.s = s;
                },

                setLightness: function (b) {
                    this.value.b = 1 - b;
                },

                setAlpha: function (a) {
                    this.value.a = parseInt((1 - a) * 100, 10) / 100;
                },

                // HSBtoRGB from RaphaelJS
                // https://github.com/DmitryBaranovskiy/raphael/
                toRGB: function (h, s, b, a) {
                    if (!h) {
                        h = this.value.h;
                        s = this.value.s;
                        b = this.value.b;
                    }
                    h *= 360;
                    var R, G, B, X, C;
                    h = (h % 360) / 60;
                    C = b * s;
                    X = C * (1 - Math.abs(h % 2 - 1));
                    R = G = B = b - C;

                    h = ~~h;
                    R += [C, X, 0, 0, X, C][h];
                    G += [X, C, C, X, 0, 0][h];
                    B += [0, 0, X, C, C, X][h];
                    return {
                        r: Math.round(R * 255),
                        g: Math.round(G * 255),
                        b: Math.round(B * 255),
                        a: a || this.value.a
                    };
                },

                toHex: function (h, s, b, a) {
                    var rgb = this.toRGB(h, s, b, a);
                    return '#' + ((1 << 24) | (parseInt(rgb.r, 10) << 16) | (parseInt(rgb.g, 10) << 8) | parseInt(rgb.b, 10)).toString(16).substr(1);
                }
            };
        }])
        .factory('Slider', ['Helper', function (Helper) {
            var
                slider = {
                    maxLeft: 0,
                    maxTop: 0,
                    callLeft: null,
                    callTop: null,
                    knob: {
                        top: 0,
                        left: 0
                    }
                },
                pointer = {};

            return {
                getSlider: function () {
                    return slider;
                },
                getLeftPosition: function (event) {
                    return Math.max(0, Math.min(slider.maxLeft, slider.left + ((event.pageX || pointer.left) - pointer.left)));
                },
                getTopPosition: function (event) {
                    return Math.max(0, Math.min(slider.maxTop, slider.top + ((event.pageY || pointer.top) - pointer.top)));
                },
                setSlider: function (event, fixedPosition) {
                    var
                        target = Helper.closestSlider(event.target),
                        targetOffset = Helper.getOffset(target, fixedPosition);
                    slider.knob = target.children[0].style;
                    slider.left = event.pageX - targetOffset.left - window.pageXOffset + targetOffset.scrollX;
                    slider.top = event.pageY - targetOffset.top - window.pageYOffset + targetOffset.scrollY;

                    pointer = {
                        left: event.pageX,
                        top: event.pageY
                    };
                },
                setSaturation: function (event, fixedPosition) {
                    slider = {
                        maxLeft: 100,
                        maxTop: 100,
                        callLeft: 'setSaturation',
                        callTop: 'setLightness'
                    };
                    this.setSlider(event, fixedPosition)
                },
                setHue: function (event, fixedPosition) {
                    slider = {
                        maxLeft: 0,
                        maxTop: 100,
                        callLeft: false,
                        callTop: 'setHue'
                    };
                    this.setSlider(event, fixedPosition)
                },
                setAlpha: function (event, fixedPosition) {
                    slider = {
                        maxLeft: 0,
                        maxTop: 100,
                        callLeft: false,
                        callTop: 'setAlpha'
                    };
                    this.setSlider(event, fixedPosition)
                },
                setKnob: function (top, left) {
                    slider.knob.top = top + 'px';
                    slider.knob.left = left + 'px';
                }
            };
        }])
        .directive('colorpicker', ['$document', '$compile', 'Color', 'Slider', 'Helper', function ($document, $compile, Color, Slider, Helper) {
            return {
                require: '?ngModel',
                restrict: 'A',
                link: function ($scope, elem, attrs, ngModel) {
                    var
                        thisFormat = attrs.colorpicker ? attrs.colorpicker : 'hex',
                        position = angular.isDefined(attrs.colorpickerPosition) ? attrs.colorpickerPosition : 'bottom',
                        fixedPosition = angular.isDefined(attrs.colorpickerFixedPosition) ? attrs.colorpickerFixedPosition : false,
                        target = angular.isDefined(attrs.colorpickerParent) ? elem.parent() : angular.element(document.body),
                        withInput = angular.isDefined(attrs.colorpickerWithInput) ? attrs.colorpickerWithInput : false,
                        inputTemplate = withInput ? '<input type="text" name="colorpicker-input">' : '',
                        template =
                            '<div class="colorpicker dropdown">' +
                            '<div class="dropdown-menu">' +
                            '<colorpicker-saturation><i></i></colorpicker-saturation>' +
                            '<colorpicker-hue><i></i></colorpicker-hue>' +
                            '<colorpicker-alpha><i></i></colorpicker-alpha>' +
                            '<colorpicker-preview></colorpicker-preview>' +
                            inputTemplate +
                            '<button class="close close-colorpicker">&times;</button>' +
                            '</div>' +
                            '</div>',
                        colorpickerTemplate = angular.element(template),
                        pickerColor = Color,
                        sliderAlpha,
                        sliderHue = colorpickerTemplate.find('colorpicker-hue'),
                        sliderSaturation = colorpickerTemplate.find('colorpicker-saturation'),
                        colorpickerPreview = colorpickerTemplate.find('colorpicker-preview'),
                        pickerColorPointers = colorpickerTemplate.find('i');

                    $compile(colorpickerTemplate)($scope);

                    if (withInput) {
                        var pickerColorInput = colorpickerTemplate.find('input');
                        pickerColorInput
                            .on('mousedown', function () {
                                event.stopPropagation();
                            })
                            .on('keyup', function (event) {
                                var newColor = this.value;
                                elem.val(newColor);
                                if (ngModel) {
                                    $scope.$apply(ngModel.$setViewValue(newColor));
                                }
                                event.stopPropagation();
                                event.preventDefault();
                            });
                        elem.on('keyup', function () {
                            pickerColorInput.val(elem.val());
                        });
                    }

                    var bindMouseEvents = function () {
                        $document.on('mousemove', mousemove);
                        $document.on('mouseup', mouseup);
                    };

                    if (thisFormat === 'rgba') {
                        colorpickerTemplate.addClass('alpha');
                        sliderAlpha = colorpickerTemplate.find('colorpicker-alpha');
                        sliderAlpha
                            .on('click', function (event) {
                                Slider.setAlpha(event, fixedPosition);
                                mousemove(event);
                            })
                            .on('mousedown', function (event) {
                                Slider.setAlpha(event, fixedPosition);
                                bindMouseEvents();
                            });
                    }

                    sliderHue
                        .on('click', function (event) {
                            Slider.setHue(event, fixedPosition);
                            mousemove(event);
                        })
                        .on('mousedown', function (event) {
                            Slider.setHue(event, fixedPosition);
                            bindMouseEvents();
                        });

                    sliderSaturation
                        .on('click', function (event) {
                            Slider.setSaturation(event, fixedPosition);
                            mousemove(event);
                        })
                        .on('mousedown', function (event) {
                            Slider.setSaturation(event, fixedPosition);
                            bindMouseEvents();
                        });

                    if (fixedPosition) {
                        colorpickerTemplate.addClass('colorpicker-fixed-position');
                    }

                    colorpickerTemplate.addClass('colorpicker-position-' + position);

                    target.append(colorpickerTemplate);

                    if (ngModel) {
                        ngModel.$render = function () {
                            elem.val(ngModel.$viewValue);
                        };
                        $scope.$watch(attrs.ngModel, function () {
                            update();
                        });
                    }

                    elem.on('$destroy', function () {
                        colorpickerTemplate.remove();
                    });

                    var previewColor = function () {
                        try {
                            colorpickerPreview.css('backgroundColor', pickerColor[thisFormat]());
                        } catch (e) {
                            colorpickerPreview.css('backgroundColor', pickerColor.toHex());
                        }
                        sliderSaturation.css('backgroundColor', pickerColor.toHex(pickerColor.value.h, 1, 1, 1));
                        if (thisFormat === 'rgba') {
                            sliderAlpha.css.backgroundColor = pickerColor.toHex();
                        }
                    };

                    var mousemove = function (event) {
                        var
                            left = Slider.getLeftPosition(event),
                            top = Slider.getTopPosition(event),
                            slider = Slider.getSlider();

                        Slider.setKnob(top, left);

                        if (slider.callLeft) {
                            pickerColor[slider.callLeft].call(pickerColor, left / 100);
                        }
                        if (slider.callTop) {
                            pickerColor[slider.callTop].call(pickerColor, top / 100);
                        }
                        previewColor();
                        var newColor = pickerColor[thisFormat]();
                        elem.val(newColor);
                        if (ngModel) {
                            $scope.$apply(ngModel.$setViewValue(newColor));
                        }
                        if (withInput) {
                            pickerColorInput.val(newColor);
                        }
                        return false;
                    };

                    var mouseup = function () {
                        $document.off('mousemove', mousemove);
                        $document.off('mouseup', mouseup);
                    };

                    var update = function () {
                        pickerColor.setColor(elem.val());
                        pickerColorPointers.eq(0).css({
                            left: pickerColor.value.s * 100 + 'px',
                            top: 100 - pickerColor.value.b * 100 + 'px'
                        });
                        pickerColorPointers.eq(1).css('top', 100 * (1 - pickerColor.value.h) + 'px');
                        pickerColorPointers.eq(2).css('top', 100 * (1 - pickerColor.value.a) + 'px');
                        previewColor();
                    };

                    var getColorpickerTemplatePosition = function () {
                        var
                            positionValue,
                            positionOffset = Helper.getOffset(elem[0]);

                        if (angular.isDefined(attrs.colorpickerParent)) {
                            positionOffset.left = 0;
                            positionOffset.top = 0;
                        }

                        if (position === 'top') {
                            positionValue = {
                                'top': positionOffset.top - 147,
                                'left': positionOffset.left
                            };
                        } else if (position === 'right') {
                            positionValue = {
                                'top': positionOffset.top,
                                'left': positionOffset.left + 126
                            };
                        } else if (position === 'bottom') {
                            positionValue = {
                                'top': positionOffset.top + elem[0].offsetHeight + 2,
                                'left': positionOffset.left
                            };
                        } else if (position === 'left') {
                            positionValue = {
                                'top': positionOffset.top,
                                'left': positionOffset.left - 150
                            };
                        }
                        return {
                            'top': positionValue.top + 'px',
                            'left': positionValue.left + 'px'
                        };
                    };

                    var documentMousedownHandler = function () {
                        hideColorpickerTemplate();
                    };

                    elem.on('click', function () {
                        update();
                        colorpickerTemplate
                            .addClass('colorpicker-visible')
                            .css(getColorpickerTemplatePosition());

                        // register global mousedown event to hide the colorpicker
                        $document.on('mousedown', documentMousedownHandler);
                    });

                    colorpickerTemplate.on('mousedown', function (event) {
                        event.stopPropagation();
                        event.preventDefault();
                    });

                    var hideColorpickerTemplate = function () {
                        if (colorpickerTemplate.hasClass('colorpicker-visible')) {
                            colorpickerTemplate.removeClass('colorpicker-visible');

                            // unregister the global mousedown event
                            $document.off('mousedown', documentMousedownHandler);
                        }
                    };

                    colorpickerTemplate.find('button').on('click', function () {
                        hideColorpickerTemplate();
                    });
                }
            };
        }]);



    'use strict';
    angular.module('wysiwyg.module', ['colorpicker.module'])
        .directive('wysiwyg', function ($timeout) {
            return {
                templateUrl: "app/utils/custom-templates/wysiwyg-template.html",
                restrict: 'E',
                scope: {
                    value: '=ngModel',
                    textareaHeight: '@textareaHeight',
                    textareaName: '@textareaName',
                    textareaPlaceholder: '@textareaPlaceholder',
                    textareaClass: '@textareaClass',
                    textareaRequired: '@textareaRequired',
                    textareaId: '@textareaId',
                    formData: '=formData',
                    readOnly: '@readOnlyField',
                    maxChars: '@maxChars'
                },
                replace: true,
                require: 'ngModel',
                link: function (scope, element, attrs, ngModelController) {

                    var textarea = element.find('div.wysiwyg-textarea');
                    scope.maxChars = scope.maxChars ? maxChars : "64000";
                    scope.readOnly = scope.readOnly ? scope.readOnly : "false";

                    scope.fonts = [
                        'Georgia',
                        'Palatino Linotype',
                        'Times New Roman',
                        'Arial',
                        'Helvetica',
                        'Arial Black',
                        'Comic Sans MS',
                        'Impact',
                        'Lucida Sans Unicode',
                        'Tahoma',
                        'Trebuchet MS',
                        'Verdana',
                        'Courier New',
                        'Lucida Console',
                        'Helvetica Neue'
                    ].sort();

                    scope.font = scope.fonts[6];

                    scope.fontSizes = [{
                        value: '1',
                        size: '10px'
                    },
                    {
                        value: '2',
                        size: '13px'
                    },
                    {
                        value: '3',
                        size: '16px'
                    },
                    {
                        value: '4',
                        size: '18px'
                    },
                    {
                        value: '5',
                        size: '24px'
                    },
                    {
                        value: '6',
                        size: '32px'
                    },
                    {
                        value: '7',
                        size: '48px'
                    }
                    ];

                    scope.fontSize = scope.fontSizes[1];

                    if (attrs.enableBootstrapTitle === "true" && attrs.enableBootstrapTitle !== undefined)
                        element.find('button[title]').tooltip({ container: 'body' })

                    textarea.bind('paste', null, function (eventData) {
                        if (!eventData.keyCode) {
                            scope.$apply(function readViewText() {

                                setTimeout(function () {
                                    var existingHtml = angular.element(eventData.currentTarget).html();
                                    var text = "";
                                    if (typeof eventData.originalEvent.clipboardData !== "undefined") {
                                        text = existingHtml + eventData.originalEvent.clipboardData.getData('text/html');
                                    } else { // To support browsers without clipboard API (IE and older browsers)
                                        text = existingHtml + angular.element(eventData.currentTarget).html();
                                    }
                                    ngModelController.$setViewValue(text);
                                    scope.formData.$setViewValue(text);
                                }, 100);
                            });
                        }
                    });
                    textarea.on('keyup mouseup', function () {
                        scope.$apply(function readViewText() {
                            var html = textarea.html();

                            if (html == '<br>') {
                                html = '';
                            }

                            ngModelController.$setViewValue(html);
                        });
                    });
                    scope.isLink = false;


                    //Used to detect things like A tags and others that dont work with cmdValue().
                    function itemIs(tag) {
                        var selection = window.getSelection().getRangeAt(0);
                        if (selection) {
                            if (selection.startContainer.parentNode.tagName === tag.toUpperCase() || selection.endContainer.parentNode.tagName === tag.toUpperCase()) {
                                return true;
                            } else { return false; }
                        } else { return false; }
                    }

                    //Used to detect things like A tags and others that dont work with cmdValue().
                    function getHiliteColor() {
                        var selection = window.getSelection().getRangeAt(0);
                        if (selection) {
                            var style = $(selection.startContainer.parentNode).attr('style');

                            if (!angular.isDefined(style))
                                return false;

                            var a = style.split(';');
                            for (var i = 0; i < a.length; i++) {
                                var s = a[i].split(':');
                                if (s[0] === 'background-color')
                                    return s[1];
                            }
                            return '#fff';
                        } else {
                            return '#fff';
                        }
                    }


                    textarea.on('click keyup focus mouseup', function () {
                        $timeout(function () {
                            scope.isBold = scope.cmdState('bold');
                            scope.isUnderlined = scope.cmdState('underline');
                            scope.isStrikethrough = scope.cmdState('strikethrough');
                            scope.isItalic = scope.cmdState('italic');
                            scope.isSuperscript = itemIs('SUP'); //scope.cmdState('superscript');
                            scope.isSubscript = itemIs('SUB'); //scope.cmdState('subscript');	
                            scope.isRightJustified = scope.cmdState('justifyright');
                            scope.isLeftJustified = scope.cmdState('justifyleft');
                            scope.isCenterJustified = scope.cmdState('justifycenter');
                            scope.isPre = scope.cmdValue('formatblock') == "pre";
                            scope.isBlockquote = scope.cmdValue('formatblock') == "blockquote";

                            scope.isOrderedList = scope.cmdState('insertorderedlist');
                            scope.isUnorderedList = scope.cmdState('insertunorderedlist');

                            scope.fonts.forEach(function (v, k) { //works but kinda crappy.
                                if (scope.cmdValue('fontname').indexOf(v) > -1) {
                                    scope.font = v;
                                    return false;
                                }
                            });

                            scope.fontSizes.forEach(function (v, k) {
                                if (scope.cmdValue('fontsize') === v.value) {
                                    scope.fontSize = v;
                                    return false;
                                }
                            })

                            scope.hiliteColor = getHiliteColor();
                            element.find('button.wysiwyg-hiliteColor').css("background-color", scope.hiliteColor);

                            scope.fontColor = scope.cmdValue('forecolor');
                            element.find('button.wysiwyg-fontcolor').css("color", scope.fontColor);

                            scope.isLink = itemIs('A');
                        }, 10);
                    });

                    // model -> view
                    ngModelController.$render = function () {
                        textarea.html(ngModelController.$viewValue);
                    };

                    scope.format = function (cmd, arg) {
                        document.execCommand(cmd, false, arg);
                    }

                    scope.cmdState = function (cmd, id) {
                        return document.queryCommandState(cmd);
                    }

                    scope.cmdValue = function (cmd) {
                        return document.queryCommandValue(cmd);
                    }

                    scope.createLink = function () {
                        var input = prompt('Enter the link URL');
                        if (input && input !== undefined)
                            scope.format('createlink', input);
                    }

                    scope.insertImage = function () {
                        var input = prompt('Enter the image URL');
                        if (input && input !== undefined)
                            scope.format('insertimage', input);
                    }

                    scope.setFont = function () {
                        scope.format('fontname', scope.font)
                    }

                    scope.setFontSize = function () {
                        scope.format('fontsize', scope.fontSize.value)
                    }

                    scope.setFontColor = function () {
                        scope.format('forecolor', scope.fontColor)
                    }

                    scope.setHiliteColor = function () {
                        scope.format('hiliteColor', scope.hiliteColor)
                    }

                    scope.format('enableobjectresizing', true);
                    scope.format('styleWithCSS', true);
                }
            };
        });
})(angular);

(function () {

    'use strict';
    angular.module('cloudlex.filters')
        .directive('clxTimepicker', ['dateUtils', timepicker])
        .directive('renderOnBlurOrEnter', renderOnBlurOrEnter)
        .factory('dateUtils', dateUtils);

    /**
    * This service provides some shortcut functions for
    * working with dates, especially dates in ISO format,
    * which is the date format Angular prefers when working
    * with date inputs.
    */
    function dateUtils() {

        return {
            parseTimeStringToDate: _parseTimeStringToDate,
        };

        /**
         * Parses partial and complete time strings to a date object.
         * Makes time input a lot more user-friendly.
         *
         * For example, all of the following string inputs should be
         * parsed to a date object of today's date and time of 1pm.
         *
         *    var times = ['1:00 pm','1:00 p.m.','1:00 p','1:00pm',
         *                 '1:00p.m.','1:00p','1 pm','1 p.m.','1 p',
         *                 '1pm','1p.m.', '1p','13:00','13'];
         *
         * NOTE: This version is optimized for the en-US locale in
         *       either 12-hour or 24-hour format. It may not be
         *       suitable for all locales. Instaed of re-writing this
         *       function, it would make more sense to extend our
         *       capabilities with locale-specific functions.
         **/
        function _parseTimeStringToDate(timeString) {

            if (timeString == '') return null;

            var time = timeString.match(/(\d+)(:(\d\d))?\s*(p?)/i);
            if (time == null) return null;

            var hours = parseInt(time[1], 10);

            // if (hours == 12 && !time[4]) { hours = 0; }
            // else { hours += (hours < 12 && time[4]) ? 12 : 0; }

            var d = new Date(1970, 1, 1, 0, 0, 0);
            d.setHours(hours);
            d.setMinutes(parseInt(time[3], 10) || 0);
            d.setSeconds(0, 0);
            return d;

        }

    }

    function timepicker(dateUtils) {

        return {
            restrict: 'EA',
            scope: {
                'theTime': '=ngModel',
                'theRealTime': '=theRealTime',
                'onSelect': '&onSelect'
            },
            replace: true,
            templateUrl: 'timepicker.tpl.html',
            link: linker
        };

        function linker(scope, element, attrs, tpCtrl) {

            function init(executeOnSelect) {
                // Initialize scope variables
                scope.labelText = attrs.label || '';
                scope.theTime = scope.theRealTime
                    ? dateUtils.parseTimeStringToDate(scope.theRealTime)
                    : new Date(1970, 1, 1, 0, 0, 0, 0);
                if (executeOnSelect) {
                    setTimeout(function () {
                        scope.$apply(function () {
                            scope.onSelect();
                        });
                    }, 0);
                }
            }

            scope.$watch('theRealTime', function (newVal, oldVal) {
                if (newVal) {
                    var executeOnSelect = !oldVal || newVal == oldVal ? false : true;
                    init(executeOnSelect);
                }
            });

        }
    }

    /**
     * Re-renders the ng-model attached to an input when the input
     * loses focus or user presses the `Enter` key while inside the input.
     **/
    function renderOnBlurOrEnter() {

        return {
            restrict: 'A',
            require: 'ngModel',
            link: linker,
        };

        function handleEvent(scope, ngModelCtrl) {
            var viewValue = null;
            if (!ngModelCtrl.$modelValue) {
                ngModelCtrl.$setViewValue("09:00");
                viewValue = "09:00";
                scope.$apply(function () {
                    scope.theRealTime = "09:00";
                });
            } else {
                viewValue = ngModelCtrl.$modelValue;
                for (var i = 0; i < ngModelCtrl.$formatters.length; i++) {
                    viewValue = ngModelCtrl.$formatters[i](viewValue);
                }
                ngModelCtrl.$viewValue = viewValue;
                if (moment(ngModelCtrl.$modelValue).isValid()) {
                    setTimeout(function () {
                        scope.$apply(function () {
                            scope.theRealTime = moment(ngModelCtrl.$modelValue).format("HH:mm");
                        });
                    }, 0);
                }
            }
            ngModelCtrl.$render();
        }

        function linker(scope, element, attrs, ngModelCtrl) {
            element.on('blur', function () {
                handleEvent(scope, ngModelCtrl);
            });

            element.on('keydown', function (event) {
                if (event.keyCode === 13) {
                    event.preventDefault();
                    event.stopPropagation();
                    handleEvent(scope, ngModelCtrl);
                }
            });
        }

    }
})();
