(function (angular) {
    angular.module('cloudlex')
        .factory('APIInterceptor', ['$q', 'userSession', 'globalConstants', 'errorResponseHandler', 'clxKeepSessionAlive',
            function ($q, userSession, globalConstants, errorResponseHandler, keepSessionAliveHelper) {

                return {
                    request: request,
                    response: response,
                    responseError: responseError
                };

                function request(config) {

                    //check for api call
                    if (utils.startsWith(config.url, globalConstants.webServiceBase) ||
                        utils.startsWith(config.url, globalConstants.intakeBase) ||
                        utils.startsWith(config.url, globalConstants.matterBase)
                    ) {
                        //remove all the script tags
                        switch (typeof config.data) {
                            case 'object':
                                stripScriptTag(config.data);
                                break;
                            case 'string':
                                config.data = config.data.replace(/<script.*?>.*?<\/script>/igm, '');
                        }
                        /* the condition is added to exclude the X_CSRF_Token from login service and send in all other services */
                        if (utils.endsWith(config.url, 'login')) {
                            delete config.headers['X-CSRF-Token'];
                        } else {
                            config.headers['X-CSRF-Token'] = userSession.getToken();
                            config.headers['Authorization'] = "Bearer " + localStorage.getItem('accessToken');
                            if (utils.startsWith(config.url, globalConstants.intakeBase) ||
                                utils.startsWith(config.url, globalConstants.matterBase)) {
                                config.headers['Ocp-Apim-Subscription-Key'] = globalConstants.Ocp_Apim_Subscription_Key;
                            } else {
                                config.withCredentials = true;
                            }
                        }

                        if (config.url.indexOf("_config.json") > -1) {
                            var buster = new Date().getTime();
                            config.url += ['?v=', buster].join('');
                        }

                        var now = new Date();
                        localStorage.setItem('lastRequestTime', now.getTime());
                        utils.endsWith(config.url, 'logout') ? angular.noop() : keepSessionAliveHelper.resetTimer();
                    } else {
                        var buster = new Date().getTime();

                        if (config.url.indexOf('template/') == -1 &&
                            config.url.indexOf('angular') == -1 &&
                            config.url.indexOf('tpl') == -1 &&
                            config.url.indexOf('.html') > -1) {
                            config.url += ['?v=', buster].join('');
                        }

                        if (config.url.indexOf("_config.json") > -1) {
                            config.url += ['?v=', buster].join('');
                        }
                    }

                    return config;
                };

                function stripScriptTag(object) {
                    angular.forEach(object, function (val, key) {
                        object[key] = (typeof object[key] === "string") ?
                            object[key].replace(/<script.*?>.*?<\/script>/igm, '') : object[key];

                        //if (typeof object[key] === "object") {
                        //    stripScriptTag(object[key]);
                        //}
                    });
                }


                function response(response) {
                    return response;
                }

                function responseError(response) {
                    // console.log("error: ", response);
                    errorResponseHandler.handle(response);
                    return $q.reject(response);
                };
            }])
})(angular);