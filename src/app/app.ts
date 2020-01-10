require('angular');
declare var angular: angular.IAngularStatic;
declare var utils;

// Declare app level module which depends on views, and components
var cloudlex = angular.module('cloudlex', [
     'ui.router',
     'ui.mask',
     'ngMessages',
     //'ngRoute',
     'ui.bootstrap',
     'ngImgCrop',
     'treeControl',
     'checklist-model',
     'clxKeepSessionAlive',
     'cloudlex.modal-service',
     'cloudlex.referral',
     'notification',
     'angularSpinner',
     'cloudlex.spinner',
     'cloudlex.launcher',
     'cloudlex.expense',
     'cloudlex.launcherSearch',
     'cloudlex.dashboard',
     'cloudlex.referralprg',
     'cloudlex.user',
     'cloudlex.contact',
     'cloudlex.matter',
     'cloudlex.notes',
     'cloudlex.events',
     'cloudlex.workflow',
     'cloudlex.message',
     'cloudlex.timeline',
     'cloudlex.allParties',
     'cloudlex.tasks',
     'cloudlex.documents',
     'cloudlex.global',
     'cloudlex.filters',
     'cloudlex.components',
     'sideNavDrawer',
     'cloudlex.masterData',
     'theaquaNg',
     'truncate',
     'angularjs-dropdown-multiselect',
     'clxTableDirective',
     'clxFilterOptions',
     'clxDateSlider',
     'ui.select',
     'clxFilterTags',
     'mb-scrollbar',
     'ngTagsInput',
     'ui.calendar',
     'ngSanitize',
     'cloudlex.report',
     'cloudlex.dailymailscan',
     'cloudlex.mailbox',
     'cloudlex.mailbox_java',
     'cloudlex.efax',
//     'textAngular',
     'ngFileUpload',
     'cloudlex.schedule',
     'cloudlex.sidebar',
     'cloudlex.newSidebar',
     'cloudlex.motion',
     'cloudlex.settings',
     'cloudlex.marketplace',
     'cloudlex.applications',
     'cloudlex.upcoming',
     'cloudlex.clxTemplateComponent',
     'cloudlex.templates',
     'cloudlex.notification',
     'cloudlex.firms',
     'angular-svg-round-progressbar',
     'vcRecaptcha',
     'scrollable-table',
     'intake',
     'ui.tree',
     'wysiwyg.module',
     'toaster',
     'cloudlex.allnotifications'
 ])

     var intake = angular.module('intake', [
     'intake.masterData',
     'intake.dashboard',
     'intake.matter',
     'intake.notes',
     'intake.events',
     'intake.allParties',
     'intake.tasks',
     'intake.documents',
     'intake.components',
     'intake.calendar',
     'intake.report',
     'intake.clxIntakeTemplateComponent',
     'intake.templates',
     'intake.workflow',
     'intake.referral'
 ]);

// all angularjs files/dependacies
require("./dependacies.ts");

// all angular components registerd as directives
require("./angular-components.ts");

//get role before loading angular if user is logged in 
//and then manually bootstrap the application
export function bootstrapAngularjsApp(Angular){
     var isloggedIn = utils.isNotEmptyVal(localStorage.getItem('loggedIn'));
     var isSessionAliveUrl = utils.getWebServiceBase() + 'practice/verifysession.json';
     var getRoleUrl = utils.getWebServiceBase() + 'practice/user_role.json';
     
     if (!isloggedIn) {
         cloudlex.value('userRole', {});
         Angular.upgrade.bootstrap(document.body, ['cloudlex'], { strictDi: false });
     } else {
         checkSession();
     }
 
     function checkSession() {
         var initInjector = angular.injector(["ng"]);
         var $http:any = initInjector.get("$http");
    
         $http({
             url: isSessionAliveUrl,
             method: "GET",
             withCredentials: true
         }).success(function (sessionStatus, status, headers, config) {
             if (sessionStatus[0]) {
                 getRole($http);
             } else {
                 cloudlex.value('userRole', {});
                 localStorage.clear();
                 Angular.upgrade.bootstrap(document.body, ['cloudlex'], { strictDi: false });
             }
         }).error(function () {
             cloudlex.value('userRole', {});
             localStorage.clear();
             Angular.upgrade.bootstrap(document.body, ['cloudlex'], { strictDi: false });
         })
     }
    
     function getRole($http) {
         $http({
             url: getRoleUrl,
             method: "GET", 
             withCredentials: true
         }).success(function (userRole, status, headers, config) {
             cloudlex.value('userRole', userRole);
             Angular.upgrade.bootstrap(document.body, ['cloudlex'], { strictDi: false });
         }).error(function (ee, status, headers, config) {
             cloudlex.value('userRole', {});
             localStorage.clear();
             Angular.upgrade.bootstrap(document.body, ['cloudlex'], { strictDi: false });
         });
     }
 }
