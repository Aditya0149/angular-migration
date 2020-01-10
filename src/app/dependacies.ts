//constants file-->
//require("./constants.js");



//generic utils-->
require("./utils/genericUtils.js");





require("./global/error-response-handler.js");
require("./global/api-interceptor.js");
require("./global/app-config.js");
require("./global/root-ctrl.js");

// Global -->
require("./global/global-module.js");
require("./global/global-constants.js");
//require("./global/global-validation-messages.js");-->
// Utils -->
require("./utils/clxTableDirective/clxTableDirective.js");
require("./utils/clxFilterOptions/clxFilterOptions.js");
require("./utils/clxFilterTags/clxFilterTags.js");
require("./utils/clxDateSlider/dateSlider.js");
require("./utils/angular-dropdown-multiselect.js");
require("./utils/select/select.js");
require("./utils/notification-service/angular-notify.js");
require("./utils/notification-service/notification-service.js");
require("./utils/keepSessionAlive.js");
require("./utils/routeManager.js");
require("./utils/DateUtil.js");
require("./utils/filterUtils.js");
require("./utils/MasterDataProvider.js");
//require("./vendor/truncate.js");
require("./utils/ngGridFlexibleHeightPlugin.js");
//require("./vendor/mb-scrollbar.min.js");
require("./utils/spin.js");

require("./utils/spinner/spinner-directive.js");
require("./utils/carousel/carousel.js");
//require("./vendor/ui-tree.js");


// components -->
require("./components/components-module.js");
require("./components/c3-directives/c3-donut.js");
require("./components/dialogue/dialog-service.js");
require("./components/header/page-header-ctrl.js");
require("./components/side-nav/page-nav-directive.js");
require("./components/dialogue/custom-dialog-service.js");
require("./components/dialogue/custom-dialog-controller.js");
require("./components/google-maps/clx-google-maps.js");

// Login -->
require("./user/user-module.js");
require("./user/activate-user/activate-user-ctrl.js");
require("./user/create-firm/create-firm-ctrl.js");
require("./user/user-constant.js");
require("./user/user-login-ctrl.js");
require("./user/user-login-datalayer.js");

//launcher-->
require("./launcher/launcher-module.js");
require("./launcher/launcher-datalayer.js");
require("./launcher/launcher-ctrl.js");
require("./launcher-search/search.js");
require("./launcher-search/search-datalayer.js");

//dashboard-->
require("./dashboard/dashboard-module.js");
require("./dashboard/dashboard-datalayer.js");
require("./dashboard/dashboard-ctrl.js");
require("./dashboard/analytics/analytics-helper.js");
require("./dashboard/analytics/analytics-ctrl.js");
require("./dashboard/avarage-matter-age/average-matter-age-directive.js");
require("./dashboard/tasks/dashboard-tasks-ctrl.js");
require("./dashboard/critical-dates/crtical-dates-ctrl.js");

// Matter -->
require("./matter/matter-module.js");
require("./matter/matter-constant.js");
require("./matter/matter-service.js");
require("./matter/matter-details/matter-details-service.js");
require("./matter/matter-details/view-memo-ctrl.js");
require("./matter/matter-details/link-upload-document/link-upload-document-ctrl.js");
require("./matter/matter-details/negligence-liability/negligence-liability-ctrl.js");
require("./matter/matter-details/medical-info/medical-info-ctrl.js");
require("./matter/matter-details/matter-details-ctrl.js");
require("./matter/matter-details/insaurance/insaurance-ctrl.js");
require("./matter/matter-details/liens/liens-ctrl.js");
require("./matter/matter-details/expenses/expenses-ctrl.js");
require("./matter/matter-details/medical-bills/medical-bills-ctrl.js");
//US#7114-->
require("./matter/matter-details/settlement/settlement-info-ctrl.js");
require("./matter/matter-details/intake-info/intake-info-ctrl.js");



require("./matter/matter-overview/matter-overview-ctrl.js");
require("./matter/matter-overview/important-dates-timeline.js");
require("./matter/matter-overview/evidence-gallery/evidence-gallery.js");
require("./matter/add-matter/important-dates-directive/important-dates.js");

