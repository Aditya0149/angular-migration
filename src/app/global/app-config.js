(function (angular) {


    angular
        .module('cloudlex')
        .config(['$urlRouterProvider', '$httpProvider', 'datepickerConfig', '$sceDelegateProvider', 'clxKeepSessionAliveProvider',
            'globalConstants', '$compileProvider',
            function ($urlRouterProvider, $httpProvider, datepickerConfig, $sceDelegateProvider, clxKeepSessionAlive,
                globalConstants, $compileProvider) {




                $urlRouterProvider.otherwise(function ($injector, $location) {
                    var $state = $injector.get('$state');
                    var isLoggedIn = localStorage.getItem('loggedIn');

                    if (isLoggedIn) {
                        var launchpad = JSON.parse(localStorage.getItem('launchpadSetting'));
                        if (launchpad && launchpad.enabled != 1) {
                            $state.go('dashboard.analytics');
                        } else {
                            $state.go('launcher');
                        }
                    } else {
                        localStorage.clear();
                        sessionStorage.clear();
                        $state.go('login');
                    }

                    return $location.path();
                });
                //add the APIInterceptor to the interceptor array
                $httpProvider.interceptors.push('APIInterceptor');

                /**
                 * You need to explicitly add URL protocols to Angular's whitelist using a regular expression. Only http, https, ftp and mailto are enabled by default. Angular will prefix a non-whitelisted URL with unsafe: when using a protocol such as chrome-extension:
                 */
                $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|javascript):/);


                //show weeks in datepicker
                datepickerConfig.showWeeks = false;

                $sceDelegateProvider.resourceUrlWhitelist([
                    // Allow same origin resource loads.
                    'self',
                    // Allow loading from our assets domain.  Notice the difference between * and **.
                    globalConstants.webServiceBase + '**'
                ]);

                //keep session alive
                var keepSessionAliveUrl = globalConstants.webServiceBase + 'lexviadocuments/keepsessionalive.json';
                clxKeepSessionAlive.setSessionAliveUrl(keepSessionAliveUrl);

                var logoutUrl = globalConstants.webServiceBase + 'services/user/logout';
                clxKeepSessionAlive.setLogoutUrl(logoutUrl);
                var isSessionAliveUrl = globalConstants.webServiceBase + 'practice/verifysession.json';
                clxKeepSessionAlive.setGetSessionStatusUrl(isSessionAliveUrl);
                clxKeepSessionAlive.setLogoutTime(31);
            }]);

})(angular)

