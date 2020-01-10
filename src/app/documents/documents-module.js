(function () {
    'use strict';

    angular.module('cloudlex.documents', ['ui.router'])

        .config(['$stateProvider', function ($stateProvider) {
            $stateProvider
                .state('matter-documents', {
                    url: '/matter-documents/:matterId',
                    templateUrl: 'app/documents/document-list.html',
                    controller: 'DocumentsCtrl as documentlist',
                    params: {
                        liteNotificationFilter: false,
                    },
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }],
                        'SubscriptionData': ['masterData', function (masterData) {
                            var subscription = masterData.getSubscription();
                            if (utils.isEmptyObj(subscription)) {
                                return masterData.fetchSubscription();
                            }
                            return subscription;
                        }]
                    }
                })
                .state('document-upload', {
                    url: '/matter-documents/upload/:matterId',
                    templateUrl: 'app/documents/add-document/landing.html',
                    controller: 'AddDocumentsCtrl as document',
                })
                .state('create-online', {
                    url: '/matter-documents/office-online/:matterId',
                    templateUrl: 'app/documents/add-document/createOnline.html',
                    controller: 'AddDocumentsCtrl as document',
                })
                .state('document-edit', {
                    url: '/matter-documents/edit/:matterId/:documentId',
                    templateUrl: 'app/documents/view-document/document-edit.html',
                    controller: 'ViewDocumentsCtrl as document',
                    resolve: {
                        'MasterData': ['masterData', '$state', '$stateParams', function (masterData, $state, $stateParams) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }],
                        'SubscriptionData': ['masterData', function (masterData) {
                            return masterData.fetchSubscription();
                        }]
                    }
                })

                .state('document-collaboration', {
                    url: '/matter-documents/sharing/:matterId/:documentId',
                    templateUrl: 'app/documents/collaboration-document/document-collaboration.html',
                    controller: 'CollaborationDocumentsCtrl as collaborationDocument',
                    resolve: {
                        // 'MasterData': ['masterData', '$state', '$stateParams', function (masterData, $state, $stateParams) {
                        //     var data = masterData.getMasterData();
                        //     if (utils.isEmptyObj(data)) {
                        //         return masterData.fetchMasterData();
                        //     }
                        //     return data;
                        // }],
                        // 'SubscriptionData': ['masterData', function (masterData) {
                        //     return masterData.fetchSubscription();
                        // }]
                    }
                })



                .state('office-view', {
                    url: '/matter-documents/officeview/:matterId/:documentId',
                    templateUrl: 'app/documents/office365/officeOnline.html',
                    controller: 'officeDocViewCtrl as officeOnline'
                })
                .state('document-view', {
                    url: '/matter-documents/view/:matterId/:documentId',
                    templateUrl: 'app/documents/view-document/document-view.html',
                    controller: 'ViewDocumentsCtrl as documentData',
                    onEnter: function ($rootScope) {
                        if ($rootScope.archivalMatterReadOnlyFlag) {
                            $rootScope.onLauncher = false;
                            $rootScope.onMatter = false;
                            $rootScope.onIntake = false;
                            $rootScope.onReferral = false;
                            $rootScope.onArchival = true;
                            $rootScope.onMarkerplace = false;
                            $rootScope.onExpense = false;
                            $rootScope.onReferralPrg = false;
                        } else {
                            $rootScope.onLauncher = false;
                            $rootScope.onMatter = true;
                            $rootScope.onIntake = false;
                            $rootScope.onReferral = false;
                            $rootScope.onArchival = false;
                            $rootScope.onMarkerplace = false;
                            $rootScope.onExpense = false;
                            $rootScope.onReferralPrg = false;
                            
                        }
                    }
                })



                .state('documents', {
                    url: '/documents',
                    templateUrl: 'app/documents/document-list.html',
                    controller: 'DocumentsCtrl as documentlist',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }],
                        'SubscriptionData': ['masterData', function (masterData) {
                            return masterData.fetchSubscription();
                        }]
                    },
                    onEnter: function ($rootScope) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    }
                })
                .state('globaldocument-view', {
                    url: '/document/view/:matterId/:documentId',
                    templateUrl: 'app/documents/view-document/document-view.html',
                    controller: 'ViewDocumentsCtrl as documentData',
                    breadcrum: [{ name: 'Documents', state: 'documents' }, { name: 'Document View' }]
                })
                .state('global-office-redirect', {
                    cache: false,
                    url: '/document/office365?mode',
                    templateUrl: 'app/documents/office365/officeOnline.html',
                    controller: 'officeDocViewCtrl as officeOnline',
                    breadcrum: [{ name: 'Documents', state: 'documents' }, { name: 'Office online' }]
                })

                .state('global-office-view', {
                    cache: false,
                    url: '/document/office365',
                    templateUrl: 'app/documents/office365/officeOnline.html',
                    controller: 'officeDocViewCtrl as officeOnline',
                    breadcrum: [{ name: 'Documents', state: 'documents' }, { name: 'Office online' }]
                })
                .state('global-office-edit', {
                    cache: false,
                    url: '/document/office365',
                    templateUrl: 'app/documents/office365/office365.html',
                    controller: 'officeDocCtrl as officeDocCtrl',
                    breadcrum: [{ name: 'Documents', state: 'documents' }, { name: 'Office online' }],

                })


                .state('globaldocument-edit', {
                    url: '/document/edit/:matterId/:documentId',
                    templateUrl: 'app/documents/view-document/document-edit.html',
                    controller: 'ViewDocumentsCtrl as document',
                    resolve: {
                        'MasterData': ['masterData', '$state', '$stateParams', function (masterData, $state, $stateParams) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }],
                        'SubscriptionData': ['masterData', function (masterData) {
                            return masterData.fetchSubscription();
                        }],
                        'CheckFileExists': ['documentsDataService', 'notification-service', '$stateParams', function (documentsDataService, notificationService, $stateParams) {
                            documentsDataService.checkIfFileExists($stateParams.documentId)
                                .then(function (response) {
                                    if (response.data[0]) {
                                        notificationService.error('An error occurred. Please try later');
                                        return false;
                                    }
                                }, function (error) {
                                    notificationService.error('Bold error');
                                    return false;
                                });
                        }]
                    },
                    breadcrum: [{ name: 'Documents', state: 'documents' }, { name: 'Document Edit' }]
                })
                .state('global-create-online', {
                    url: '/documents/office-online',
                    templateUrl: 'app/documents/add-document/createOnline.html',
                    controller: 'AddDocumentsCtrl as document',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    },
                    breadcrum: [{ name: 'Documents', state: 'documents' }, { name: 'Document Upload' }]
                })

                .state('globaldocument-upload', {
                    url: '/documents/upload',
                    templateUrl: 'app/documents/add-document/landing.html',
                    controller: 'AddDocumentsCtrl as document',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    },
                    breadcrum: [{ name: 'Documents', state: 'documents' }, { name: 'Document Upload' }]
                })
        }]);

})();