require("./matter/add-matter/add-contact-dialogue/add-contact-ctrl.js");
require("./matter/matter-list/filter-dialogue-ctrl.js");
require("./matter/add-matter/contact-constant.js");
require("./matter/add-matter/partial/closed-matter-ctrl.js");
require("./matter/add-matter/add-matter-ctrl.js");
require("./matter/matter-list/matter-list-ctrl.js");
require("./matter/matter-list/matter-archive/archive-matter-list-ctrl.js");
require("./matter/matter-list/matter-archive/filter-dialogue-ctrl.js");
require("./matter/matter-list/partials/archive-popup-ctrl.js");



// Notes -->
require("./notes/notes-module.js");
require("./notes/notes-data-service.js");

// matter notes -->
require("./notes/matter-notes/notes-controller.js");
require("./notes/matter-notes/partials/view-note-controller.js");
require("./notes/matter-notes/partials/note-filter-controller.js");

// Global notes -->
require("./notes/global-notes/global-notes-controller.js");
require("./notes/global-notes/partials/add-global-note-controller.js");

// Events -->
require("./events/events-module.js");
require("./events/events-data-service.js");
require("./events/events-controller.js");

// Workflow -->
require("./workflow/workflow-module.js");
require("./workflow/workflow-data-service.js");
require("./workflow/workflow-controller.js");
require("./workflow/matter-view-workflow/matter-view-workflow-ctrl.js");
require("./workflow/apply-workflow/apply-workflow-ctrl.js");
require("./workflow/apply-workflow/apply-workflowTask-ctrl.js");
require("./workflow/apply-workflow/apply-workflowEvent-ctrl.js");

// Timeline -->
require("./timeline/timeline-module.js");
//require("./timeline/timeline-data-service.js");
require("./timeline/timeline-controller.js");
require("./timeline/timeline-filters/timeline-filters-ctrl.js");

// AllNotifications -->
require("./allnotifications/allnotifications-module.js");
require("./allnotifications/allnotifications-ctrl.js");

// All Parties -->
require("./all-parties/all-parties-module.js");
require("./all-parties/all-parties-data-service.js");
require("./all-parties/all-parties-controller.js");
require("./all-parties/plaintiffs/plaintiffs-view-controller.js");
require("./all-parties/defendants/defendants-view-controller.js");
require("./all-parties/other-parties/other-parties-view-controller.js");
require("./all-parties/add-plaintiff/add-plaintiff-ctrl.js");
require("./all-parties/add-plaintiff/add-employer/add-employer-ctrl.js");
require("./all-parties/other-parties/add-other-party/add-other-party-ctrl.js");
require("./all-parties/defendants/add-defendant/add-defendant-ctrl.js");
require("./all-parties/other-party-filter-controller.js");

//Tasks-->
require("./tasks/task-module.js");
require("./tasks/add-task/task-tree/task-tree.js");
require("./tasks/tasks-service.js");
require("./tasks/tasks-datalayer.js");
require("./tasks/global-tasks/global-tasks-ctrl.js");
require("./tasks/matter-tasks/tasks-ctrl.js");
require("./tasks/add-task/add-task-ctrl.js");

//Documents-->
require("./documents/documents-module.js");
require("./documents/documents-constants.js");
require("./documents/documents-data-service.js");

require("./documents/documents-controller.js");
//require("./documents/office365/office-module.js");-->
require("./documents/office365/office-doc-view-ctrl.js");
require("./documents/add-document/add-documents-controller.js");
require("./documents/view-document/view-documents-controller.js");
require("./documents/view-document/clone-documents-controller.js");
require("./documents/documents-filter-ctrl.js");

// Global Contact -->
require("./contact/contact-module.js");
require("./contact/add-contact-ctrl.js");
require("./contact/contact-global-constant.js");
require("./contact/contact-global-factory.js");
require("./contact/global-contact-ctrl.js");
require("./contact/contact-filter-controller.js");
require("./contact/relationship-graph-controller.js");

//Message-->
require("./message/message-module.js");
require("./message/message-constants.js");
require("./message/message-data-service.js");
require("./message/partials/messageNotify-ctrl.js");
require("./message/message-ctrl.js");

