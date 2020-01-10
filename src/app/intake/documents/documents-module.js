(function() {
    'use strict';

    angular.module('intake.documents', ['ui.router'])

    .config(['$stateProvider', function($stateProvider) {
        $stateProvider
            .state('intake-documents', {
                url: '/intake/intake-documents/:intakeId',
                templateUrl: 'app/intake/documents/document-list.html',
                controller: 'IntakeDocumentsCtrl as documentlist',
                resolve: {
                    'SubscriptionData': ['masterData', function(masterData) {
                        var subscription = masterData.getSubscription();
                        if (utils.isEmptyObj(subscription)) {
                            return masterData.fetchSubscription();
                        }
                        return subscription;
                    }],
                    'MasterData': ['masterData', function(masterData) {
                        var data = masterData.getMasterData();
                        if (utils.isEmptyObj(data)) {
                            return masterData.fetchMasterData().then(function(res) {
                                return res;
                            });
                        }
                        return data;
                    }],
                }
            })
            .state('intakedocument-upload', {
                url: '/intake-documents/upload/:intakeId',
                templateUrl: 'app/intake/documents/add-document/landing.html',
                controller: 'IntakeAddDocumentsCtrl as document',
                resolve: {
                    'MasterData': ['masterData', function(masterData) {
                        var data = masterData.getMasterData();
                        if (utils.isEmptyObj(data)) {
                            return masterData.fetchMasterData().then(function(res) {
                                return res;
                            });
                        }
                        return data;
                    }]
                }
            })
            .state('intakecreate-online', {
                url: '/intake-documents/office-online/:intakeId',
                templateUrl: 'app/intake/documents/add-document/createOnline.html',
                controller: 'IntakeAddDocumentsCtrl as document',
                resolve: {
                    'MasterData': ['masterData', function(masterData) {
                        var data = masterData.getMasterData();
                        if (utils.isEmptyObj(data)) {
                            return masterData.fetchMasterData().then(function(res) {
                                return res;
                            });
                        }
                        return data;
                    }]
                }
            })
            .state('intakedocument-edit', {
                url: '/intake-documents/edit/:intakeId/:documentId',
                templateUrl: 'app/intake/documents/view-document/document-edit.html',
                controller: 'IntakeViewDocumentsCtrl as document',
                resolve: {
                    'SubscriptionData': ['masterData', function(masterData) {
                        return masterData.fetchSubscription();
                    }],
                    'MasterData': ['masterData', function(masterData) {
                        var data = masterData.getMasterData();
                        if (utils.isEmptyObj(data)) {
                            return masterData.fetchMasterData().then(function(res) {
                                return res;
                            });
                        }
                        return data;
                    }],
                }
            })
            .state('intakeoffice-view', {
                url: '/intake-documents/officeview/:intakeId/:documentId',
                templateUrl: 'app/intake/documents/office365/officeOnline.html',
                controller: 'intakeOfficeDocViewCtrl as officeOnline'
            })
            .state('intakedocument-view', {
                url: '/intake-documents/view/:intakeId/:documentId',
                templateUrl: 'app/intake/documents/view-document/document-view.html',
                controller: 'IntakeViewDocumentsCtrl as documentData',
                resolve: {
                    'MasterData': ['masterData', function(masterData) {
                        var data = masterData.getMasterData();
                        if (utils.isEmptyObj(data)) {
                            return masterData.fetchMasterData().then(function(res) {
                                return res;
                            });
                        }
                        return data;
                    }],
                },
                onEnter: function($rootScope) {
                    $rootScope.onLauncher = false;
                    $rootScope.onMatter = false;
                    $rootScope.onIntake = true;
                    $rootScope.onReferral = false;
                    $rootScope.onArchival = false;
                    $rootScope.onMarkerplace = false;
                    $rootScope.onExpense = false;
                    $rootScope.onReferralPrg = false;
                }
            })



        .state('intakedocuments', {
                url: '/documents',
                templateUrl: 'app/documents/document-list.html',
                controller: 'IntakeDocumentsCtrl as documentlist',
                resolve: {
                    'MasterData': ['masterData', function(masterData) {
                        var data = masterData.getMasterData();
                        if (utils.isEmptyObj(data)) {
                            return masterData.fetchMasterData();
                        }
                        return data;
                    }],
                    'SubscriptionData': ['masterData', function(masterData) {
                        return masterData.fetchSubscription();
                    }]
                }
            })
            // .state('intakeglobaldocument-view', {
            //     url: '/document/view/:intakeId/:documentId',
            //     templateUrl: 'app/intake/documents/view-document/document-view.html',
            //     controller: 'IntakeViewDocumentsCtrl as documentData',
            //     breadcrum: [{ name: 'Documents', state: 'documents' }, { name: 'Document View' }]
            // })
            .state('intakeglobal-office-redirect', {
                cache: false,
                url: '/intake-document/office365?mode',
                templateUrl: 'app/intake/documents/office365/officeOnline.html',
                controller: 'intakeOfficeDocViewCtrl as officeOnline',
                breadcrum: [{ name: 'Documents', state: 'documents' }, { name: 'Office online' }]
            })

        .state('intakeglobal-office-view', {
                cache: false,
                url: '/intake-document/office365',
                templateUrl: 'app/intake/documents/office365/officeOnline.html',
                controller: 'intakeOfficeDocViewCtrl as officeOnline',
                breadcrum: [{ name: 'Documents', state: 'documents' }, { name: 'Office online' }]
            })
            .state('intakeglobal-office-edit', {
                cache: false,
                url: '/document/office365',
                templateUrl: 'app/intake/documents/office365/office365.html',
                controller: 'intakeOfficeDocCtrl as officeDocCtrl',
                breadcrum: [{ name: 'Documents', state: 'documents' }, { name: 'Office online' }],

            })


        .state('intakeglobaldocument-edit', {
                url: '/document/edit/:intakeId/:documentId',
                templateUrl: 'app/intake/documents/view-document/document-edit.html',
                controller: 'IntakeViewDocumentsCtrl as document',
                resolve: {
                    'MasterData': ['masterData', function(masterData) {
                        var data = masterData.getMasterData();
                        if (utils.isEmptyObj(data)) {
                            return masterData.fetchMasterData();
                        }
                        return data;
                    }],
                    'SubscriptionData': ['masterData', function(masterData) {
                        return masterData.fetchSubscription();
                    }],
                    'CheckFileExists': ['inatkeDocumentsDataService', 'notification-service', '$stateParams', function(inatkeDocumentsDataService, notificationService, $stateParams) {
                        inatkeDocumentsDataService.checkIfFileExists($stateParams.documentId)
                            .then(function(response) {
                                if (response.data[0]) {
                                    notificationService.error('An error occurred. Please try later');
                                    return false;
                                }
                            }, function(error) {
                                notificationService.error('Bold error');
                                return false;
                            });
                    }]
                },
                breadcrum: [{ name: 'Documents', state: 'documents' }, { name: 'Document Edit' }]
            })
            .state('intakeglobal-create-online', {
                url: '/documents/office-online',
                templateUrl: 'app/intake/documents/add-document/createOnline.html',
                controller: 'IntakeAddDocumentsCtrl as document',
                resolve: {
                    'MasterData': ['masterData', function(masterData) {
                        var data = masterData.getMasterData();
                        if (utils.isEmptyObj(data)) {
                            return masterData.fetchMasterData();
                        }
                        return data;
                    }]
                },
                breadcrum: [{ name: 'Documents', state: 'documents' }, { name: 'Document Upload' }]
            })

        .state('intakeglobaldocument-upload', {
            url: '/documents/upload',
            templateUrl: 'app/intake/documents/add-document/landing.html',
            controller: 'IntakeAddDocumentsCtrl as document',
            resolve: {
                'MasterData': ['masterData', function(masterData) {
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