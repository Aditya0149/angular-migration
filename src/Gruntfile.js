// Generated on 2015-05-06 using generator-angular 0.11.1
(function () {
    'use strict';
    // this function is strict...
}());

//file paths to be minified and bundled
var userFiles = [
    "app/utils/genericUtils.js",
    "app/app.js",
    "app/global/error-response-handler.js",
    "app/global/api-interceptor.js",
    "app/global/app-config.js",
    "app/global/root-ctrl.js",
    "app/global/global-module.js",
    "app/global/global-constants.js",

    "app/utils/clxTableDirective/clxTableDirective.js",
    "app/utils/clxFilterOptions/clxFilterOptions.js",
    "app/utils/clxFilterTags/clxFilterTags.js",
    "app/utils/clxDateSlider/dateSlider.js",
    "app/utils/angular-dropdown-multiselect.js",
    "app/utils/select/select.js",
    "app/utils/notification-service/angular-notify.js",
    "app/utils/keepSessionAlive.js",
    "app/utils/notification-service/notification-service.js",
    "app/utils/routeManager.js",
    "app/utils/DateUtil.js",
    "app/utils/modal-service/modal-service.js",
    "app/utils/filterUtils.js",
    "app/utils/MasterDataProvider.js",
    "app/vendor/truncate.js",
    "app/utils/ngGridFlexibleHeightPlugin.js",
    "app/vendor/mb-scrollbar.min.js",
    "app/utils/spin.js",
    "app/utils/spinner/angular-spinner.min.js",
    "app/utils/spinner/spinner-directive.js",
    "app/utils/moment.timezone.js",

    "app/components/components-module.js",
    "app/components/c3-directives/c3-donut.js",
    "app/components/dialogue/dialog-service.js",
    "app/components/header/page-header-ctrl.js",
    "app/components/side-nav/page-nav-directive.js",
    "app/components/dialogue/custom-dialog-service.js",
    "app/components/dialogue/custom-dialog-controller.js",

    "app/user/user-module.js",
    "app/user/activate-user/activate-user-ctrl.js",
    "app/user/create-firm/create-firm-ctrl.js",
    "app/user/user-constant.js",
    "app/user/user-login-ctrl.js",
    "app/user/user-login-datalayer.js",

    "app/launcher/launcher-module.js",
    "app/launcher/launcher-datalayer.js",
    "app/launcher/launcher-ctrl.js",
    "app/launcher-search/search.js",
    "app/launcher-search/search-datalayer.js",

    "app/dashboard/dashboard-module.js",
    "app/dashboard/dashboard-datalayer.js",
    "app/dashboard/dashboard-ctrl.js",
    "app/dashboard/analytics/analytics-helper.js",
    "app/dashboard/analytics/analytics-ctrl.js",
    "app/dashboard/avarage-matter-age/average-matter-age-directive.js",
    "app/dashboard/tasks/dashboard-tasks-ctrl.js",
    "app/dashboard/critical-dates/crtical-dates-ctrl.js",

    "app/matter/matter-module.js",
    "app/matter/matter-constant.js",
    "app/matter/matter-service.js",
    "app/matter/matter-details/matter-details-service.js",
    "app/matter/matter-details/view-memo-ctrl.js",
    "app/matter/matter-details/link-upload-document/link-upload-document-ctrl.js",
    "app/matter/matter-details/negligence-liability/negligence-liability-ctrl.js",
    "app/matter/matter-details/medical-info/medical-info-ctrl.js",
    "app/matter/matter-details/matter-details-ctrl.js",
    "app/matter/matter-details/insaurance/insaurance-ctrl.js",
    "app/matter/matter-details/liens/liens-ctrl.js",
    "app/matter/matter-details/expenses/expenses-ctrl.js",
    "app/matter/matter-details/medical-bills/medical-bills-ctrl.js",
    "app/matter/matter-details/settlement/settlement-info-ctrl.js",
    "app/matter/matter-details/intake-info/intake-info-ctrl.js",


    "app/matter/matter-overview/matter-overview-ctrl.js",
    "app/matter/matter-overview/important-dates-timeline.js",
    "app/matter/matter-overview/evidence-gallery/evidence-gallery.js",
    "app/matter/add-matter/important-dates-directive/important-dates.js",
    "app/matter/add-matter/add-contact-dialogue/add-contact-ctrl.js",
    "app/matter/matter-list/filter-dialogue-ctrl.js",
    "app/matter/matter-list/matter-archive/archive-matter-list-ctrl.js",
    "app/matter/matter-list/matter-archive/filter-dialogue-ctrl.js",
    "app/matter/matter-list/partials/archive-popup-ctrl.js",

    "app/message/message-module.js",
    "app/message/message-constants.js",
    "app/message/message-data-service.js",
    "app/message/partials/messageNotify-ctrl.js",
    "app/message/message-ctrl.js",

    "app/matter/add-matter/add-matter-ctrl.js",
    "app/matter/matter-list/matter-list-ctrl.js",
    "app/matter/add-matter/partial/closed-matter-ctrl.js",

    "app/notes/notes-module.js",
    "app/notes/notes-data-service.js",
    "app/notes/notes-controller.js",
    "app/notes/partials/view-note-controller.js",
    "app/notes/partials/note-filter-controller.js",

    "app/notes/matter-notes/notes-controller.js",
    "app/notes/matter-notes/partials/view-note-controller.js",
    "app/notes/matter-notes/partials/note-filter-controller.js",

    "app/notes/global-notes/global-notes-controller.js",
    "app/notes/global-notes/partials/view-global-note-controller.js",
    "app/notes/global-notes/partials/note-global-filter-controller.js",
    "app/notes/global-notes/partials/add-global-note-controller.js",

    "app/events/events-module.js",
    "app/events/events-data-service.js",
    "app/events/events-controller.js",


    //Workflow
    "app/workflow/workflow-module.js",
    "app/workflow/workflow-data-service.js",
    "app/workflow/workflow-controller.js",
    "app/workflow/matter-view-workflow/matter-view-workflow-ctrl.js",
    "app/workflow/apply-workflow/apply-workflow-ctrl.js",
    "app/workflow/apply-workflow/apply-workflowTask-ctrl.js",
    "app/workflow/apply-workflow/apply-workflowEvent-ctrl.js",

    //Intake-Workflow
    "app/intake/workflow/workflow-module.js",
    "app/intake/workflow/workflow-data-service.js",
    "app/intake/workflow/workflow-controller.js",
    "app/intake/workflow/matter-view-workflow/matter-view-workflow-ctrl.js",
    "app/intake/workflow/apply-workflow/apply-workflow-ctrl.js",
    "app/intake/workflow/apply-workflow/apply-workflowTask-ctrl.js",
    "app/intake/workflow/apply-workflow/apply-workflowEvent-ctrl.js",

    "app/timeline/timeline-module.js",
    "app/timeline/timeline-data-service.js",
    "app/timeline/timeline-controller.js",
    "app/timeline/timeline-filters/timeline-filters-ctrl.js",

    "app/allnotifications/allnotifications-module.js",
    "app/allnotifications/allnotifications-ctrl.js",
    "app/all-parties/all-parties-module.js",
    "app/all-parties/all-parties-data-service.js",
    "app/all-parties/all-parties-controller.js",
    "app/all-parties/plaintiffs/plaintiffs-view-controller.js",
    "app/all-parties/defendants/defendants-view-controller.js",
    "app/all-parties/other-parties/other-parties-view-controller.js",
    "app/all-parties/add-plaintiff/add-plaintiff-ctrl.js",
    "app/all-parties/add-plaintiff/add-employer/add-employer-ctrl.js",
    "app/all-parties/other-parties/add-other-party/add-other-party-ctrl.js",
    "app/all-parties/defendants/add-defendant/add-defendant-ctrl.js",
    "app/all-parties/other-party-filter-controller.js",

    "app/tasks/task-module.js",
    "app/tasks/add-task/task-tree/task-tree.js",
    "app/tasks/tasks-service.js",
    "app/tasks/tasks-datalayer.js",
    "app/tasks/global-tasks/global-tasks-ctrl.js",
    "app/tasks/matter-tasks/tasks-ctrl.js",
    "app/tasks/add-task/add-task-ctrl.js",

    "app/documents/documents-module.js",
    "app/documents/documents-constants.js",
    "app/documents/documents-data-service.js",
    "app/documents/documents-controller.js",
    "app/documents/add-document/add-documents-controller.js",
    "app/documents/view-document/view-documents-controller.js",
    "app/documents/view-document/clone-documents-controller.js",
    "app/documents/documents-filter-ctrl.js",
    "app/documents/office365/office-doc-view-ctrl.js",


    "app/contact/contact-module.js",
    "app/contact/add-contact-ctrl.js",
    "app/contact/contact-global-constant.js",
    "app/contact/contact-global-factory.js",
    "app/contact/global-contact-ctrl.js",
    "app/contact/contact-filter-controller.js",
    "app/contact/relationship-graph-controller.js",


    "app/intake/newCal/calendar-ctrl.js",
    "app/intake/newCal/calendarDatalayer.js",
    "app/intake/calendar/partials/calendarEvent-ctrl.js",
    "app/intake/calendar/calendarDatalayer.js",
    "app/calendar/partials/calendarEvent-ctrl.js",
    "app/schedule/schedule-module.js",
    "app/schedule/schedule-ctrl.js",
    "app/schedule/scheduleDataLayer.js",

    "app/report/report-module.js",
    "app/report/report-ctrl.js",
    "app/report/report-service.js",
    "app/report/report-constant.js",
    "app/report/allMatterList/allMatterListReport-ctrl.js",
    "app/report/allMatterList/matterInTookByDate-ctrl.js",
    "app/report/allMatterList/filterPopUp/matterIntookByDate/matterIntookByDateFilterCtrl.js",
    "app/report/allMatterList/matterStatus-ctrl.js",
    "app/report/allMatterList/matterType-ctrl.js",
    "app/report/allMatterList/upComingNOCs-ctrl.js",
    "app/report/allMatterList/upcomingSOLs-ctrl.js",
    "app/report/allMatterList/matter-event-ctrl.js",
    "app/report/allMatterList/filterPopUp/matterEvents/matter-events-report-Ctrl.js",
    "app/report/customDate-ctrl.js",
    "app/report/allMatterList/partial/allMatterListCustomFilter-ctrl.js",
    "app/report/allMatterList/filterPopUp/allMatter/allMatterPopCtrl.js",
    "app/report/allMatterList/filterPopUp/allMatter/upcomingSOLNOCPopCtrl.js",
    "app/report/allMatterList/expenseReportCtrl.js",
    "app/report/allMatterList/settlementReportCtrl.js",
    "app/report/allMatterList/plaintiffMailing-ctrl.js",
    "app/report/allMatterList/filterPopUp/matterValuation/matterValuationFillter.js",
    "app/report/allMatterList/matterValuation-ctrl.js",
    "app/report/allMatterList/filterPopUp/medicalRecordRequest/medicalRecordRequestFilter.js",
    "app/report/allMatterList/medicalRecordRequestReport-Ctrl.js",
    "app/report/allMatterList/filterPopUp/expense/expenseFilter.js",
    "app/report/allMatterList/filterPopUp/settlementFilterPopup/settlementFilter.js",
    "app/report/allMatterList/filterPopUp/plaintiffMailingList/plaintiffMailingFillter.js",
    "app/report/matter-age-report/matter-age-ctrl.js",
    "app/report/venue/venue-report-ctrl.js",
    "app/report/task-age/task-age-ctrl.js",
    "app/report/task-age/filter-pop-up/task-age-filter-ctrl.js",
    "app/report/taskSummary/taskSummary-report-ctrl.js",
    "app/report/taskSummary/taskSummaryDataLayer.js",
    "app/report/taskSummary/taskSummaryPopUp/task-summary-popup-ctrl.js",
    "app/report/document-report/document-report.js",
    "app/report/document-report/filter/doc-report-filter-ctrl.js",
    "app/report/userActivity/userActivityReportCtrl.js",
    "app/report/userActivity/userActivityPopUp/userActivityReportFilterPopUpCtrl.js",
    "app/report/userActivity/userActivityService.js",
    "app/report/contact/contact-report-ctrl.js",
    "app/report/contact/contact-filter-popup/contact-report-filter-ctrl.js",
    "app/report/motion-report/motion-report.js",
    "app/report/motion-report/filter/motion-report-filter-ctrl.js",
    "app/report/allMatterList/filterPopUp/insurance/insuranceFilter.js",
    "app/report/allMatterList/insuranceReport.js",
    "app/report/allMatterList/keywordSearch.js",

    "app/dailymailscan/dailymailscan-module.js",
    "app/dailymailscan/dailymailscan-data-service.js",
    "app/dailymailscan/dailymailscan-controller.js",

    "app/mailbox/mailbox-module.js",
    "app/mailbox/mailbox-constants.js",
    "app/mailbox/mailbox-data-service.js",
    "app/mailbox/mailbox-controller.js",

    "app/mailbox_v2/mailbox-module.js",
    "app/mailbox_v2/mailbox-constants.js",
    "app/mailbox_v2/mailbox-data-service.js",
    "app/mailbox_v2/mailbox-controller.js",

    "app/efax/efax-module.js",
    "app/efax/efax-constants.js",
    "app/efax/efax-data-service.js",
    "app/efax/efax-controller.js",

    "app/sidebar/sidebar-module.js",
    "app/sidebar/sidebar-ctrl.js",
    "app/sidebar/sidebarDataLayer.js",

    "app/referral/referral-module.js",
    "app/referral/referral-datalayer.js",
    "app/referral/refer-out-matter/refer-out-ctrl.js",
    "app/referral/referred-matters/reffered-matters-ctrl.js",
    "app/referral/referred-matters/refer-matter-info/referred-matter-info.js",
    "app/referral/referred-matters/partials/referral-payment-ctrl.js",
    "app/referral/refer-out-matter/content-editable-directive.js",
    "app/referral/refer-out-matter/partials/search-contact-popup.js",
    "app/referral/refer-out-matter/partials/searchrefDataLayer.js",
    

    "app/referral-program/referral-prg-module.js",
    "app/referral-program/referral-prg.js",


    "app/motion/motion-module.js",
    "app/motion/motion-ctrl.js",
    "app/motion/motionDataService.js",
    "app/motion/motion-filter-ctrl.js",

    "app/matter/matter-overview/matter-valuation/valuation.js",
    "app/matter/matter-overview/client-communicator/client-config-ctrl.js",
    "app/settings/settings-module.js",
    "app/settings/settings-ctrl.js",
    "app/settings/user-management-tab/user-management-tab-ctrl.js",
    "app/settings/role-management/role-management-ctrl.js",
    "app/settings/user-management/user-management-ctrl.js",
    "app/settings/user-management/add-user/add-user-ctrl.js",
    "app/settings/user-management/transfer-user/transfer-user.js",
    "app/settings/user-management/set-email/add-email.js",
    "app/settings/practiceAndBilling/practice-and-billing-ctrl.js",
    "app/settings/profile/profile-ctrl.js",
    "app/settings/profile/password.js",
    "app/settings/profile/profileDataLayer.js",
    "app/settings/practiceAndBilling/practiceAndBillingDataLayer.js",
    "app/settings/subscription/subscription-ctrl.js",
    "app/settings/planSelection/plan-selection-ctrl.js",
    "app/settings/planSelection/confirmation-modal-ctrl.js",

    "app/settings/workflows/workflow-ctrl.js",
    "app/settings/workflows/view-workflow/view-workflow-ctrl.js",
    "app/settings/workflows/view-workflow/add-workflowTask/add-workflowTask-ctrl.js",
    "app/settings/workflows/view-workflow/add-workflowEvent/add-workflowEvent-ctrl.js",
    "app/settings/workflows/add-workflow/add-workflow-ctrl.js",

    // Intake-setting-workflow
    "app/settings/intake-workflows/workflow-ctrl.js",
    "app/settings/intake-workflows/view-workflow/view-workflow-ctrl.js",
    "app/settings/intake-workflows/view-workflow/add-workflowTask/add-workflowTask-ctrl.js",
    "app/settings/intake-workflows/view-workflow/add-workflowEvent/add-workflowEvent-ctrl.js",
    "app/settings/intake-workflows/add-workflow/add-workflow-ctrl.js",

    "app/settings/payment/payment-ctrl.js",
    "app/settings/payment/payment-data-layer.js",
    "app/settings/payment/partial/payment-filter-ctrl.js",



    "app/marketplace/marketplace-module.js",
    "app/marketplace/marketplace-ctrl.js",
    "app/marketplace/applications/applications-ctrl.js",
    "app/marketplace/applications/applicationsDataLayer.js",
    "app/marketplace/applications/applications-module.js",
    "app/marketplace/applications/partials/office-payment-ctrl.js",
    "app/marketplace/applications/partials/outlook-web-ctrl.js",

    "app/marketplace/subscription/subscription.js",
    "app/marketplace/services/services-ctrl.js",
    "app/marketplace/upcoming/upcoming-module.js",
    "app/marketplace/upcoming/upcoming-apps-ctrl.js",

    "app/firms/firms-module.js",
    "app/firms/firms-data-service.js",
    "app/firms/firms-controller.js",

    "app/notification/notification-module.js",
    "app/notification/notification-ctrl.js",
    "app/notification/notification-datalayer.js",

    // Intake

    // components
    "app/intake/components/components-module.js",
    "app/intake/components/dialogue/dialog-service.js",
    "app/intake/components/dialogue/custom-dialog-service.js",
    "app/intake/components/dialogue/custom-dialog-controller.js",

    // dashboard
    "app/intake/dashboard/dashboard-module.js",
    "app/intake/dashboard/dashboard-datalayer.js",
    "app/intake/dashboard/dashboard-ctrl.js",
    "app/intake/dashboard/analytics/analytics-helper.js",
    "app/intake/dashboard/analytics/analytics-ctrl.js",
    "app/intake/dashboard/avarage-matter-age/average-matter-age-directive.js",
    "app/intake/dashboard/tasks/dashboard-tasks-ctrl.js",
    "app/intake/dashboard/critical-dates/crtical-dates-ctrl.js",

    // Matter
    "app/intake/matter/matter-module.js",
    "app/intake/matter/matter-constant.js",
    "app/intake/matter/matter-service.js",
    "app/intake/matter/matter-details/matter-details-ctrl.js",
    "app/intake/matter/matter-overview/matter-overview-ctrl.js",
    "app/intake/matter/add-matter/important-dates-directive/important-dates.js",

    "app/intake/matter/matter-list/filter-dialogue-ctrl.js",
    "app/intake/matter/add-matter/add-matter-ctrl.js",
    "app/intake/matter/matter-list/matter-list-ctrl.js",
    "app/intake/matter/matter-list/matter-archive/archive-matter-list-ctrl.js",
    "app/intake/matter/matter-list/matter-archive/filter-dialogue-ctrl.js",
    "app/intake/matter/matter-list/partials/archive-popup-ctrl.js",
    "app/intake/matter/matter-list/migration.js",


    // Notes
    "app/intake/notes/notes-module.js",
    "app/intake/notes/notes-data-service.js",

    // matter notes
    "app/intake/notes/matter-notes/notes-controller.js",
    "app/intake/notes/matter-notes/partials/view-note-controller.js",
    "app/intake/notes/matter-notes/partials/note-filter-controller.js",

    // Global notes
    "app/intake/notes/global-notes/global-notes-controller.js",
    "app/intake/notes/global-notes/partials/add-global-note-controller.js",

    "app/intake/newNotes/notes-data-service.js",
    "app/intake/newNotes/global-notes/global-notes-controller.js",

    // Events
    "app/intake/events/events-module.js",
    "app/intake/events/events-data-service.js",
    "app/intake/events/events-controller.js",

    // All Parties
    "app/intake/all-parties/all-parties-module.js",
    "app/intake/all-parties/all-parties-data-service.js",
    "app/intake/all-parties/all-parties-controller.js",

    // Tasks
    "app/intake/tasks/task-module.js",
    "app/intake/tasks/add-task/task-tree/task-tree.js",
    "app/intake/tasks/tasks-service.js",
    "app/intake/tasks/tasks-datalayer.js",
    "app/intake/tasks/global-tasks/global-tasks-ctrl.js",
    "app/intake/tasks/matter-tasks/tasks-ctrl.js",
    "app/intake/tasks/add-task/add-task-ctrl.js",

    // Documents
    "app/intake/documents/documents-module.js",
    "app/intake/documents/documents-constants.js",
    "app/intake/documents/documents-data-service.js",

    "app/intake/documents/documents-controller.js",
    "app/intake/documents/office365/office-doc-view-ctrl.js",
    "app/intake/documents/add-document/add-documents-controller.js",
    "app/intake/documents/view-document/view-documents-controller.js",
    "app/intake/documents/view-document/clone-documents-controller.js",
    "app/intake/documents/documents-filter-ctrl.js",
    "app/intake/documents/open-docuSign-popup.js",

    // New Task
    "app/intake/newTask/global-tasks/global-tasks-ctrl.js",
    "app/intake/newTask/tasks-datalayer.js",

    //Intake Reports
    "app/intake/report/report-module.js",
    "app/intake/report/intakeReport-constant.js",
    "app/intake/report/intakeReport-service.js",
    "app/intake/report/report-ctrl.js",
    "app/intake/report/allIntakeList/allIntakeListReport-ctrl.js",
    "app/intake/report/allIntakeList/upcomingSOLs-ctrl.js",
    "app/intake/report/allIntakeList/filterPopUp/allIntake/allIntakePopCtrl.js",
    "app/intake/report/allIntakeList/filterPopUp/allIntake/upcomingSOLNOCPopCtrl.js",
    "app/intake/report/allIntakeList/upComingNOCs-ctrl.js",
    "app/intake/report/allIntakeList/intakeValuation-ctrl.js",
    "app/intake/report/allIntakeList/filterPopUp/intakeValuation/intakeValuationFillter.js",
    "app/intake/report/allIntakeList/intakeCampaign-ctrl.js",
    "app/intake/report/allIntakeList/filterPopUp/intakeCampaign/intakeCampaignPopCtrl.js",
	"app/intake/report/venue/venue-report-ctrl.js",

    //Matter Collaboration
    "app/matter/matter-collaboration/matter-collaboration.js",
    "app/matter/matter-collaboration/document/documents-controller.js",
    "app/matter/matter-collaboration/events/events-controller.js",
    "app/matter/matter-collaboration/notes/notes-controller.js",
    "app/documents/collaboration-document/collaboration-documents-controller.js",
    "app/notes/notes-collaboration/notes-collaboration-controller.js",

    //New Sidebar
    "app/newSidebar/sidebar-module.js",
    "app/newSidebar/sidebar-ctrl.js",
    "app/newSidebar/sidebarDataLayer.js",

    //Intake Referal In/Out
    "app/intake/referral/referral-module.js",
    "app/intake/referral/referral-datalayer.js",
    "app/intake/referral/refer-out-matter/refer-out-ctrl.js",
    "app/intake/referral/referred-matters/reffered-matters-ctrl.js",
    "app/intake/referral/referred-matters/refer-matter-info/referred-matter-info.js",

    // US16929: Expense Manager (Quickbooks integration)
    "app/expenseManager/ExpenseManagerModule.js",
    "app/expenseManager/ExpenseManagerDatalayer.js",
    "app/expenseManager/ExpenseManager.js",
    "app/expenseManager/FilterPopup/ExpenseManagerFilterPopup.js"
];

