(function (angular) {

    angular.module('cloudlex.settings')
        .factory('paymentDataLayer', paymentDataLayer);


    paymentDataLayer.$inject = ['$http', 'globalConstants', 'matterFactory'];
    function paymentDataLayer($http, globalConstants, matterFactory) {

        var urls = {
            paymentsList: globalConstants.webServiceBase + 'packagesubscription/plangrid',
            downloadPayments: globalConstants.webServiceBase + 'reports/report.json'
        };

        return {
            getPaymentList: _getPaymentList,
            getPaymentGrid: _getPaymentGrid,
            downloadPayments: _downloadPayments,
            getFilterObj: _getFilterObj
        };

        function _getFilterObj(filter, sortBy) {
            var oldfilter = angular.copy(filter);
            var filterObj = {};
            if (oldfilter.transactiontype) {
                filterObj['Transaction Type'] = oldfilter.transactiontype;
            }
            else {
                filterObj['Transaction Type'] = '';
            }
            if (oldfilter.t_start_date && oldfilter.t_end_date) {
                filterObj['Transaction Date Range'] = matterFactory.getFormatteddate(oldfilter.t_start_date) + ' - ' +
                    matterFactory.getFormatteddate(oldfilter.t_end_date);
            }
            else {
                filterObj['Transaction Date Range'] = '';
            }
            if (sortBy) {
                filterObj['ORDERED BY'] = (sortBy == 1) ? 'Transaction Date Desc'
                    : 'Transaction Date Asc';
            }
            else {
                filterObj['ORDERED BY'] = '';
            }
            return filterObj;
        }

        function _getPaymentList(filter) {
            var url = urls.paymentsList + '?' + utils.getParams(filter);
            return $http.get(url);
        }

        function _getPaymentGrid() {
            return [
                {
                    field: [
                        {
                            prop: 'transaction_id',
                            printDisplay: 'Transaction ID'
                        }
                    ],
                    displayName: 'Transaction ID',
                    dataWidth: "10"
                },
                {
                    field: [
                        {
                            prop: 'transaction_type',
                            printDisplay: 'Transaction Type'
                        }],
                    displayName: 'Transaction Type',
                    dataWidth: "12"
                },
                {
                    field: [
                        {
                            prop: 'transaction_date',
                            printDisplay: 'Date Time'
                        }],
                    displayName: 'Date Time',
                    dataWidth: "17"
                },
                {
                    field: [
                        {
                            prop: 'transaction_item',
                            printDisplay: 'Item Description'
                        }
                    ],
                    displayName: 'Item Description',
                    dataWidth: "24"
                },
                {
                    field: [
                        {
                            prop: 'rate_per_unit',
                            printDisplay: 'Rate Per Unit',
                            html: '<span style="text-align: right;display: block;width:115px;">${{data.rate_per_unit | number:2}}</span>'
                        }
                    ],
                    displayName: '<span style="text-align: right;display: block;width:115px;">Rate Per Unit</span>',
                    dataWidth: "12"
                },
                {
                    field: [
                        {
                            prop: 'quantity',
                            printDisplay: 'Quantity',
                            html: '<span style="text-align: right;display: block;width:115px;">{{data.quantity | number:2}}</span>'
                        }
                    ],
                    displayName: '<span style="text-align: right;display: block;width:115px;">Quantity</span>',
                    dataWidth: "12"
                },
                {
                    field: [
                        {
                            prop: 'total_amount',
                            printDisplay: 'total_amount',
                            html: '<span style="text-align: right;display: block;width:115px;">${{data.total_amount | number:2}}</span>'
                        }
                    ],
                    displayName: '<span style="text-align: right;display: block;width:115px;">Amount</span>',
                    dataWidth: "12"
                }
            ];
        }
        function _downloadPayments(filters, sortBy) {
            var popUpFilters = {};
            popUpFilters["reportname"] = "payments_list";
            popUpFilters["filename"] = "Payments_List.xlsx";
            popUpFilters["type"] = "excel";
            popUpFilters["user"] = "all-users";
            popUpFilters["subtype"] = filters.transactiontype;
            popUpFilters["start"] = filters.t_start_date;
            popUpFilters["end"] = filters.t_end_date;
            popUpFilters["sortBy"] = sortBy;

            var url = urls.downloadPayments;
            url += '?' + utils.getParams(popUpFilters)
            var download = window.open(url, '_self');
        }

    }

})(angular);