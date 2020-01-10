(function () {
    'use strict';
    angular
        .module('cloudlex.marketplace')
        .controller('applicationCtrl', applicationController);

    applicationController.$inject = ['$state', '$modal', 'modalService', 'applicationsDataLayer', 'notification-service', 'masterData', 'routeManager', 'launcherDatalayer', '$window', 'globalConstants', '$rootScope', '$q'];

    function applicationController($state, $modal, modalService, applicationsDataLayer, notificationService, masterData, routeManager, launcherDatalayer, $window, globalConstants, $rootScope, $q) {

        var vm = this;
        vm.showDetails = showDetails;
        vm.showDetailsPage = false;
        vm.save = saveProfile;
        vm.showapplications = true;
        vm.clearStorage = clearStorage;
        vm.showOfficeOnlinePopup = showOfficeOnlinePopup;
        vm.confirm = confirm;
        vm.subIntegratingTools = subIntegratingTools;
        vm.subofficeConnector = subofficeConnector;
        vm.downloadOfficeConnector = downloadOfficeConnector;
        vm.downloadOutlookConnector = downloadOutlookConnector;
        vm.outlookWebConnectorDetails = outlookWebConnectorDetails;
        vm.GmailConnectorDetails = GmailConnectorDetails;
        vm.subEmailConnector = subEmailConnector;
        var LstateName = 'Applications';
        vm.downloadOfficeConnectorURL = globalConstants.downloadOfficeConnectorURL;
        vm.downloadOfficeConnectorURLforMAC = globalConstants.downloadOfficeConnectorURLforMAC;
        vm.downloadOutlookConnectorURL = globalConstants.downloadOutlookConnectorURL;
        vm.myInterval = 3000;
        vm.mySliderInterval = 3000;
        vm.sortApplications = sortApplications;
        vm.slides = [];
        vm.slidesOutlook = [];
        vm.slidesGmail = [];
        var gracePeriodDetails = masterData.getUserRole();
        vm.dissableSubscribe = (gracePeriodDetails.is_admin == 1) || gracePeriodDetails.role == "LexviasuperAdmin" ? false : true;
        vm.downloadOfficeConnectorForMAC = downloadOfficeConnectorForMAC;
        vm.launchpad = JSON.parse(localStorage.getItem('launchpadSetting'));
        vm.launchpadAccess = (vm.launchpad.enabled == 1) ? true : false;
        vm.scrollto = null;
        vm.allfirmData = JSON.parse(localStorage.getItem('allFirmSetting'));
        vm.isSMSEnables = false;
        vm.isExpenseManagerFn = isExpenseManagerFn;
        _.forEach(vm.allfirmData, function (item) {
            if (item.state == "SMS") {
                vm.isSMSEnables = (item.enabled == 1) ? true : false;
            }
        });
        vm.emailConnectors = [{
            id: 1,
            open: false
        },
        {
            id: 2,
            open: false
        }
        ];
        (function () {
            if ($state.current.name == "marketplace.applications") {
                clearStorage();
            }
            // var response = applicationsDataLayer.getConfigurableData();
            // response.then(function (data) {
            //     vm.applicationlist = data.applications;    
            // });
            setBreadcrum();
            getConfiguredData();
            setImageSlider(localStorage.getItem("selectedType"));
            vm.emailconnector = localStorage.getItem("selectedType");
        })();

        vm.toggleDiv = function (appIndex) {
            _.forEach(vm.emailConnectors, function (currentItem, index) {
                if (index != appIndex)
                    currentItem.open = false;
            });
            vm.emailConnectors[appIndex].open = !vm.emailConnectors[appIndex].open;
        }

        function sortApplications() {
            var main = document.getElementById('main');
            [].map.call(main.children, Object).sort(function (a, b) {
                return +a.id.match(/\d+/) - +b.id.match(/\d+/);
            }).forEach(function (elem) {
                main.appendChild(elem);
            });
        }

        /**
         * set images in slider
         * @param {type} selected 
         */
        function setImageSlider(type) {
            switch (type) {
                case "CCOM":
                    //  $state.go('c-com-details');
                    setSliderImg(globalConstants.marketPlace.CCOM); // set slider images                   
                    break;
                case "RE":
                    //  $state.go('referral-details');
                    setSliderImg(globalConstants.marketPlace.RE); // set slider images
                    break;
                case "DA":
                    //  $state.go('digatl-archival-details');
                    setSliderImg(globalConstants.marketPlace.DA); // set slider images
                    break;
                case "IT":
                    //  $state.go('Integration-tools-details');
                    setSliderImg(globalConstants.marketPlace.IT); // set slider images
                    break;
                case "OPLG":
                    //   $state.go('word-plugin-details');
                    setSliderImg(globalConstants.marketPlace.OPLG); // set slider images
                    break;
                case "OTLG":
                    //   $state.go('word-plugin-details');
                    setSliderImg(globalConstants.marketPlace.OTLG); // set slider images
                    break;
                case "0365":
                    //  $state.go('office-online-details');
                    setSliderImg(globalConstants.marketPlace.O365); // set slider images
                    break;
                case "IM":
                    setSliderImg(globalConstants.marketPlace.IM);
                    break;
                case "GA":
                    setSliderImg(globalConstants.marketPlace.GA, true);
                    setSliderImgOutlook(globalConstants.marketPlace.OTLG);
                    setImageTextOutlook(type);
                    break;
                case "SMS":
                    setSliderImg(globalConstants.marketPlace.SMS);
                    break;
                case "LG":
                    setSliderImg(globalConstants.marketPlace.LG);
                    break;
                case "EM":
                    setSliderImg(globalConstants.marketPlace.EM);
                    break;
            }
            if (type == "GA")
                setImageText(type, true);
            else
                setImageText(type);
        }

        function resetaftersubcribed(Subdiv) {
            vm.scrollto = '#' + Subdiv;
        }

        function showDetails(selected) {
            switch (selected) {
                case "CCOM":
                    $state.go('c-com-details');
                    localStorage.setItem("state", 'Client Communicator');
                    localStorage.setItem("selectedType", "CCOM");
                    break;
                case "RE":
                    $state.go('referral-details');
                    localStorage.setItem("state", 'Referral Engine');
                    localStorage.setItem("selectedType", "RE");
                    break;
                case "DA":
                    $state.go('digatl-archival-details');
                    localStorage.setItem("state", 'Digital Archiver');
                    localStorage.setItem("selectedType", "DA");
                    break;
                case "IT":
                    $state.go('Integration-tools-details');
                    localStorage.setItem("state", 'App Integrator');
                    localStorage.setItem("selectedType", "IT");
                    break;
                case "OPLG":
                    $state.go('word-plugin-details');
                    localStorage.setItem("state", 'Word Connector');
                    localStorage.setItem("selectedType", "OPLG");
                    break;
                case "OTLG":
                    $state.go('outlook-plugin-details');
                    localStorage.setItem("state", 'Email Connector');
                    localStorage.setItem("selectedType", "OTLG");
                    break;
                case "GA":
                    $state.go('gmail-plugin-details');
                    localStorage.setItem("state", 'Email Connector');
                    localStorage.setItem("selectedType", "GA");
                    break;
                case "O365":
                    $state.go('office-online-details');
                    localStorage.setItem("state", 'Microsoft Office Online');
                    localStorage.setItem("selectedType", "0365");
                    break;
                case "IM":
                    $state.go('intake-manager-details');
                    localStorage.setItem("state", 'Intake Manager');
                    localStorage.setItem("selectedType", "IM");
                    break;
                case "SMS":
                    $state.go('sms-details');
                    localStorage.setItem("state", 'Client Messenger');
                    localStorage.setItem("selectedType", "SMS");
                    break;
                case "LG":
                    $state.go('lead-generator');
                    localStorage.setItem("state", 'Lead Generator');
                    localStorage.setItem("selectedType", "LG");
                    break;
                case "EM":
                    $state.go('expense-manager');
                    localStorage.setItem("state", 'Expense Manager');
                    localStorage.setItem("selectedType", "EM");
                    break;
            }

        }

        function setImageTextOutlook(type) {
            vm.slidesOutlook[0].text = "";
            vm.slidesOutlook[1].text = "Once downloaded and installed, Outlook Connector will show up as a tab in Outlook.  When you’ve opened an email you’d like to save, click on the <b>Save as Note</b> button next to the CloudLex tab located at the top-left corner of the screen.";
            vm.slidesOutlook[2].text = "You will then be prompted to enter your CloudLex user information.";
            vm.slidesOutlook[3].text = "Once logged in, choose the appropriate matter from the dropdown menu and check the box if you want to mark the email as “Important”.  Once finished, click <b>Upload</b>.";
            vm.slidesOutlook[4].text = "To add an attachment to an email, click <b>Select File</b>. Choose the file from local storage, and then click <b>Upload</b>. A pop-up window will appear confirming that your email with attachment(s) has been saved.";
        }

        function setImageText(type, isGmail) {
            switch (type) {
                case "CCOM":
                    {
                        break;
                    }
                case "RE":
                    {
                        break;
                    }
                case "DA":
                    {
                        vm.slides[0].text = "";
                        vm.slides[1].text = "To archive a matter, first navigate to the <b>Matters</b> tab.";
                        vm.slides[2].text = "Then, navigate to the <b>Closed</b> tab. Please note, you can only archive matters that have been closed. Select any matter(s) that you’d like to archive, and then click the <b>Archive icon.</b>";
                        vm.slides[3].text = "To see all archived matters, navigate to <b>Digital Archiver</b> from the menu icon located at the top-right corner of your dashboard.";
                        vm.slides[4].text = "To retrieve an archived matter, select the checkbox next to the matter name in the “Archived Matter List”, and click the <b>Retrieve</b> icon.";
                        vm.slides[5].text = "The retrieved matter can then be found within the <b>Closed</b> tab.";
                        break;
                    }
                case "IT":
                    {
                        vm.slides[0].text = "";
                        vm.slides[1].text = "You are automatically subscribed to App Integrator with your CloudLex subscription.";
                        vm.slides[2].text = "To configure your CloudLex account with select third-party applications and integrations, first click on your user icon at the top-right corner of the page, and then click <b>Settings</b>.";
                        vm.slides[3].text = "Then, navigate to the <b>Configuration</b> tab.";
                        vm.slides[4].text = "Turn on the toggle button for any features you want to integrate with, and then click <b>Save</b>.";
                        vm.slides[5].text = "After toggling on the features, we will need to sync them individually with your CloudLex account. To do so, first go to the <b>My Profile tab</b>, and then click the <b>Edit</b> button.";
                        vm.slides[6].text = "Click <b>Configure</b> below each feature and follow the corresponding prompts. If you want to unsync a feature with CloudLex,  click <b>Revoke</b>. ";                    
                        vm.slides[7].text = "To install CloudLex Calendar extension, go to Chrome Web Store. Then, search for CloudLex Calendar. Choose the option that says, <b>“Add to Chrome”</b>.";
                        vm.slides[8].text = "Once the CloudLex Calendar extension has been successfully added, you will be able to access your Google calendar to add, edit, and delete events. To do so, click on the CloudLex logo located on your browser's extension bar and then log in to your CloudLex account.";
                        vm.slides[9].text = "This is a Google calendar integrated view. Click on any date or the plus sign to create an event.";
                        vm.slides[10].text = "Insert the event details and click on <b>Save</b> to create an event on Google Calendar.";
                        vm.slides[11].text = "You can see the created event under the selected date. Click on the event name to view details or edit again.";
                        vm.slides[12].text = "You can also choose to sync this event in your CloudLex system and assign them to their respective Matter or Intake. To do so, select the <b>Add to CloudLex</b> checkbox. Then, select a particular intake or matter for this event. Click, <b>Save</b>.";
                        vm.slides[13].text = "You can see the synced event in the Events menu in your CloudLex account under the selected intake/matter.";
                        break;
                    }
                case "OPLG":
                    {
                        vm.slides[0].text = "";
                        vm.slides[1].text = "Once downloaded and installed, Word Connector will show up as tab in Word.  Click on the <b>Upload</b> button and enter your CloudLex user information.  After logging in, you can begin to draft your document.";
                        vm.slides[2].text = "Once you’ve finished drafting, you can upload the document to CloudLex.  First, select the appropriate matter or intake and category from the dropdown menu, and then click the <b>Upload</b> button.";
                        vm.slides[3].text = "Once the document has been uploaded you will see the following screen.";
                        vm.slides[4].text = "If you want to make any additional edits to the document, make the necessary changes, and then click the <b>Upload</b> button. A pop-up permission window will appear asking if you would like to replace the previously saved document. Click <b>Yes</b> to replace the previous version with the updated one.";
                        vm.slides[5].text = "To retrieve a CloudLex document in Word, select the matter or intake from the <b>Retrieve</b> tab, and then click on the <b>Get</b> button. The category that was previously selected will automatically be displayed. Expand the <b>Category</b> menu and select the desired document.";
                        vm.slides[6].text = "After the document is selected, a root path will automatically be generated and you can save the document to local storage.";
                        vm.slides[7].text = "Once saved, your retrieved document will be displayed, enabling you to view and edit it in Word. When finished editing, click on the <b>Upload</b> tab and your previous matter and category selections will be displayed. Finalize the process by clicking the <b>Upload</b> button.";
                        break;
                    }
                case "OTLG":
                    {
                        vm.slides[0].text = "";
                        vm.slides[1].text = "Once downloaded and installed, Outlook Connector will show up as a tab in Outlook. When you’ve opened an email you’d like to save, click on the <b>Save as Note</b> button next to the CloudLex tab located at the top-left corner of the screen.";
                        vm.slides[2].text = "You will then be prompted to enter your CloudLex user information.";
                        vm.slides[3].text = "Once logged in, choose the appropriate matter or intake from the dropdown menu and check the box if you want to mark the email as <b>“Important”</b>.";
                        vm.slides[4].text = "If you want to upload the attachment(s), simply click on <b>“Select File”</b> and upload the files. To finalize the process, click <b>Upload</b>.";
                        break;
                    }
                case "0365":
                    {
                        vm.slides[0].text = "";
                        vm.slides[1].text = "With Microsoft Office Online, you can open Word, Excel and PPT files directly in your web browser. To open Microsoft Office Online, first go to the <b>Documents</b> tab outlined in red at the bottom of the page.";
                        vm.slides[2].text = "Select the file you wish to open by clicking on the file name. (Please note, Word documents must be saved as extension '.docx' in order to be opened in Office Online.)";
                        vm.slides[3].text = "A pop-up window called <b>“Review Document”</b> will appear. Click on the dropdown menu and choose the desired option.";
                        vm.slides[4].text = "To upload a new document using Microsoft Office Online, first click on the <b>Add</b> icon located at the top-left corner of the page.";
                        vm.slides[5].text = "Then, select the <b>“Office”</b> icon to create a document online.";
                        vm.slides[6].text = "You will then be brought to the following page. Select the type of document you wish to create (Word, Excel, or PPT) and fill in the required fields. When you have finished adding the required information, click <b>Save</b>.";
                        break;
                    }
                case "IM":
                    {
                        vm.slides[0].text = "";
                        vm.slides[1].text = "All intakes for the firm can be found on the Intake List under <b>“Lead Name”</b>.";
                        vm.slides[2].text = "To add a new intake, click the <b>Add Intake</b> button. Enter the corresponding data into the respective fields, and then click <b>“Save”</b>. Mandatory fields are marked with an asterisk (<span style='color:red'>*</span>).";
                        vm.slides[3].text = "The Details tab displays all basic information regarding the plaintiff. You can either fill in the information manually or share the intake form with your client(s) via email. To edit the information manually, first click the <b>“Edit”</b> button, then make the necessary changes and lastly, click <b>“Save”</b>.";
                        vm.slides[4].text = "You can also share the intake form via email from the Intakes List. Select the checkbox to the left of the Intake name,  and then click on the <b>Share form</b> button. You can also open the form in a new tab as shown below.";
                        vm.slides[5].text = "The Documents tab displays all documents related to a particular intake. You can add new documents by clicking on the <b>Add</b> icon. You can view and edit documents with Microsoft Office Online®️.";
                        vm.slides[6].text = "To open a document in Microsoft Office Online®️, click on the document name, and then select <b>“View original document using Microsoft Office Online”</b> from the “Edit” drop-down menu. ";
                        vm.slides[7].text = "To migrate an intake to a case, first select the checkbox to the left of the intake name from the Intake List. Then, select the <b>“Migrate to Matter Manager”</b> button.";
                        vm.slides[8].text = "You can migrate the intake to either a new matter or to an existing matter in Matter Manager. Select the appropriate option. Then, fill in and review the respective data fields. Mandatory fields are marked with an asterisk “<span style='color:red'>*</span>”. After reviewing, click on the <b>“Migrate”</b> button. Your intake has now been migrated to a matter. To make additional edits, please access the case in Matter Manager.";
                        vm.slides[9].text = "To migrate multiple intakes to a case, first select the checkboxes to the left of the intake names from the Intake List. *Please note, only intakes with the same Type and Subtypes can be migrated at the same time.* Then, select the <b>“Migrate to Matter Manager”</b> button.";
                        vm.slides[10].text = "You can migrate the intakes to either a new matter or to an existing matter in Matter Manager. Select the appropriate option. Then, fill in and review the respective data fields. Mandatory fields are marked with an asterisk “<span style='color:red'>*</span>”. After reviewing, click on the <b>“Migrate”</b> button. Your intakes have now been migrated to a matter. To make additional edits, please access the case in Matter Manager.";

                        break;
                    }
                case "GA":
                    {
                        if (isGmail) {
                            vm.slidesGmail[0].text = "";
                            vm.slidesGmail[1].text = "To install Connector for Gmail, first log into your Gmail account from your web browser. Then, click on the <b>Settings</b> icon located at the top-right corner of the screen. Choose the option that says, “<b>Get add-ons</b>”.";
                            vm.slidesGmail[2].text = "Next, click <b>Install</b>.";
                            vm.slidesGmail[3].text = "Once the connector has been successfully installed, you will be able to upload emails and their attachment(s) from your inbox directly to CloudLex. To do so, click on the CloudLex logo located on the right-hand side of any open email and then <b>login</b> to your CloudLex account.";
                            vm.slidesGmail[4].text = "Type the <b>Matter or Intake name</b> that corresponds to the email you want to save in the textbox, and then click Search. (You can search for a matter/intake by typing the first three letters of the matter/intake name.)";
                            vm.slidesGmail[5].text = "You can also mark the Note as ‘Important’ by checking the box. ’If you want to mark the note as <b>“important”</b>, select the check box. If not, leave the check box blank.";
                            vm.slidesGmail[6].text = "If the email contains any attachments, the option <b>“Upload with attachment”</b> will automatically be selected. If you do not want to upload the attachment(s), simply uncheck the box. To finalize the process, click <b>Upload Email</b>.";

                        } else {
                            vm.slides[0].text = "";
                            vm.slides[1].text = "To install Connector for Gmail, first log into your Gmail account from your web browser. Then, click on the <b>Settings</b> icon located at the top-right corner of the screen. Choose the option that says, “<b>Get add-ons</b>”.";
                            vm.slides[2].text = "Next, click <b>Install</b>.";
                            vm.slides[3].text = "Once the connector has been successfully installed, you will be able to upload emails and their attachment(s) from your inbox directly to CloudLex. To do so, click on the CloudLex logo located on the right-hand side of any open email. Select <b>Log</b> In and enter your CloudLex login credentials.";
                            vm.slides[4].text = "Type the <b>Matter or Intake name</b> that corresponds to the email you want to save in the textbox, and then click Search. (You can search for a matter/intake by typing the first three letters of the matter/intake name.)";
                            vm.slides[5].text = "You can also mark the Note as ‘Important’ by checking the box. ’If you want to mark the note as <b>“important”</b>, select the check box. If not, leave the check box blank.";
                            vm.slides[6].text = "If the email contains any attachments, the option <b>“Upload with attachment”</b> will automatically be selected. If you do not want to upload the attachment(s), simply uncheck the box. To finalize the process, click <b>Upload Email</b>.";

                        }
                        break;
                    }
                case "SMS":
                    {
                        vm.slides[0].text = "";
                        vm.slides[1].text = "";
                        vm.slides[2].text = "To access Client Messenger, first move your cursor to the right-hand side of the screen so that the Global Toolbar appears. Select the <b>Sidebar</b> icon. Once the Global Toolbar expands, click on the <b>plus sign</b> and then select <b>“Client Messenger”</b>.";
                        // vm.slides[3].text = "You will now see the Client Messenger dashboard. To create a text message, click on the <b>“Add”</b> icon.";
                        vm.slides[3].text = "The following screen will appear. Add the recipient by typing the contact’s name into the Contact search bar. *Please note, in order to send and receive messages from contacts, he or she must be previously added as a contact in Contact Manager*. Next, type your message. When you have finished, review the information and click <b>“Send”</b> to start your correspondence.";
                        vm.slides[4].text = "Your conversation thread will be displayed on the right-hand side of the panel. To tag the conversation to a particular Matter or Intake, select <b>“Tag a Matter/Intake”</b>.";
                        vm.slides[5].text = "Then, select the appropriate field (either Intake or Matter) and type its identifier into the search bar.";
                        vm.slides[6].text = "Once tagged, you will see the associated Matter or Intake below the contact’s name in the communication thread.";
                        break;
                    }
                case "EM":
                    {
                        vm.slides[0].text = "";
                        vm.slides[1].text = "To push an expense from a matter to Expense Manager, first select the expense by clicking the checkbox.";
                        vm.slides[2].text = "Click <b>“Proceed”</b> to confirm your action.";
                        vm.slides[3].text = "To access Expense Manager, navigate to the menu located at the top right-hand corner of the screen.";
                        vm.slides[4].text = "Newly added expenses will appear in the “New Requests” tab. To add an expense to your records, first select the expense and then click <b>“Add to Records”</b>.";
                        vm.slides[5].text = "Enter in the corresponding details and then click <b>“Apply”</b>.";
                        vm.slides[6].text = "Your recorded expenses can then be found under the <b>“Recorded”</b> tab.";
                        break;
                    }
            }
        }

        /**
         * set slider images 
         */
        function setSliderImg(images, isGmail) {
            if (isGmail) {
                vm.slidesGmail = [];
                _.forEach(images, function (currentItem, index) {
                    vm.slidesGmail.push({ image: "styles/images/marketplace-images/slider/" + currentItem });
                });
            } else {
                vm.slides = [];
                _.forEach(images, function (currentItem, index) {
                    vm.slides.push({ image: "styles/images/marketplace-images/slider/" + currentItem });
                });
            }

            //console.log(vm.slides);
        }

        function setSliderImgOutlook(images) {
            vm.slidesOutlook = [];
            _.forEach(images, function (currentItem, index) {
                vm.slidesOutlook.push({ image: "styles/images/marketplace-images/slider/" + currentItem });
            });
            //console.log(vm.slides);
        }

        function setBreadcrum() {

            LstateName = utils.isEmptyVal(localStorage.getItem("state")) ? LstateName : localStorage.getItem("state");
            // var initCrum = [{
            //     name: '...'
            // }, {
            //     name: 'Marketplace'
            // }, {
            //     name: LstateName
            // }];
            var initCrum = [{
                name: '...'
            }, {
                name: LstateName
            }];
            routeManager.setBreadcrum(initCrum);
        }

        function clearStorage() {
            localStorage.setItem("state", 'Applications');
            // localStorage.setItem("selectedType", "AP");
            // $state.go('marketplace.applications');
        }

        /**
         * download office connector setup
         */
        function downloadOfficeConnector() {
            $window.open(vm.downloadOfficeConnectorURL, '_blank');
        }

        function downloadOfficeConnectorForMAC() {
            $window.open(vm.downloadOfficeConnectorURLforMAC, '_blank');
        }

        /**
         * download outlook connector setup
         */
        function downloadOutlookConnector() {
            $window.open(vm.downloadOutlookConnectorURL, '_blank');
        }

        function outlookWebConnectorDetails() {

            var modalInstance = $modal.open({
                templateUrl: 'app/marketplace/applications/partials/outlook-web-details.html',
                controller: 'OutlookWebCtrl as outlookWebCtrl',
                windowClass: 'modalXLargeDialog',
                backdrop: 'static',
                keyboard: false,
            });

            modalInstance.result.then(function (resp) {

            }, function (error) {

            });
        }

        function GmailConnectorDetails() {

            var modalInstance = $modal.open({
                templateUrl: 'app/marketplace/applications/partials/Gmail-web-details.html',
                controller: 'OutlookWebCtrl as outlookWebCtrl',
                windowClass: 'modalXLargeDialog',
                backdrop: 'static',
                keyboard: false,
            });

            modalInstance.result.then(function (resp) {

            }, function (error) {

            });
        }


        /*Modal popup for Office online*/
        function showOfficeOnlinePopup(data, SucribedDiv) {
            vm.offOnlineInfo = data;
            saveProfile(data, '', SucribedDiv);
            // if (data.payment_status) {
            //     saveProfile(data);
            // }
        }

        // function paymentModal(data) {
        //     var selectedData = data;
        //     var modalInstance = $modal.open({
        //         templateUrl: 'app/marketplace/applications/partials/office-365-payment.html',
        //         controller: 'paymentCtrl as payment',
        //         windowClass: 'medicalIndoDialog',
        //         backdrop: 'static',
        //         scope: $scope,
        //         keyboard: false,
        //         resolve: {
        //             selectedInfo: function () {
        //                 return selectedData;
        //             }
        //         }
        //     });
        //     modalInstance.result.then(function (response) {
        //         getConfiguredData();
        //     });
        // }

        /**
         * payment for office online
         */
        function confirm(data, SucribedDiv) {
            var postDataObj = {
                application_id: data.id,
                amount: data.amount
            };
            applicationsDataLayer.confirm(postDataObj)
                .then(function (response) {
                    if (response.data) {
                        notificationService.success("You have successfully subscribed to Microsoft Office Online");
                        resetaftersubcribed(SucribedDiv);
                    }
                    getConfiguredData();
                    callback();
                }, function (error) {
                    if (error.status == 406) {
                        notificationService.error(error.statusText);
                    } else if (error.status == 400) {
                        notificationService.error(error.statusText);
                    } else if (error.status == 403) {
                        notificationService.error(error.data[0]);
                    }
                    callback();
                });
        };

        /**
         * callback for modal close
         */
        function callback() {
            $('#payment').removeClass('in');
            $('#payment').css('display', 'none');
            $(".modal-backdrop").removeClass('fade in');
            $("body").removeClass('modal-open');
            $("body").css('padding-right', '0px');
        }


        function saveProfile(data, Flag, SucribedDiv) {
            if (Flag == 'DA') {
                isDigitalArchival(data, SucribedDiv);
            } else if (Flag == 'RE') {
                isReferralExchange(data, SucribedDiv);
            } else if (Flag == 'IM') {
                isIntakeManager(data, SucribedDiv);
            } else if (Flag == 'CCOM') {
                clientCommunicator(data, SucribedDiv);
            } else if (Flag == 'SMS') {
                isSMS(data, SucribedDiv);
            } else if (Flag == 'LG') {
                isLG(data, SucribedDiv);
            } else if (Flag == 'EM') {
                isExpenseManagerFn(data, SucribedDiv);
            } else {
                isMicrosoftOnline(data, SucribedDiv);
            }
        }



        /**
         * office connector subscribe
         */
        function subofficeConnector(data, SucribedDiv) {
            var successmsg = 'You have successfully subscribed to Word Connector';
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Subscribe',
                headerText: 'Subscribe to Word Connector',
                bodyText: 'Are you sure you want to subscribe to Word Connector?'
            };
            if (data.app_code == "OTLG") {
                modalOptions.headerText = 'Subscribe to Outlook Connector';
                modalOptions.bodyText = 'Are you sure you want to subscribe to Outlook Connector';
                successmsg = 'You have successfully subscribed to Outlook Connector';
            }
            if (data.app_code == "GA") {
                modalOptions.headerText = 'Subscribe to Connector for Gmail';
                modalOptions.bodyText = 'Are you sure you want to subscribe to Connector for Gmail';
                successmsg = 'You have successfully subscribed to Connector for Gmail';
            }

            //confirm before subscribe
            modalService.showModal({}, modalOptions).then(function () {
                var postDataObj = {
                    application_id: data.id,
                    status: 1
                }
                var response = applicationsDataLayer.saveProfileData(postDataObj);
                response.then(function (data) {
                    if (angular.isDefined(data) && data != '' && data != ' ') {

                        var msg = successmsg; //(isOutlook) ? 'You have successfully subscribed to Outlook Connector' : ;
                        notificationService.success(msg);
                        resetaftersubcribed(SucribedDiv);
                        getConfiguredData();
                    }
                }, function (error) {
                    notificationService.error(error.data[0]);
                });
            });
        }

        /* Suscribe Email connector */
        function subEmailConnector(dataGA, dataOTLG, SucribedDiv) {
            var dataRequests = [];
            var successmsg = 'You have successfully subscribed to Email Connector';
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Subscribe',
                headerText: 'Subscribe to Email Connector',
                bodyText: 'Are you sure you want to subscribe to Email Connector?'
            };
            //confirm before subscribe
            modalService.showModal({}, modalOptions).then(function () {
                var postDataObj = {
                    application_id: dataGA.id,
                    status: 1
                }
                var postDataObjoutlook = {
                    application_id: dataOTLG.id,
                    status: 1
                }
                if (dataGA.is_active != 1) {
                    dataRequests.push(applicationsDataLayer.saveProfileData(postDataObj));
                }
                if (dataOTLG.is_active != 1) {
                    dataRequests.push(applicationsDataLayer.saveProfileData(postDataObjoutlook));
                }
                //var response = ;
                $q.all(dataRequests).then(function (data) {
                    var msg = successmsg; //(isOutlook) ? 'You have successfully subscribed to Outlook Connector' : ;
                    notificationService.success(msg);
                    resetaftersubcribed(SucribedDiv);
                    getConfiguredData();
                }, function (error) {
                    notificationService.error(error.data[0]);
                });
            });
        }

        /**
         * App Integrator subscribe
         */
        function subIntegratingTools(data, SucribedDiv) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Subscribe',
                headerText: 'Subscribe to App Integrator',
                bodyText: 'Are you sure you want to subscribe App Integrator'
            };

            //confirm before subscribe
            modalService.showModal({}, modalOptions).then(function () {
                var postDataObj = {
                    application_id: data.id,
                    status: 1
                }
                var response = applicationsDataLayer.saveProfileData(postDataObj);
                response.then(function (data) {
                    if (angular.isDefined(data) && data != '' && data != ' ') {
                        $state.go('settings.configuration');
                        notificationService.success('You have successfully subscribed to App Integrator');
                        resetaftersubcribed(SucribedDiv);
                        getConfiguredData();
                    }
                }, function (error) {
                    notificationService.error(error.data[0]);
                });
            });
        }

        /**
         * Referral Engine subscribe
         */
        function isReferralExchange(data, SucribedDiv) {
            var modalInstance = OpenPopUpForPaidServices(false, false, false, false, true, "Referral Engine");
            modalInstance.result.then(function (response) {
                var postDataObj = {
                    application_id: data.id,
                    status: 1
                }
                var response = applicationsDataLayer.saveProfileData(postDataObj);
                response.then(function (data) {
                    if (angular.isDefined(data) && data != '' && data != ' ') {
                        $rootScope.$emit('updatereferralIcon', 'updateIcon');
                        notificationService.success('Thank you! We will contact you soon.');
                        resetaftersubcribed(SucribedDiv);
                        getConfiguredData();
                    }
                }, function (error) {
                    notificationService.error(error.data[0]);
                });
            });


        }

        function OpenPopUpForPaidServices(isPlanChange, isSMS, isIntake, isDigiArchival, isReferralExchange, appName) {
            return $modal.open({
                templateUrl: 'app/marketplace/subscription/subscription.html',
                controller: 'SubscriptionCtrl as subscriptionCtrl',
                windowClass: 'middle-pop-up',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    data: function () {
                        return {
                            isSMS: isSMS,
                            isIntake: isIntake,
                            isDigiArchival: isDigiArchival,
                            isReferralExchange: isReferralExchange,
                            isLG: !isSMS && !isIntake && !isDigiArchival && !isReferralExchange
                        }
                    },
                    isPlanChange: function () {
                        return isPlanChange;
                    },
                    appName: function () {
                        return appName;
                    }
                }
            });
        }


        //  SMS subscribe
        function isSMS(data, SucribedDiv) {

            var modalInstance = OpenPopUpForPaidServices(false, true, false, false, false, "Client Messenger");
            modalInstance.result.then(function (response) {
                var postDataObj = {
                    application_id: data.id,
                    status: 1,
                    plan_id: response.id
                }
                var response = applicationsDataLayer.saveProfileData(postDataObj);
                response.then(function (data) {
                    if (angular.isDefined(data) && data != '' && data != ' ') {
                        notificationService.success('Thank you! We will contact you soon.');
                        resetaftersubcribed(SucribedDiv);
                        getConfiguredData();
                    }
                }, function (error) {
                    notificationService.error(error.data[0]);
                });
            });
        }

        function isLG(data, SucribedDiv) {

            var modalInstance = OpenPopUpForPaidServices(false, false, false, false, false, "Lead Generator");
            modalInstance.result.then(function (response) {
                var postDataObj = {
                    application_id: data.id,
                    status: 1
                }
                var response = applicationsDataLayer.saveProfileData(postDataObj);
                response.then(function (data) {
                    if (angular.isDefined(data) && data != '' && data != ' ') {
                        notificationService.success('Thank you! We will contact you soon.');
                        resetaftersubcribed(SucribedDiv);
                        getConfiguredData();
                    }
                }, function (error) {
                    notificationService.error(error.data[0]);
                });
            });
        }

        /**
         * Intake Manager subscribe
         */
        function isIntakeManager(data, SucribedDiv) {

            var modalInstance = OpenPopUpForPaidServices(false, false, true, false, false, "Intake");
            modalInstance.result.then(function (response) {
                var postDataObj = {
                    application_id: data.id,
                    status: 1,
                    plan_id: response.id
                }
                var response = applicationsDataLayer.saveProfileData(postDataObj);
                response.then(function (data) {
                    if (angular.isDefined(data) && data != '' && data != ' ') {
                        notificationService.success('Thank you! We will contact you soon.');
                        resetaftersubcribed(SucribedDiv);
                        getConfiguredData();
                    }
                }, function (error) {
                    notificationService.error(error.data[0]);
                });
            });
        }

        // Expense Manager Subscribe
        function isExpenseManagerFn(data, SucribedDiv) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Subscribe',
                headerText: 'Subscribe to Expense Manager',
                bodyText: 'Are you sure you want to subscribe to the Expense Manager?'
            };

            //confirm before subscribe
            modalService.showModal({}, modalOptions).then(function () {
                var postDataObj = {
                    application_id: data.id,
                    status: 1
                }
                var response = applicationsDataLayer.saveProfileData(postDataObj);
                response.then(function (data) {
                    if (angular.isDefined(data) && data != '' && data != ' ') {
                        notificationService.success('You have successfully subscribed to Expense Manager.');
                        resetaftersubcribed(SucribedDiv);
                        getConfiguredData();
                    }
                }, function (error) {
                    notificationService.error(error.data[0]);
                });
            });
        }

        /**
         * Microsoft subscribe
         */
        function isMicrosoftOnline(data, SucribedDiv) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Subscribe',
                headerText: 'Subscribe to Microsoft Office Online',
                bodyText: 'By subscribing to Microsoft Office Online the users of your firm will be able to create/edit documents online directly in CloudLex.'
            };

            //confirm before subscribe
            modalService.showModal({}, modalOptions).then(function () {
                var postDataObj = {
                    application_id: data.id,
                    status: 1
                }
                var response = applicationsDataLayer.saveProfileData(postDataObj);
                response.then(function (data) {
                    if (angular.isDefined(data) && data != '' && data != ' ') {
                        notificationService.success('You have successfully subscribed to Microsoft Office Online.');
                        resetaftersubcribed(SucribedDiv);
                        getConfiguredData();
                    }
                }, function (error) {
                    notificationService.error(error.data[0]);
                });
            });
        }

        /**
         * Digital Archiver subscribe
         */
        function isDigitalArchival(data, SucribedDiv) {
            var modalInstance = OpenPopUpForPaidServices(false, false, false, true, false, "Digital Archiver");
            modalInstance.result.then(function (response) {
                var postDataObj = {
                    application_id: data.id,
                    status: 1
                }
                var response = applicationsDataLayer.saveProfileData(postDataObj);
                response.then(function (data) {
                    if (angular.isDefined(data) && data != '' && data != ' ') {
                        notificationService.success('Thank you! We will contact you soon.');
                        resetaftersubcribed(SucribedDiv);
                        getConfiguredData();
                    }
                }, function (error) {
                    notificationService.error(error.data[0]);
                });
            });
        }

        function clientCommunicator(data, SucribedDiv) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Subscribe',
                headerText: 'Subscribe to Client Communicator',
                bodyText: 'By subscribing to Client Communicator you will be able to communicate with your Clients'
            };

            //confirm before subscribe
            modalService.showModal({}, modalOptions).then(function () {
                var postDataObj = {
                    application_id: data.id,
                    status: 1
                }
                var response = applicationsDataLayer.saveProfileData(postDataObj);
                response.then(function (data) {
                    if (angular.isDefined(data) && data != '' && data != ' ') {
                        $rootScope.isPortalEnabled = true;
                        notificationService.success('You have successfully subscribed to Client Communicator');
                        resetaftersubcribed(SucribedDiv);
                        getConfiguredData();
                    }
                }, function (error) {
                    notificationService.error(error.data[0]);
                });
            });
        }

        function getAppList() {
            launcherDatalayer.getAppAccess().then(function (response) {
                vm.appList = response.user_permission;

                $rootScope.isDigiArchivalSub = checkIfAppActive("DA");
                $rootScope.isReferalActive = checkIfAppActive("RE");
                $rootScope.isIntakeActive = checkIfAppActive("IM");
                $rootScope.isExpenseActive = checkIfAppActive("EM");

                $rootScope.isDigiArchivalSubUI = checkIfAppActive("DA");
                $rootScope.isReferalActiveUI = checkIfAppActive("RE");
                $rootScope.isIntakeActiveUI = checkIfAppActive("IM");
                $rootScope.isExpenseActiveUI = checkIfAppActive("EM");

                localStorage.setItem("isDigiArchivalSub", $rootScope.isDigiArchivalSub);
                localStorage.setItem("isReferalActive", $rootScope.isReferalActive);
                localStorage.setItem("isIntakeActive", $rootScope.isIntakeActive);
                localStorage.setItem("isExpenseActive", $rootScope.isExpenseActive);
            });
        }

        function checkIfAppActive(appKey) {
            var appPermissions = _.filter(vm.appList, function (entity) {
                if (entity.app_code == appKey) {
                    return entity;
                }
            });
            if (appPermissions && appPermissions.length > 0) {
                return appPermissions[0].is_active == 1 && appPermissions[0].permission == 1 ? 1 : 0
            } else {
                return 0;
            }
        }


        function getConfiguredData() {
            var response = applicationsDataLayer.getConfigurableData();
            response.then(function (data) {
                vm.applicationlist = data.applications;
                _.forEach(data.applications, function (application) {
                    switch (application.app_code) {
                        case "CCOM":
                            vm.isCloudlexCommunicator = application;
                            break;
                        case "RE":
                            vm.isRefferalEngine = application;
                            getAppList();
                            break;
                        case "DA":
                            vm.isDigitalArchival = application;
                            getAppList();
                            break;
                        case "IT":
                            vm.isIntegratingTools = application;
                            break;
                        case "OPLG":
                            vm.isWordOfficePlugin = application;
                            break;
                        case "OTLG":
                            vm.isOutlookPlugin = application;
                            break;
                        case "O365":
                            vm.isOfficeOnline = application;
                            //(application.payment_status) ? vm.paymentFlag = false : vm.paymentFlag = true;
                            break;
                        case "IM":
                            vm.isIntakeManager = application;
                            $rootScope.isIntakeActive = vm.isIntakeManager.is_active;
                            break;
                        case "GA":
                            vm.isgmailPlugin = application;
                            break;
                        case "SMS":
                            vm.isSMS = application;
                            break;
                        case "LG":
                            vm.isLG = application;
                            break;
                        case "EM":
                            vm.isExpenseManager = application;
                            $rootScope.isExpenseActive = vm.isExpenseManager.is_active;
                            break;

                    }
                });
                var emailconnector_isactive = 0;
                if (vm.isgmailPlugin.is_active == 1 && vm.isOutlookPlugin.is_active == 1) {
                    emailconnector_isactive = 1;
                } else {
                    emailconnector_isactive = 0;
                }
                var emailobject = { 'app_order': 100, 'app_code': "EC", 'name': "Email Connector", 'is_active': emailconnector_isactive };
                vm.applicationlist.push(emailobject);
                // if (vm.scrollto) {
                //     setTimeout(function () {
                //         $('html, body').animate({
                //             scrollTop: $(vm.scrollto).offset().top
                //         }, 1000);
                //         vm.scrollto = null;
                //     }, 1000);
                // }



            });
        }
    }

})();