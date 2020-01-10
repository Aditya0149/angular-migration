(function (angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name cloudlex.referral.controller:RefferedMattersCtl
     * @requires referralDatalayer, referredMatterHelper, $modal, masterData
     * @description
     */

    angular
        .module('cloudlex.referral')
        .controller('RefferedMattersCtrl', ReferredController);

    ReferredController.$inject = ['$stateParams', 'routeManager', 'referralDatalayer', 'referredMatterHelper', '$modal', 'masterData', 'modalService',
        'notification-service', 'practiceAndBillingDataLayer', '$rootScope', '$state'];
    function ReferredController($stateParams, routeManager, referralDatalayer, referredMatterHelper, $modal, masterData, modalService,
        notificationService, practiceAndBillingDataLayer, $rootScope, $state) {
        var vm = this;
        var defaultStatusDesc = "Awaiting Decision";

        //code to redirect on referred in tab when link cliked from email
        var RferredMatterLink = localStorage.getItem('fromReferredMatterLink');
        RferredMatterLink == true ? localStorage.removeItem('fromReferredMatterLink') : RferredMatterLink;
        var defaultTab = RferredMatterLink ? 'referred in' : $stateParams.tab === 'in' ? 'referred in' : 'referred out';


        var paginationParams = {
            pageNum: 1,
            pageSize: 250
        };

        vm.getReferredMatters = getReferredMatters;
        vm.getStatusCounts = getStatusCounts;
        vm.showResendBtn = showResendBtn;
        vm.showReferredInfo = showReferredInfo;
        vm.resendReferredOut = resendReferredOut;
        vm.paymentModal = paymentModal;
        vm.declineReferral = declineReferral;
        vm.cancelReferredOut = cancelReferredOut;
        vm.showReferredActionButtons = showReferredActionButtons;
        vm.getMore = getMore;
        vm.getAll = getAll;
        vm.hideMoreBtn = hideMoreBtn;
        vm.filterRetain = filterRetain;
        //flag for tab selected
        $rootScope.is_ReferralMatter = true;
        $rootScope.is_ReferralIntake = false;
        (function () {

            setBreadcrum();
            var userRole = masterData.getUserRole();
            vm.defaultStatus = {};
            vm.selectedStatusId = {};
            vm.activeTab = defaultTab;
            setBreadcrum(defaultTab);
            getSubscriptionInfo();

            // vm.isMD = (userRole.role === 'Managing Partner/Attorney' || userRole.role === 'Attorney' || userRole.role === 'LexviasuperAdmin');
            vm.dataReceived = false;
            vm.referredOut = {
                headers: referredMatterHelper.getReferredOutGridCols(),
            };

            vm.referredIn = {
                headers: referredMatterHelper.getReferredInGridCols(),
            };

            vm.matterStatusGridOptions = {
                headers: referredMatterHelper.getMatterStatusGridCols()
            };

            vm.refInmatterStatusGridOptions = {
                headers: referredMatterHelper.getRefInMatterStatusGridCols()
            };
            getStatusCounts(defaultTab);
            persistData();
            vm.launchpad = JSON.parse(localStorage.getItem('launchpadSetting'));
            if (vm.launchpad && vm.launchpad.enabled != 1) {
                vm.isMM = true;
            } else {
                vm.isMM = false;
            }
        })();

        // to retain data in filter
        function persistData() {
            if (utils.isNotEmptyVal(localStorage.getItem("referredFilterText"))) {
                vm.showSearch = true;
                vm.referredFilterText = localStorage.getItem("referredFilterText");
            }
        }
        function filterRetain() {
            localStorage.setItem("referredFilterText", vm.referredFilterText);
        }

        function setBreadcrum(defaultTab) {
            var dTab = defaultTab === 'referred in' ? 'Referred In' : 'Referred Out';
            // var initCrum = [{name: '...'}, {name: 'Referral' }, { name: dTab }];
            var initCrum = [{ name: '...' }, { name: dTab }];
            routeManager.setBreadcrum(initCrum);
        }


        /**
         * to check is referral engine is subscribed from marketplace 
         */
        function getSubscriptionInfo() {
            var response = practiceAndBillingDataLayer.getConfigurableData();
            response.then(function (data) {
                vm.isReferralExchange = data.RE.is_active;
            });
        }


        /**
        * @ngdoc method
        * @name cloudlex.referral.RefferedMattersCtrl#getReferredMatters
        * @methodOf cloudlex.referral.RefferedMattersCtrl
        * @description
        * gets the referred matters based on status
        *
        * @param {object} status object
        */
        function getReferredMatters(status, activeTab) {
            paginationParams.pageNum = 1;
            switch (activeTab) {
                case 'referred in':
                    getReferredInMatters(status, paginationParams);
                    break;
                case 'referred out':
                    getReferredOutMatters(status, paginationParams);
                    break;
            }
        }

        /**
         * @ngdoc method
         * @name cloudlex.referral.RefferedMattersCtrl#getReferredOutMatters
         * @methodOf cloudlex.referral.RefferedMattersCtrl
         * @description
         * gets the referred out matters based on status
         *
         * @param {object} status object
         */
        function getReferredOutMatters(status, paginationParams) {
            vm.selectedStatusId = status;
            vm.dataReceived = false;
            referralDatalayer.getReferredOutMatters(status, paginationParams)
                .then(
                    function (response) {
                        var data = response.data.data;
                        setCount(vm.selectedStatusId, response.data.count);
                        utils.replaceNullByEmptyStringArray(data);
                        referredMatterHelper.setModifiedDateDisplay(data);
                        referredMatterHelper.setName(data, 'referred out');
                        vm.refferedOutMatters = data;
                        vm.activeTab = 'referred out';
                        vm.dataReceived = true;
                    }
                );
        }

        /**
        * @ngdoc method
        * @name cloudlex.referral.RefferedMattersCtrl#getReferredInMatters
        * @methodOf cloudlex.referral.RefferedMattersCtrl
        * @description
        * gets the referred in matters based on status
        *
        * @param {object} status object
        */
        function getReferredInMatters(status, paginationParams) {
            vm.selectedStatusId = status;
            vm.dataReceived = false;
            referralDatalayer.getReferredInMatters(status, paginationParams)
                .then(
                    function (response) {
                        var data = response.data.data;
                        setCount(vm.selectedStatusId, response.data.count);
                        utils.replaceNullByEmptyStringArray(data);
                        referredMatterHelper.setModifiedDateDisplay(data);
                        referredMatterHelper.setName(data, 'referred in');
                        vm.refferedOutMatters = data;
                        vm.activeTab = 'referred in';
                        vm.dataReceived = true;
                    }
                );
        }


        function setCount(selectedStatus, count) {
            if (selectedStatus.isMatterStatus) {
                _.forEach(vm.matterStatuses, function (matter) {
                    if (matter.id === selectedStatus.id) {
                        matter.Count = count;
                    }
                })
            } else {
                _.forEach(vm.referredStatuses, function (matter) {
                    if (matter.id === selectedStatus.id) {
                        matter.Count = count;
                    }
                })
            }
        }


        /**
        * @ngdoc method
        * @name cloudlex.referral.RefferedMattersCtrl#getStatusCounts
        * @methodOf cloudlex.referral.RefferedMattersCtrl
        * @description
        * gets statuses with their counts
        *
        */

        function getStatusCounts(tab, selectedStatus) {
            setBreadcrum(tab);
            paginationParams.pageNum = 1;
            referralDatalayer.getStatusCounts(tab)
                .then(function (response) {
                    var counts = response.data;
                    vm.matterStatuses = referredMatterHelper.getMatterStatusCountArray(counts);
                    vm.referredStatuses = referredMatterHelper.getReferredStatusCountArray(counts);
                    //set selected status
                    setDefaultStatus(selectedStatus);
                    switch (tab) {
                        case 'referred out':
                            getReferredOutMatters(vm.selectedStatusId, paginationParams);
                            break;
                        case 'referred in':
                            getReferredInMatters(vm.selectedStatusId, paginationParams);
                    }
                });


        }

        function setDefaultStatus(selectedStatus) {
            if (angular.isUndefined(selectedStatus)) {
                vm.defaultStatus = referredMatterHelper
                    .getDefaultStatus(vm.matterStatuses, vm.referredStatuses, defaultStatusDesc);
                vm.selectedStatusId = angular.copy(vm.defaultStatus);
            } else {
                var status = {};
                //if the selected status is not matter status check if the status is awaiting decision and the count is 0
                if (!selectedStatus.isMatterStatus) {
                    status = _.find(vm.referredStatuses, function (status) { return status.id === selectedStatus.id });
                    if (status.desc === 'Awaiting Decision' && parseInt(status.Count) === 0) {
                        vm.defaultStatus = referredMatterHelper.getDefaultStatus(vm.matterStatuses, vm.referredStatuses, defaultStatusDesc);
                        vm.selectedStatusId = angular.copy(vm.defaultStatus);
                    } else {
                        vm.selectedStatusId = status;
                    }
                } else {
                    vm.selectedStatusId = selectedStatus;
                }
            }
        }

        /**
        * @ngdoc method
        * @name cloudlex.referral.RefferedMattersCtrl#showResendBtn
        * @methodOf cloudlex.referral.RefferedMattersCtrl
        * @description
        * show hide resend button based on the status description and isMatterStatus Boolean
        *
        * @param {object} object having status id and isMatterStatus property
        * @returns {Boolean} show resend btn or not
        */

        function showResendBtn(selectedStatus) {
            return selectedStatus.desc !== 'Awaiting Decision';
        }

        function showReferredInfo(info, activeTab) {
            info.activeTab = activeTab;
            $modal.open({
                controller: 'RefferedMatterInfoCtrl as referInfo',
                templateUrl: 'app/referral/referred-matters/refer-matter-info/referred-matter-info.html',
                windowClass: 'medicalIndoDialog',
                resolve: {
                    'referredOutInfo': function () {
                        return info;
                    }
                }
            });
        }


        function isSubToReferralEngine() {
            if (vm.isReferralExchange == 0) {
                notificationService.error('You are not subscribed to Referral Engine');
                return false;
            } else {
                return true;
            }
        }

        /**
        * @ngdoc method
        * @name cloudlex.referral.RefferedMattersCtrl#resendReferredOut
        * @methodOf cloudlex.referral.RefferedMattersCtrl
        * @description
        * 
        */
        function resendReferredOut($event, matterInfo) {
            $event.stopPropagation();
            if (isSubToReferralEngine()) {
                var actionObj = { id: matterInfo.id, action: 'resend' };
                referralDatalayer
                    .cancelResendReferral(actionObj)
                    .then(function (response) {
                        if (response.data[0] == true) {
                            notificationService.success('Referral resent successfully');
                            getStatusCounts(vm.activeTab, vm.selectedStatusId);
                        } else {
                            notificationService.error('Unable to resend the referral');
                        }
                    }, function () {
                        notificationService.error('Unable to resend the referral');
                    });
            }
        }

        /**
        * @ngdoc method
        * @name cloudlex.referral.RefferedMattersCtrl#paymentModal
        * @methodOf cloudlex.referral.RefferedMattersCtrl
        * @description
        * 
        */

        function paymentModal($event, data) {
            $event.stopPropagation();
            if (isSubToReferralEngine()) {
                var selectedData = data;
                var modalInstance = $modal.open({
                    templateUrl: 'app/referral/referred-matters/partials/referral-payment.html',
                    controller: 'referralPaymentCtrl as payment',
                    windowClass: 'referralDialog',
                    backdrop: 'static',
                    //  scope: $scope,
                    keyboard: false,
                    resolve: {
                        selectedInfo: function () {
                            return selectedData;
                        }
                    }
                });
                modalInstance.result.then(function (response) {
                    acceptReferral(response)
                    //console.log(response.amount);
                });
            }
        }



        function acceptReferral(matterInfo) {
            var actionObj = { id: matterInfo.id, action: 'accept', amount: matterInfo.amount };
            referralDatalayer
                .cancelResendReferral(actionObj)
                .then(function (response) {
                    if (response.data) {
                        notificationService.success('Referral accepted successfully');
                        getStatusCounts(vm.activeTab, vm.selectedStatusId);
                        $state.go("add-overview", { 'matterId': response.data.matter_id });
                    } else {
                        notificationService.error('Unable to accept the referral');
                    }
                }, function (response) {
                    if (response.status == 406) {
                        notificationService.error(response.data[0]);
                    } else {
                        notificationService.error('Unable to accept the referral');
                    }

                });
        }


        /**
       * @ngdoc method
       * @name cloudlex.referral.RefferedMattersCtrl#declineReferral
       * @methodOf cloudlex.referral.RefferedMattersCtrl
       * @description
       * 
       */
        function declineReferral($event, matterInfo) {
            $event.stopPropagation();
            if (isSubToReferralEngine()) {
                var modalOptions = {
                    closeButtonText: 'No',
                    actionButtonText: 'Yes',
                    headerText: 'Decline ?',
                    bodyText: 'Are you sure you want to decline ?'
                };

                //confirm before delete
                modalService.showModal({}, modalOptions).then(function () {
                    var actionObj = { id: matterInfo.id, action: 'decline' };
                    referralDatalayer
                        .cancelResendReferral(actionObj)
                        .then(function (response) {
                            if (response.data[0] == true) {
                                notificationService.success('Referral declined successfully');
                                getStatusCounts(vm.activeTab, vm.selectedStatusId);
                            } else {
                                notificationService.error('Unable to decline the referral');
                            }

                        }, function () {
                            notificationService.error('Unable to decline the referral');
                        });
                });

            }

        }

        /**
        * @ngdoc method
        * @name cloudlex.referral.RefferedMattersCtrl#resend
        * @methodOf cloudlex.referral.RefferedMattersCtrl
        * @description
        * 
        */
        function cancelReferredOut($event, matterInfo) {
            $event.stopPropagation();
            if (isSubToReferralEngine()) {
                var actionObj = { id: matterInfo.id, action: 'cancel' };
                referralDatalayer
                    .cancelResendReferral(actionObj)
                    .then(function (response) {
                        if (response.data[0] == true) {
                            notificationService.success('Referral Cancelled');
                            getStatusCounts(vm.activeTab, vm.selectedStatusId);
                        } else {
                            notificationService.error('Unable to cancel the referral');
                        }

                    }, function () {
                        notificationService.error('Unable to cancel the referral');
                    });
            }
        }

        function showReferredActionButtons() {
            return vm.selectedStatusId.desc !== 'Declined';
        }

        function getMore(status, activeTab) {
            paginationParams.pageNum += 1;
            switch (activeTab) {
                case 'referred in':
                    vm.selectedStatusId = status;
                    vm.dataReceived = false;
                    referralDatalayer.getReferredInMatters(status, paginationParams)
                        .then(
                            function (response) {
                                var data = response.data.data;
                                utils.replaceNullByEmptyStringArray(data);
                                referredMatterHelper.setModifiedDateDisplay(data);
                                vm.refferedOutMatters = vm.refferedOutMatters.concat(data);
                                vm.activeTab = 'referred in';
                                vm.dataReceived = true;
                            }
                        );
                    break;
                case 'referred out':
                    vm.selectedStatusId = status;
                    vm.dataReceived = false;
                    referralDatalayer.getReferredOutMatters(status, paginationParams)
                        .then(
                            function (response) {
                                var data = response.data.data;
                                utils.replaceNullByEmptyStringArray(data);
                                referredMatterHelper.setModifiedDateDisplay(data);
                                vm.refferedOutMatters = vm.refferedOutMatters.concat(data);
                                vm.activeTab = 'referred out';
                                vm.dataReceived = true;
                            }
                        );
                    break;
            }
        }

        function getAll(status, activeTab) {
            switch (activeTab) {
                case 'referred in':
                    vm.selectedStatusId = status;
                    vm.dataReceived = false;
                    referralDatalayer.getReferredInMatters(status, {})
                        .then(
                            function (response) {
                                var data = response.data.data;
                                utils.replaceNullByEmptyStringArray(data);
                                referredMatterHelper.setModifiedDateDisplay(data);
                                vm.refferedOutMatters = data;
                                vm.activeTab = 'referred in';
                                vm.dataReceived = true;
                            }
                        );
                    break;
                case 'referred out':
                    vm.selectedStatusId = status;
                    vm.dataReceived = false;
                    referralDatalayer.getReferredOutMatters(status, {})
                        .then(
                            function (response) {
                                var data = response.data.data;
                                utils.replaceNullByEmptyStringArray(data);
                                referredMatterHelper.setModifiedDateDisplay(data);
                                vm.refferedOutMatters = data;
                                vm.activeTab = 'referred out';
                                vm.dataReceived = true;
                            }
                        );
                    break;
            }
        }

        function hideMoreBtn(status) {
            if (angular.isUndefined(vm.refferedOutMatters)) {
                return false;
            }
            return vm.refferedOutMatters.length < parseInt(status.Count);
        }

    }

    /**
     * @ngdoc service
     * @name cloudlex.referral.services :referredMatterHelper
     * @requires 
     * @description
     * #referredMatterHelper
     * The referredMatterHelper provides few helper functions to help out the controller
     */

    angular
        .module('cloudlex.referral')
        .factory('referredMatterHelper', referredMatterHelper);

    function referredMatterHelper() {
        return {
            getReferredOutGridCols: _getReferredOutGridCols,
            getReferredInGridCols: _getReferredInGridCols,
            getMatterStatusGridCols: _getMatterStatusGridCols,
            getRefInMatterStatusGridCols: _getRefInMatterStatusGridCols,
            setModifiedDateDisplay: _setModifiedDateDisplay,
            setName: _setName,
            getMatterStatusCountArray: _getMatterStatusCountArray,
            getReferredStatusCountArray: _getReferredStatusCountArray,
            getDefaultStatus: _getDefaultStatus
        };


        /**
        * @ngdoc method
        * @name cloudlex.referral.referOutHelper#_getMatterStatusGridCols
        * @methodOf cloudlex.referral.referredMatterHelper
        *
        * @description
        * sets headers info for refered status grid 
        *
        * @returns {array} array having grid headers and settings for data display in the col
        */

        function _getReferredOutGridCols() {
            return [
                {
                    field: [
                        {
                            prop: 'matter_name',
                            template: 'bold',
                            title: true
                        },
                        {
                            prop: 'file_number',
                            label: 'File #'
                        },
                        {
                            prop: 'index_number',
                            label: 'Index/Docket#'
                        }],
                    displayName: 'Matter Name, File# and Index/Docket#',
                    dataWidth: 15
                },
                {
                    field: [
                        {
                            prop: 'status_name',
                            // template: 'bold'
                        },
                        {
                            prop: 'sub_status_name'
                        }],
                    displayName: 'Status & Substatus',
                    dataWidth: 15

                },
                {
                    field: [
                        {
                            prop: 'name',
                            title: true
                        }],
                    displayName: 'Referred Out To',
                    dataWidth: 15
                },
                {
                    field: [
                        {
                            prop: 'ref_out_on',
                        }],
                    displayName: 'Referred Out On',
                    dataWidth: 15
                },
                {
                    field: [
                        {
                            prop: 'message',
                            title: true,
                            ellipsis: true
                        }],
                    displayName: 'Message',
                    dataWidth: 15
                },
                {
                    field: [
                        {
                            html: '<div class="button-vertical-center">' +

                                '<button ' +
                                ' data-ng-show="data.isSender" ' +
                                ' data-ng-click="referred.cancelReferredOut($event,data)"' +
                                ' class="btn btn-default">' +
                                'Cancel</button><span class="marginLR-5px"></span>' +

                                '<button ' +
                                ' data-ng-show="data.isSender" ' +
                                ' class="btn btn-default"' +
                                ' data-ng-click="referred.resendReferredOut($event,data)"' +
                                ' data-ng-show="referred.showResendBtn(referred.selectedStatusId)">' +
                                'Resend</button>' +

                                '</div>'
                        }
                    ],

                    displayName: 'Action',
                    dataWidth: 25
                }
            ];

        }

        /**
       * @ngdoc method
       * @name cloudlex.referral.referOutHelper#_getReferredInGridCols
       * @methodOf cloudlex.referral.referredMatterHelper
       *
       * @description
       * sets headers info for refered status grid 
       *
       * @returns {array} array having grid headers and settings for data display in the col
       */

        function _getReferredInGridCols() {
            return [
                {
                    field: [
                        {
                            prop: 'matter_name',
                            title: true,
                            template: 'bold'
                        },
                        {
                            prop: 'file_number',
                            label: 'File #'
                        },
                        {
                            prop: 'index_number',
                            label: 'Index/Docket#'
                        }],
                    displayName: 'Matter Name, File# and Index/Docket#',
                    dataWidth: "15"
                },
                {
                    field: [
                        {
                            prop: 'status_name',
                            template: 'bold'
                        },
                        {
                            prop: 'sub_status_name'
                        }],
                    displayName: 'Status & Substatus',
                    dataWidth: "15"
                },
                {
                    field: [
                        {
                            prop: 'name',
                            title: true,
                        }],
                    displayName: 'Referred Out By',
                    dataWidth: "15"
                },
                {
                    field: [
                        {
                            prop: 'ref_out_on',
                        }],
                    displayName: 'Referred Out On',
                    dataWidth: "15"
                },
                {
                    field: [
                        {
                            prop: 'message',
                            title: true,
                            ellipsis: true
                        }],
                    displayName: 'Message',
                    dataWidth: "15"
                },
                {
                    field: [
                        {
                            html: '<div class="button-vertical-center"' +
                                'data-ng-show="referred.showReferredActionButtons()">' +

                                '<button ' +
                                //' data-ng-disabled="!referred.isMD" ' +
                                ' data-ng-show="data.isReceiver === 1"' +
                                ' data-ng-click="referred.paymentModal($event,data)"' +
                                ' class="btn btn-default">' +
                                'Accept</button><span class="marginLR-5px"></span>' +

                                '<button ' +
                                //' data-ng-disabled="!referred.isMD" ' +
                                ' class="btn btn-default"' +
                                ' data-ng-click="referred.declineReferral($event,data)"' +
                                ' data-ng-show="data.isReceiver === 1">' +
                                ' Decline</button>' +

                                '</div>'
                        }
                    ],

                    displayName: 'Action',
                    dataWidth: "25"
                }
            ];
        }

        /**
        * @ngdoc method
        * @name cloudlex.referral.referOutHelper#_getMatterStatusGridCols
        * @methodOf cloudlex.referral.referredMatterHelper
        *
        * @description
        * sets headers info for matter status grid 
        *
        * @returns {array} array having grid headers and settings for data display in the col
        */

        function _getMatterStatusGridCols() {
            return [
                {
                    field: [
                        {
                            prop: 'matter_name',
                            template: 'bold',
                            title: true
                            //href: { link: '#/matter-overview', paramProp: ['matter_id'] }
                        },
                        {
                            prop: 'file_number',
                            label: 'File #'
                        },
                        {
                            prop: 'index_number',
                            label: 'Index/Docket#'
                        }],
                    displayName: 'Matter Name, File# and Index/Docket#',
                    dataWidth: "20"
                },
                {
                    field: [
                        {
                            prop: 'status_name',
                            template: 'bold'
                        },
                        {
                            prop: 'sub_status_name'
                        }],
                    displayName: 'Status & Substatus',
                    dataWidth: "15"

                },
                {
                    field: [
                        {
                            prop: 'matter_type_name',
                            template: 'bold'
                        }, {
                            prop: 'matter_sub_type_name'
                        }],
                    displayName: 'Type & Subtype',
                    dataWidth: "15"
                },
                {
                    field: [{
                        prop: 'category_name'
                    }],
                    displayName: 'Category',
                    dataWidth: "10"
                },
                {
                    field: [
                        {
                            prop: 'venue_name'
                        }],
                    displayName: 'Venue',
                    dataWidth: "10"
                },
                {
                    field: [
                        {
                            prop: 'name',
                            title: true
                        }],
                    displayName: 'Referred Out To',
                    dataWidth: "10"
                },
                {
                    field: [
                        {
                            prop: 'ref_out_on',
                        }],
                    displayName: 'Referred Out On',
                    dataWidth: "10"
                },
                {
                    field: [{
                        prop: 'modified_date_display',
                    }],
                    displayName: 'Last updated',
                    dataWidth: "10"
                }];
        }


        /**
               * @ngdoc method
               * @name cloudlex.referral.referOutHelper#_getRefInMatterStatusGridCols
               * @methodOf cloudlex.referral.referredMatterHelper
               *
               * @description
               * sets headers info for referred In matter status grid 
               *
               * @returns {array} array having grid headers and settings for data display in the col
               */

        function _getRefInMatterStatusGridCols() {
            return [
                {
                    field: [
                        {
                            prop: 'matter_name',
                            template: 'bold',
                            title: true
                            //href: { link: '#/matter-overview', paramProp: ['matter_id'] }
                        },
                        {
                            prop: 'file_number',
                            label: 'File #'
                        },
                        {
                            prop: 'index_number',
                            label: 'Index/Docket#'
                        }],
                    displayName: 'Matter Name, File# and Index/Docket#',
                    dataWidth: "20"
                },
                {
                    field: [
                        {
                            prop: 'status_name',
                            template: 'bold'
                        },
                        {
                            prop: 'sub_status_name'
                        }],
                    displayName: 'Status & Substatus',
                    dataWidth: "15"

                },
                {
                    field: [
                        {
                            prop: 'matter_type_name',
                            template: 'bold'
                        }, {
                            prop: 'matter_sub_type_name'
                        }],
                    displayName: 'Type & Subtype',
                    dataWidth: "15"

                },
                {
                    field: [{
                        prop: 'category_name'
                    }],
                    displayName: 'Category',
                    dataWidth: "10"
                },
                {
                    field: [
                        {
                            prop: 'venue_name'
                        }],
                    displayName: 'Venue',
                    dataWidth: "10"
                },
                {
                    field: [
                        {
                            prop: 'name',
                            title: true
                        }],
                    displayName: 'Referred Out By',
                    dataWidth: "10"
                },
                {
                    field: [
                        {
                            prop: 'ref_out_on',
                        }],
                    displayName: 'Referred Out On',
                    dataWidth: "10"
                },
                {
                    field: [{
                        prop: 'modified_date_display',
                    }],
                    displayName: 'Last updated',
                    dataWidth: "10"
                }];
        }

        /**
        * @ngdoc method
        * @name cloudlex.referral.referOutHelper#_setModifiedDateDisplay
        * @methodOf cloudlex.referral.referredMatterHelper
        *
        * @description
        * converts the unix timestamp into required format
        * 
        * @param {array} array of objects of matter 
        */

        function _setModifiedDateDisplay(matterList) {
            _.forEach(matterList, function (matter) {
                matter.modified_date_display = moment.unix(matter.modified_date).format('DD MMM YYYY');
                matter.ref_out_on = moment.unix(matter.ref_out_on).format('DD MMM YYYY');

            });
        }

        /**
       * @ngdoc method
       * @name cloudlex.referral.referOutHelper#_setName
       * @methodOf cloudlex.referral.referredMatterHelper
       *
       * @description
       * sets name property for display
       * 
       * @param {array} array of objects of matter 
       */
        function _setName(referredMatters, activeTab) {
            var lname, fname;
            switch (activeTab) {
                case "referred in":
                    lname = "ref_out_by_lname";
                    fname = "ref_out_by_fname";
                    break;
                case "referred out":
                    lname = "ref_out_lname";
                    fname = "ref_out_fname";
                    break;
            }
            _.forEach(referredMatters, function (matter) {
                matter.name = matter[fname] + " " + matter[lname];
            });
        }

        /**
        * @ngdoc method
        * @name cloudlex.referral.referOutHelper#_getMatterStatusCountArray
        * @methodOf cloudlex.referral.referredMatterHelper
        *
        * @description
        * sets the matter status array
        * the server sends an object with the status name as a property
        * as an object is unordered collection of properties to arrange the statuses in order
        * we need to have an ordered array of statuses and then form a new ordered array to be displayed
        *
        * @param {object} referOut post obj
        * @returns {string} validation message
        */

        function _getMatterStatusCountArray(statusCount) {
            var displayOrder = [
                'All', 'New Case/Pre-Lit', 'Litigation', 'Discovery', 'Trial', 'Motion', 'Arbitration'
            ];
            var statusCounts = [];
            _.forEach(statusCount, function (status, key) {
                if (statusCount[key].isMatterStatus === "1") {
                    statusCount[key].isMatterStatus = true;
                    statusCounts.push(statusCount[key]);
                }
            });
            return statusCounts;
        }

        /**
        * @ngdoc method
        * @name cloudlex.referral.referOutHelper#_getMatterStatusCountArray
        * @methodOf cloudlex.referral.referredMatterHelper
        *
        * @description
        * sets the matter status array
        * the server sends an object with the status name as a property
        * as an object is unordered collection of properties to arrange the statuses in order
        * we need to have an ordered array of statuses and then form a new ordered array to be displayed
        *
        * @param {object} referOut post obj
        * @returns {string} validation message
        */
        function _getReferredStatusCountArray(statusCount) {
            var referredArray = ['Stalled', 'Awaiting', 'Declined'];
            var statusCounts = [];
            _.forEach(statusCount, function (status, key) {
                if (statusCount[key].isMatterStatus === "0") {
                    if (key === 'Awaiting') {
                        statusCount[key].desc = 'Awaiting Decision';
                    }
                    statusCount[key].isMatterStatus = false;
                    statusCounts.push(statusCount[key]);
                }
            });
            return statusCounts;
        }

        /**
      * @ngdoc method
      * @name cloudlex.referral.referOutHelper#_getDefaultStatus 
      * @methodOf cloudlex.referral.referredMatterHelper
      *
      * @description
      * get the default status when referred grid is loaded
      * @param {array} matter status array
      * @param {array} referred status array
      * @param {string} default status description
      * @returns {object} default status
      */
        function _getDefaultStatus(matterStatuses, referredStatuses, defaultStatusDesc) {
            var defaultStatus = _.find(referredStatuses, function (status) { return status.desc === defaultStatusDesc });
            if (parseInt(defaultStatus.Count) === 0) {
                return _.find(matterStatuses, function (status) { return status.desc === 'All' });
            }
            return defaultStatus;
        }
    }


})(angular);