// Utils -->
require("./utils/clxTableDirective/clxTableDirective.js");
require("./utils/clxFilterOptions/clxFilterOptions.js");
require("./utils/clxDateSlider/dateSlider.js");
require("./utils/angular-dropdown-multiselect.js");
require("./utils/select/select.js");
require("./utils/notification-service/angular-notify.js");
require("./utils/notification-service/notification-service.js");
require("./utils/spin.js");
require("./utils/routeManager.js");
require("./utils/DateUtil.js");
require("./utils/modal-service/modal-service.js");
require("./utils/genericUtils.js");
require("./utils/filterUtils.js");
require("./utils/MasterDataProvider.js");
//require("./vendor/truncate.js");
require("./utils/ngGridFlexibleHeightPlugin.js");
//require("./vendor/mb-scrollbar.min.js");
require("./utils/ng-offclick/off-click.js");

// Calendar -->
require("./intake/newCal/calendar-ctrl.js");
require("./intake/newCal/calendarDatalayer.js");
require("./intake/calendar/partials/calendarEvent-ctrl.js");
require("./intake/calendar/calendarDatalayer.js");
require("./calendar/partials/calendarEvent-ctrl.js");
require("./schedule/schedule-module.js");
require("./schedule/schedule-ctrl.js");
require("./schedule/scheduleDataLayer.js");

// Report -->
require("./report/report-module.js");
require("./report/report-ctrl.js");
require("./report/report-service.js");
require("./report/report-constant.js");
require("./report/allMatterList/allMatterListReport-ctrl.js");
require("./report/allMatterList/matterInTookByDate-ctrl.js");
require("./report/allMatterList/filterPopUp/matterIntookByDate/matterIntookByDateFilterCtrl.js");
require("./report/allMatterList/matterStatus-ctrl.js");
require("./report/allMatterList/matterType-ctrl.js");
require("./report/allMatterList/upComingNOCs-ctrl.js");
require("./report/allMatterList/upcomingSOLs-ctrl.js");
require("./report/allMatterList/matter-event-ctrl.js");
require("./report/allMatterList/filterPopUp/matterEvents/matter-events-report-Ctrl.js");
require("./report/customDate-ctrl.js");
require("./report/allMatterList/partial/allMatterListCustomFilter-ctrl.js");
require("./report/allMatterList/filterPopUp/allMatter/allMatterPopCtrl.js");
require("./report/allMatterList/filterPopUp/allMatter/upcomingSOLNOCPopCtrl.js");
require("./report/allMatterList/expenseReportCtrl.js");
require("./report/allMatterList/settlementReportCtrl.js");
require("./report/allMatterList/plaintiffMailing-ctrl.js");
require("./report/allMatterList/filterPopUp/matterValuation/matterValuationFillter.js");
require("./report/allMatterList/matterValuation-ctrl.js");
require("./report/allMatterList/filterPopUp/medicalRecordRequest/medicalRecordRequestFilter.js");
require("./report/allMatterList/medicalRecordRequestReport-Ctrl.js");
require("./report/allMatterList/filterPopUp/expense/expenseFilter.js");
require("./report/allMatterList/filterPopUp/settlementFilterPopup/settlementFilter.js");
require("./report/allMatterList/filterPopUp/plaintiffMailingList/plaintiffMailingFillter.js");
require("./report/matter-age-report/matter-age-ctrl.js");
require("./report/venue/venue-report-ctrl.js");
require("./report/task-age/task-age-ctrl.js");
require("./report/task-age/filter-pop-up/task-age-filter-ctrl.js");
require("./report/taskSummary/taskSummary-report-ctrl.js");
require("./report/taskSummary/taskSummaryDataLayer.js");
require("./report/taskSummary/taskSummaryPopUp/task-summary-popup-ctrl.js");
require("./report/document-report/document-report.js");
require("./report/document-report/filter/doc-report-filter-ctrl.js");
require("./report/userActivity/userActivityReportCtrl.js");
require("./report/userActivity/userActivityPopUp/userActivityReportFilterPopUpCtrl.js");
require("./report/userActivity/userActivityService.js");
require("./report/contact/contact-report-ctrl.js");
require("./report/contact/contact-filter-popup/contact-report-filter-ctrl.js");
require("./report/motion-report/motion-report.js");
require("./report/motion-report/filter/motion-report-filter-ctrl.js");
require("./report/allMatterList/insuranceReport.js");
require("./report/allMatterList/filterPopUp/insurance/insuranceFilter.js");
require("./report/allMatterList/keywordSearch.js");