// template minifucation
var template = [
    "app/templates/partials/template-component.js",
    "app/templates/templates-module.js",
    "app/templates/partials/generate-template-ctrl.js",
    "app/templates/partials/template-config.js"
];

var intakeTemplate = [
    "app/intake/templates/partials/template-component.js",
    "app/intake/templates/templates-module.js",
    "app/intake/templates/partials/generate-template-ctrl.js",
    "app/intake/templates/partials/template-config.js",
]

//third party file paths to be minified and bundled
var vendor = [
    "bower_components/underscore-min.js",
    "bower_components/jquery.min.js",
    "bower_components/bootstrap.min.js",
    "bower_components/angular.js",
    "bower_components/angular-sanitize.js",
    "bower_components/angular-animate.js",
    "bower_components/angular-route.min.js",
    "bower_components/ui-bootstrap-tpls.min.js",

    "app/vendor/angular-svg-round-progressbar/0.4.7/roundProgress.min.js",
    "app/vendor/angular-ui-router/angular-ui-router.js",
    "app/vendor/c3/d3.js",
    "app/vendor/c3/c3.js",
    "app/vendor/checklist-model.js",
    "app/vendor/ng-switcher.min.js",
    "app/vendor/moment-range.js",
    "app/vendor/ng-tagging/ng-tags-input.min.js",
    "app/vendor/calendar/calendar.js",
    "app/vendor/calendar/fullcalendar.js",
    "app/vendor/calendar/gcal.js",
    "app/vendor/tree-view/angular-tree-control.js",
    "app/vendor/dropzone/dropzone.min.js",
    "app/vendor/textangular/textAngularSetup.js",
    "app/vendor/textangular/textAngular-rangy.min.js",
    "app/vendor/textangular/textAngular-sanitize.min.js",
    "app/vendor/textangular/textAngular.js",
    "app/vendor/ng-file-upload/ng-file-upload-shim.min.js",
    "app/vendor/ng-file-upload/ng-file-upload.min.js",
    "app/vendor/sha256.js",
    "app/vendor/ng-img-crop.js",
    "app/vendor/angular-recaptcha.js",
    "app/vendor/jquery.nicescroll.js",
    "app/vendor/ui-tree.js",
    "app/vendor/aspnetsignalr1.0.4.js",
    "app/vendor/toaster.js"
];

