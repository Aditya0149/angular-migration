
(function (angular) {
    'use strict';

    angular.module('cloudlex.referral')
        .controller('SearchReferralCtrl', SearchReferralController)

    SearchReferralController.$inject = ['$scope', '$modalInstance', 'searchRefDatalayer', 'searchRefHelper',
        'notification-service', 'scrollHelper', 'resetCallbackHelper'];

    function SearchReferralController($scope, $modalInstance, searchRefDatalayer, searchRefHelper,
        notificationService, scrollHelper, resetCallbackHelper) {
        var vm = this,
            initPageDataLimit = 50;
        vm.setSelectedSearch = setSelectedSearch;
        vm.getSearchedData = getSearchedData;
        vm.setSelectedTab = setSelectedTab;
        vm.cancel = cancel;
        vm.selectedContact = selectedContact;
        vm.inviteNewContact = inviteNewContact;

        (function () {
            vm.showSearchResults = false;
            vm.searchData = {
                lawFirm: [],
                searchByName: [],
                searchByEmail: [],
                inviteNew: []

            };
            var defaultSearchParam = "searchByName";
            vm.tabs = searchRefHelper.setTabs(vm.searchData);
            resetCallbackHelper.setCallback(function () {
                $scope.$apply(function () {
                    vm.searchString = "";
                    vm.searchParam = defaultSearchParam;
                    getSearchedData(vm.searchString);
                });
            });

            vm.searchParams = [
                { value: "searchByName", label: "Search by Name" },
                { value: "searchByEmail", label: "Search by Email" },
                { value: "lawFirm", label: "Law Firm" }
                //  { value: "inviteNew", label: "Invite New" }
            ];
            vm.searchParam = defaultSearchParam;

            scrollHelper.setReachedBottom(reachedBottom);
            scrollHelper.setReachedTop(reachedTop);
        })();


        function cancel() {
            $modalInstance.close();
        }

        function reachedBottom() {
            vm.limit += initPageDataLimit;
        }

        function reachedTop() {
            vm.limit = initPageDataLimit;
        }




        function selectedContact(data) {
            $modalInstance.close(data);
        }

        function inviteNewContact(type, email) {
            var postObj = {
                // conatctType:type,
                email_id: email
            }
            searchRefDatalayer.inviteNewContact(postObj)
                .then(function (data) {
                    notificationService.success('New contact invited succesfully');
                    $modalInstance.close(data);
                }, function () {
                    notificationService.error('An error occurred. Please try later.');
                    // $modalInstance.dismiss();
                });

        }



        function setSelectedSearch(searchString) {
            vm.searchString = searchString;
            getSearchedData(vm.searchString);
        }



        function getResultForSearchParam(searchString, searchParam) {
            if (utils.isEmptyVal(searchString)) {
                return;
            }

            getSearchedData(searchString, searchParam);
        }

        function getSearchedData(searchString, searchParam) {
            //get search result
            searchRefDatalayer
                .search(searchString, searchParam)
                .then(function (response) {
                    $('.tooltip').remove();
                    //set ng-repeat limit
                    vm.limit = initPageDataLimit;
                    vm.searchData = response.data;

                    vm.lawFirm = vm.searchData.law_firm;
                    vm.searchByName = vm.searchData.search_name;
                    vm.searchByEmail = vm.searchData.search_email;

                    vm.tabs = searchRefHelper.setTabs(vm.searchData);
                    vm.showSearchResults = true;
                    vm.showTabs = utils.isNotEmptyVal(searchString);
                    vm.isDataPresent = searchRefHelper.isDataPresent(vm.searchData, vm.searchString);
                    vm.showNoDataMsg = (!vm.isDataPresent) && (angular.isDefined(searchString) && !utils.isEmptyString(searchString));


                    vm.setSelectedTab(searchParam);
                });
        }



        function setSelectedTab(tab) {
            vm.limit = initPageDataLimit;
            vm.currentTab = tab;
        }



    }

    angular
        .module('cloudlex.referral')
        .factory('searchRefHelper', searchRefHelper)

    function searchRefHelper() {
        return {
            setTabs: _setTabs,

            isDataPresent: _isDataPresent,
            isInSavedList: _isInSavedList
        };

        function _setTabs(data) {
            var tabs = [];



            var tabModel = [
                { prop: 'searchByName', display: 'Search by Name' },
                { prop: 'searchByEmail', display: 'Search by Email' },
                { prop: 'lawFirm', display: 'Law Firm' },
                // { prop: 'inviteNew', display: 'Invite New' }
            ];
            //set tabs mentioned in the obj above
            angular.forEach(tabModel, function (tab) {
                var tabObj = {
                    value: tab.prop,
                    label: (angular.isDefined(data[tab.prop]) ? data[tab.prop].length : 0) + ' ' + tab.display
                };
                tabs.push(tabObj);
            });

            return tabs;
        }



        function _isDataPresent(searchData, searchString) {
            return (!utils.isEmptyObj(searchData)) && (angular.isDefined(searchString) && !utils.isEmptyString(searchString));
        }

        function _isInSavedList(string, savedList) {
            var strings = _.pluck(savedList, 'string');
            return strings.indexOf(string) > -1;
        }
    }
})(angular);