// Dailymailscan -->
require("./dailymailscan/dailymailscan-module.js");
require("./dailymailscan/dailymailscan-data-service.js");
require("./dailymailscan/dailymailscan-controller.js");

//Mailbox-PHP-->
require("./mailbox/mailbox-module.js");
require("./mailbox/mailbox-constants.js");
require("./mailbox/mailbox-data-service.js");
require("./mailbox/mailbox-controller.js");

//Mailbox-JAVA-->
require("./mailbox_v2/mailbox-module.js");
require("./mailbox_v2/mailbox-constants.js");
require("./mailbox_v2/mailbox-data-service.js");
require("./mailbox_v2/mailbox-controller.js");

//Efax-->
require("./efax/efax-module.js");
require("./efax/efax-constants.js");
require("./efax/efax-data-service.js");
require("./efax/efax-controller.js");


// Side Bar -->
require("./sidebar/sidebar-module.js");
require("./sidebar/sidebar-ctrl.js");
require("./sidebar/sidebarDataLayer.js");

// Referral -->
require("./referral/referral-module.js");
require("./referral/referral-datalayer.js");
require("./referral/refer-out-matter/refer-out-ctrl.js");
require("./referral/referred-matters/reffered-matters-ctrl.js");
require("./referral/referred-matters/refer-matter-info/referred-matter-info.js");
require("./referral/referred-matters/partials/referral-payment-ctrl.js");
require("./referral/refer-out-matter/content-editable-directive.js");
require("./referral/refer-out-matter/partials/search-contact-popup.js");
require("./referral/refer-out-matter/partials/searchrefDataLayer.js");
require("./referral-program/referral-prg-module.js");
require("./referral-program/referral-prg.js");

// Motion -->
require("./motion/motion-module.js");
require("./motion/motion-ctrl.js");
require("./motion/motionDataService.js");
require("./motion/motion-filter-ctrl.js");

require("./matter/matter-overview/matter-valuation/valuation.js");
require("./matter/matter-overview/client-communicator/client-config-ctrl.js");


//Settings-->
require("./settings/settings-module.js");
require("./settings/settings-ctrl.js");
//US#5667  Role Mangement   -->
require("./settings/user-management-tab/user-management-tab-ctrl.js");
require("./settings/role-management/role-management-ctrl.js");

require("./settings/user-management/user-management-ctrl.js");
require("./settings/user-management/add-user/add-user-ctrl.js");
require("./settings/user-management/transfer-user/transfer-user.js");
require("./settings/user-management/set-email/add-email.js");
require("./settings/practiceAndBilling/practice-and-billing-ctrl.js");
require("./settings/profile/profile-ctrl.js");
require("./settings/profile/password.js");
require("./settings/profile/profileDataLayer.js");
require("./settings/practiceAndBilling/practiceAndBillingDataLayer.js");
require("./settings/subscription/subscription-ctrl.js");
require("./settings/planSelection/plan-selection-ctrl.js");
require("./settings/planSelection/confirmation-modal-ctrl.js");
require("./settings/workflows/workflow-ctrl.js");
require("./settings/workflows/view-workflow/view-workflow-ctrl.js");
require("./settings/workflows/view-workflow/add-workflowTask/add-workflowTask-ctrl.js");
require("./settings/workflows/view-workflow/add-workflowEvent/add-workflowEvent-ctrl.js");
require("./settings/workflows/add-workflow/add-workflow-ctrl.js");
require("./settings/payment/payment-ctrl.js");
require("./settings/payment/payment-data-layer.js");
require("./settings/payment/partial/payment-filter-ctrl.js");


//Marketplace-->
require("./marketplace/marketplace-module.js");


require("./marketplace/marketplace-ctrl.js");
require("./marketplace/applications/partials/office-payment-ctrl.js");
require("./marketplace/applications/partials/outlook-web-ctrl.js");
require("./marketplace/applications/applications-ctrl.js");
require("./marketplace/applications/applicationsDataLayer.js");
require("./marketplace/subscription/subscription.js");