//css file paths to be minified and bundled
var css = [
    "app/utils/select/select.css",
    "app/styles/css/sanitize_select.css",
    "app/utils/select/select2.css",
    "app/app.css",
    "app/styles/css/bootstrap.min.css",
    "app/utils/notification-service/angular-notify.css",
    "app/styles/css/temp.css",
    "app/styles/css/font-awesome.css",
    "app/vendor/c3/c3.css",
    "app/vendor/dropzone/dropzone.css",
    "app/vendor/ng-tagging/ng-tags-input.min.css",
    "app/styles/css/calendar.css",
    "app/styles/css/calendarDemo.css",
    "app/styles/css/fullcalendar.css",
    "app/vendor/textangular/textAngular.css",
    "app/vendor/tree-view/css/tree-control.css",
    "app/vendor/tree-view/css/tree-control-attribute.css",
    "app/styles/css/main.css",
    "app/styles/css/toaster.css",
    "app/styles/combinedCustomStyle.css"
];

var copyFiles = [
    { src: "app/favicon.ico", dest: "dist/favicon.ico" },
    { src: "app/robots.txt", dest: "dist/robots.txt" },
    { src: "app/constants.js", dest: "dist/scripts/constants.js" },
    { src: "app/utils/filterUtils.js", dest: "dist/scripts/filterUtils.js" },
    { src: "app/vendor/ui-mask/angular-ui-utils.min.js", dest: "dist/scripts/angular-ui-utils.min.js" },
    { src: "app/vendor/ng-messages/ng-messages.js", dest: "dist/scripts/ng-messages.js" },
    { src: "app/vendor/moment.min.js", dest: "dist/scripts/moment.min.js" },
    { src: "app/vendor/moment-business.min.js", dest: "dist/scripts/moment-business.min.js" },
    { src: "app/templates/partials/template_generate_config.json", dest: "dist/templates/partials/template_generate_config.json" },
    { src: "app/templates/partials/auto_template_generate_config.json", dest: "dist/templates/partials/auto_template_generate_config.json" },
    { src: "app/templates/templates-ctrl.js", dest: "dist/scripts/templates-ctrl.js" },
    { src: "app/intake/templates/partials/template_generate_config.json", dest: "dist/intake/templates/partials/template_generate_config.json" },
    { src: "app/intake/templates/partials/auto_template_generate_config.json", dest: "dist/intake/templates/partials/auto_template_generate_config.json" },
    { src: "app/intake/templates/templates-ctrl.js", dest: "dist/scripts/intake-templates-ctrl.js" },
    { src: "app/docuSign-redirect/bg.jpg", dest: "dist/docuSign-redirect/bg.jpg" },
    { src: "app/docuSign-redirect/logo.png", dest: "dist/docuSign-redirect/logo.png" }

];

