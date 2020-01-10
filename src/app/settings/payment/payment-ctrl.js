(function (angular) {

    'user strict';

    /**
    * @ngdoc controller
    * @name cloudlex.settings.controller:paymentCtrl
    * @requires $modal,modalService, notification-service, routeManager
    */

    angular.module('cloudlex.settings')
        .controller('paymentCtrl', paymentCtrl);

    paymentCtrl.$inject = ['$modal', 'notification-service', 'routeManager', 'paymentDataLayer', 'matterFactory', 'globalConstants'];
    function paymentCtrl($modal, notificationService, routeManager, paymentDataLayer, matterFactory, globalConstants) {

        var vm = this;
        vm.initlimit = 10;
        vm.limit = vm.initlimit;
        vm.filters = {};
        vm.toggleFilterPage = toggleFilterPage;
        vm.sorts = [{ key: 1, name: "Transaction Date Desc" },
        { key: 2, name: "Transaction Date Asc" }];
        vm.sortBy = 1;
        vm.tags = [];
        vm.tagCancelled = tagCancelled;
        vm.downloadPayments = downloadPayments;
        vm.retainFilters = retainFilters;//store filters to local storage
        vm.persistFilter = persistFilter;//reset stored filter
        vm.print = print;
        vm.getMorePayments = getMorePayments;
        vm.increaseLimit = increaseLimit;//for lazy loading
        vm.pageSize = 250;//initial limit for grid records
        vm.decreaseLimit = decreaseLimit;
        vm.retainsearchText = retainsearchText;

        (function () {
            //set payment Grid
            vm.paymentGrid = {
                headers: paymentDataLayer.getPaymentGrid(),
                selectedItems: []
            };
            vm.persistFilter();//filter retaintion
            vm.tags = createFilterTags(vm.filters);
            getpaymentList();
            setBreadcrum();
        })();

        //function to reset applied filters
        function persistFilter() {
            var trasaction_type = JSON.parse(localStorage.getItem("Transaction_Type"));
            var start = JSON.parse(localStorage.getItem("trans_Start_Date"));
            var end = JSON.parse(localStorage.getItem("trans_End_Date"));
            var searchText = JSON.parse(localStorage.getItem("Search_Text"));
            vm.filters.transactiontype = utils.isEmptyVal(trasaction_type) ? '' : trasaction_type;
            vm.filters.t_start_date = utils.isEmptyVal(start) ? '' : start;
            vm.filters.t_end_date = utils.isEmptyVal(end) ? '' : end;
            vm.searchText = utils.isEmptyVal(searchText) ? '' : searchText;
        }

        /*function to store applied filters into local storage to
          achive filter retaintion*/
        function retainFilters(filterObj) {
            var storeObj = angular.copy(filterObj);
            localStorage.setItem("Transaction_Type", JSON.stringify(storeObj.transactiontype));
            localStorage.setItem("trans_Start_Date", JSON.stringify(storeObj.t_start_date));
            localStorage.setItem("trans_End_Date", JSON.stringify(storeObj.t_end_date));

        }

        function retainsearchText() {
            var searchText = angular.copy(vm.searchText);
            localStorage.setItem("Search_Text", JSON.stringify(searchText));
        }

        //remove filter tags
        function tagCancelled(cancelled) {
            var scrollPos = $(window).scrollTop();
            $(window).scrollTop(scrollPos - 1);

            switch (cancelled.key) {
                case 'TransactionType':
                    vm.filters['transactiontype'] = '';
                    break;
                case 'tDateRange':
                    //remove transactiondate filter
                    vm.filters['t_start_date'] = '';
                    vm.filters['t_end_date'] = '';
                    break;
            }
            retainFilters(vm.filters);
            getpaymentList(vm.filters, vm.sortBy);
        }

        //print payment list 
        function print() {
            var filterObj = paymentDataLayer.getFilterObj(vm.filters, vm.sortBy);
            var output = getPrintPage(vm.paymentList, filterObj);
            window.open().document.write(output);
        }



        //export payment data into excel sheet
        function downloadPayments() {
            paymentDataLayer.downloadPayments(vm.filters, vm.sortBy);
        }

        //lazy loading: increase limit by 15
        function increaseLimit() {
            if (vm.limit <= vm.totalPayments) {
                vm.limit = vm.limit + 10;
            }

        }

        //lazy loading: decrease limit by 15
        function decreaseLimit() {
            vm.limit = vm.initlimit;
        }

        //get sort by label
        vm.getSortByLabel = function (sortBy) {
            if (utils.isEmptyVal(sortBy)) {
                return " - ";
            }

            var selSort = _.find(vm.sorts, function (sort) {
                return sort.key == sortBy;
            });
            return selSort.name;
        }

        //sort by filters
        vm.applySortByFilter = function (sortBy) {
            vm.sortBy = sortBy;
            getpaymentList(vm.filters, vm.sortBy);
        }

        function setBreadcrum() {
            var initCrum = [{ name: '...' }, { name: 'Settings' }, { name: 'Payments' }];
            routeManager.setBreadcrum(initCrum);
        }


        /**
         * To get the payment list
         */

        function getpaymentList() {
            var filterObject = getFilterObjectforList(vm.filters, vm.sortBy, vm.pageSize);
            paymentDataLayer.getPaymentList(filterObject)
                .then(function (response) {
                    var data = response.data;
                    vm.paymentList = data.data;
                    vm.totalPayments = data.count;
                    //convert to date time : dd/mm/yyyy HH:mm a
                    _.forEach(vm.paymentList, function (data) {
                        data.transaction_date = getUtcMoment(data.transaction_date);
                    });
                }, function (error) {
                    notificationService.error('' + error.data);
                });
        }


        //get next payment records when user clicks on more

        function getMorePayments(filter, sortBy) {
            vm.pageSize = vm.pageSize + 250;
            var filterObject = getFilterObjectforList(vm.filters, vm.sortBy, vm.pageSize);
            paymentDataLayer.getPaymentList(filterObject)
                .then(function (response) {
                    var data = response.data;
                    vm.paymentList = data.data;
                    vm.totalPayments = data.count;
                    //convert to date time : dd/mm/yyyy HH:mm a
                    _.forEach(vm.paymentList, function (data) {
                        data.transaction_date = getUtcMoment(data.transaction_date)
                    });
                }, function (error) {
                    notificationService.error('' + error.data);
                });
        }
        // get all payment records when user clicks on all option
        function getAllPaymentList() {
            var filterObject = getFilterObjectforList(vm.filters, vm.sortBy);
            paymentDataLayer.getPaymentList(filterObject)
                .then(function (response) {
                    var data = response.data;
                    vm.paymentList = data.data;
                    vm.totalPayments = data.count;
                    //convert to date time : dd/mm/yyyy HH:mm a
                    _.forEach(vm.paymentList, function (data) {
                        data.transaction_date = getUtcMoment(data.transaction_date)
                    });
                }, function (error) {
                    notificationService.error('' + error.data);
                });
        }

        //
        function getFilterObjectforList(filter, sortBy, pageSize) {
            var params = {};
            if (utils.isNotEmptyVal(filter.transactiontype)) {
                params['subtype'] = filter.transactiontype;
            }
            if (utils.isNotEmptyVal(filter.t_start_date)) {
                params['start'] = filter.t_start_date;
            }
            if (utils.isNotEmptyVal(filter.t_end_date)) {
                params['end'] = filter.t_end_date;
            }
            if (utils.isNotEmptyVal(sortBy)) {
                params['sortBy'] = sortBy;
            }
            if (utils.isNotEmptyVal(pageSize)) {
                params['pagesize'] = pageSize;
            }
            return params;
        }

        /**
         * Function  to open a filter pop up where user can apply filter
         */

        function toggleFilterPage() {
            var filtercopy = angular.copy(vm.filters);
            filtercopy.t_start_date = (filtercopy.t_start_date) ?
                matterFactory.getFormatteddate(filtercopy.t_start_date) : '';
            filtercopy.t_end_date = (filtercopy.t_end_date) ?
                matterFactory.getFormatteddate(filtercopy.t_end_date) : ''
            var modalInstance = $modal.open({
                templateUrl: 'app/settings/payment/partial/payment-filter.html',
                controller: 'PaymentFilterCtrl',
                windowClass: 'modalMidiumDialog',
                resolve: {
                    'filterParams': function () {
                        return {
                            transactiontype: filtercopy.transactiontype,
                            t_start_date: filtercopy.t_start_date,
                            t_end_date: filtercopy.t_end_date
                        }
                    }
                }
            });

            modalInstance.result.then(function (selectedFilters) {
                vm.filters = selectedFilters;
                vm.retainFilters(vm.filters);//call filter storage funtion
                var filtercopy = angular.copy(vm.filters);
                //create tags for applied filter
                vm.tags = createFilterTags(filtercopy);
                //get filtered payment list
                getpaymentList(filtercopy, vm.sortBy);
            });
        }

        //this function will create filters tags to show on grid
        function createFilterTags(filters) {
            var tags = [];
            //create tag for transaction type
            if (utils.isNotEmptyVal(filters.transactiontype)) {
                var typefilter = {};
                typefilter.value = "Transaction Type : " + gettranstypetag(filters.transactiontype);
                typefilter.key = "TransactionType";
                tags.push(typefilter);
            }
            //create tag for transaction date range
            if (utils.isNotEmptyVal(filters.t_start_date) && utils.isNotEmptyVal(filters.t_end_date)) {
                var trangefilter = {};
                trangefilter.value = "Transaction Date Range : " +
                    moment.unix(filters.t_start_date).format('MM/DD/YYYY') + ' - ' +
                    moment.unix(filters.t_end_date).format('MM/DD/YYYY');
                trangefilter.key = "tDateRange";
                tags.push(trangefilter);
            }
            return tags;
        }

        function gettranstypetag(type) {
            var tagname;
            switch (type) {
                case '1': tagname = 'Add on - Matters'; break;
                case '2': tagname = 'Add on - Users'; break;
                case '3': tagname = 'Archive'; break;
                case '4': tagname = 'Subscription'; break;
            }
            return tagname;
        }


        //payment grid print page
        function getPrintPage(dataList, filterobj) {
            var title = [
                { name: 'transaction_id', desc: 'Transaction ID' },
                { name: 'transaction_type', desc: 'Transaction Type' },
                { name: 'transaction_date', desc: 'Date Time' },
                { name: 'transaction_item', desc: 'Item Description' },
                { name: 'rate_per_unit', desc: 'Rate Per Unit' },
                { name: 'quantity', desc: 'Quantity' },
                { name: 'total_amount', desc: 'Amount' }
            ];

            var html = "<html><title>Payment List</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}</style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt;'><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Payment List</h1><div></div>";
            html += "<body>";
            html += "<div><h2 style='text-align:left;padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";
            //replace transaction type key with lables
            filterobj['Transaction Type'] =
                utils.isNotEmptyVal(filterobj['Transaction Type']) ? gettranstypetag(filterobj['Transaction Type']) : '';

            angular.forEach(filterobj, function (val, key) {
                html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'><label><strong>" + key + " : </strong></label>";
                html += "<span style='padding:5px'> " + val;
                html += "</span>";
                html += "</div>";
            });

            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "<table style='border:1px solid #e2e2e2;width:100%;text-align: left; font-size:8pt;' cellspacing='0' cellpadding='0' border='0'>";
            html += "<tr>";
            angular.forEach(title, function (value, key) {

                if (value.name == 'transaction_id') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:left'>" + value.desc + "</th>";
                }
                else if (value.name == 'transaction_type') {
                    html += "<th style='border:1px solid #e2e2e2; background-color:#E9EEF0!important;-webkit-print-color-adjust:exact;border-collapse:collapse; padding:5px; text-align:left'>" + value.desc + "</th>";
                }
                else if (value.name == 'transaction_date') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:left'>" + value.desc + "</th>";
                }
                else if (value.name == 'transaction_item') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:left'>" + value.desc + "</th>";
                }
                else if (value.name == 'rate_per_unit') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                }
                else if (value.name == 'quantity') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                }
                else if (value.name == 'total_amount') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                }
                else { html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + value.desc + "</th>"; }
            });
            html += "</tr>";

            angular.forEach(dataList, function (data) {
                html += "<tr>";
                angular.forEach(title, function (titlevalue, titlekey) {
                    var val = (_.isNull(data[titlevalue.name])) ? '' : data[titlevalue.name];
                    if (titlevalue.name == 'transaction_id') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + val + "</td>";
                    }
                    else if (titlevalue.name == 'transaction_type') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + val + "</td>";
                    }
                    else if (titlevalue.name == 'transaction_date') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + val + "</td>";
                    }
                    else if (titlevalue.name == 'transaction_item') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + val + "</td>";
                    }
                    else if (titlevalue.name == 'rate_per_unit') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" + '' + (utils.isNotEmptyVal(val) ? '$' : '') + (utils.isNotEmptyVal(val) ? parseFloat(val).toFixed(2) : '') + "</td>";
                    }
                    else if (titlevalue.name == 'quantity') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" + (utils.isNotEmptyVal(val) ? parseFloat(val).toFixed(2) : '') + "</td>";
                    }
                    else if (titlevalue.name == 'total_amount') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" + '' + (utils.isNotEmptyVal(val) ? '$' : '') + (utils.isNotEmptyVal(val) ? (parseFloat(val).toFixed(2)) : '') + "</td>";
                    }
                    else {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" + val + "</td>";
                    }
                });
                html += "</tr>";
            });

            html += "</body>";
            html += "</table>";
            html += "</html>";
            return html;
        }

        function getUtcMoment(timestamp) {
            var format = 'MM/DD/YYYY hh:mm A';
            var date = moment.unix(timestamp).format(format);
            return date;
        }

    }

})(angular);
