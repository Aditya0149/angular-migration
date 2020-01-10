
(function () {

    'use strict';

    angular
        .module('cloudlex.notes')
        .controller('NoteFiltersCtrl', NoteFiltersController);

    NoteFiltersController.$inject = ['notesDataService', '$scope', '$modalInstance', 'matterID', 'categories', 'users', 'selectedFilters', 'currentDateFilter', 'tags', 'contactFactory', 'matterFactory', 'globalConstants'];

    function NoteFiltersController(notesDataService, $scope, $modalInstance, matterID, categories, users, selectedFilters, currentDateFilter, tags, contactFactory, matterFactory, globalConstants) {
        $scope.categories = [];

        $scope.users = [];
        $scope.currentFilter = {
            catFilter: [],
            uidFilter: [],
            impFilter: '',
            start: '',
            end: '',
            linked_contact: [],
        };
        var tagList = tags;
        $scope.getLinkContactFilter = getLinkContactFilter;

        (function () {
            $scope.categories = categories;
            $scope.categories.push({ 'category_name': "{Blank}", 'notecategory_id': "blank" }); //US:3548 Add Blank Filter value for  filter pop up 
            //US:3548 Filter Unique category 
            $scope.categories = _.uniq($scope.categories, function (item) {
                return item.category_name;
            });
            $scope.users = users;

            if (selectedFilters != null) {
                $scope.currentFilter = utils.isEmptyObj(selectedFilters) ? $scope.currentFilter : selectedFilters;
            }
            if (currentDateFilter != null) {
                $scope.currentDateFilter = currentDateFilter;
            }
        })();

        $scope.setDateFilter = function (param) {

            $scope.currentDateFilter = param;

            var start = moment();
            var end = moment(); //Now

            switch (param) {
                case "LAST_WEEK":
                    start = moment().subtract('days', 7);        // Start of day 7 days ago
                    break;
                case "MONTH_AGO":
                    start = moment().subtract('months', 1);        // Start of day 1 month ago
                    break;
            }

            start = moment(start).subtract('m', moment(start).minutes());
            start = moment(start).subtract('h', moment(start).hours());
            start = moment(start).subtract('s', moment(start).seconds());
            start = moment(start).subtract('ms', moment(start).milliseconds());

            $scope.currentFilter.start = start.utc().unix();
            $scope.currentFilter.end = end.utc().unix();
        };

        $scope.$watch(function () {
            if ($scope.currentFilter && !utils.isEmptyObj($scope.currentFilter)) {
                if ((angular.isDefined($scope.currentFilter.catFilter) && $scope.currentFilter.catFilter.length > 0) || utils.isNotEmptyVal($scope.currentFilter.end) ||
                    utils.isNotEmptyVal($scope.currentFilter.start) || $scope.currentFilter.uidFilter.length > 0 ||
                    $scope.currentFilter.impFilter != '' || tagList.length > 0 || $scope.currentFilter.linked_contact.length > 0) {
                    $scope.enableApply = false;
                } else {
                    $scope.enableApply = true;
                }
            } else {
                $scope.enableApply = true;
            }

        })

        function getLinkContactFilter(name) {

            if (utils.isNotEmptyVal(name)) {
                var postObj = {};
                postObj.type = globalConstants.allTypeList;
                postObj.first_name = utils.isNotEmptyVal(name) ? name : '';
                //postObj = matterFactory.setContactType(postObj);
                postObj.page_Size = 250


                matterFactory.getContactsByName(postObj, true)
                    .then(function (response) {
                        var data = response.data;
                        $scope.filteredContact = [];
                        var allData = [];
                        contactFactory.setDataPropForContactsFromOffDrupalToNormalContact(data);
                        contactFactory.setNamePropForContactsOffDrupal(data);
                        $scope.filteredContact = [];
                        var allLinkedContactId = _.pluck($scope.currentFilter.linked_contact, 'contact_id');
                        var responseData = angular.copy(data);
                        _.forEach(responseData, function (item, index) {
                            _.forEach(allLinkedContactId, function (it) {
                                if (item.contact_id == it) {
                                    data.splice(index, 1);
                                }
                            })
                        });
                        allData = data;
                        _.forEach(allData, function (item) {
                            if (item.contact_type != "Global") {
                                $scope.filteredContact.push(item);
                            }
                        });


                        // $scope.filteredContact = data;

                        if (utils.isNotEmptyVal($scope.filteredContact)) {
                            $scope.filteredContact = _.uniq($scope.filteredContact, function (item) {
                                return item.contactid;
                            });
                        }
                    }, function (error) {
                        //notificationService.error('Unable to retreive contacts.');
                    });
            } else {
                $scope.filteredContact = [];
            }
        }

        $scope.applyFilters = function () {
            //if email category is checked then add key,value pair into existing object  
            _.forEach($scope.currentFilter.catFilter, function (value, key) {
                if (utils.isNotEmptyVal(value)) {
                    if (value == '13' && $scope.currentFilter.catFilter.indexOf('1001') == -1) {
                        $scope.currentFilter.catFilter.push('1001');
                    };
                }

            });
            var index = _.indexOf($scope.currentFilter.catFilter, 13);
            if (index == -1) {
                var dummyIndex = _.indexOf($scope.currentFilter.catFilter, '1001');
                if (dummyIndex > -1) {
                    $scope.currentFilter.catFilter.splice(dummyIndex, 1);
                }
            }
            notesDataService.customPageNum = 1;
            notesDataService.getFilteredNotes(matterID, $scope.currentFilter, notesDataService.customPageNum)
                .then(function (data) {
                    $modalInstance.close({ filterData: data.notes, filters: $scope.currentFilter, currentDateFilter: $scope.currentDateFilter });
                });
        };

        $scope.reset = function () {
            $scope.currentDateFilter = '';
            $scope.currentFilter = {
                categoryFilter: [],
                uidFilter: [],
                linked_contact: [],
                impFilter: '',
                start: '',
                end: ''
            };

            //$modalInstance.close({ action: "RESET" });
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

    }

})();




