(function () {
    'use strict';
    angular
        .module('cloudlex.marketplace')
        .controller('servicesCtrl', servicesController);

    servicesController.$inject = ['$state', 'applicationsDataLayer', 'notification-service', 'masterData', 'routeManager', 'globalConstants'];

    function servicesController($state, applicationsDataLayer, notificationService, masterData, routeManager, globalConstants) {

        var vm = this;
        vm.save = saveServicesData;
        vm.showDetails = showDetails;
        vm.clearStorage = clearStorage;
        vm.myInterval = 3000;

        var gracePeriodDetails = masterData.getUserRole();
        vm.dissableSubscribe = (gracePeriodDetails.is_admin == 1) || gracePeriodDetails.role == "LexviasuperAdmin" ? false : true;
        vm.slides = [
            {
                image: 'styles/images/marketplace-images/01.jpg'
            },
            {
                image: 'styles/images/marketplace-images/02.jpg'
            },
            {
                image: 'styles/images/marketplace-images/03.jpg'
            },
            {
                image: 'styles/images/marketplace-images/04.jpg'
            }
        ];
        (function () {
            setBreadcrum();
            getConfiguredData();
            setImageSlider(localStorage.getItem("selectedType"));
        })();

        /**
         * set slider images 
         */
        function setSliderImg(images) {
            vm.slides = [];
            _.forEach(images, function (currentItem, index) {
                vm.slides.push({ image: "styles/images/marketplace-images/slider/" + currentItem });
            });
        }

        /**
         * set images in slider
         * @param {type} selected 
         */
        function setImageSlider(type) {
            switch (type) {
                case "LS":
                    setSliderImg(globalConstants.marketPlace.LS); // set slider images
                    break;
            }
        }

        /**
         * show details for LexviaServices
         */
        function showDetails(selected) {
            switch (selected) {
                case "LS":
                    $state.go('digital-lexvia-service-up');
                    localStorage.setItem("upstate", ' Services ');
                    localStorage.setItem("selectedType", "LS");
                    break;
            }
        }

        /**
         * set backward state for services
         */
        function clearStorage() {
            localStorage.setItem("upstate", 'Services');
        }


        function setBreadcrum() {
            var initCrum = [{ name: '...' }, { name: 'Services' }];
            routeManager.setBreadcrum(initCrum);
        }



        function saveServicesData(data) {
            var postDataObj = {
                LexviaServices: data == true ? 1 : 0
            }
            var response = applicationsDataLayer.saveServicesData(postDataObj);
            response.then(function (data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    getConfiguredData();
                    if (postDataObj.LexviaServices == 1) {
                        notificationService.success('You have successfully subscribed to Lexvia Services');
                    } else if (postDataObj.LexviaServices == 0) {
                        notificationService.success('You have unsubscribed Successfully');
                    }
                }
            }, function (error) {
                notificationService.error(error.data[0]);
            });
        }


        function getConfiguredData() {
            var response = applicationsDataLayer.getConfigurableData();
            response.then(function (data) {
                vm.isLexviaServices = data.services.lexvia_services;
            });
        }
    }

})();
