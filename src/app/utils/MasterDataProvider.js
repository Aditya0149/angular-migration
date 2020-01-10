(function () {

    angular.module('cloudlex.masterData', [])
        .factory('masterData', ['$http', '$q', 'globalConstants',
            function ($http, $q, globalConstants) {
                var masterData = {};
                var promise;
                var userRole = {};
                var subscriptionStat = {};
                var jurisdictionId;

                var masterDataUrl = globalConstants.javaWebServiceBaseV4 + 'master-data';
                var userRoleUrl = globalConstants.webServiceBase + 'practice/user_role.json';
                var subscriptionStatus = globalConstants.webServiceBase + 'modulesubscription/subscription.json';
                var fetchFirmDataUrl = globalConstants.javaWebServiceBaseV4 + 'firm/fetch-firm-data';
                return {
                    promise: promise,
                    fetchMasterData: fetchMasterData,
                    fetchUserRole: fetchUserRole,
                    fetchJurisdiction: fetchJurisdiction,
                    fetchSubscription: fetchSubscription,
                    getSubscription: getSubscription,
                    clearUserRole: clearUserRole,
                    getUserRole: getUserRole,
                    setUserRole: setUserRole,
                    getMasterData: getMasterData,
                    getEventTypes: getEventTypes,
                    getVenues: getVenues,
                    getJurisdictions: getJurisdictions,
                    getPermissions: getPermissions,
                    fetchFirmData: fetchFirmData,
                };

                function mapDataForIntake() {
                    masterData.countries = masterData.contries;
                    _.forEach(masterData.event_types, function (it) {
                        it.name = it.Name;
                        it.labelId = it.LabelId;
                    });
                    // to shift labelId 3 and 20 to bottom -- US#18262
                    var removeType = _.filter(masterData.event_types, function (item) {
                        return item.labelId == 3 || item.labelId == 20
                    });
                    
                    var typeList = _.reject(masterData.event_types,function(item){
                        return item.labelId == 3 || item.labelId == 20
                    });
                    var list = _.sortBy(typeList,'name');
                    masterData.event_types = [];
                    list.push(removeType[0]);
                    list.push(removeType[1]);
                    masterData.event_types = list;
                    _.forEach(masterData.documents_cat, function (it) {
                        it.doc_category_id = it.Id;
                        it.doc_category_name = it.Name;
                    });

                }

                function fetchMasterData() {
                    var deferred = $q.defer();
                    var existingData = getMasterData();
                    if (utils.isEmptyObj(existingData)) {
                        $http.get(masterDataUrl)
                            .then(function (response) {
                                if (angular.isDefined(response.data)) {
                                    masterData = utils.mapKeys(response.data);
                                    mapDataForIntake();
                                }
                                deferred.resolve(masterData);
                            }, function (error) {
                                deferred.reject();
                            });
                    } else {
                        deferred.resolve(existingData);
                    }
                    return deferred.promise;
                }

                function fetchFirmData(params) {
                    var url = '';
                    url = angular.isDefined(params) ? fetchFirmDataUrl + "?fid=" + params : fetchFirmDataUrl;

                    // getting access token of java login user
                    var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }

                    var deferred = $q.defer();
                    $http({
                        url: url,
                        method: "GET",
                        headers: token, // Add params into headers
                        withCredentials: true
                    }).then(function (response) {
                        deferred.resolve(response.data);
                    }, function (response) {
                        deferred.reject(response);
                    });

                    return deferred.promise;

                }


                function fetchUserRole(deferred) {
                    var deferred = $q.defer();
                    var url = userRoleUrl;
                    $http.get(url)
                        .then(function (response) {
                            userRole = response.data;
                            jurisdictionId = response.data.jurisdiction_id;
                            // localStorage.setItem("jurisdictionId", response.data.jurisdiction_id);
                            fetchJurisdiction();
                            deferred.resolve();
                        }, function () {
                            deferred.reject()
                        });
                    return deferred.promise;
                }

                function fetchJurisdiction(deferred) {
                    var jurisdictionsList = [];
                    var selectedJurisdiction;
                    jurisdictionsList = getJurisdictions();

                    // var defaultJurisdiction = localStorage.getItem("jurisdictionId");
                    if (jurisdictionId == null) {
                        localStorage.setItem('firmJurisdiction', '');
                    } else {
                        var defaultJurisdiction = _.where(jurisdictionsList, { id: jurisdictionId });
                        if (defaultJurisdiction && defaultJurisdiction.length > 0) {
                            selectedJurisdiction = defaultJurisdiction[0];
                            localStorage.setItem('firmJurisdiction', JSON.stringify(selectedJurisdiction));
                        } else {
                            localStorage.setItem('firmJurisdiction', '');
                        }
                    }
                }

                function fetchSubscription() {
                    var deferred = $q.defer();
                    $http.get(subscriptionStatus)
                        .then(function (response) {
                            if (angular.isDefined(response.data)) {
                                subscriptionStat = response.data;
                            }
                            deferred.resolve();
                        }, function (error) {
                            deferred.reject();
                        });
                    return deferred.promise;
                }

                function clearUserRole() {
                    userRole = null;
                }

                function getUserRole() {
                    var launchpad = JSON.parse(localStorage.getItem('launchpadSetting'));
                    if (launchpad && launchpad.enabled == 0) {
                        userRole.client_portal = 0;
                    }
                    return userRole;
                }

                function getSubscription() {
                    return subscriptionStat;
                }

                function getPermissions() {
                    return masterData.user_permission;
                }

                function setUserRole(role) {
                    userRole = angular.copy(role);
                }

                function getMasterData() {
                    return masterData;
                }

                function getEventTypes() {
                    return masterData.event_types;
                }

                function getVenues() {
                    return angular.copy(masterData.venues);
                }

                function getJurisdictions() {
                    return angular.copy(masterData.jurisdictions);
                }

            }
        ]);

})();

(function () {

    angular.module('intake.masterData', [])
        .factory('intakeMasterData', ['$http', '$q', 'globalConstants',
            function ($http, $q, globalConstants) {
                var masterData = {};
                var masterDataUrl = globalConstants.intakeServiceBaseV2 + 'master';

                return {
                    fetchMasterData: fetchMasterData,
                    getMasterData: getMasterData,
                };

                function fetchMasterData() {
                    var deferred = $q.defer();
                    var token = {
                        'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                        'Content-type': 'application/json'
                    }
                    $http({
                        url: masterDataUrl,
                        method: "GET",
                        headers: token,
                    }).success(function (response, status) {
                        if (angular.isDefined(response)) {
                            masterData = response;
                        }
                        deferred.resolve(masterData);
                    }).error(function (ee, status, headers, config) {
                        deferred.reject(ee);
                    });

                    return deferred.promise;

                }

                function getMasterData() {
                    return masterData;
                }

            }
        ]);

})();