require("./marketplace/applications/applications-module.js");


require("./marketplace/services/services-ctrl.js");

require("./marketplace/upcoming/upcoming-module.js");
require("./marketplace/upcoming/upcoming-apps-ctrl.js");



// Templates-->
require("./templates/partials/template-component.js");
require("./templates/templates-module.js");
require("./templates/templates-ctrl.js");
require("./templates/partials/generate-template-ctrl.js");
require("./templates/partials/template-config.js");

// Firms -->
require("./firms/firms-module.js");
require("./firms/firms-data-service.js");
require("./firms/firms-controller.js");

// Notification -->
require("./notification/notification-module.js");
require("./notification/notification-ctrl.js");
require("./notification/notification-datalayer.js");

// Intake -->
// components -->
require("./intake/components/components-module.js");
require("./intake/components/dialogue/dialog-service.js");
require("./intake/components/dialogue/custom-dialog-service.js");
require("./intake/components/dialogue/custom-dialog-controller.js");

//dashboard-->
require("./intake/dashboard/dashboard-module.js");
require("./intake/dashboard/dashboard-datalayer.js");
require("./intake/dashboard/dashboard-ctrl.js");
require("./intake/dashboard/analytics/analytics-helper.js");
require("./intake/dashboard/analytics/analytics-ctrl.js");
require("./intake/dashboard/avarage-matter-age/average-matter-age-directive.js");
require("./intake/dashboard/tasks/dashboard-tasks-ctrl.js");
require("./intake/dashboard/critical-dates/crtical-dates-ctrl.js");

// Matter -->
require("./intake/matter/matter-module.js");
require("./intake/matter/matter-constant.js");
require("./intake/matter/matter-service.js");
require("./intake/matter/matter-details/matter-details-ctrl.js");

require("./intake/matter/matter-overview/matter-overview-ctrl.js");
require("./intake/matter/add-matter/important-dates-directive/important-dates.js");

require("./intake/matter/matter-list/filter-dialogue-ctrl.js");
require("./intake/matter/add-matter/add-matter-ctrl.js");
require("./intake/matter/matter-list/matter-list-ctrl.js");
require("./intake/matter/matter-list/matter-archive/archive-matter-list-ctrl.js");
require("./intake/matter/matter-list/matter-archive/filter-dialogue-ctrl.js");
require("./intake/matter/matter-list/partials/archive-popup-ctrl.js");
require("./intake/matter/matter-list/migration.js");


// Notes -->
require("./intake/notes/notes-module.js");
require("./intake/notes/notes-data-service.js");

// matter notes -->
require("./intake/notes/matter-notes/notes-controller.js");
require("./intake/notes/matter-notes/partials/view-note-controller.js");
require("./intake/notes/matter-notes/partials/note-filter-controller.js");

// Global notes -->
require("./intake/notes/global-notes/global-notes-controller.js");
require("./intake/notes/global-notes/partials/add-global-note-controller.js");

// Launcher Notes -->
require("./intake/newNotes/notes-data-service.js");
require("./intake/newNotes/global-notes/global-notes-controller.js");

// Events -->
require("./intake/events/events-module.js");
require("./intake/events/events-data-service.js");
require("./intake/events/events-controller.js");

// All Parties -->
require("./intake/all-parties/all-parties-module.js");
require("./intake/all-parties/all-parties-data-service.js");
require("./intake/all-parties/all-parties-controller.js");

//Tasks-->
require("./intake/tasks/task-module.js");
require("./intake/tasks/add-task/task-tree/task-tree.js");
require("./intake/tasks/tasks-service.js");
require("./intake/tasks/tasks-datalayer.js");
require("./intake/tasks/global-tasks/global-tasks-ctrl.js");
require("./intake/tasks/matter-tasks/tasks-ctrl.js");
require("./intake/tasks/add-task/add-task-ctrl.js");

//Documents-->
require("./intake/documents/documents-module.js");
require("./intake/documents/documents-constants.js");
require("./intake/documents/documents-data-service.js");

