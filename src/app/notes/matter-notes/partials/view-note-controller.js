
(function () {

    'use strict';

    angular
        .module('cloudlex.notes')
        .controller('ViewNoteCtrl', ViewNoteController);

    ViewNoteController.$inject = ['notesDataService', 'notification-service', '$scope', '$modal', '$modalInstance', 'note', 'categories', 'globalConstants', 'mailboxDataService', 'mailboxDataServiceV2', 'masterData', '$state', 'matterFactory', 'contactFactory', '$filter'];

    function ViewNoteController(notesDataService, notificationService, $scope, $modal, $modalInstance, note, categories, globalConstants, mailboxDataService, mailboxDataServiceV2, masterData, $state, matterFactory, contactFactory, $filter) {
        $scope.isIntake = false;
        $scope.note = note.note;
        $scope.catdes = $scope.note.noteCategory.category_name;
        $scope.addNoteCategories = categories;
        $scope.noteToEdit = {};
        $scope.noteData = $scope.note;
        $scope.isUser = true;
        $scope.edit = edit;
        $scope.getCollaboration = getCollaboration;

        $scope.display = {
            mode: 'view'
        };
        var cat = _.find($scope.addNoteCategories, function (item) {
            return item.notecategory_id == '';
        })
        if (utils.isEmptyObj(cat)) {
            $scope.addNoteCategories.unshift({ 'category_name': undefined, 'notecategory_id': "" });
        }
        $scope.composeNotesMail = composeNotesMail;
        $scope.noteView = note.view;
        var note = note.note;
        var gracePeriodDetails = masterData.getUserRole();
        $scope.email_subscription = gracePeriodDetails.email_subscription;
        $scope.isGraceOver = gracePeriodDetails.plan_subscription_status;
        $scope.sidebarComments = []; //array for sidebar post

        if (utils.isNotEmptyVal($scope.note.linked_contact)) {
            _.forEach($scope.note.linked_contact, function (contact) {
                contact['firstname'] = utils.isNotEmptyVal(contact.first_name) ? contact.first_name : '';
                contact['lastname'] = utils.isNotEmptyVal(contact.last_name) ? contact.last_name : '';
                contact['contactid'] = contact.contact_id.toString();
            });
            $scope.note.linked_contact_temp = _.map($scope.note.linked_contact, function (item) {
                return item;
            });
            $scope.contactList1 = angular.copy($scope.note.linked_contact);
        } else {
            $scope.note.linked_contact_temp = [];
            $scope.contactList1 = [];
        }


        $scope.getLinkContact = getLinkContact;

        function getLinkContact(name) {

            if (utils.isNotEmptyVal(name)) {

                var postObj = {};
                postObj.type = globalConstants.allTypeList;
                postObj.first_name = utils.isNotEmptyVal(name) ? name : '';
                postObj.page_Size = 250

                matterFactory.getContactsByName(postObj, true)
                    .then(function (response) {
                        var data = response.data;
                        $scope.contactList1 = [];
                        contactFactory.setDataPropForContactsFromOffDrupalToNormalContact(data);
                        contactFactory.setNamePropForContactsOffDrupal(data);

                        var allLinkedContactId = _.pluck($scope.note.linked_contact_temp, 'contact_id');
                        var responseData = angular.copy(data);
                        _.forEach(responseData, function (item, index) {
                            _.forEach(allLinkedContactId, function (it) {
                                if (item.contact_id == it) {
                                    data.splice(index, 1);
                                }
                            })
                        })
                        $scope.filteredContact = data;

                        _.forEach(data, function (item) {
                            if (item.contact_type != "Global") {
                                $scope.contactList1.push(item);
                            }
                        });
                        if (utils.isNotEmptyVal($scope.contactList1)) {
                            $scope.contactList1 = _.uniq($scope.contactList1, function (item) {
                                return item.contact_id;
                            });
                        }
                    });

            } else {
                $scope.contactList1 = [];
            }
        }

        (function () {
            getNoteAttachments(note);
            if ($scope.noteView == "CONV") {
                editFromConvView(); // set default selected matter note details
            }
            var userrole = masterData.getUserRole();
            $scope.isUser = (userrole.uid == note.user.user_id) || (userrole.role == globalConstants.adminrole) || (userrole.is_admin == '1') ? false : true; //US#8097

            /**
             * firm basis module setting 
             */
            $scope.firmData = JSON.parse(localStorage.getItem('firmSetting'));

            $scope.matterInfo = matterFactory.getMatterData();

        })();



        /**
         * go to document view 
         */
        $scope.gotoDocument = function (attachment) {
            $state.go('globaldocument-view', { matterId: attachment.matterid, documentId: attachment.documentid }, { reload: true });
        }

        var permissions = masterData.getPermissions();
        $scope.notesPermissions = _.filter(permissions[0].permissions, function (per) {
            if (per.entity_id == '5') {
                return per;
            }
        });
        //US#7770 if it is a sidebar note then check sidebar post
        if (note.type == 'sidebar') {
            if (note.noteCategory.notecategory_id == 1002) {
                notesDataService.sidebarComment(note.note_id)
                    .then(function (response) {
                        $scope.sidebarComments = utils.isEmptyVal(response.data) ? '' : response.data;
                        $scope.sidebarPost = $scope.sidebarComments.length == 0 ? true : false;
                    });
            }


        }
        if (note.noteCategory.notecategory_id == 1003) {
            notesDataService.getSelectedSMSThread(note.note_id, note.matter_id)
                .then(function (response) {
                    var data = response;
                    $scope.selectedSMSThread = data.threadMessages;
                    note.threadMessages = $scope.selectedSMSThread;
                });
        }
        if (note.type == 'email') {
            if ($scope.firmData.API != "PHP") {
                mailboxDataServiceV2.getNoteThread(note.id).then(function (res) {
                    if (utils.isNotEmptyVal(res.data)) {
                        self.note = note;

                        _.forEach(res.data, function (mailKey) {
                            var recipientsArr = [];
                            var ccRecipientsArr = [];
                            // To mail
                            _.forEach(mailKey.recipients, function (recipient_key) {
                                recipientsArr.push(recipient_key.address);
                            });
                            // cc mail
                            _.forEach(mailKey.cc_recipients, function (cc_recipient_key) {
                                ccRecipientsArr.push(cc_recipient_key.address);
                            });

                            mailKey.recipients_mail = recipientsArr.toString();
                            mailKey.cc_recipients_mail = ccRecipientsArr.toString();
                            mailKey.message = mailKey.messagebody;
                            mailKey.from_mail_user = mailKey.sender.address;
                            mailKey.from_mail = mailKey.sender.address;
                            mailKey.createddate = mailKey.internaldate;
                        });

                        self.note.emailMessages = res.data;
                    } else { self.note.emailMessages = []; }
                });
            } else {
                mailboxDataService.getMailthread(note.note_id)
                    .then(function (res) {
                        self.isOpenNotesView = true;
                        if (utils.isNotEmptyVal(res.data)) {
                            self.note = note;

                            _.forEach(res.data.message, function (mailKey) {
                                var recipientsArr = [];
                                var ccRecipientsArr = [];
                                // To mail
                                _.forEach(mailKey.recipients, function (recipient_key) {
                                    recipientsArr.push(recipient_key.mail_to);
                                });
                                // cc mail
                                _.forEach(mailKey.cc_recipients, function (cc_recipient_key) {
                                    ccRecipientsArr.push(cc_recipient_key.mail_to);
                                });

                                mailKey.recipients_mail = recipientsArr.toString();
                                mailKey.cc_recipients_mail = ccRecipientsArr.toString();
                            });

                            self.note.emailMessages = res.data.message;
                        } else { self.note.emailMessages = []; }
                    });
            }
        } else {
            $scope.isOpenNotesView = true;
            $scope.note = note;
        }

        /**
        * get note attachment notes
        */
        function getNoteAttachments(note) {
            notesDataService.getNoteAttachments(note.note_id, 0)
                .then(function (response) {
                    $scope.documentTags = [];
                    _.forEach(response.data, function (currentItem, index) {
                        $scope.documentTags.push({ 'value': currentItem.doc_name, 'documentid': currentItem.doc_id, 'matterid': note.matter_id });
                    });
                }, function (error) {
                    //notificationService.error("unable to fetch note attachments!");
                });
        }


        function composeNotesMail() {
            $modalInstance.close({ composeEmail: true, note: note });
        }

        //edit note function for view note
        function edit() {
            if ($scope.notesPermissions[0].E == 0) {
                notificationService.error(" You are not authorized to edit notes");
                return;
            }
            $scope.display.mode = 'edit';
            //set the note to be edited on new obj
            $scope.noteToEdit = angular.extend({}, angular.copy($scope.note));
            $scope.noteToEdit.text = utils.getTextFromHtml($scope.noteToEdit.text);
            $scope.noteToEdit.noteCategory.notecategory_id = angular.copy($scope.note.noteCategory.notecategory_id);
            setIsImportant($scope.noteToEdit);
        };

        function getCollaboration() {
            $scope.noteData = angular.extend({}, $scope.note);
            var modalInstance = $modal.open({
                templateUrl: 'app/notes/notes-collaboration/notes-collaboration.html',
                controller: 'NotesCollaborationCtrl as collaborationNote',
                keyboard: false,
                backdrop: 'static',
                size: 'lg',
                windowClass: 'modalMidiumDialog',
                resolve: {
                    collaborationNote: function () {
                        return {
                            noteData: $scope.noteData
                        };
                    }
                }
            });
        };


        function editFromConvView() {
            $scope.noteToEdit = angular.extend({}, $scope.note);
            $scope.noteToEdit.text = utils.getTextFromHtml($scope.noteToEdit.text);
            $scope.noteToEdit.noteCategory.notecategory_id = $scope.note.noteCategory.notecategory_id;
            var list = angular.copy($scope.note.linked_contact);
            // _.forEach(list, function(item){
            //     $scope.noteToEdit.linked_contact_temp.push(item.contact_id);
            // });
            setIsImportant($scope.noteToEdit);
        };

        //function of edit note
        $scope.editNote = function (note) {
            if (utils.isNotEmptyVal(note.linked_contact_temp)) {
                note.linked_contact_temp = _.uniq(note.linked_contact_temp, function (item) {
                    return item;
                });
            }
            utils.isEmptyVal(note.text) ? note.text = "<p></p>" : note.text = note.text;
            note.is_important = (note.is_important == true ? 1 : 0);
            //note.linked_contact = note.linked_contact_temp;
            var arr = [];
            _.forEach(note.linked_contact_temp, function (item, index) {
                if (_.isObject(item)) {
                    arr.push({ 'contact_id': item.contact_id });
                } else {
                    arr.push({ 'contact_id': item });
                }

            });
            note.linked_contact = arr;
            notesDataService.editNote(note)
                .then(function (res) {
                    $modalInstance.close({ edited: true });
                });
        }

        // to open add new contact pop up
        $scope.addNewContact = function(type) {
            var selectedType = {};
            selectedType.type = type;
            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                if (response) {
                    response.firstname = response.first_name;
                    response.lastname = response.last_name;
                    response.contactid = (response.contact_id).toString();
                    
                    $scope.noteToEdit.linked_contact_temp.push(response);
                }
            }, function () { });
        }

        /*Print Note*/
        $scope.printNote = function (note, sidebar) {
            //US#7770
            var sidebarPrint = angular.isDefined(sidebar) ? sidebar : '';
            if (utils.isEmptyVal(note.addedbyuser)) {
                note.addedbyuser = '';
            }
            // if (utils.isEmptyVal(note.lname)) {
            //     note.lname = '';
            // }
            var output = getNoteData(angular.copy(note), sidebarPrint, note.threadMessages);
            window.open().document.write(output);

        };

        function getNoteData(note, sidebar, threadMessages) {
            var noteText = utils.isNotEmptyVal(note.text) ? utils.replaceHtmlEntites(note.text.replace(/<\/?[^>]+>/gi, '')) : '';
            noteText = utils.replaceQuoteWithActual(noteText);
            noteText = $filter('showSafeHtml')(noteText);
            if (note.type == 'email') {
                return emailPrintView(note);
            }
            if (note.is_important == 1) {
                var imp = '<div style="float:left;margin: 5px 7px 32px 7px;"><img src='
                    + globalConstants.images_path + 'print_alert.png /></div>'
            } else { var imp = ''; }
            //if (note.noteCategory) { var cat = note.noteCategory.category_name } else { var cat = '' }
            var cat = utils.isNotEmptyVal(note.noteCategory.category_name) ? note.noteCategory.category_name : "Note";
            if (utils.isNotEmptyVal(note.noteCategory.category_name) && note.noteCategory.category_name == 'sidebar') {
                var cat = "Sidebar";
            }
            var html = "<html><title>Note</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>pre {overflow-x: auto;white-space: pre-wrap; white-space: -moz-pre-wrap;white-space: -pre-wrap;white-space: -o-pre-wrap; word-wrap: break-word;}  table tr { page-break-inside: always; }  </style>";
            html += "<style>@media print{ #printBtn{display:none} </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 10pt;'><img src="
                + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right; '><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Note</h1><div style='margin:30px 0 0 '>";
            html += imp;
            html += "<div class='note-subhead' <strong style='display:block; min-height:7px'>" + cat + "</strong>" + "</br>";
            html += " <small>Matter Name:" + utils.removeunwantedHTML(note.matter_name) + " | " + "File #:" + note.file_number + " </small>" + "</br>";
            html += "<small>Added By:" + note.addedbyuser + "|" + getFormattedDate(note.created_date) + " </small></br>";
            html += " <small>Linked Contact:" + utils.removeunwantedHTML(note.linked_names) + " </small> </div>";

            if (!threadMessages) {
                html += "<pre style='width: 100%; text-align:justify;border-top: 1px solid #ccc; padding: 10px 0; word-break: keep-all;background-color: #ffffff;border:none;font-family: GothamRounded-Book;padding:0px;'>" + noteText + "</pre></div>";
            } else {
                html += "<pre style='width: 100%; text-align:justify;border-top: 1px solid #ccc; padding: 10px 0; word-break: keep-all;background-color: #ffffff;border:none;font-family: GothamRounded-Book;padding:0px;'></pre></div>";
            }

            //US#7770
            if (note.type == 'sidebar' || note.type == 'Client Messenger') {
                if (!threadMessages) {
                    var checkSidebarLen = sidebar.length;
                    checkSidebarLen != 0 ? html += '<span>Comment</span><br>' : '';

                    _.forEach(sidebar, function (data) {
                        html += data.user_name + ' <br> ' + getSidebarDate(data.created) + "</br>" + "<p style='width: 44%; text-align:justify;border-top: 1px solid #ccc; padding: 10px 0; word-break:break-word'>" + data.comment_body_value + '</p><br><br>';
                    });
                } else {
                    html += notesDataService.getSmsPrint(threadMessages);
                }
            }
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';

            return html;
        }

        function emailPrintView(note) {
            var html = " <html><head><title>Note</title>" +
                "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'><style>@media print{ #printBtn{display:none} </style>" +

                "</head>" +

                "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 10pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";

            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Note</h1><div></div>";

            html += "<strong style='display:block; min-height:7px; word-wrap:break-word;width: 44%;margin:30px 0 0 '>Email</strong>";

            html += " <small>Matter Name:" + utils.removeunwantedHTML(note.matter_name) + " | " + "File #:" + note.file_number + " </small>" + "</br>";
            html += "<small>Added By: " +
                note.user.first_name + ' ' + note.user.last_name + "|" + getFormattedDate(note.created_date)
                + "</small>" + "</br>";
            html += '<div style="width:100%; clear:both;border-top: 1px solid #ccc;padding: 10px 0 0;width: 44%;"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';

            _.forEach(note.emailMessages, function (mail, key) {
                html += "<table style='width:100%;text-align: left; word-break:break-word;padding:10px;";
                html += key != note.emailMessages.length - 1 ?
                    "border-left:1px solid #e2e2e2;'" : "border-left:1px solid #FFF;'";
                html += " cellspacing='0' cellpadding='0' border='0'>";
                html += "<tr>";
                html += "<td>To: " + mail.recipients_mail + "</td>";
                html += "</tr>";
                if (mail.cc_recipients_mail != "") {
                    html += "<tr>";
                    html += "<td>Cc: " + mail.cc_recipients_mail + "</td>";
                    html += "</tr>";
                }
                html += "<tr>";
                html += "<td>From: " + mail.from_mail + "</td>";
                html += "</tr>";
                html += "<tr>";
                html += "<td>Date: " + getFormattedDate(mail.createddate) + "</td>";
                html += "</tr>";

                html += "<tr>";
                html += "<td style='padding:10px 0;'>Sub: " + mail.subject + "</td>";
                html += "</tr>";



                html += "<tr>";
                html += "<td>" + mail.message + "</td>";
                html += "</tr>";
                html += "</table>";

            });
            html += "</body>";
            html += "</html>";
            return html;
        }

        function setIsImportant(note) {
            var isImp = parseInt(note.is_important);
            if (isNaN(isImp)) {
                note.is_important = (utils.isEmptyVal(note.is_important) || note.is_important == "null") ? false : true;
            } else {
                note.is_important = isImp === 1;
            }
        }

        //Delete note
        $scope.doDeleteNote = function () {
            notesDataService.deleteNote($scope.note.note_id)
                .then(function (response) {
                    $modalInstance.close(response);
                    $scope.display.mode = 'view';
                });
        };

        $scope.deleteNote = function () {
            if ($scope.notesPermissions[0].D == 0) {
                notificationService.error(" You are not authorized to delete notes");
                return;
            }
            //console.log($scope.note.id);
            $scope.display.mode = 'delete';
        };

        $scope.cancelDelete = function () {
            $scope.display.mode = 'view';
        };

        $scope.getFormattedDate = function (timestamp) {
            return moment.unix(timestamp).format("MM/DD/YYYY hh:mm A");
        };

        function getSidebarDate(timestamp) {
            return moment.unix(timestamp).format('hh:mm A MMM DD,YYYY');
        }

        $scope.close = function () {
            $modalInstance.dismiss();
        }

        $scope.cancel = function () {
            $scope.display.mode === 'edit' ? ($scope.display.mode = 'view') : $modalInstance.dismiss('cancel');
        };

    }

})();