var version = (new Date()).getTime();

module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    var serveStatic = require('serve-static');

    grunt.loadNpmTasks('grunt-replace');

    // Configurable paths for the application
    var appConfig = {
        app: 'app',
        dist: 'dist'
    };

    // Define the configuration for all the tasks
    grunt.initConfig({

        // Project settings
        yeoman: appConfig,

        postcss: {

            options: {
                processors: [
                    require('autoprefixer')([
                        "Android 2.3",
                        "Android >= 4",
                        "Chrome >= 20",
                        "Firefox >= 24",
                        "Explorer >= 8",
                        "iOS >= 6",
                        "Opera >= 12",
                        "Safari >= 6"
                    ])
                ]
            },
            dist: {
                src: '<%= yeoman.app %>/styles/combinedCustomStyle.css',
                dest: '<%= yeoman.app %>/styles/combinedCustomStyle.css'
            }

        },
        replace: {
            dist: {
                options: {
                    patterns: [
                        {
                            match: /sprite.png/g,
                            replacement: function () {
                                return 'sprite.png?v=' + version;
                            }
                        }
                    ]
                },
                files: [
                    { expand: true, flatten: true, src: ['<%= yeoman.dist %>/styles/css/main.css'], dest: '<%= yeoman.dist %>/styles/css/' }
                ]
            }
        },

        concat: {
            dist: {
                src: [
                    '<%= yeoman.app %>/**/*.scss'
                ],
                dest: '<%= yeoman.app %>/styles/combinedCustomStyle.scss',
            }
        },
        sass: {
            dist: {
                files: {
                    '<%= yeoman.app %>/styles/combinedCustomStyle.css': ['<%= yeoman.app %>/styles/combinedCustomStyle.scss']
                }
            },
            options: {
                compass: true,
                style: 'compressed',
                sourceMap: false
            }
        },

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            js: {
                files: ['<%= yeoman.app %>/scripts/{,*/}*.js'],
                options: {
                    livereload: '<%= connect.options.livereload %>'
                }
            },
            jsTest: {
                files: ['test/spec/{,*/}*.js'],
            },
            css: {
                files: '<%= yeoman.app %>/**/*.scss',
                tasks: ['update-css', 'newer:copy:styles'],
                options: {
                    livereload: true,
                },
            },
            styles: {
                files: [
                    '<%= yeoman.app %>/**/*.scss',
                    '!<%= yeoman.app %>/styles/combinedCustomStyle.scss',
                    '<%= yeoman.app %>/styles/css/*.css',
                    '!<%= yeoman.app %>/styles/css/cloudlex.css',
                    '!<%= yeoman.app %>/styles/combinedCustomStyle.css'],
                tasks: ['update-css', 'newer:copy:styles']
            },
            gruntfile: {
                files: ['Gruntfile.js']
            },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [
                    '<%= yeoman.app %>/{,*/}*.html',
                    '.tmp/styles/{,*/}*.css',
                    '<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
                ]
            }
        },

        // The actual grunt server settings
        connect: {
            options: {
                port: 9000,
                protocol: 'https',
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost',
                livereload: 35729
            },
            livereload: {
                options: {
                    open: true,
                    middleware: function (connect, options, middlewares) {
                        return [

                            serveStatic('.tmp'),
                            connect().use(
                                '/bower_components',
                                serveStatic('./bower_components')
                            ),
                            connect().use(
                                '/app/styles',
                                serveStatic('./app/styles')
                            ),
                            serveStatic(appConfig.app)
                        ];
                    }
                }
            },
            dist: {
                options: {
                    open: true,
                    base: '<%= yeoman.dist %>'
                }
            }
        },

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= yeoman.dist %>/{,*/}*',
                        '!<%= yeoman.dist %>/.git{,*/}*'
                    ]
                }]
            },
            css: {
                files: [{
                    dot: true,
                    src: [
                        '<%= yeoman.app %>/styles/combinedCustomStyle.css',
                        '<%= yeoman.app %>/styles/combinedCustomStyle.scss'
                    ]
                }]
            },
            server: '.tmp'
        },

        // Renames files for browser caching purposes
        filerev: {
            dist: {
                src: [
                    '<%= yeoman.dist %>/scripts/{,*/}*.js',
                    '<%= yeoman.dist %>/styles/{,*/}*.css',
                    '<%= yeoman.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
                    '<%= yeoman.dist %>/styles/fonts/*'
                ]
            }
        },

        // Reads HTML for usemin blocks to enable smart builds that automatically
        //  minify and revision files. Creates configurations in memory so
        // additional tasks can operate on them
        useminPrepare: {
            html: '<%= yeoman.app %>/index.html',
            options: {
                dest: '<%= yeoman.dist %>',
                flow: {
                    html: {
                        steps: {
                            js: ['uglifyjs'],
                            css: ['cssmin']
                        },
                        post: {}
                    }
                }
            }
        },

        // Performs rewrites based on filerev and the useminPrepare configuration
        usemin: {
            html: ['<%= yeoman.dist %>/{,*/}*.html'],
            css: ['<%= yeoman.dist %>/styles/{,*/}*.css'],
            options: {
                assetsDirs: [
                    '<%= yeoman.dist %>',
                    '<%= yeoman.dist %>/images',
                    '<%= yeoman.dist %>/styles'
                ]
            }
        },

        // The following *-min tasks will produce minified files in the dist folder
        // By default, your `index.html`'s <!-- Usemin block --> will take care of
        // minification. These next options are pre-configured if you do not wish
        // to use the Usemin blocks.
        cssmin: {
            dist: {
                files: {
                    '<%= yeoman.dist %>/styles/css/main.css': css
                }
            },
            local: {
                files: {
                    '<%= yeoman.app %>/styles/css/cloudlex.css': css
                }
            }

        },

        // uglify: {
        //     // keeping the mangle: false because with true it is causing some runtime dependancy problem.
        //     options: {
        //         mangle: false
        //     },
        //     dist: {
        //         files: {
        //             '<%= yeoman.dist %>/scripts/vendor.min.js': vendor,
        //             '<%= yeoman.dist %>/scripts/cloudlex.min.js': userFiles,
        //             '<%= yeoman.dist %>/scripts/template.min.js': template
        //         }
        //     }
        // },

        uglify: {
            // keeping the mangle: false because with true it is causing some runtime dependancy problem.
            dist1: {
                options: {
                    mangle: true
                },
                files: {
                    '<%= yeoman.dist %>/scripts/vendor.min.js': vendor
                }
            },
            dist2: {
                options: {
                    mangle: false
                },
                files: {
                    '<%= yeoman.dist %>/scripts/cloudlex.min.js': userFiles
                }
            },
            dist3: {
                options: {
                    mangle: true
                },
                files: {
                    '<%= yeoman.dist %>/scripts/template.min.js': template
                }
            },
            dist4: {
                options: {
                    mangle: true
                },
                files: {
                    '<%= yeoman.dist %>/scripts/intakeTemplate.min.js': intakeTemplate
                }
            }

        },

        imagemin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '{,*/}*.{png,jpg,jpeg,gif}',
                    dest: '<%= yeoman.dist %>/images'
                }]
            }
        },

        svgmin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '{,*/}*.svg',
                    dest: '<%= yeoman.dist %>/images'
                }]
            }
        },
        htmlmin: {
            dist: {
                options: {
                    collapseWhitespace: true,
                    conservativeCollapse: true,
                    collapseBooleanAttributes: true,
                    removeCommentsFromCDATA: true,
                    removeOptionalTags: true
                },

                files: [
                    {
                        expand: true,     // Enable dynamic expansion.
                        cwd: 'app/',      // Src matches are relative to this path.
                        src: ['**/*.html'], // Actual pattern(s) to match.
                        dest: 'dist/',   // Destination path prefix.
                    },
                ],
            }
        },

        // Replace Google CDN references
        cdnify: {
            dist: {
                html: ['<%= yeoman.dist %>/*.html']
            }
        },

        // Copies remaining files to places other tasks can use
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.dist %>',
                    src: [
                        '*.{ico,png,txt}',
                        '.htaccess',
                        '*.html',
                        'views/{,*/}*.html',
                        'images/{,*/}*.{webp}',
                        'styles/fonts/{,*/}*.*'
                    ]
                }, {
                    expand: true,
                    cwd: '.tmp/images',
                    dest: '<%= yeoman.dist %>/images',
                    src: ['generated/*']
                }
                ]
            },
            copystyles: {
                expand: true,
                cwd: '<%= yeoman.app %>/styles',
                dest: '<%= yeoman.dist %>/styles',
                src: ['fonts/{,*/}*.*', 'images/{,*/}*.*', 'images/marketplace-images/{,*/}*.*', 'images/marketplace-images/slider/{,*/}*.*', 'videos/*']
            },
            copyselect2image: {
                files: [{ src: "app/utils/select/select2.png", dest: "dist/styles/css/select2.png" }]
            },
            copyselect2imageLocal: {
                files: [{ src: "app/utils/select/select2.png", dest: "app/styles/css/select2.png" }]
            },
            copyjs: {
                files: copyFiles
            },
            copyindex: {
                files: [
                    { src: "index.min.html", dest: "dist/index.html" }
                ]
            },
            styles: {
                expand: true,
                cwd: '<%= yeoman.app %>/styles',
                dest: '.tmp/styles/',
                src: '{,*/}*.css'
            }
        },
        // Run some tasks in parallel to speed up the build process
        concurrent: {
            server: [
                'copy:styles'
            ],
            dist: [
                'copy:styles',
                'imagemin',
                'svgmin'
            ]
        },
        cache_control: {
            your_target: {
                source: "dist/index.html",
                options: {
                    version: version,
                    links: true,
                    scripts: true,
                    ignoreCDN: true,
                }
            }
        },
    });


    grunt.registerTask('serve', 'Compile then start a connect web server', function (target) {
        if (target === 'dist') {
            return grunt.task.run(['build', 'connect:dist:keepalive']);
        }

        grunt.task.run([
            'clean:server',
            'clean:css',
            'concat',
            'sass',
            'postcss',
            'cssmin:local',
            'clean:css',
            'copy:copyselect2imageLocal',
            'concurrent:server',
            'connect:livereload',
            'watch'
        ]);
    });

    grunt.registerTask('server', 'DEPRECATED TASK. Use the "serve" task instead', function (target) {
        grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
        grunt.task.run(['serve:' + target]);
    });

    grunt.registerTask('test', [
        'clean:server',
        'concurrent:test',
        'connect:test'
    ]);

    grunt.registerTask('update-css', [
        'clean:css',
        'concat',
        'sass',
        'postcss',
        'cssmin:local',
        'clean:css',
    ]);

    grunt.registerTask('build', [
        'clean:dist',
        'useminPrepare',
        'concurrent:dist',
        'copy:dist',
        'cdnify',
        'cssmin',
        'uglify:dist1',
        'uglify:dist2',
        'uglify:dist3',
        'uglify:dist4',
        'usemin',
        'htmlmin',
        'copystyles',
        'copyjs',
        'copyindex',
        'cache_control'
    ]);

    grunt.registerTask('default', [
        'build'
    ]);

    grunt.registerTask('minify', [
        'clean:dist',
        'clean:css',
        'concat',
        'sass',
        'postcss',
        'cssmin',
        'clean:css',
        'uglify:dist1',
        'uglify:dist2',
        'uglify:dist3',
        'uglify:dist4',
        'htmlmin',
        'copystyles',
        'copyjs',
        'replace',
        'copyindex',
        'cache_control'
    ]);

    // purpose: dev task
    // use this for js minification
    grunt.registerTask('minify-js', [
        'clean:dist',
        'uglify:dist1',
        'uglify:dist2',
        'uglify:dist3',
        'uglify:dist4',
        'copyjs',
    ]);

    // purpose: dev task
    // use this for html minification
    grunt.registerTask('minify-html', [
        'clean:dist',
        'cssmin',
        'htmlmin',
        'copystyles',
        'replace',
        'copyindex',
    ]);

    grunt.registerTask('copystyles', [
        'copy:copystyles',
        'copy:copyselect2image'
    ]);

    grunt.registerTask('copyjs', ['copy:copyjs']);

    grunt.registerTask('copyindex', ['copy:copyindex']);

    grunt.registerTask('run-minified', ['connect:dist',
        'watch']);

};