require("./intake/documents/documents-controller.js");
//require("./documents/office365/office-module.js");-->
require("./intake/documents/office365/office-doc-view-ctrl.js");
require("./intake/documents/add-document/add-documents-controller.js");
require("./intake/documents/view-document/view-documents-controller.js");
require("./intake/documents/view-document/clone-documents-controller.js");
require("./intake/documents/documents-filter-ctrl.js");
require("./intake/documents/open-docuSign-popup.js");

// Intake Workflow -->
require("./intake/workflow/workflow-module.js");
require("./intake/workflow/workflow-data-service.js");
require("./intake/workflow/workflow-controller.js");
require("./intake/workflow/matter-view-workflow/matter-view-workflow-ctrl.js");
require("./intake/workflow/apply-workflow/apply-workflow-ctrl.js");
require("./intake/workflow/apply-workflow/apply-workflowTask-ctrl.js");
require("./intake/workflow/apply-workflow/apply-workflowEvent-ctrl.js");

require("./intake/newTask/global-tasks/global-tasks-ctrl.js");
require("./intake/newTask/tasks-datalayer.js");

require("./settings/intake-workflows/workflow-ctrl.js");
require("./settings/intake-workflows/add-workflow/add-workflow-ctrl.js");
require("./settings/intake-workflows/view-workflow/view-workflow-ctrl.js");
require("./settings/intake-workflows/view-workflow/add-workflowTask/add-workflowTask-ctrl.js");
require("./settings/intake-workflows/view-workflow/add-workflowEvent/add-workflowEvent-ctrl.js");



// Intake Reports -->
require("./intake/report/report-module.js");
require("./intake/report/report-ctrl.js");
require("./intake/report/intakeReport-constant.js");
require("./intake/report/intakeReport-service.js");
require("./intake/report/allIntakeList/allIntakeListReport-ctrl.js");
require("./intake/report/allIntakeList/upcomingSOLs-ctrl.js");
require("./intake/report/allIntakeList/filterPopUp/allIntake/allIntakePopCtrl.js");
require("./intake/report/allIntakeList/filterPopUp/allIntake/upcomingSOLNOCPopCtrl.js");
require("./intake/report/allIntakeList/upComingNOCs-ctrl.js");
require("./intake/report/allIntakeList/intakeValuation-ctrl.js");
require("./intake/report/allIntakeList/filterPopUp/intakeValuation/intakeValuationFillter.js");
require("./intake/report/allIntakeList/intakeCampaign-ctrl.js");
require("./intake/report/allIntakeList/filterPopUp/intakeCampaign/intakeCampaignPopCtrl.js");
require("./intake/report/venue/venue-report-ctrl.js");

// Intake Templates-->
require("./intake/templates/partials/template-component.js");
require("./intake/templates/templates-module.js");
require("./intake/templates/templates-ctrl.js");
require("./intake/templates/partials/generate-template-ctrl.js");
require("./intake/templates/partials/template-config.js");

// Matter Collaboration -->
require("./matter/matter-collaboration/matter-collaboration.js");
require("./matter/matter-collaboration/document/documents-controller.js");
require("./matter/matter-collaboration/events/events-controller.js");
require("./matter/matter-collaboration/notes/notes-controller.js");
require("./documents/collaboration-document/collaboration-documents-controller.js");
require("./notes/notes-collaboration/notes-collaboration-controller.js");

// Side Bar -->
require("./newSidebar/sidebar-module.js");
require("./newSidebar/sidebar-ctrl.js");
require("./newSidebar/sidebarDataLayer.js");

//---Intake Referal In/Out------>
require("./intake/referral/referral-module.js");
require("./intake/referral/referral-datalayer.js");
require("./intake/referral/refer-out-matter/refer-out-ctrl.js");
require("./intake/referral/referred-matters/reffered-matters-ctrl.js");
require("./intake/referral/referred-matters/refer-matter-info/referred-matter-info.js");

// US16929: Expense Manager (Quickbooks integration) -->
require("./expenseManager/ExpenseManagerModule.js");
require("./expenseManager/ExpenseManagerDatalayer.js");
require("./expenseManager/ExpenseManager.js");
require("./expenseManager/FilterPopup/ExpenseManagerFilterPopup.js");