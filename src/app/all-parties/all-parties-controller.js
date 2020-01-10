;

(function () {

    'use strict';

    angular
        .module('cloudlex.allParties')
        .controller('AllPartiesCtrl', AllPartiesController);

    AllPartiesController.$inject = ['$scope', 'allPartiesDataService', '$stateParams',
        'matterFactory', 'contactFactory', '$rootScope', 'mailboxDataService', 'practiceAndBillingDataLayer'];

    function AllPartiesController($scope, allPartiesDataService, $stateParams,
        matterFactory, contactFactory, $rootScope, mailboxDataService, practiceAndBillingDataLayer) {

        var self = this;
        self.matterId = $stateParams.matterId;
        self.dataReceived = false;
        $scope.plaintiffsCount = 0;
        $scope.defendantsCount = 0;
        $scope.otherPartiesCount = 0;
        self.closeComposeMail = closeComposeMail;

        allPartiesDataService.resetAllPartiesData();
        allPartiesDataService
            .getAllParties(self.matterId)
            .then(function () {
                self.dataReceived = true;
            });

        self.views = {
            PLAINTIFF_VIEW: "PLAINTIFF_VIEW",
            DEFENDANT_VIEW: "DEFENDANT_VIEW",
            OTHER_PARTY_VIEW: "OTHER_PARTY_VIEW"
        };

        (function () {

            displayWorkflowIcon();
            //set breadcrum
            //matterFactory.setBreadcrum(self.matterId, 'All Parties');
            matterFactory.setBreadcrumWithPromise(self.matterId, 'All Parties').then(function (resultData) {
                self.matterInfo = resultData;
            });
            //Set current view
            if ($stateParams.openView) {
                self.currentView = $stateParams.openView;
            } else {
                self.currentView = self.views.PLAINTIFF_VIEW;
            }
            self.firmData = JSON.parse(localStorage.getItem('firmSetting'));
            getUserEmailSignature();


        })();

        function displayWorkflowIcon() {
            var response = practiceAndBillingDataLayer.getConfigurableData();
            response.then(function (data) {
                var resData = data.matter_apps;                                   //promise
                if (angular.isDefined(resData) && resData != '' && resData != ' ') {
                    self.is_workflow = (resData.workflow == 1) ? true : false;
                }
            });
        }

        $rootScope.$on('updateWorkflowIcons', function (updateworkflowIconevent) {
            displayWorkflowIcon();
        });


        /*** Service call Functions ***/

        /*** Event Handlers ***/
        self.openContactCard = function (contact) {
            contactFactory.displayContactCard1(contact.contactid, contact.edited, contact.contact_type);
            contact.edited = false;
        };

        //  //set email signature
        function getUserEmailSignature() {
            mailboxDataService.emailSignature()
                .then(function (data) {
                    if (utils.isNotEmptyVal(data.data)) {
                        self.signature = data.data[0];
                        self.signature = '<br/><br/>' + self.signature;
                    }
                });
        }

        // //US#8330
        $scope.$on('composeEmailFromContact', function (event, data) {
            if (!(window.isDrawerOpen)) {
                self.compose = true;
                var html = "";
                html += (self.signature == undefined) ? '' : self.signature;
                self.composeEmail = html;
                $rootScope.updateComposeMailMsgBody(self.composeEmail, '', '', '', 'contactEmail', data);
            }

        });

        //US#8330
        $rootScope.$on("callCloseComposeMail", function () {
            closeComposeMail();
        });

        //US#8330
        function closeComposeMail() {
            self.compose = false;
        }

        self.showView = function (view) {
            self.currentView = view;
            if (self.currentView == self.views.OTHER_PARTY_VIEW) {
                // set height for otherparties grid
                setTimeout(function () {
                    var heightForGrid = ($("#allPartiesFooter").offset().top - $("#myDiv1").offset().top);
                    heightForGrid = heightForGrid - $("#gridHeaderOtherParties").height();
                    $('#myGrid').css("max-height", heightForGrid + "px");
                    $('#myGrid').css("height", heightForGrid + "px");
                }, 100);
            }
        };

        /*** Styling Functions ***/

        /*** Alert Functions ***/
        self.alert = {};

        self.closeAlert = function () {
            self.alert = {};
        };
    }

})();