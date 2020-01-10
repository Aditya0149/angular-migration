(function () {
    'use strict';
    angular
        .module('cloudlex.marketplace')
        .controller('upcompingAppsCtrl', upcompingAppsController);

    upcompingAppsController.$inject = ['$state', 'applicationsDataLayer', 'notification-service', 'routeManager', 'globalConstants'];

    function upcompingAppsController($state, applicationsDataLayer, notificationService, routeManager, globalConstants) {

        var vm = this;
        vm.showDetails = showDetails;
        // vm.showDetailsPage = false;
        vm.save = saveProfile;
        // vm.showapplications =true;
        vm.clearStorage = clearStorage;
        var LstateName = 'Upcoming';
        vm.myInterval = 3000;
        vm.slides = [];

        (function () {
            setBreadcrum();
            getConfiguredData();
            setImageSlider(localStorage.getItem("upSelectedType"));
        })();


        /**
         * set images in slider
         * @param {type} selected 
         */
        function setImageSlider(type) {
            switch (type) {
                case "CCOM":
                    setSliderImg(globalConstants.marketPlace.CCOM); // set slider images
                    break;
                case "RE":
                    setSliderImg(globalConstants.marketPlace.RE); // set slider images
                    break;
                case "RX":
                    setSliderImg(globalConstants.marketPlace.RX); // set slider images
                    break;
                case "DA":
                    setSliderImg(globalConstants.marketPlace.DA); // set slider images
                    break;
                case "IT":
                    setSliderImg(globalConstants.marketPlace.IT); // set slider images
                    break;
                case "OPLG":
                    setSliderImg(globalConstants.marketPlace.OPLG); // set slider images
                    break;
                case "0365":
                    setSliderImg(globalConstants.marketPlace.O365); // set slider images
                    break;
            }
        }

        function showDetails(selected) {

            switch (selected) {
                case "CCOM":
                    $state.go('c-com-details-up');
                    localStorage.setItem("upstate", 'Client Communicator ');
                    localStorage.setItem("upSelectedType", "CCOM");
                    break;
                case "RE":
                    $state.go('referral-engine-details-up');
                    localStorage.setItem("upstate", 'Referral Engine ');
                    localStorage.setItem("upSelectedType", "RE");
                    break;
                case "DA":
                    $state.go('digatl-archival-details-up');
                    localStorage.setItem("upstate", 'Digital Archiver');
                    localStorage.setItem("upSelectedType", "DA");
                    break;
                case "OPLG":
                    $state.go('word-officePlug-details-up');
                    localStorage.setItem("upstate", 'Office Connector');
                    localStorage.setItem("upSelectedType", "OPLG");
                    break;
                case "RX":
                    $state.go('referral-exchange-details-up');
                    localStorage.setItem("upstate", 'Referral Exchange ');
                    localStorage.setItem("upSelectedType", "RX");
                    break;
                case "O365":
                    $state.go('office-online-details-up');
                    localStorage.setItem("upstate", 'Microsoft Office Online');
                    localStorage.setItem("upSelectedType", "0365");
            }

        }

        /**
         * set slider images 
         */
        function setSliderImg(images) {
            vm.slides = [];
            _.forEach(images, function (currentItem, index) {
                vm.slides.push({ image: "styles/images/marketplace-images/slider/" + currentItem });
            });
        }

        function setBreadcrum() {
            LstateName = utils.isEmptyVal(localStorage.getItem("upstate")) ? LstateName : localStorage.getItem("upstate");
            var initCrum = [{ name: '...' }, { name: LstateName }];
            routeManager.setBreadcrum(initCrum);
        }


        function clearStorage() {
            localStorage.setItem("upstate", 'Upcoming');
        }


        function saveProfile(data) {
            var postDataObj = {
                application_id: data.id,
                status: 1
            }
            var response = applicationsDataLayer.saveProfileData(postDataObj);
            response.then(function (data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    getConfiguredData();
                    notificationService.success('Configuration saved Successfully');
                }
            }, function (error) {
                notificationService.error(error.data[0]);
            });
        }


        function getConfiguredData() {
            var response = applicationsDataLayer.getConfigurableData();
            response.then(function (data) {
                vm.isRefferalEngine = data.services.lexvia_services;

            });
        }
    }

})();
