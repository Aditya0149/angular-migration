(function () {
    'use strict';
    angular
        .module('cloudlex.newSidebar')
        .controller('NewSidebarCtrl', NewSidebarController)
        .filter('numberFixedLen', function () {
            return function (n, len) {
                var num = parseInt(n, 10);
                len = parseInt(len, 10);
                if (isNaN(num) || isNaN(len)) {
                    return n;
                }
                num = '' + num;
                while (num.length < len) {
                    num = '0' + num;
                }
                return num;
            };
        });

    NewSidebarController.$inject = ['$scope', '$modal', '$rootScope', '$state', 'matterFactory', 'newSidebarDataLayer', 'newSidebarHelper',
        'notification-service', 'modalService', 'masterData', 'notificationDatalayer', 'documentsDataService', 'allPartiesDataService', 'intakeNotesDataService', '$q', 'intakeFactory', 'globalConstants', 'contactFactory', '$location', 'practiceAndBillingDataLayer', '$filter', 'mailboxHelper', 'Upload', '$timeout', 'inatkeDocumentsDataService', 'mailboxDataService'];

    function NewSidebarController($scope, $modal, $rootScope, $state, matterFactory, newSidebarDataLayer, newSidebarHelper,
        notificationService, modalService, masterData, notificationDatalayer, documentsDataService, allPartiesDataService, intakeNotesDataService, $q, intakeFactory, globalConstants, contactFactory, $location, practiceAndBillingDataLayer, $filter, mailboxHelper, Upload, $timeout, inatkeDocumentsDataService, mailboxDataService) {


        // On Page Refresh websocket user-update call
        // if ((sessionStorage.getItem("webScoketsessionStorageObj") != 'undefined') && (sessionStorage.getItem("webScoketsessionStorageObj") != null) && (sessionStorage.getItem("webScoketsessionStorageObj") != '')) {
        //     var webScoketsessionStorageObj = JSON.parse(sessionStorage.getItem("webScoketsessionStorageObj"));
        //     messageFactory.updateUserDetails(webScoketsessionStorageObj.firmId, webScoketsessionStorageObj.matterId, webScoketsessionStorageObj.userId, webScoketsessionStorageObj.groupId)
        //         .then(function (response) {
        //             // console.log(response);
        //             getNotificationMessageCountData();
        //         });
        //     sessionStorage.removeItem('webScoketsessionStorageObj');
        // }

        var vm = this;
        vm.allPosts = allPosts;
        vm.following = following;

        //function call from UI
        vm.displayMorePosts = displayMorePosts;
        vm.followPost = followPost;
        vm.unFollowPost = unFollowPost;
        vm.commentButtonClick = commentButtonClick;
        vm.cancelComment = cancelComment;
        vm.saveComment = saveComment;
        vm.deleteComment = deleteComment;
        vm.postMessage = postMessage;
        vm.displayAllComments = displayAllComments;
        vm.editPost = editPost;
        vm.saveEditedPost = saveEditedPost;
        vm.cancelEdit = cancelEdit;
        vm.deletePost = deletePost;
        vm.showEditDelete = showEditDelete;
        vm.goToMatter = goToMatter;
        vm.clientCommunication = clientCommunication;
        vm.messageCount = 0;
        vm.unseenMsgCount = "";
        vm.documents = [];
        //US#4713 disable add edit delete  for grace period validity 
        var gracePeriodDetails = masterData.getUserRole();
        vm.firmID = gracePeriodDetails.firm_id;
        vm.isGraceOver = gracePeriodDetails.plan_subscription_status;

        /** Set  isPortalEnabled flag to show/hide client communicator icon **/
        if (!(angular.isDefined($rootScope.isPortalEnabled))) {
            $rootScope.isPortalEnabled = (gracePeriodDetails.client_portal == '1') ? true : false;
        }

        vm.resetPage = resetPage;
        vm.launchpad = JSON.parse(localStorage.getItem('launchpadSetting'));
        vm.launchpadAccess = (vm.launchpad.enabled == 1) ? true : false;
        vm.selectedMode = $rootScope.onMatter || $rootScope.onLauncher ? '0' : '1';

        /**
         * Start:  new variable for sidebar
         */

        vm.allfirmData = JSON.parse(localStorage.getItem('allFirmSetting'));
        vm.isSMSFirmSettingActive = false;
        _.forEach(vm.allfirmData, function (item) {
            if (item.state == "SMS") {
                vm.isSMSFirmSettingActive = (item.enabled == 1) ? true : false;
            }
        });

        vm.blockHideAndShow = blockHideAndShow;
        var intakes = [];
        vm.ext_msg_formatTypeaheadDisplay = ext_msg_formatTypeaheadDisplay;
        vm.ext_msg_searchMatters = ext_msg_searchMatters;
        vm.sendNewExternalMessages = sendNewExternalMessages;
        var EXT_MSG_SOCKET_CONNECTION;
        vm.ext_msg_grouplistFn = ext_msg_grouplistFn;
        vm.ext_msg_grouplist = [];
        vm.ext_msg_group_selectedFn = ext_msg_group_selectedFn;
        vm.onlySendNewExtMessages = onlySendNewExtMessages;
        vm.listSelectedDropdownFirmPost = true;
        vm.leftSidePanelFlag = true;
        vm.listSelectedDropdown = "Post";
        vm.getConfigurableData = getConfigurableData;
        vm.resetSMSPage = resetSMSPage;
        vm.getAllSMSThreadFn = getAllSMSThreadFn;
        vm.selectedSMSThread = null;
        vm.clxGridOptions = {};
        vm.documentTags = [];
        vm.listofReq = [];
        vm.reqs = [];
        vm.mediaList = [];
        vm.attachmentFile = {};
        vm.attachmentFile.file = [];
        vm.attachmentFile.clx_file = [];
        vm.searchDocs = '';

        /**
         * End:  new variable for sidebar
         */


        vm.eventFor = [
            {
                id: '1',
                name: "Intake"
            },
            {
                id: '0',
                name: "Matter"
            },
        ];

        vm.selectedModeForSidebar = $rootScope.onMatter || $rootScope.onLauncher ? '0' : '1';
        vm.selectedModeForSidebarForSMS = $rootScope.onMatter || $rootScope.onLauncher ? '0' : '1';
        vm.selectedModeForSidebarMMS = $rootScope.onMatter || $rootScope.onLauncher ? '0' : '1';

        vm.getIntakeList = function (contactName, migrate) {
            return intakeNotesDataService.getMatterList(contactName, migrate)
                .then(function (response) {
                    if (response == 0) {
                        vm.getTagIntakeId = vm.getTagIntakeId;
                    }
                    intakes = response;

                    return response;
                });

        };

        //checkbox select state manager start
        vm.selectAllDocuments = function (selected) {
            if (selected) {
                vm.clxGridOptions.selectedItems = angular.copy(vm.getMatterDocList);
            } else {
                vm.clxGridOptions.selectedItems = [];
            }
        };

        vm.allDocumentsSelected = function () {
            if (vm.getMatterDocList.length != 0)
                return vm.clxGridOptions.selectedItems.length === vm.getMatterDocList.length;
        };

        vm.isDocumentSelected = function (contact) {
            var ids = _.pluck(vm.clxGridOptions.selectedItems, 'doc_id');
            return ids.indexOf(contact.doc_id) > -1;
        };

        //checkbox for intake
        vm.selectAllDocumentsForIntake = function (selected) {
            if (selected) {
                vm.clxGridOptions.selectedItemsForIntake = angular.copy(vm.getIntakeDocList);
            } else {
                vm.clxGridOptions.selectedItemsForIntake = [];
            }
        };

        vm.allDocumentsSelectedForIntake = function () {
            if (vm.getIntakeDocList.length != 0)
                return vm.clxGridOptions.selectedItemsForIntake.length === vm.getIntakeDocList.length;
        };

        vm.isDocumentSelectedForIntake = function (contact) {
            var ids = _.pluck(vm.clxGridOptions.selectedItemsForIntake, 'intake_document_id');
            return ids.indexOf(contact.intake_document_id) > -1;
        };


        vm.formatTypeaheadDisplayForIntake = function (intakeId) {
            if (angular.isUndefined(intakeId.intakeId) || utils.isEmptyString(intakeId.intakeId)) {
                return undefined;
            }

            var intakeInfo = _.find(intakes, function (intake) {
                return intake.intakeId == intakeId.intakeId;
            });

            return utils.removeunwantedHTML(intakeInfo.intakeName) + intakeInfo.dateIntake;
        };
        vm.closeDocListModal = function () {
            vm.docModel = {};
            modalInstance.dismiss();
        }
        $scope.$watch(function () {
            vm.disableUpload = false;
            if (vm.selectedMode == 1 && vm.clxGridOptions.selectedItemsForIntake && vm.clxGridOptions.selectedItemsForIntake.length == 0) {
                vm.disableUpload = true;
            } else if (vm.selectedMode == 0 && vm.clxGridOptions.selectedItems && vm.clxGridOptions.selectedItems.length == 0) {
                vm.disableUpload = true;
            } else {
                vm.disableUpload = false;
            }
        })

        vm.saveDocListModal = function () {
            var list = [];
            if (vm.selectedMode == 1) {
                list = angular.copy(vm.clxGridOptions.selectedItemsForIntake);
            } else {
                list = angular.copy(vm.clxGridOptions.selectedItems);
            }

            var array = [];
            list.slice(0).forEach(function (file) {
                if (file.size > 3500000) {
                    array.push(vm.selectedMode == 1 ? file.documentname : file.doc_name);
                    list.splice(list.indexOf(file), 1);
                }
            })
            if (array.length > 0) {
                notificationService.error("The MMS size of " + array.toString() + " files exceed 3.15 MB");
            }
            if (list.length > 0) {
                _.forEach(list, function (item) {
                    vm.attachmentFile.clx_file.push(item);
                })
                var intakeFiles = _.filter(vm.attachmentFile.clx_file, function (list) {
                    return list.intake_document_id;
                });
                intakeFiles = _.uniq(intakeFiles, 'intake_document_id');
                var matterFiles = _.filter(vm.attachmentFile.clx_file, function (list) {
                    return list.doc_id;
                });
                matterFiles = _.uniq(matterFiles, 'doc_id');
                vm.attachmentFile.clx_file = [];
                vm.attachmentFile.clx_file = matterFiles.concat(intakeFiles);

                _.forEach(vm.attachmentFile.clx_file, function (currentItem, index) {
                    vm.documentTags.push({ value: currentItem.doc_name, name: currentItem.doc_name + " " + currentItem.size, index: index, type: 'CLX', id: currentItem.id, from: currentItem.from });
                });
                vm.documentTags = _.uniq(vm.documentTags, 'id');
                modalInstance.close();

            }
        }
        vm.cancelFirmPost = function () {
            if (vm.listSelectedDropdown == "Post") {
                vm.allPosts(1);
                vm.blockHideAndShow(true, false, false, false, false, false, false);
            }

            if (vm.listSelectedDropdown == "Text Message") {
                vm.getAllSMSThreadFn();
                vm.resetSMSPage();
                vm.blockHideAndShow(false, false, false, false, true, false, false);
            }

            if (vm.listSelectedDropdown == "Following Post") {
                vm.following(0);
                vm.blockHideAndShow(true, false, false, false, false, false, false);
            }
            vm.documentTags = [];
            vm.attachmentFile = { file: [], clx_file: [] };
            vm.searchDocs = '';
        }

        vm.init = function () {
            vm.unseenMsgCount = "";
            vm.allPostClick = 0;
            vm.followingClick = 1;
            vm.clientClick = 1;
            vm.eventClick = 1;
            vm.followingFlag = true;
            vm.moreFlag = false;
            vm.followData = {};
            vm.postData = {};
            vm.unFollowFlag = false;
            vm.postMessageText = '';
            vm.newCommentText = '';
            vm.displayDataFlag = false;
            vm.displayNoDataFound = true;
            vm.showPostFromDataFlag = false;
            vm.addCommentFlag = false;
            vm.addCommentData = {};
            vm.addCommentPostId = '';
            vm.addCommentResponse = {};
            vm.displayFollowingTabFlag = false;
            vm.displayAllCommentsFollowingTabFlag = false;
            vm.displaySingleCommentFlag = false;
            vm.clientCumEnable = true;
            vm.indexVal = '';
            vm.getTagMatterId = '';
            vm.followPostIndex = '';
            vm.unFollowPostIndex = '';
            //data
            vm.allPostsData = [];
            vm.followingData = [];
            vm.displayData = [];
            vm.matterid = '';
            vm.showPostFromMatterid = '';
            vm.matterIdForPostMoreLink = '';
            if ($rootScope.isSmsActive == 1) {
                vm.isSmsActiveUI = "1";
            }
            if ($rootScope.onLauncher || $rootScope.onNotifications) {
                if ($rootScope.isIntakeActive) {
                    vm.is_intake_flag = '';
                    vm.SMSThreadFlag = 2;
                    vm.placeholderForFirmPost = 'Search Matter/Intake';
                    vm.searchFilterMessageForFirmPostList = 'No data for selected Matter/Intake';
                    vm.lengthMessageForFirmPostList = 'No Post available for Matter/Intake';
                    vm.lengthMessageForFollowingPostList = 'No Following Post available for Matter/Intake';
                } else {
                    vm.is_intake_flag = '0';
                    vm.SMSThreadFlag = 0;
                    vm.placeholderForFirmPost = 'Search Matter';
                    vm.searchFilterMessageForFirmPostList = 'No data for selected Matter';
                    vm.lengthMessageForFirmPostList = 'No Post available for Matter';
                    vm.lengthMessageForFollowingPostList = 'No Following Post available for Matter';
                }
            } else if ($rootScope.onIntake) {
                vm.is_intake_flag = '1';
                vm.SMSThreadFlag = 1;
                vm.placeholderForFirmPost = 'Search Intake';
                vm.searchFilterMessageForFirmPostList = 'No data for selected Intake';
                vm.lengthMessageForFirmPostList = 'No Post available for Intake';
                vm.lengthMessageForFollowingPostList = 'No Following Post available for Intake';
            } if ($rootScope.onMatter) {
                vm.is_intake_flag = '0';
                vm.SMSThreadFlag = 0;
                vm.placeholderForFirmPost = 'Search Matter';
                vm.searchFilterMessageForFirmPostList = 'No data for selected Matter';
                vm.lengthMessageForFirmPostList = 'No Post available for Matter';
                vm.lengthMessageForFollowingPostList = 'No Following Post available for Matter';
            }


            vm.filters = {
                pageNum: 1,
                matterID: '',
                is_intake: vm.is_intake_flag
            };

            vm.showPostFromFilter = {
                matterID: ''
            };

            vm.followFilters = {
                post_id: 0,
                follow: ''
            };
            vm.filters.pageNum = 1;

            // call message notification count function on loading script
            // getMessageNotificationCount();
            // getNotificationMessageCountData();
            getConfigurableData();

        };
        /* file upload watch */
        $scope.$watch(function () {
            return vm.documents;
        }, function () {
            if (vm.documents && vm.documents.length > 0) {
                vm.upload(vm.documents);
            }
        });

        vm.tagCancelled = function (cancelled) {
            vm.documentTags = [];
            if (cancelled.type == 'CLX') {
                _.forEach(vm.attachmentFile.clx_file, function (currentItem, matterIdx) {
                    if (currentItem && (currentItem.id == cancelled.id)) {
                        vm.attachmentFile.clx_file.splice(matterIdx, 1);
                        _.forEach(vm.attachmentFile.clx_file, function (currentItem, index) {
                            vm.documentTags.push({ value: currentItem.doc_name, name: currentItem.doc_name + " " + currentItem.size, index: index, type: 'CLX', id: currentItem.id, from: currentItem.from });
                        });
                        if (vm.attachmentFile.file.length > 0) {
                            _.forEach(vm.attachmentFile.file, function (currentItem, index) {
                                vm.documentTags.push({ value: currentItem.name, name: currentItem.name + " " + currentItem.size, index: index, type: 'Local', id: Math.random() });
                            });
                        }

                    }
                })
            }
            if (cancelled.type == 'Local') {
                _.forEach(vm.attachmentFile.file, function (currentItem, matterIdx) {
                    if (currentItem && currentItem.name == cancelled.value) {
                        vm.attachmentFile.file.splice(matterIdx, 1);
                        if (vm.attachmentFile.clx_file.length > 0) {
                            _.forEach(vm.attachmentFile.clx_file, function (currentItem, index) {
                                vm.documentTags.push({ value: currentItem.doc_name, name: currentItem.doc_name + " " + currentItem.size, index: index, type: 'CLX', id: currentItem.id, from: currentItem.from });
                            });
                        }
                        _.forEach(vm.attachmentFile.file, function (currentItem, index) {
                            vm.documentTags.push({ value: currentItem.name, name: currentItem.name + " " + currentItem.size, index: index, type: 'Local', id: Math.random() });
                        });
                    }
                })
            }
        }

        // ///////////////////////////
        vm.upload = function (files) {
            if ($rootScope.isUsertSmsActive == 0) {
                notificationService.error('You do not have permission to send Messages. Please contact your SMP/Administrator.');
                return;
            }
            if (files) {
                var checkSize = mailboxHelper.getSize(files);
                if (checkSize) {
                    notificationService.error("Cannot upload 0kb file");
                }
                var array = [];
                files.slice(0).forEach(function (file) {
                    if (file.size > 3500000) {
                        array.push(file.name);
                        files.splice(files.indexOf(file), 1);
                    }
                })
                if (array.length > 0) {
                    notificationService.error("The MMS size of " + array.toString() + " files exceed 3.15 MB");
                }

                if (files.length > 0) {
                    _.forEach(files, function (item) {
                        vm.attachmentFile.file.push(item);
                    });
                    vm.attachmentFile.file = _.uniq(vm.attachmentFile.file, 'name');
                    vm.documentTags = _.filter(vm.documentTags, function (list) {
                        return list.type == 'CLX';
                    })
                    _.forEach(vm.attachmentFile.file, function (currentItem, index) {
                        vm.documentTags.push({ value: currentItem.name, name: currentItem.name + " " + currentItem.size, index: index, type: 'Local', id: Math.random() });
                    });
                    vm.documentTags = _.uniq(vm.documentTags, 'id');
                }
            }
        }
        var modalInstance
        vm.close = function () {
            modalInstance.close();
        }
        vm.openDocList = function () {
            vm.docModel = {
                matterid: '',
                intakeId: ''
            }
            vm.getMatterDocList = [];
            vm.getIntakeDocList = [];
            vm.clxGridOptions.selectedItemsForIntake = [];
            vm.clxGridOptions.selectedItems = [];
            vm.searchDocs = '';
            vm.selectedMode = $rootScope.onMatter || $rootScope.onLauncher ? '0' : '1';
            modalInstance = $modal.open({
                templateUrl: 'app/newSidebar/clx-documents.html',
                scope: $scope,
                windowClass: 'modalXLargeDialog',
                backdrop: 'static',
                keyboard: false,
            });

            modalInstance.result.then(function (resp) {

            }, function (error) {
            });
        }

        vm.twoWayMsgClick = function () {

            resetSMSPage();
            getAllSMSThreadFn();
            blockHideAndShow(false, false, false, false, true, false, false);
        };

        vm.addGroupChat = function () {
            //Post
            if (((vm.listSelectedDropdown == 'Post' || vm.listSelectedDropdown == 'Following Post'))) {
                vm.allPosts(1);
                vm.blockHideAndShow(false, false, true, false, false, false, false);
            }

            // Message
            if (vm.listSelectedDropdown == 'External') {
                // ng-if="!onIntake && false"
                vm.resetExtMessagePage();
                vm.blockHideAndShow(false, false, false, false, false, true, false);

            }

            //Two Way Text
            if (vm.listSelectedDropdown == 'Text Message') {
                vm.smsCountCheck();
            }
        }

        $rootScope.$on('updateMsgCount', function (event, args) {
            // call message notification count function on loading script
            getMessageNotificationCount();
        });

        /**
         * get message notification count
         */
        function getMessageNotificationCount() {
            newSidebarDataLayer.getNotificationCount()
                .then(function (success) {
                    vm.messageCount = success.data.msg_count;
                }, function (error) {
                    notificationService.error("message notification count failed");
                });
        }

        /* resetCallbackHelper.setCallback(function () {
             $scope.$apply(function () {
                 vm.init();
                 getAllPost();
             })
         }); */

        function resetPage() {
            vm.init();
            vm.clientCumEnable = true;
            vm.listSelectedDropdownFirmPost = true;
            vm.clientCumDisable = false;
            blockHideAndShow(true, false, false, false, false, false, false);
            resetSMSPage();
            resetExtMessagePage();
            vm.leftSidePanelFlag = true;
            vm.listSelectedDropdown = "Post";
        }


        function singleEvent(post) {
            if (angular.isDefined(post) && angular.isDefined(post.comments) && angular.isDefined(post.comments) && post.comments.length != '') {
                vm.displaySingleCommentFlag = true;
            }
            vm.displayData.push(post);
            vm.displayData = _.uniq(vm.displayData, function (item, key, a) {
                return item.nid
            });
        }

        function convert(posts) {
            if (vm.filters.pageNum === 1) {
                vm.displayData = [];
            }

            _.forEach(posts, function (post) {
                singleEvent(post);
            });
            //clear selected post to edit
            vm.postToEdit = {};
        }

        //function to go on sepecific matter 
        function goToMatter(matterId) {
            $state.go('add-overview', { matterId: matterId }, { reload: true });
        }

        function getConfigurableData() {
            var response = practiceAndBillingDataLayer.getPackageSubscripDetails();
            response.then(function (data) {
                vm.applicationsInfo = data;
                if (localStorage.getItem('fromNotificationIconToTxt') == 'true') {
                    vm.twoWayMsgClick();
                } else {
                    getAllPost();
                }
                localStorage.setItem('fromNotificationIconToTxt', false);
                if (vm.applicationsInfo && vm.applicationsInfo.sms) {
                    vm.applicationsInfo.sms.total_sms_count = parseInt(vm.applicationsInfo.sms.total_sms_count);
                    vm.applicationsInfo.sms.max_sms_count = parseInt(vm.applicationsInfo.sms.max_sms_count);
                }
            });
        }

        function getAllPost() {
            vm.loaderFlag = false;
            vm.showPostFromDataFlag = false;
            vm.moreFlag = false;

            if (!(angular.isUndefined(vm.matterIdForPostMoreLink) || utils.isEmptyString(vm.matterIdForPostMoreLink))) {
                vm.filters['matterID'] = vm.matterIdForPostMoreLink;
            }

            var filterObj = newSidebarHelper.getFiltersObj(vm.filters);
            var notificationComingFlag = JSON.parse(sessionStorage.getItem('fromNotification'));
            if (notificationComingFlag) {
                var notificationObj = JSON.parse(localStorage.getItem('sideBarScrollPostId'));
                if (notificationObj == null) {

                } else {
                    filterObj['nid'] = notificationObj.nid;
                }
            }
            var promesa = newSidebarDataLayer.getAllPost(filterObj);
            promesa.then(function (posts) {

                convert(posts);
                if (posts.length >= 10) {
                    vm.moreFlag = true;
                    vm.displayDataFlag = true;
                    vm.displayNoDataFound = false;
                } else if ((posts.length > 0 && posts.length < 10) || (posts.length == 0 && vm.filters.pageNum > 1)) {
                    vm.moreFlag = false;
                    vm.displayDataFlag = true;
                    vm.displayNoDataFound = false;
                } else {
                    vm.displayDataFlag = false;
                    vm.displayNoDataFound = true;
                }
                vm.displayFollowingTabFlag = false;
                var fromNoticationcheck = sessionStorage.getItem('fromNotification');
                if (localStorage.getItem('sideBarScrollPostId') && fromNoticationcheck == "true") {
                } else if (vm.saveEditedPostFlag) {
                    selectedPost(vm.saveEditedPostFlagObj);
                    vm.saveEditedPostFlag = false;
                } else if (vm.filters.pageNum == 1) {
                    (posts.length > 0) ? selectedPost(posts[0]) : '';
                    if (sideBarScrollPost) {
                        sideBarScrollPost = null;
                        var container = $('#main-event'),
                            scrollTo = $('#' + posts[0].nid);
                        if (scrollTo.offset()) {
                            container.animate({
                                scrollTop: scrollTo.offset().top - $("#main-event").offset().top
                            }, 100);
                        }
                    }
                }
                var container = $('#main-event'),
                    scrollTo = $('#' + vm.displayDataSelected[0].nid);
                if (scrollTo.offset()) {
                    container.animate({
                        scrollTop: scrollTo.offset().top - $("#main-event").offset().top
                    }, 100);
                }
                vm.loaderFlag = true;
            });

        }

        function getFollowingPost() {
            vm.loaderFlag = false;
            vm.showPostFromDataFlag = false;
            vm.indexVal = -1;
            vm.moreFlag = false;
            if (!(angular.isUndefined(vm.matterIdForPostMoreLink) || utils.isEmptyString(vm.matterIdForPostMoreLink))) {
                vm.filters['matterID'] = vm.matterIdForPostMoreLink;
            }
            var filterObj = newSidebarHelper.getFiltersObj(vm.filters);
            var promesa = newSidebarDataLayer.getFollowingPost(filterObj);
            promesa.then(function (posts) {
                // var Arr = [];
                // _.forEach(response, function (data, index) {
                //     if (data.is_deleted == 1) {

                //     } else {
                //         Arr.push(data);
                //     }
                // })
                // var posts = Arr;
                convert(posts);
                if (posts.length >= 10) {
                    vm.moreFlag = true;
                    vm.displayDataFlag = true;
                    vm.displayNoDataFound = false;
                } else if ((posts.length > 0 && posts.length < 10) || (posts.length == 0 && vm.filters.pageNum > 1)) {
                    vm.moreFlag = false;
                    vm.displayDataFlag = true;
                    vm.displayNoDataFound = false;
                } else {
                    vm.displayDataFlag = false;
                    vm.displayNoDataFound = true;
                }
                if (vm.saveEditedPostFlag) {
                    vm.saveEditedPostFlag = false;
                    selectedPost(vm.saveEditedPostFlagObj);
                } else if (vm.filters.pageNum == 1) {
                    (posts.length > 0) ? selectedPost(posts[0]) : '';
                }
                vm.loaderFlag = true;
            });
        }


        //US#14854 : Note Sync Update
        vm.changeNotesSync = function (data) {
            var copyNote = {};
            if (data == true) {
                copyNote.noteSync = 1;
            } else if (data == false) {
                copyNote.noteSync = 0;
            }
            copyNote.threadId = angular.copy(vm.selectedSMSThread.threadId);
            newSidebarDataLayer.updateNotesSync(copyNote)
                .then(function (response) {
                    notificationService.success("Note updated successfully");
                    // getAllSMSThreadFn();
                }, function (error) {
                    notificationService.error("Unable to Update note");
                });
        }

        function displayMorePosts() {
            vm.filters.pageNum = vm.filters.pageNum + 1;
            if (vm.eventClick == 1) {
                getAllPost();
            } else {
                getFollowingPost();
            }
        };

        vm.form = {};
        vm.searchMatters = searchMatters;
        vm.formatTypeaheadDisplay = formatTypeaheadDisplay;
        vm.getTagAMatter = getTagAMatter;
        var matters = [];

        $scope.$watch(function () {
            return vm.getTagMatterId;
        }, function (newValue) {
            vm.matterid = '';
            /*if(angular.isUndefined(newValue) || utils.isEmptyString(newValue)){
                vm.matterid = '';
            }*/
        });

        function searchMatters(matterName) {
            return matterFactory.searchMatters(matterName)
                .then(function (response) {
                    if (response.data.length == 0) {
                        //vm.getTagMatterId = '';
                        vm.matterId = '';
                    }
                    matters = response.data;

                    return response.data;
                });
        }

        function formatTypeaheadDisplay(matterid) {
            if (angular.isUndefined(matterid) || utils.isEmptyString(matterid)) {
                return undefined;
            }
            var matterInfo = _.find(matters, function (matter) {
                return matter.matterid === matterid;
            });
            if (angular.isDefined(matterInfo) && angular.isDefined(matterInfo.matterid)) {
                vm.matterid = matterInfo.matterid;
            }
            getPlaintiffsForDocument(matterid);

            return utils.removeunwantedHTML(matterInfo.name) + '-' + matterInfo.filenumber;
        }






        function getTagAMatter() {
            vm.matterId = vm.getTagMatterId;
        }

        $scope.$watch(function () {
            return vm.showPostFromMatterid;
        }, function (newValue) {
            if (angular.isUndefined(newValue) || utils.isEmptyString(newValue)) {
                vm.matterIdForPostMoreLink = '';
                vm.filters['pageNum'] = 1;
                vm.filters['matterID'] = '';
                vm.matterIdForPostMoreLink = '';
                if (vm.listSelectedDropdown == 'Post') {
                    var notificationComingFlag = JSON.parse(sessionStorage.getItem('fromNotification'));
                    if (!notificationComingFlag) {
                        getAllPost();
                    }
                } else if (vm.listSelectedDropdown == 'Following Post') {
                    getFollowingPost();
                }
            }
        });

        vm.searchShowPostFrom = searchShowPostFrom;
        vm.typeAHeadShowPostFrom = typeAHeadShowPostFrom;
        vm.getSHowPostFrom = getSHowPostFrom;
        var mattersForSHowPostFrom = [];

        function searchShowPostFrom(matterName) {
            if ($rootScope.onMatter) {
                return matterFactory.searchMatters(matterName)
                    .then(function (response) {
                        _.forEach(response.data, function (item) {
                            item['temp_name'] = item.name;
                        });
                        mattersForSHowPostFrom = response.data;
                        return response.data;
                    });
            } else if ($rootScope.onIntake) {
                return intakeNotesDataService.getMatterList(matterName, 0)
                    .then(function (response) {
                        var data = response;
                        _.forEach(data, function (item) {
                            item['name'] = item.intakeName;
                            item['temp_name'] = item.intakeName;
                            item['matterid'] = item.intakeId;
                            item['is_intake_post'] = true;
                            item['created_date'] = item.dateIntake ? (item.dateIntake) : " ";
                        });
                        mattersForSHowPostFrom = data;
                        return data;
                    });
            } else if ($rootScope.onLauncher) {
                var q1 = getMatterListForPost(matterName);
                var q2 = getIntakeListForPost(matterName);
                return $q.all([q1, q2]).then(function (completeData) {
                    var data1 = completeData[0];
                    _.forEach(data1, function (item) {
                        item['created_date'] = " ";
                    });

                    var data2 = completeData[1];
                    _.forEach(data2, function (item) {
                        item['name'] = item.intakeName;
                        // item['temp_name'] = '<strong>Intake: </strong>' + item.intakeName;
                        item['matterid'] = item.intakeId;
                        item['is_intake_post'] = true;
                        item['created_date'] = item.dateIntake ? (item.dateIntake) : " ";
                    });
                    var finalArr = data1.concat(data2);
                    mattersForSHowPostFrom = finalArr;
                    return finalArr;
                });

            }

        }


        //
        function getMatterListForPost(matterName) {
            var defer = $q.defer();
            matterFactory.searchMatters(matterName)
                .then(function (response) {
                    defer.resolve(response.data);
                });
            return defer.promise;
        }

        function getIntakeListForPost(matterName) {
            var defer = $q.defer();
            intakeNotesDataService.getMatterList(matterName, 0)
                .then(function (response) {
                    var data = response;
                    _.forEach(data, function (item) {
                        item['name'] = item.intakeName;
                        item['matterid'] = item.intakeId;
                        item['is_intake_post'] = true;
                        item['createdDate'] = item.dateIntake;
                    });
                    defer.resolve(data);
                });
            return defer.promise;
        }
        //

        function typeAHeadShowPostFrom(matterid) {
            if (angular.isUndefined(matterid) || utils.isEmptyString(matterid)) {
                vm.matterIdForPostMoreLink = '';
                return undefined;
            }

            vm.matterIdForPostMoreLink = matterid;
            var matterInfo = _.find(mattersForSHowPostFrom, function (matter) {
                return matter.matterid === matterid;
            });
            if (angular.isDefined(matterInfo) && angular.isDefined(matterInfo.matterid)) {
                vm.showPostFromMatterid = matterInfo.matterid;
            }

            vm.filters['pageNum'] = 1;
            setTimeout(function () {
                if (vm.listSelectedDropdown == 'Post') {
                    getSHowPostFrom(matterInfo);
                } else if (vm.listSelectedDropdown == 'Following Post') {
                    newGetFollowingPost(matterInfo);
                }
            }, 50)

            if ($rootScope.onIntake) {
                return matterInfo.name + matterInfo.created_date;
            } else if ($rootScope.onLauncher) {
                return matterInfo.name + (angular.isDefined(matterInfo.filenumber) ? " - " + matterInfo.filenumber : matterInfo.created_date);
            }
            else {
                return matterInfo.name + " - " + matterInfo.filenumber;
            }
        }

        function getSHowPostFrom(data) {
            vm.loaderFlag = false;
            vm.showPostFromDataFlag = false;
            vm.showPostFromFilter.matterID = vm.showPostFromMatterid;

            if (!(angular.isUndefined(vm.matterIdForPostMoreLink) || utils.isEmptyString(vm.matterIdForPostMoreLink))) {
                vm.showPostFromFilter.matterID = vm.matterIdForPostMoreLink;
            }

            if ($rootScope.onMatter) {
                vm.showPostFromFilter.is_intake = '0';
            } else if ($rootScope.onIntake) {
                vm.showPostFromFilter.is_intake = '1';
            } else if ($rootScope.onLauncher) {
                vm.showPostFromFilter.is_intake = data.is_intake_post ? '1' : '0';
            }

            var filterObj = newSidebarHelper.getShowPostFromObj(vm.showPostFromFilter);
            filterObj['pageNum'] = vm.filters.pageNum;
            var promesa = newSidebarDataLayer.getAllPost(filterObj);
            promesa.then(function (posts) {
                vm.displayData = [];
                vm.moreFlag = false;
                // var Arr = [];
                // _.forEach(response, function (data, index) {
                //     if (data.is_deleted == 1) {

                //     } else {
                //         Arr.push(data);
                //     }
                // })
                // var posts = Arr;
                convert(posts);
                if (posts.length >= 10) {
                    vm.moreFlag = true;
                    vm.displayDataFlag = true;
                    vm.displayNoDataFound = false;
                    vm.showPostFromDataFlag = false;
                } else if (posts.length > 0 && posts.length < 10) {
                    vm.moreFlag = false;
                    vm.displayDataFlag = true;
                    vm.displayNoDataFound = false;
                    vm.showPostFromDataFlag = false;
                } else {
                    vm.displayDataFlag = false;
                    vm.displayNoDataFound = true;
                    vm.showPostFromDataFlag = true;
                }
                selectedPost(posts[0]);
                vm.loaderFlag = true;
            });

        }


        function newGetFollowingPost(data) {
            vm.loaderFlag = false;
            vm.showPostFromDataFlag = false;
            vm.showPostFromFilter.matterID = vm.showPostFromMatterid;

            if (!(angular.isUndefined(vm.matterIdForPostMoreLink) || utils.isEmptyString(vm.matterIdForPostMoreLink))) {
                vm.showPostFromFilter.matterID = vm.matterIdForPostMoreLink;
            }

            if ($rootScope.onMatter) {
                vm.showPostFromFilter.is_intake = '0';
            } else if ($rootScope.onIntake) {
                vm.showPostFromFilter.is_intake = '1';
            } else if ($rootScope.onLauncher) {
                vm.showPostFromFilter.is_intake = data.is_intake_post ? '1' : '0';
            }

            var filterObj = newSidebarHelper.getShowPostFromObj(vm.showPostFromFilter);
            var promesa = newSidebarDataLayer.getFollowingPost(filterObj);
            promesa.then(function (posts) {

                convert(posts);
                if (posts.length >= 10) {
                    vm.moreFlag = true;
                    vm.displayDataFlag = true;
                    vm.displayNoDataFound = false;
                } else if ((posts.length > 0 && posts.length < 10) || (posts.length == 0 && vm.filters.pageNum > 1)) {
                    vm.moreFlag = false;
                    vm.displayDataFlag = true;
                    vm.displayNoDataFound = false;
                } else {
                    vm.displayDataFlag = false;
                    vm.displayNoDataFound = true;
                }
                selectedPost(posts[0]);
                vm.loaderFlag = true;
            });
        }

        function allPosts(param) {
            vm.unseenMsgCount = "";
            vm.showPostFromMatterid = '';
            vm.filters.pageNum = 1;
            vm.displayData = [];
            vm.allPostClick = param;
            vm.followingClick = 1;
            vm.clientClick = 1;
            vm.eventClick = param;
            vm.followingFlag = true;
            vm.displayFollowingTabFlag = false;
            vm.showPostFromMatterid = '';
            vm.displayAllCommentsFollowingTabFlag = false;
            vm.addCommentFlag = false;
            vm.matterIdForPostMoreLink = '';
            getAllPost();
        }

        function following(param) {
            vm.unseenMsgCount = "";
            vm.listSelectedDropdown = 'Following Post';
            vm.showPostFromMatterid = '';
            vm.filters.pageNum = 1;
            vm.displayData = [];
            vm.followingClick = param;
            vm.allPostClick = 1;
            vm.clientClick = 1;
            vm.eventClick = param;
            vm.displayFollowingTabFlag = true;
            vm.followingFlag = false;
            vm.displayAllCommentsFollowingTabFlag = false;
            vm.addCommentFlag = false;
            vm.displayAllCommentsPostId = '';
            vm.matterIdForPostMoreLink = '';
            getFollowingPost();
        }

        /**
         * Enable client communication tab
         */
        function clientCommunication(param) {
            vm.clientClick = param;
            vm.followingClick = 1;
            vm.allPostClick = 1;
            vm.eventClick = param;
            resetSMSPage();
            blockHideAndShow(false, false, false, false, false, false, true);
        }

        function followPost(postId, index) {
            vm.filters.pageNum = 1;
            vm.followData.post_id = postId;
            vm.followData.follow = "Follow";
            var promesa = newSidebarDataLayer.postFollow(vm.followData);
            promesa.then(function (follow) {
                vm.followPostIndex = index;
                vm.displayDataSelected[index].user_following = "following";
                // vm.displayData[index].user_following = "following";
                /* vm.displayData = [];
                 getAllPost();*/
            });
        };

        function unFollowPost(postId, index) {

            vm.filters.pageNum = 1;
            vm.followData.post_id = postId;
            vm.followData.follow = "Unfollow";
            var promesa = newSidebarDataLayer.postFollow(vm.followData);
            promesa.then(function (follow) {
                //vm.displayData = [];
                if (vm.eventClick == 1) {
                    vm.followPostIndex = index;
                    vm.displayDataSelected[index].user_following = "unfollowing";
                    // vm.displayData[index].user_following = "unfollowing";
                    // getAllPost();
                } else {
                    // vm.displayData.splice(index, 1);
                    vm.displayDataSelected.splice(index, 1);
                    vm.followingFlag = false;
                    getFollowingPost();
                }
            });
        };

        function commentButtonClick(postId) {
            vm.newCommentText = '';
            vm.addCommentFlag = true;
            vm.addCommentPostId = postId;
        };

        function cancelComment() {
            vm.newCommentText = '';
            vm.addCommentFlag = false;
        };

        function saveComment(postId, index) {
            vm.addCommentData.post_id = postId;
            vm.addCommentData.comment = vm.newCommentText;
            var promesa = newSidebarDataLayer.addComment(vm.addCommentData);
            promesa.then(function (posts) {
                vm.addCommentFlag = false;
                vm.displayDataSelected[index].comments = posts.data;
                // vm.displayData[index].comments = posts.data;
                vm.newCommentText = '';
            });
        };

        function deleteComment(postId, commentId, index) {
            var promesa = newSidebarDataLayer.deleteComment(commentId);
            promesa.then(function (response) {
                if (angular.isDefined(response) && angular.isDefined(response.data) && response.data[0] == "Deleted") {
                    // var originalDisplayData = vm.displayData;
                    var originalDisplayData = vm.displayDataSelected;

                    var newDisplayData = [];
                    _.forEach(originalDisplayData, function (data) {
                        if (angular.isDefined(data) && angular.isDefined(data.comments)) {
                            _.forEach(data.comments, function (comment) {

                                if (angular.isDefined(comment) && angular.isDefined(comment.cid) && (comment.cid === commentId)) {
                                    data.comments.splice(index, 1);
                                }
                            });

                        }
                        newDisplayData.push(data);
                    });
                    // vm.displayData = newDisplayData;
                    vm.displayDataSelected = newDisplayData;
                }

            });

        }

        function displayAllComments(id, index) {

            vm.indexVal = index;
            vm.displayAllCommentsFollowingTabFlag = true;
            vm.displayAllCommentsPostId = id;
        };

        function postMessage() {
            if (vm.postMessageText.trim() != '' && vm.postMessageText != '') {
                var tagMatterId = vm.getTagMatterId;
                vm.postData.matterId = vm.matterid;
                vm.postData.status = vm.postMessageText;

                if ($rootScope.onLauncher) {
                    vm.postData.is_intake = vm.selectedModeForSidebar;
                } else {
                    vm.postData.is_intake = vm.is_intake_flag;
                }

                if (vm.selectedModeForSidebar == '1' || $rootScope.onIntake) {
                    vm.postData.matterId = vm.getTagIntakeId.intakeId ? vm.getTagIntakeId.intakeId.toString() : null;
                }

                if (vm.postData.matterId == null) {
                    vm.postData.is_intake = null;
                }

                var promesa = newSidebarDataLayer.postCommentPost(vm.postData);
                promesa.then(function (posts) {
                    vm.matterid = '';
                    vm.postMessageText = '';
                    vm.displayData = [];
                    if (vm.eventClick == 1) {
                        getAllPost();
                    } else {
                        vm.followingFlag = false;
                        getFollowingPost();
                    }
                    blockHideAndShow(true, false, false, false, false, false, false);
                    vm.listSelectedDropdown = 'Post';
                    vm.listSelectedDropdownFirmPost = true;
                });
                vm.matterid = '';
                vm.getTagMatterId = '';
            } else {
                notificationService.error('Please Enter any message to Post');
            }
        };

        function editPost(post, $event) {
            $event.stopPropagation();
            vm.postToEdit = angular.copy(post);
        }


        function saveEditedPost(newPost, $event) {
            $event.stopPropagation();
            var postMsg = { msg: newPost.body_value };
            newSidebarDataLayer.editPost(newPost.nid, postMsg)
                .then(function (res) {
                    notificationService.success("Post edited successfully.");
                    vm.filters.pageNum = 1;
                    vm.saveEditedPostFlag = true;
                    vm.saveEditedPostFlagObj = newPost;
                    if (sideBarScrollPost && sideBarScrollPost.nid == newPost.nid) {
                        vm.saveEditedPostFlag = false;
                    }
                    if (vm.eventClick == 1) {
                        getAllPost();
                    } else {
                        vm.followingFlag = false;
                        getFollowingPost();
                    }
                }, function () { notificationService.error("Unable to edit post."); });
        }

        function cancelEdit($event) {
            $event.stopPropagation();
            vm.postToEdit = {};
        }

        function deletePost(post, $event) {
            $event.stopPropagation();
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {
                newSidebarDataLayer.deletePost(post.nid)
                    .then(function (res) {
                        notificationService.success("Post deleted successfully.");
                        vm.filters.pageNum = 1;
                        if (vm.eventClick == 1) {
                            getAllPost();
                        } else {
                            vm.followingFlag = false;
                            getFollowingPost();
                        }
                    }, function () { notificationService.error("Unable to delete post.") })
            });
        }

        function showEditDelete(post) {
            if (angular.isUndefined(post)) {
                return false;
            }
            var role = masterData.getUserRole() || {};
            return post.uid == role.uid;
        }

        function getNotificationMessageCountData() {
            if (angular.isDefined($rootScope.isPortalEnabled) && $rootScope.isPortalEnabled) {
                notificationDatalayer.getNewMessageList()
                    .then(function (res) {
                        vm.messageCount = utils.isNotEmptyVal(res.TotalCount) ? res.TotalCount : 0;
                        $rootScope.$emit('messageNotificationCount', vm.messageCount);
                    })
            }
        }

        $rootScope.$on('messageNotificationCount', function (event, data) {
            vm.messageCount = data;
        });

        vm.init();

        function blockHideAndShow(clientCumEnable, clientCumDisable, firmPost, externalMsg, sms, externalMsgAddForm, smsAddForm) {
            // if (sms) {
            //     if ($rootScope.isUsertSmsActive == 0) {
            //         notificationService.error('You do not have access to this application. Please contact your SMP/Administrator to get access.');
            //         return;
            //     }
            // }

            vm.clientCumEnable = clientCumEnable;
            vm.clientCumDisable = clientCumDisable;
            vm.firmPost = firmPost;
            vm.externalMsg = externalMsg;
            vm.sms = sms;
            vm.externalMsgAddForm = externalMsgAddForm;
            vm.smsAddForm = smsAddForm;

            if (vm.externalMsg) {
                vm.listSelectedDropdown = 'External'
            }
            if (vm.sms) {
                vm.listSelectedDropdown = 'Text Message';
                vm.filtersForSMS = {
                    pageNum: 1,
                    pageSize: 30
                }
                scrollUpForSMS();
            }

            if (vm.firmPost || vm.smsAddForm || vm.externalMsgAddForm) {
                vm.leftSidePanelFlag = false;
            } else {
                vm.leftSidePanelFlag = true;
            }

            //Reset Field
            vm.postMessageText = '';
            vm.getTagMatterId = '';
            vm.getTagIntakeId = '';
            vm.ext_msg_matter_id = '';
            vm.ext_msg_contact_id = [];
            // vm.sendExtMessage = '';

        }


        /**
         * Start:  SMS
         */
        vm.searchMattersForSMS = searchMattersForSMS;
        vm.matters_for_sms = [];
        vm.sms_contact_list = [];
        var intakeListForSMS = [];
        vm.sms_contact_id = [];
        vm.sms_contact_id_compare = [];
        vm.contactNameForSMS = '';
        vm.scrollUpForSMS = scrollUpForSMS;
        vm.filtersForSMS = {
            pageNum: 1,
            pageSize: 30
        }


        function resetSMSPage() {
            // if ($rootScope.isUsertSmsActive == 0) {
            //     // notificationService.error('You do not have access to this application. Please contact your SMP/Administrator to get access.');
            //     return;
            // }
            vm.unseenMsgCount = 0;
            vm.getMatterIdForSMS = '';
            vm.sms_contact_list = [];
            vm.sms_contact_id = [];
            vm.sms_contact_id_compare = [];
            vm.sendMessageForSMS = '';
            vm.sendOnlySMS = '';
            intakeListForSMS = [];
            vm.matters_for_sms = [];
            vm.contactNameForSMS = '';
            vm.contactIdForSMSMoreLink = '';
            vm.filtersForSMS = {
                pageNum: 1,
                pageSize: 30
            };
        };

        function searchMattersForSMS(matterName) {
            vm.matters_for_sms = [];
            return matterFactory.searchMatters(matterName)
                .then(function (response) {
                    if (response.data.length == 0) {
                        vm.getMatterIdForSMS = '';
                    }
                    vm.matters_for_sms = response.data;
                    return response.data;
                });
        }

        vm.formatTypeaheadDisplayForSMS = function (matterid) {
            if (angular.isUndefined(matterid) || utils.isEmptyString(matterid)) {
                vm.sms_contact_id = [];
                vm.sms_contact_list = [];
                return undefined;
            }
            var matterInfo = _.find(vm.matters_for_sms, function (matter) {
                return matter.matterid === matterid;
            });
            if (angular.isDefined(matterInfo) && angular.isDefined(matterInfo.matterId)) {
                vm.getMatterIdForSMS = matterInfo.matterId;
            }
            vm.sms_contact_id = [];
            vm.sms_contact_list = [];

            // if (typeof matterid === 'number') {
            getContactsAndEmails(matterid);
            // }   
            return matterInfo.name + ' - ' + matterInfo.filenumber;
        }

        vm.getContactsAndEmails = getContactsAndEmails;
        function getContactsAndEmails(matterId) {
            vm.sms_contact_list = [];
            if (angular.isUndefined(matterId)) {
                return;
            }
            var emails = newSidebarDataLayer.getContactsAndEmails(matterId).then(function (data) {
                var contactObj = angular.copy(data);

                // plaintiff
                if (contactObj && contactObj.plaintiff != undefined) {
                    _.forEach(contactObj.plaintiff, function (item) {
                        var contact = addContactObj(item);
                        vm.sms_contact_list.push(contact);
                    });
                }

                //PoA and Estate Admin
                var tempPlaintiffArray = contactObj && contactObj.plaintiff ? contactObj.plaintiff : '';
                if (utils.isNotEmptyVal(tempPlaintiffArray)) {
                    _.forEach(tempPlaintiffArray, function (item) {
                        if (item.isinfant == '1' && utils.isNotEmptyVal(item.guardianid)) {
                            var contact = addContactObj(item.guardianid);
                            vm.sms_contact_list.push(contact);
                        }
                        if (utils.isNotEmptyVal(item.estateadminid)) {
                            var contact = addContactObj(item.estateadminid);
                            vm.sms_contact_list.push(contact);
                        }
                    });
                }

                // defendant
                if (contactObj && contactObj.defendant != undefined) {
                    _.forEach(contactObj.defendant, function (item) {
                        var contact = addContactObj(item);
                        vm.sms_contact_list.push(contact);
                    });
                }

                // insurance_provider: []
                if (contactObj && contactObj.insurance_provider != undefined) {
                    _.forEach(contactObj.insurance_provider, function (item) {
                        var contact = addContactObj(item);
                        vm.sms_contact_list.push(contact);
                    });
                }

                // insured_party: []
                if (contactObj && contactObj.insured_party != undefined) {
                    _.forEach(contactObj.insured_party, function (item) {
                        var contact = addContactObj(item);
                        vm.sms_contact_list.push(contact);
                    });
                }

                // medicalbills_service_provider: []
                if (contactObj && contactObj.medicalbills_service_provider != undefined) {
                    _.forEach(contactObj.medicalbills_service_provider, function (item) {
                        var contact = addContactObj(item);
                        vm.sms_contact_list.push(contact);
                    });
                }

                // oparty: []
                if (contactObj && contactObj.oparty != undefined) {
                    _.forEach(contactObj.oparty, function (item) {
                        var contact = addContactObj(item);
                        vm.sms_contact_list.push(contact);
                    });
                }

                // insurance_adjuster: []
                if (contactObj && contactObj.insurance_adjuster != undefined) {
                    _.forEach(contactObj.insurance_adjuster, function (item) {
                        var contact = addContactObj(item);
                        vm.sms_contact_list.push(contact);
                    });
                }

                // lien_insurance_provider: []
                if (contactObj && contactObj.lien_insurance_provider != undefined) {
                    _.forEach(contactObj.lien_insurance_provider, function (item) {
                        var contact = addContactObj(item);
                        vm.sms_contact_list.push(contact);
                    });
                }

                // lien_adjuster: []
                if (contactObj && contactObj.lien_adjuster != undefined) {
                    _.forEach(contactObj.lien_adjuster, function (item) {
                        var contact = addContactObj(item);
                        vm.sms_contact_list.push(contact);
                    });
                }

                // lien_holder: []
                if (contactObj && contactObj.lien_holder != undefined) {
                    _.forEach(contactObj.lien_holder, function (item) {
                        var contact = addContactObj(item);
                        vm.sms_contact_list.push(contact);
                    });
                }

                // physician: []
                if (contactObj && contactObj.physician != undefined) {
                    _.forEach(contactObj.physician, function (item) {
                        var contact = addContactObj(item);
                        vm.sms_contact_list.push(contact);
                    });
                }

                // service_provider: []
                if (contactObj && contactObj.service_provider != undefined) {
                    _.forEach(contactObj.service_provider, function (item) {
                        var contact = addContactObj(item);
                        vm.sms_contact_list.push(contact);
                    });
                }


                vm.sms_contact_list = _.uniq(vm.sms_contact_list, function (item) {
                    return item.contactid;
                });

                $scope.$broadcast('sms_contact_list', vm.sms_contact_list);

            }, function () {
            });

        }

        function addContactObj(item) {
            var fname = item.fname ? item.fname : "";
            var mname = item.mname ? item.mname : "";
            var lname = item.lname ? item.lname : "";
            var fullname = fname + " " + mname + " " + lname;

            var contact = {
                name: fullname,
                email: item.email ? item.email : item.emailid,
                contactid: parseInt(item.contactid),
                type: item.type
            }

            return contact;

        }

        vm.getIntakeListForSMS = function (contactName, migrate) {
            intakeListForSMS = [];
            return intakeNotesDataService.getMatterList(contactName, migrate)
                .then(function (response) {
                    if (response == 0) {
                        vm.getMatterIdForSMS = '';
                    }
                    intakeListForSMS = response;
                    return response;
                });

        };

        vm.intakeDataList = [];
        vm.formatTypeaheadDisplayForIntakeForSMS = function (intakeId) {
            if (angular.isUndefined(intakeId) || utils.isEmptyString(intakeId)) {
                vm.sms_contact_id = [];
                vm.sms_contact_list = [];
                return undefined;
            }
            var intakeInfo = _.find(intakeListForSMS, function (intake) {
                return intake.intakeId == intakeId;
            });
            vm.intakeDataList = intakeInfo;
            vm.type = vm.intakeDataList.intakeType.intakeTypeId;
            vm.subtype = vm.intakeDataList.intakeSubType.intakeSubTypeId;

            vm.sms_contact_id = [];
            vm.sms_contact_list = [];
            getPlaintiffForSMSIntake(intakeId);
            return utils.removeunwantedHTML(intakeInfo.intakeName) + intakeInfo.dateIntake;
        }


        function getPlaintiffForSMSIntake(intakeId) {
            vm.sms_contact_list = [];
            if (angular.isUndefined(intakeId)) {
                return;
            }
            intakeFactory.getPlaintiffByIntake(intakeId)
                .then(function (response) {
                    if (utils.isNotEmptyString(response)) {
                        var data = response[0].contact;
                        intakeFactory.getOtherDetails(intakeId)
                            .then(function (res) {

                                var otherDetailsInfo = utils.isNotEmptyVal(res) ? JSON.parse(res[0].detailsJson) : null;
                                var data1 = [];

                                if (otherDetailsInfo) {
                                    _.forEach(otherDetailsInfo, function (currentItem) {
                                        if ((vm.type == 1 && vm.subtype == 1) || (vm.type == 1 && vm.subtype == 2)) {
                                            if (utils.isNotEmptyVal(currentItem.mvaTreatment.hospPhysicianId) && currentItem.mvaTreatment.hospPhysicianId != undefined) {
                                                var dataMvaTreatment = currentItem.mvaTreatment.hospPhysicianId;
                                                var fname = dataMvaTreatment.first_name ? dataMvaTreatment.first_name : "";
                                                var lname = dataMvaTreatment.last_name ? dataMvaTreatment.last_name : "";
                                                var fullname = fname + " " + lname;
                                                var obj = {
                                                    'contactid': dataMvaTreatment.contact_id,
                                                    'name': fullname
                                                }
                                                data1.push(obj)
                                            }
                                        }
                                        if ((vm.type == 1 && vm.subtype == 1)) {
                                            if (utils.isNotEmptyVal(currentItem.automobileOtherDetails) && utils.isNotEmptyVal(currentItem.automobileOtherDetails.insuredParty) && currentItem.automobileOtherDetails.insuredParty != undefined) {
                                                var dataAutoOtherDetails = currentItem.automobileOtherDetails.insuredParty;
                                                var fname = dataAutoOtherDetails.first_name ? dataAutoOtherDetails.first_name : "";
                                                var lname = dataAutoOtherDetails.last_name ? dataAutoOtherDetails.last_name : "";
                                                var fullname = fname + " " + lname;
                                                var obj = {
                                                    'contactid': dataAutoOtherDetails.contact_id,
                                                    'name': fullname
                                                }
                                                data1.push(obj)
                                            }
                                        }
                                        // (vm.type == 1 && vm.subtype == 1) || 
                                        if ((vm.type == 2)) {
                                            if (utils.isNotEmptyVal(currentItem.MedMal) && utils.isNotEmptyVal(currentItem.MedMal.insuranceProviderId) && currentItem.MedMal.insuranceProviderId != undefined) {
                                                var dataMedMal = currentItem.MedMal.insuranceProviderId;
                                                var fname = dataMedMal.first_name ? dataMedMal.first_name : "";
                                                var lname = dataMedMal.last_name ? dataMedMal.last_name : "";
                                                var fullname = fname + " " + lname;
                                                var obj = {
                                                    'contactid': parseInt(dataMedMal.contact_id),
                                                    'name': fullname
                                                }
                                                data1.push(obj)
                                            }
                                        }


                                        // if ((vm.type == 1 && vm.subtype == 4)) {
                                        if ((vm.type == 1 && vm.subtype == 1) || (vm.type == 1 && vm.subtype == 2) || (vm.type == 2)) {


                                        } else {
                                            //Hospital
                                            if (utils.isNotEmptyVal(currentItem.details) && utils.isNotEmptyVal(currentItem.details.hospital) && currentItem.details.hospital != undefined) {
                                                var dataHospitalDetails = currentItem.details.hospital;
                                                var fname = dataHospitalDetails.first_name ? dataHospitalDetails.first_name : "";
                                                var lname = dataHospitalDetails.last_name ? dataHospitalDetails.last_name : "";
                                                var fullname = fname + " " + lname;
                                                var obj = {
                                                    'contactid': dataHospitalDetails.contact_id,
                                                    'name': fullname
                                                }
                                                data1.push(obj)
                                            }
                                            //physician
                                            if (utils.isNotEmptyVal(currentItem.details) && utils.isNotEmptyVal(currentItem.details.physician) && currentItem.details.physician != undefined) {
                                                var dataPhysicianDetails = currentItem.details.physician;
                                                var fname = dataPhysicianDetails.first_name ? dataPhysicianDetails.first_name : "";
                                                var lname = dataPhysicianDetails.last_name ? dataPhysicianDetails.last_name : "";
                                                var fullname = fname + " " + lname;
                                                var obj = {
                                                    'contactid': dataPhysicianDetails.contact_id,
                                                    'name': fullname
                                                }
                                                data1.push(obj)
                                            }
                                            if (utils.isNotEmptyVal(currentItem.details) && utils.isNotEmptyVal(currentItem.details.witnessNameListForDetails) && currentItem.details.witnessNameListForDetails != undefined) {
                                                _.forEach(currentItem.details.witnessNameListForDetails, function (item, index) {
                                                    var datawitnessNameListDetails = item.name;
                                                    var fname = datawitnessNameListDetails.first_name ? datawitnessNameListDetails.first_name : "";
                                                    var lname = datawitnessNameListDetails.last_name ? datawitnessNameListDetails.last_name : "";
                                                    var fullname = fname + " " + lname;
                                                    var obj = {
                                                        'contactid': datawitnessNameListDetails.contact_id,
                                                        'name': fullname
                                                    }
                                                    data1.push(obj)
                                                });

                                            }
                                        }



                                    });
                                }
                                //automobileOtherDetails



                                var fname = data.firstName ? data.firstName : "";
                                var lname = data.lastName ? data.lastName : "";
                                var fullname = fname + " " + lname;
                                var obj = {
                                    'contactid': data.contactId,
                                    'name': fullname
                                }
                                data1.push(obj)
                                //Employer contacts
                                // if ((vm.type == 1 && vm.subtype == 1) || (vm.type == 1 && vm.subtype == 4) || (vm.type == 2) ){
                                if (utils.isNotEmptyVal(response[0].intakeEmployer) && response[0].intakeEmployer != undefined) {
                                    _.forEach(response[0].intakeEmployer, function (item, index) {
                                        var dataEmployee = item.contact;
                                        var fname = dataEmployee.firstName ? dataEmployee.firstName : "";
                                        var lname = dataEmployee.lastName ? dataEmployee.lastName : "";
                                        var fullname = fname + " " + lname;
                                        var obj = {
                                            'contactid': dataEmployee.contactId,
                                            'name': fullname
                                        }
                                        data1.push(obj)
                                    })
                                }
                                //poaContact
                                if (utils.isNotEmptyVal(response[0].poa) && response[0].poa != undefined) {
                                    var dataPoa = response[0].poa;
                                    var fname = dataPoa.firstName ? dataPoa.firstName : "";
                                    var lname = dataPoa.lastName ? dataPoa.lastName : "";
                                    var fullname = fname + " " + lname;
                                    var obj = {
                                        'contactid': dataPoa.contactId,
                                        'name': fullname
                                    }
                                    data1.push(obj)
                                }
                                // estateAdminIdContact
                                if (utils.isNotEmptyVal(response[0].estateAdminId) && response[0].estateAdminId != undefined) {
                                    var dataEstateAdmin = response[0].estateAdminId;
                                    var fname = dataEstateAdmin.firstName ? dataEstateAdmin.firstName : "";
                                    var lname = dataEstateAdmin.lastName ? dataEstateAdmin.lastName : "";
                                    var fullname = fname + " " + lname;
                                    var obj = {
                                        'contactid': dataEstateAdmin.contactId,
                                        'name': fullname
                                    }
                                    data1.push(obj)
                                }
                                //EducationContact
                                if (utils.isNotEmptyVal(response[0].studentInstitution) && response[0].studentInstitution != undefined) {
                                    var dataEducation = response[0].studentInstitution;
                                    var fname = dataEducation.firstName ? dataEducation.firstName : "";
                                    var lname = dataEducation.lastName ? dataEducation.lastName : "";
                                    var fullname = fname + " " + lname;
                                    var obj = {
                                        'contactid': dataEducation.contactId,
                                        'name': fullname
                                    }
                                    data1.push(obj)
                                }
                                // Hospital
                                if (utils.isNotEmptyVal(response[0].studentInstitution) && response[0].studentInstitution != undefined) {
                                    var dataEducation = response[0].studentInstitution;
                                    var fname = dataEducation.firstName ? dataEducation.firstName : "";
                                    var lname = dataEducation.lastName ? dataEducation.lastName : "";
                                    var fullname = fname + " " + lname;
                                    var obj = {
                                        'contactid': dataEducation.contactId,
                                        'name': fullname
                                    }
                                    data1.push(obj)
                                }




                                // }
                                if ((vm.type == 1 && vm.subtype == 1) || (vm.type == 1 && vm.subtype == 2)) {
                                    //WitnessesContact
                                    if (utils.isNotEmptyVal(response[0].intakeWitnesses) && response[0].intakeWitnesses != undefined) {
                                        _.forEach(response[0].intakeWitnesses, function (item, index) {
                                            var dataWitnessContact = item.contact;
                                            var fname = dataWitnessContact.firstName ? dataWitnessContact.firstName : "";
                                            var lname = dataWitnessContact.lastName ? dataWitnessContact.lastName : "";
                                            var fullname = fname + " " + lname;
                                            var obj = {
                                                'contactid': dataWitnessContact.contactId,
                                                'name': fullname
                                            }
                                            data1.push(obj)
                                        })
                                    }
                                }

                                if ((vm.type == 1 && vm.subtype == 1) || (vm.type == 1 && vm.subtype == 2)) {
                                    // intakeMedicalRecordsContact
                                    if (utils.isNotEmptyVal(response[0].intakeMedicalRecords) && response[0].intakeMedicalRecords != undefined) {
                                        // _.forEach(response[0].intakeMedicalRecords[0].intakeMedicalProviders, function (item, index) {
                                        _.forEach(response[0].intakeMedicalRecords[0].intakeMedicalProviders, function (medicalRecord, index) {
                                            var dataMedicalProvider = medicalRecord.medicalProviders;
                                            var fname = dataMedicalProvider.firstName ? dataMedicalProvider.firstName : "";
                                            var lname = dataMedicalProvider.lastName ? dataMedicalProvider.lastName : "";
                                            var fullname = fname + " " + lname;
                                            var obj = {
                                                'contactid': dataMedicalProvider.contactId,
                                                'name': fullname
                                            }
                                            data1.push(obj)

                                        })
                                        _.forEach(response[0].intakeMedicalRecords[0].intakeMedicalProviders, function (physici, index) {
                                            var dataPhysician = physici.physician;
                                            var fname = dataPhysician.firstName ? dataPhysician.firstName : "";
                                            var lname = dataPhysician.lastName ? dataPhysician.lastName : "";
                                            var fullname = fname + " " + lname;
                                            var obj = {
                                                'contactid': dataPhysician.contactId,
                                                'name': fullname
                                            }
                                            data1.push(obj)

                                        })

                                    }


                                }



                                //insuranceInfos
                                if (utils.isNotEmptyVal(response[0].insuranceInfos) && response[0].insuranceInfos != undefined) {

                                    _.forEach(response[0].insuranceInfos, function (InsuranceInfo, index) {

                                        _.forEach(InsuranceInfo.insuredParty, function (InsuranceInfo1, index) {
                                            var dataInsuranceInfo1 = InsuranceInfo1;
                                            var fname = dataInsuranceInfo1.firstName ? dataInsuranceInfo1.firstName : "";
                                            var lname = dataInsuranceInfo1.lastName ? dataInsuranceInfo1.lastName : "";
                                            var fullname = fname + " " + lname;
                                            var obj = {
                                                'contactid': dataInsuranceInfo1.contactId,
                                                'name': fullname
                                            }
                                            data1.push(obj)

                                        });




                                        if (utils.isNotEmptyVal(InsuranceInfo.insuranceProvider) && InsuranceInfo.insuranceProvider != undefined) {

                                            var datainsuranceProvider = InsuranceInfo.insuranceProvider;
                                            var fname = datainsuranceProvider.firstName ? datainsuranceProvider.firstName : "";
                                            var lname = datainsuranceProvider.lastName ? datainsuranceProvider.lastName : "";
                                            var fullname = fname + " " + lname;
                                            var obj = {
                                                'contactid': datainsuranceProvider.contactId,
                                                'name': fullname
                                            }
                                            data1.push(obj)

                                        }


                                        if (utils.isNotEmptyVal(InsuranceInfo.adjuster) && InsuranceInfo.adjuster != undefined) {
                                            var dataAdjuster = InsuranceInfo.adjuster;
                                            var fname = dataAdjuster.firstName ? dataAdjuster.firstName : "";
                                            var lname = dataAdjuster.lastName ? dataAdjuster.lastName : "";
                                            var fullname = fname + " " + lname;
                                            var obj = {
                                                'contactid': dataAdjuster.contactId,
                                                'name': fullname
                                            }
                                            data1.push(obj)
                                        }

                                    })
                                }


                                vm.sms_contact_list = _.unique(data1, 'contactid');
                                $scope.$broadcast('sms_contact_list', vm.sms_contact_list);

                            });
                    }
                });
        }



        vm.sendMessageForSMSFn = sendMessageForSMSFn;
        vm.smsConsentCheck = smsConsentCheck;

        vm.smsCountCheck = function (fromSendBtn) {
            vm.documentTags = [];
            vm.attachmentFile = { file: [], clx_file: [] };
            if ($rootScope.isUsertSmsActive == 0) {
                notificationService.error('You do not have permission to send Messages. Please contact your SMP/Administrator.');
                return;
            }
            if (vm.applicationsInfo.sms.total_sms_count >= vm.applicationsInfo.sms.max_sms_count) {
                var modalInstance = $modal.open({
                    templateUrl: 'app/newSidebar/smsLimit.html',
                    controller: 'smsLimitCtrl as smsLimit',
                    windowClass: 'middle-pop-up',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        planInfo: function () {
                            return vm.applicationsInfo.sms;
                        }
                    }
                });

                modalInstance.result.then(function (resp) {

                }, function (error) {
                });

                return;
            } else {
                if (!fromSendBtn) {
                    clientCommunication(2);
                }
            }


        }


        function sendMessageForSMSFn() {
            var smsFlag = false;
            var contact_name;
            _.forEach(vm.sms_contact_id_compare, function (data) {
                if (data.is_sms_consent == 1) {
                    smsFlag = true;
                    contact_name = utils.isEmptyVal(contact_name) ? data.full_name : contact_name;
                }
            })
            if (smsFlag) {
                notificationService.error(contact_name + ' has been opted out of messages.');
                return;
            }
            var tempName = (vm.selectedModeForSidebarForSMS == 0) ? "Matter" : "Intake";
            if ((vm.getMatterIdForSMS == '' || vm.getMatterIdForSMS == undefined)) {
                newSendMessageForSMSFn();
            } else {
                var contactIds = _.pluck(vm.sms_contact_list, 'contactid');
                var cmpContactIds = _.pluck(vm.sms_contact_id_compare, 'contactid');
                var flag = true;

                if (contactIds.length > 0) {
                    _.forEach(cmpContactIds, function (item, index) {
                        if (flag) {
                            if (!_.contains(contactIds, parseInt(item))) {
                                notificationService.error("The selected " + tempName + " is not linked with " + vm.sms_contact_id_compare[index].firstname + " " + vm.sms_contact_id_compare[index].lastname);
                                flag = false;
                            } else if (index == (cmpContactIds.length - 1)) {
                                newSendMessageForSMSFn();
                            }
                        }
                    });
                } else {
                    notificationService.error("The selected " + tempName + " is not linked with contact");
                }

            }
        }

        function smsConsentCheck(contactInfo) {
            var index = contactInfo.length - 1;
            var data = contactInfo[index];
            if (data.is_sms_consent == 1) {
                notificationService.error('This contact has been opted out of messages.');
                return;
            }
        }

        function newSendMessageForSMSFn() {
            if (vm.applicationsInfo.sms.total_sms_count >= vm.applicationsInfo.sms.max_sms_count) {
                vm.smsCountCheck(true);
                return;
            }
            var reqList = [];
            if (vm.attachmentFile.file.length) {
                var localFIleCounter = 0;
                var totalLocalFiles = vm.attachmentFile.file.length;
                _.forEach(vm.attachmentFile.file, function (file, index) {
                    Upload.upload({
                        url: newSidebarDataLayer.sendMMS + '?thread_id=',
                        file: file
                    }).success(function (data, status, headers, config) {
                        $timeout(function () {
                            localFIleCounter++;

                            reqList.push(data);
                            if (localFIleCounter == totalLocalFiles) {
                                if (vm.attachmentFile.clx_file.length > 0) {
                                    _.forEach(vm.attachmentFile.clx_file, function (file, index) {
                                        reqList.push(file.doc_uri);
                                    });
                                }
                                wrapperForNewThread(reqList);
                            }
                        })
                    }).error(function (data, status, headers, config) {
                        notificationService.error('File not attached!');
                    });
                });
            } else {
                if (vm.attachmentFile.clx_file.length > 0) {
                    _.forEach(vm.attachmentFile.clx_file, function (file, index) {
                        reqList.push(file.doc_uri);
                    })
                }
                wrapperForNewThread(reqList);
            }



        }

        function wrapperForNewThread(reqList) {
            var objList = [];

            if (reqList.length > 0) {
                _.forEach(reqList, function (req, index) {
                    var obj = {
                        "matterId": vm.getMatterIdForSMS ? parseInt(vm.getMatterIdForSMS) : null,
                        "isIntake": parseInt(vm.selectedModeForSidebarForSMS),
                        "recipientContactIds": _.pluck(vm.sms_contact_id_compare, 'contactid'),
                        "threadMessages": [
                            {
                                "messageText": null,
                                "mediaURL": req
                            }
                        ]
                    };
                    objList.push(obj);

                })
            }

            if (objList.length > 0) {
                var firstReq = objList[0];
                objList.shift();
                newSidebarDataLayer.createNewSMS(firstReq).then(function (response) {
                    _.forEach(objList, function (obj) {
                        vm.listofReq.push(newSidebarDataLayer.createNewSMS(obj));
                    });

                    if (vm.listofReq.length > 0) {
                        $q.all(vm.listofReq).then(function () {
                            sendText();
                        }, function (response) {
                            resetObjOnError(response);
                        });
                    } else {
                        sendText();
                    }

                }, function (response) {
                    if (response.status == 409) {
                        notificationService.error("Message Not Delivered.");
                    } else if (response.status == 500) {
                        notificationService.error("Message Not Delivered.");
                    }
                });
            } else {
                sendText();
            }
        }

        function sendText() {
            if (vm.sendMessageForSMS) {
                var obj = {
                    "matterId": vm.getMatterIdForSMS ? parseInt(vm.getMatterIdForSMS) : null,
                    "isIntake": parseInt(vm.selectedModeForSidebarForSMS),
                    "recipientContactIds": _.pluck(vm.sms_contact_id_compare, 'contactid'),
                    "threadMessages": [
                        {
                            "messageText": vm.sendMessageForSMS
                        }
                    ]
                };
                vm.sendMessageForSMS = '';
                newSidebarDataLayer.createNewSMS(obj).then(function () {
                    getAllSMSThreadFn();
                    resetObjOnError();
                    blockHideAndShow(false, false, false, false, true, false, false);
                }, function (response) {
                    resetObjOnError(response);
                });
            } else {
                getAllSMSThreadFn();
                resetObjOnError();
                blockHideAndShow(false, false, false, false, true, false, false);
            }
        }


        function getAllSMSThreadFn(modalThreadId) {

            // if ($rootScope.isUsertSmsActive == 0) {
            //     notificationService.error('You do not have access to this application. Please contact your SMP/Administrator to get access.');
            //     return;
            // }


            vm.loaderFlag = false;
            vm.sendOnlySMS = '';
            var cid;
            if (!(angular.isUndefined(vm.contactIdForSMSMoreLink) || utils.isEmptyString(vm.contactIdForSMSMoreLink))) {
                cid = vm.contactIdForSMSMoreLink;
            }
            //vm.unseenMsgCount = '';
            var sideBarScrollTxt = '';
            if (localStorage.getItem('sideBarScrollPostId')) {
                sideBarScrollTxt = JSON.parse(localStorage.getItem('sideBarScrollPostId'));
                sideBarScrollTxt = sideBarScrollTxt.nid.toString();
               
            } else {
                sideBarScrollTxt = null;
            }

            newSidebarDataLayer.getAllSMSThread(vm.SMSThreadFlag, vm.filtersForSMS.pageNum, vm.filtersForSMS.pageSize, cid, sideBarScrollTxt)
                .then(function (response) {
                    if (response.length == vm.filtersForSMS.pageSize) {
                        vm.sms_more_flag = true;
                    } else {
                        vm.sms_more_flag = false;
                    }
                    if (vm.filtersForSMS.pageNum > 1) {
                        var data = response;
                        vm.all_thread_grouplist = vm.all_thread_grouplist.concat(getAllSMSThreadResponse(data));
                    } else if (vm.filtersForSMS.pageNum == 1) {

                        var data = response;
                        vm.all_thread_grouplist = getAllSMSThreadResponse(data);
                        if (angular.isDefined(modalThreadId)) {
                            _.forEach(vm.all_thread_grouplist, function (item, index) {
                                if (item.threadId == modalThreadId) {
                                    getSelectedSMSThread(vm.all_thread_grouplist[index]);
                                    var container = $('#main-event'),
                                        scrollTo = $('#' + vm.all_thread_grouplist[index].threadId);
                                    if (scrollTo.offset()) {
                                        container.animate({
                                            scrollTop: scrollTo.offset().top - $("#main-event").offset().top
                                        }, 100);
                                    }
                                }
                            });
                        } else {
                            var fromNoticationcheck = sessionStorage.getItem('fromNotification');
                            if (localStorage.getItem('sideBarScrollPostId') && fromNoticationcheck == "true") {
                                sideBarScrollPost = JSON.parse(localStorage.getItem('sideBarScrollPostId'));
                                var index = _.indexOf(vm.all_thread_grouplist, _.findWhere(vm.all_thread_grouplist, { threadId: sideBarScrollPost.nid }));
                                if (index > -1) {
                                    getSelectedSMSThread(vm.all_thread_grouplist[index]);
                                    var container = $('#main-event'),
                                        scrollTo = $('#' + vm.all_thread_grouplist[index].threadId);
                                    if (scrollTo.offset()) {
                                        container.animate({
                                            scrollTop: scrollTo.offset().top - $("#main-event").offset().top
                                        }, 100);
                                    }
                                } else {
                                    getSelectedSMSThread(response[0]);
                                }
                            } else {
                                getSelectedSMSThread(response[0]);
                            }
                            localStorage.removeItem('sideBarScrollPostId');
                        }

                    }

                    vm.loaderFlag = true;

                });
        }

        vm.selectedThread = null;
        vm.getSelectedSMSThread = getSelectedSMSThread;
        function getSelectedSMSThread(obj, noScroll) {
            vm.documentTags = [];
            if (angular.isDefined(obj)) {
                obj.unseenSms ? vm.unseenMsgCount-- : angular.noop;
                obj.unseenSms = false;
            }
            vm.attachmentFile = { file: [], clx_file: [] };
            vm.selectedThread = angular.copy(obj);
            vm.sendOnlySMS = '';
            if (angular.isUndefined(obj)) {
                vm.singleSelectedThread = false;
                vm.unseenMsgCount = 0;
                return;
            } else {
                vm.singleSelectedThread = true;
            }
            newSidebarDataLayer.getSelectedSMSThread(obj.threadId, obj.matterId)
                .then(function (response) {
                    if ($rootScope.onLauncher) {
                        notificationDatalayer.getNotificationCountForIntake()
                            .then(function (res) {
                                var smsCountForIntake = res.data.two_way_text_count;
                                $rootScope.$broadcast('updatetwoWayTextCountForIntake', { count: smsCountForIntake });
                            });

                        notificationDatalayer.getNotificationCount()
                            .then(function (res) {
                                var smsCount = res.data.two_way_text_count;
                                $rootScope.$broadcast('updatetwoWayTextCount', { count: smsCount });
                            });

                    } else if ($rootScope.onIntake) {
                        notificationDatalayer.getNotificationCountForIntake()
                            .then(function (res) {
                                var smsCountForIntake = res.data.two_way_text_count;
                                $rootScope.$broadcast('updatetwoWayTextCountForIntake', { count: smsCountForIntake });
                            });
                    } else {
                        notificationDatalayer.getNotificationCount()
                            .then(function (res) {
                                var smsCount = res.data.two_way_text_count;
                                $rootScope.$broadcast('updatetwoWayTextCount', { count: smsCount });
                            });
                    }
                    var data = response;
                    var oldIndexDate;
                    var currentIndexDate;
                    var getTimeArray = globalConstants.sidebarSMSTimeDifference;
                    data.threadMessages.slice(0).forEach(function (item) {
                        if (item.isIncoming == 1) {
                            var removeRec = false;
                            var nextIncomingMsg = _.filter(data.threadMessages, function (msg) {
                                return msg.createdOn > item.createdOn && msg.isIncoming == 1;
                            });
                            if (nextIncomingMsg && nextIncomingMsg.length > 0) {
                                var diff = moment.unix(nextIncomingMsg[0].createdOn).diff(moment.unix(item.createdOn), 'seconds');
                                if (diff > getTimeArray[0] && diff < getTimeArray[1]) {
                                    var index = data.threadMessages.indexOf(nextIncomingMsg[0]);
                                    data.threadMessages[index].messageText = [item.messageText, data.threadMessages[index].messageText].join(" ");

                                    removeRec = true;
                                }
                            }
                            if (removeRec) {
                                data.threadMessages.splice(data.threadMessages.indexOf(item), 1);

                            }
                        }

                    });

                    _.forEach(data.threadMessages, function (item, index) {
                        if (index != 0) {
                            oldIndexDate = moment.unix(data.threadMessages[index - 1].createdOn).format('MM/DD/YYYY');
                        }
                        currentIndexDate = moment.unix(item.createdOn).format('MM/DD/YYYY');
                        if (oldIndexDate != currentIndexDate) {
                            item.titleDate = currentIndexDate;
                        } else {
                            item.titleDate = "";
                        }
                        if (!item.documentName && item.mediaURL) {
                            var uriArr = item.mediaURL.split('/');
                            var filename = uriArr[uriArr.length - 1];
                            var dfilename = decodeURIComponent(filename);
                            var fileNameArr = dfilename.split('.');
                            var fileExt = fileNameArr[fileNameArr.length - 1];
                            var name = fileNameArr[0];
                            var urlRegex = /((-V1-)[0-9]*)/ig;
                            dfilename = name.replace(urlRegex, function (url) {
                                return '.' + fileExt;
                            });
                            item.documentName = dfilename;
                        }

                        item.ext = item.documentName ? (item.documentName).split('.').pop().toLowerCase() : null;
                        item.isImage = (item.ext && (item.ext == 'png' || item.ext == 'jpeg' || item.ext == 'jpg')) ? true : false;
                    });

                    vm.selectedSMSThread = data;
                    vm.selectedSMSThread.is_NoteSync = utils.isNotEmptyVal(response.noteSync) ? response.noteSync : 0;
                    if (utils.isEmptyVal(vm.selectedSMSThread.matterName)) {
                        vm.somethingDisabled = true;
                    } else {
                        vm.somethingDisabled = false;
                    }
                    blockHideAndShow(false, false, false, false, true, false, false);
                    if (vm.all_thread_grouplist.length > 0 && !noScroll) {
                        var container = $('#main-event'),
                            scrollTo = $('#' + vm.selectedSMSThread.threadId);
                        if (scrollTo.offset()) {
                            container.animate({
                                scrollTop: scrollTo.offset().top - $("#main-event").offset().top
                            }, 100);
                        }
                    }
                });
        }

        vm.openDoc = openDocFn;
        documentsDataService.getDocumentCategories()
            .then(function (response) {
                vm.documentCategories = response;
            }, function (error) {
                notificationService.error('document categories not loaded');
            });

        var matterList = [];
        /*Search matter in case of global documents*/
        vm.searchMattersForDoc = function (matterName) {
            if (matterName) {
                return matterFactory.searchMatters(matterName).then(
                    function (response) {
                        matterList = response.data;
                        return response.data;
                    }, function (error) {
                        notificationService.error('Matters not loaded');
                    });
            }
        }

        /* Formate the matter id and name in case of global documents*/
        vm.formatTypeaheadDisplayForDoc = function (matterid, data) {
            // if (angular.isUndefined(matterid) || utils.isEmptyString(matterid) || matterList.length === 0) {
            //     return undefined;
            // }
            var matterInfo = _.find(matterList, function (matter) {

                vm.docModel.matterid = matterid;

                return matter.matterid == matterid;
            });
            vm.showErrorMsg = false;
            if (data == 'doc') {
                if (matterInfo && matterInfo.matterid) {
                    var promesa = documentsDataService.getDocumentsList(true, matterInfo.matterid, false, 1, '', 5, '', '', '', false);
                    promesa.then(function (data) {
                        vm.getMatterDocList = [];
                        vm.clxGridOptions.selectedItems = [];
                        vm.getMatterDocList = data.documents;
                        var listOfExt = globalConstants.extensionForMMS;
                        _.forEach(vm.getMatterDocList, function (it) {
                            it.ext = (it.doc_name).split('.').pop();
                            it.ext = it.ext.toLowerCase();
                            it.id = it.doc_id;
                            it.from = 'Matter';
                        })
                        var result = vm.getMatterDocList.filter(function (o1) {
                            return listOfExt.some(function (o2) {
                                return o1.ext === o2; // return the ones with equal ext
                            });
                        });
                        vm.getMatterDocList = angular.copy(result);
                        if (vm.getMatterDocList.length > 0) {
                            var selectedDocId = "[" + _.pluck(vm.getMatterDocList, 'doc_id').toString() + "]";
                            mailboxDataService.getdocumentsize(selectedDocId, "0")
                                .then(function (response) {
                                    if (response.data) {
                                        _.forEach(vm.getMatterDocList, function (item) {
                                            _.forEach(response.data, function (currentItem) {
                                                if (item.doc_id == currentItem.documentid) {
                                                    item.size = currentItem.documentsize;
                                                }
                                            })
                                        })
                                    }
                                })
                        } else {
                            vm.showErrorMsg = true;
                        }
                    })
                }

            }
            return matterInfo ? matterInfo.name + '-' + matterInfo.filenumber : "";
        }
        vm.setDefaultValues = function () {
            if (vm.selectedMode == 1) {
                vm.getMatterDocList = [];
                vm.docModel.matterid = '';
            } else {
                vm.getIntakeDocList = [];
                vm.docModel.intakeId = '';
            }
            vm.searchDocs = '';
        }
        var intakeList = [];
        /*Search matter in case of global documents*/
        vm.searchIntakesForDoc = function (matterName) {
            if (matterName) {
                return intakeNotesDataService.getMatterList(matterName, 2)
                    .then(function (response) {
                        intakeList = response;
                        return response;
                    }, function (error) {
                        notificationService.error('Intake not loaded');
                    });
            }
        }

        /* Formate the matter id and name in case of global documents*/
        vm.formatIntakeTypeaheadDisplayForDoc = function (intake, data) {
            var matterInfo = _.find(intakeList, function (matter) {
                data == 'doc' ? vm.docModel.intakeId = intake : vm.docModel.matterid = intake;
                return matter.intakeId == intake;
            });
            vm.showErrorMsgForIntake = false;
            if (data == 'doc') {
                if (matterInfo && matterInfo.intakeId) {
                    var promesa = inatkeDocumentsDataService.getDocumentsList(false, matterInfo.intakeId, false, '1', '', '', '', '')
                    promesa.then(function (data) {
                        vm.getIntakeDocList = [];
                        vm.clxGridOptions.selectedItemsForIntake = [];
                        vm.getIntakeDocList = data.data;
                        var listOfExt = globalConstants.extensionForMMS;
                        _.forEach(vm.getIntakeDocList, function (it) {
                            it.ext = (it.documentname).split('.').pop();
                            it.ext = it.ext.toLowerCase();
                            it.doc_name = it.documentname;
                            it.id = it.intake_document_id;
                            it.from = 'Intake';
                            it.doc_uri = it.docuri;
                        })
                        var result = vm.getIntakeDocList.filter(function (o1) {
                            return listOfExt.some(function (o2) {
                                return o1.ext === o2; // return the ones with equal ext
                            });
                        });
                        vm.getIntakeDocList = angular.copy(result);
                        if (vm.getIntakeDocList.length > 0) {
                            var selectedDocId = "[" + _.pluck(vm.getIntakeDocList, 'intake_document_id').toString() + "]";
                            mailboxDataService.getdocumentsize(selectedDocId, "1")
                                .then(function (response) {
                                    if (response.data) {
                                        _.forEach(vm.getIntakeDocList, function (item) {
                                            _.forEach(response.data, function (currentItem) {
                                                if (item.intake_document_id == currentItem.documentid) {
                                                    item.size = currentItem.documentsize;
                                                }
                                            })
                                        })
                                    }
                                })
                        } else {
                            vm.showErrorMsgForIntake = true;
                        }
                    })
                }
            }
            return matterInfo ? matterInfo.intakeName + '-' + matterInfo.dateIntake : "";
        }

        vm.generateDocLink = generateDocLinkFn;
        function generateDocLinkFn() {
            var link = document.createElement('a');
            link.href = vm.singleDoc.publicMediaURL;
            link.download = vm.singleDoc.documentName;
            link.click();
        }

        function openDocFn(doc) {
            vm.singleDoc = angular.copy(doc);
            vm.docModel = {};
            vm.docModel.documentName = vm.singleDoc.documentName;
            vm.docModel.mediaURLCopy = angular.copy(vm.singleDoc.mediaURL);
            vm.docModel.mediaURL = $scope.trustSrc(vm.singleDoc.mediaURL);
            if (vm.singleDoc.docMatterId) {
                vm.docModel.matterid = vm.singleDoc.docMatterName;
                vm.docModel.category = vm.singleDoc.docCategoryName
            } else {

            }

            var doc_ext = vm.singleDoc.ext;

            if (doc_ext == 'pdf' || doc_ext == 'txt' || doc_ext == 'png' || doc_ext == 'jpg' || doc_ext == 'jpeg' || doc_ext == 'gif') {
                vm.viewable = true;
            } else {
                vm.viewable = false;
            }
            docModalInstance = $modal.open({
                templateUrl: "app/newSidebar/document-popup-view.html",
                scope: $scope,
                size: 'lg',
                backdrop: 'static',
                keyboard: false,
                windowClass: 'modalXLargeDialog'
            });
        };

        vm.closeDocModal = function () {
            vm.singleDoc = null;
            vm.docModel = {};
            docModalInstance.close();
            docModalInstance = null;
        }

        vm.saveDocModal = function () {
            if (vm.singleDoc) {
                if (!utils.isNotEmptyVal(vm.docModel.documentName)) {
                    notificationService.error('Document name is required.');
                    return;
                };
                if (!utils.isNotEmptyVal(vm.docModel.matterid) || (vm.docModel.matterid && isNaN(vm.docModel.matterid) && typeof (vm.docModel.matterid) == 'string')) {
                    var errMsg = vm.selectedModeForSidebarMMS == 0 ? 'Matter is required.' : 'Intake is required.'
                    notificationService.error(errMsg);
                    return;
                };
                if (!utils.isNotEmptyVal(vm.docModel.category)) {
                    notificationService.error('Category is required.');
                    return;
                };

            };

            var obj = {
                "doc_name": vm.docModel.documentName,
                "doc_category": { "doc_category_id": vm.docModel.category },
                "doc_uri": vm.docModel.mediaURLCopy,
                "uploadtype": "fresh"
            }
            if (vm.selectedModeForSidebarMMS == 0) {
                obj.matter = { "matter_id": vm.docModel.matterid };
            } else {
                obj.intake = { "intake_id": vm.docModel.matterid };
            }

            newSidebarDataLayer.postFileAttachMMS(obj, vm.selectedModeForSidebarMMS == 1, vm.singleDoc.id)
                .then(function (response) {
                    vm.getSelectedSMSThread(vm.selectedThread);
                    vm.closeDocModal();
                    notificationService.success("Document saved successfully.");
                }, function (response) {
                    if (error.message == "Document name already exists in Matter and Category") {
                        notificationService.error("Document name already exist in Matter and category!");
                    } else if (error.message == "No document extension given in document name") {
                        notificationService.error("Document name must contain extension.");
                    } else {
                        notificationService.error(error.message);
                    }
                });
        }

        vm.onlySendSMSFn = onlySendSMSFn;
        function onlySendSMSFn() {
            vm.unseenMsgCount = 0;
            if ($rootScope.isUsertSmsActive == 0) {
                notificationService.error('You do not have permission to send Messages. Please contact your SMP/Administrator.');
                return;
            }
            if (vm.selectedSMSThread.isMigrated == 1) {
                notificationService.error("This intake has migrated to Matter Manager as a Matter. Please select the corresponding Matter to send/receive text messages.");
            } else {
                var localFileResponse = buildLocalFileObj(vm.attachmentFile.file);
                var clxFileResponse = buildClxFileObj(vm.attachmentFile.clx_file);
                var smsResponse = buildSmsObj(vm.sendOnlySMS);
                $q.all([localFileResponse, clxFileResponse, smsResponse]).then(function () {

                    var firstReq = vm.reqs[0];
                    vm.reqs.shift();
                    newSidebarDataLayer.createNewSMS(firstReq).then(function (response) {
                        _.forEach(vm.reqs, function (obj) {
                            vm.listofReq.push(newSidebarDataLayer.createNewSMS(obj));
                        });

                        if (vm.listofReq.length > 0) {
                            $q.all(vm.listofReq).then(function () {
                                sendThreadText();
                            }, function (response) {
                                resetObjOnError(response);
                            });
                        } else {
                            sendThreadText();
                        }

                    }, function (response) {
                        if (response.status == 409) {
                            notificationService.error("Message Not Delivered.");
                        } else if (response.status == 500) {
                            notificationService.error("Message Not Delivered.");
                        }
                        resetObjOnError(response);
                    });

                });
            }
        }

        function sendThreadText() {
            vm.sendOnlySMS = '';
            getAllSMSThreadFn();
            resetObjOnError();
        }

        function resetObjOnError(response) {
            if (response && response.status == 406) {
                notificationService.error("Phone number does not exists for contact");
            } else if (response && response.status == 403) {
                notificationService.error("Selected contact(s) is either deleted or has invalid Type/Consent.");
            }
            vm.documentTags = [];
            vm.attachmentFile = {};
            vm.attachmentFile.file = [];
            vm.attachmentFile.clx_file = [];
            vm.listofReq = [];
            vm.reqs = [];
            vm.mediaList = [];
            vm.searchDocs = '';
        }

        function buildLocalFileObj(promiseObj) {
            var defer = $q.defer();
            if (promiseObj.length > 0) {
                var flagForPromise = 0;
                _.forEach(promiseObj, function (file, index) {
                    Upload.upload({
                        url: newSidebarDataLayer.sendMMS + '?thread_id=' + vm.selectedSMSThread.threadId,
                        file: file
                    }).success(function (data, status, headers, config) {
                        flagForPromise = flagForPromise + 1;
                        var contactIds = JSON.parse(vm.selectedSMSThread.threadMessages[0].recipientDetails);
                        var recipientContactIds = _.pluck(contactIds.contacts, 'contactId');
                        var obj = {
                            "matterId": vm.selectedSMSThread.matterId,
                            "isIntake": vm.selectedSMSThread.isIntake,
                            "recipientContactIds": recipientContactIds,
                            "threadMessages": [
                                {
                                    "messageText": null,
                                    "mediaURL": data
                                }
                            ]
                        }
                        vm.reqs.push(obj);
                        if (promiseObj.length == flagForPromise) {
                            defer.resolve();
                        }
                    }).error(function (data, status) {
                        if (data && status == 403) {
                            notificationService.error("Selected contact(s) is either deleted or has invalid Type/Consent.");
                        } else if (data && status == 406) {
                            notificationService.error("Phone number does not exists for contact");
                        } else {
                            notificationService.error('File not attached!');
                        }
                    });
                });
            } else {
                defer.resolve();
            }
            return defer.promise;
        }
        function buildClxFileObj(promiseObj) {
            var defer = $q.defer();
            if (promiseObj.length > 0) {
                _.forEach(promiseObj, function (file, index) {
                    var contactIds = JSON.parse(vm.selectedSMSThread.threadMessages[0].recipientDetails);
                    var recipientContactIds = _.pluck(contactIds.contacts, 'contactId');
                    var obj = {
                        "matterId": vm.selectedSMSThread.matterId,
                        "isIntake": vm.selectedSMSThread.isIntake,
                        "recipientContactIds": recipientContactIds,
                        "threadMessages": [
                            {
                                "messageText": null,
                                "mediaURL": file.doc_uri
                            }
                        ]
                    }
                    vm.reqs.push(obj);
                    if (promiseObj.length == (index + 1)) {
                        defer.resolve();
                    }
                })

            } else {
                defer.resolve();
            }
            return defer.promise;
        }
        function buildSmsObj(promiseObj) {
            var defer = $q.defer();
            if (promiseObj) {
                var contactIds = JSON.parse(vm.selectedSMSThread.threadMessages[0].recipientDetails);
                var recipientContactIds = _.pluck(contactIds.contacts, 'contactId');

                var obj = {
                    "matterId": vm.selectedSMSThread.matterId,
                    "isIntake": vm.selectedSMSThread.isIntake,
                    "recipientContactIds": recipientContactIds,
                    "threadMessages": [
                        {
                            "messageText": vm.sendOnlySMS
                        }
                    ]
                }
                vm.reqs.push(obj);
                defer.resolve();

            } else {
                defer.resolve();
            }
            return defer.promise;
        }
        vm.getContactsForSMS = getContactsForSMS;
        function getContactsForSMS(contactName, searchItem) {

            var postObj = {};
            postObj.type = globalConstants.clientMessengerTypeList;
            postObj.first_name = utils.isNotEmptyVal(contactName) ? contactName : '';
            postObj.page_Size = 250

            return matterFactory.getContactsByName(postObj, true)
                .then(function (response) {
                    var data = response.data;
                    contactFactory.setDataPropForContactsFromOffDrupalToNormalContact(data);
                    contactFactory.setNamePropForContactsOffDrupal(data);
                    return data;
                });
        }

        vm.formatTypeaheadDisplayForContactSearchSMS = formatTypeaheadDisplayForContactSearchSMS;
        function formatTypeaheadDisplayForContactSearchSMS(contact) {
            vm.sendOnlySMS = '';

            if (angular.isUndefined(contact) || utils.isEmptyString(contact)) {
                vm.contactIdForSMSMoreLink = '';
                return undefined;
            }

            vm.loaderFlag = false;
            vm.contactIdForSMSMoreLink = contact.contact_id;
            vm.filtersForSMS['pageNum'] = 1;
            vm.unseenMsgCount = 0;
            //vm.unseenMsgCount = '';
            newSidebarDataLayer.getAllSMSThread(vm.SMSThreadFlag, vm.filtersForSMS.pageNum, vm.filtersForSMS.pageSize, contact.contact_id)
                .then(function (response) {

                    if (response.length == vm.filtersForSMS.pageSize) {
                        vm.sms_more_flag = true;
                    } else {
                        vm.sms_more_flag = false;
                    }
                    if (vm.filtersForSMS.pageNum > 1) {
                        var data = response;
                        vm.all_thread_grouplist = vm.all_thread_grouplist.concat(getAllSMSThreadResponse(data));
                    } else if (vm.filtersForSMS.pageNum == 1) {
                        var data = response;
                        vm.all_thread_grouplist = getAllSMSThreadResponse(data);
                        getSelectedSMSThread(response[0]);

                    }
                    vm.loaderFlag = true;

                });

            return contactFactory.formatTypeaheadDisplay(contact);
        }

        function getAllSMSThreadResponse(data) {

            var uId = localStorage.getItem('userId');
            _.forEach(data, function (item) {
                item['imgIcon'] = item.userProfilePicURIs.split(",").map(function (item) {
                    return item.trim();
                });
                item['itemIconAlt'] = item.contactName.split(",").map(function (item) {
                    return item.trim();
                });
                var today = moment((new Date())).format('MM/DD/YYYY');
                var yestarday = moment((new Date()).setDate((new Date()).getDate() - 1)).format('MM/DD/YYYY');
                var itemDay = moment.unix(item.threadMessages[0].createdOn).format('MM/DD/YYYY');
                if (today == itemDay) {
                    item['timeIcon'] = 'Today';
                } else if (yestarday == itemDay) {
                    item['timeIcon'] = 'Yestarday';
                } else {
                    item['timeIcon'] = itemDay;
                }
                item['unseenSms'] = true;

                var arr = JSON.parse(item.seenBy);
                if (uId && _.indexOf(arr.userIds, parseInt(uId)) > -1) {
                    item['unseenSms'] = false;
                }
                item.unseenSms ? vm.unseenMsgCount++ : angular.noop;

            });

            return data;
        }

        vm.displayMoreSMS = displayMoreSMS;
        function displayMoreSMS() {
            vm.filtersForSMS.pageNum = vm.filtersForSMS.pageNum + 1;
            getAllSMSThreadFn();
        };

        function scrollUpForSMS() {
            if (angular.isUndefined(vm.selectedSMSThread) || vm.selectedSMSThread == null) {
                return '';
            }
            $location.hash('anchor' + (vm.selectedSMSThread.threadMessages.length - 1));
        }

        $scope.$watch(function () {
            return vm.contactNameForSMS;
        }, function (newValue) {
            if (angular.isUndefined(newValue) || utils.isEmptyString(newValue)) {
                if (vm.listSelectedDropdown == 'Text Message' && !vm.smsAddForm) {
                    vm.contactIdForSMSMoreLink = '';
                    vm.filtersForSMS['pageNum'] = 1;
                    vm.unseenMsgCount = 0;
                    getAllSMSThreadFn();
                }
            }
        });

        $scope.trustSrc = function (src) {
            if (angular.isUndefined(src) || utils.isEmptyString(src)) {
                return undefined;
            }
            if (src !== "NULL") {
                var uriArr = src.split('/');
                var filename = uriArr[uriArr.length - 2] + '/' + uriArr[uriArr.length - 1];
                try {
                    var dfilename = decodeURIComponent(filename);
                    filename = dfilename;
                } catch (err) { }
                var filenameEncoded = encodeURIComponent(filename);
                return globalConstants.webServiceBase + "lexviafiles/downloadfile/ViewDocument.json?filename=" + filenameEncoded + "&&containername=" + uriArr[uriArr.length - 3];
            } else {
                return 'styles/images/contact_picture/profile.png';
            }
        }


        vm.getPlaintiffsForDocument = getPlaintiffsForDocument;
        vm.getDefendants = getDefendants;
        vm.getDocPlaintiffData = getDocPlaintiffData;
        vm.groupPlaintiffDefendants = groupPlaintiffDefendants;
        vm.setPartyRole = setPartyRole;

        function getPlaintiffsForDocument(matterId) {
            documentsDataService.getPlaintiffs(matterId)
                .then(function (response) {
                    vm.docPlaintiffs = response;
                    getDefendants(matterId);
                }, function (error) {
                    notificationService.error('plaintiffs not loaded');
                });
        }


        function getDefendants(matterId) {
            allPartiesDataService.getDefendants(matterId)
                .then(function (res) {
                    vm.docDefendants = res.data;
                    allPartiesDataService.getOtherPartiesBasic(matterId)
                        .then(function (res) {
                            vm.docOtherparties = res.data;
                            vm.docPlaintiffDefendants = getDocPlaintiffData(vm.docPlaintiffs, vm.docDefendants, vm.docOtherparties);
                        });
                });
        }

        function getDocPlaintiffData(plaintiffs, defendants, otherParties) {
            var plaintiffDefendantsArray = [];

            var plaintiff = plaintiffs.map(function (plaintiff) {
                var newplaintiff = {
                    id: plaintiff.plaintiffID,
                    name: plaintiff.plaintiffName,
                    type: 1 // 1 refer plaintiff
                };
                return newplaintiff;
            });
            plaintiffDefendantsArray = plaintiffDefendantsArray.concat(plaintiff);

            var defendants = defendants.map(function (defendant) {
                if (utils.isNotEmptyVal(defendant.contactid)) {
                    // var defendantName = utils.isNotEmptyVal(defendant.contactid.firstname) ? defendant.contactid.firstname : "";
                    // defendantName += "" + utils.isNotEmptyVal(defendant.contactid.lastname) ? defendant.contactid.lastname : "";
                    var defendantFirstName = utils.isNotEmptyVal(defendant.contactid.firstname) ? defendant.contactid.firstname : "";
                    var defendantLastName = utils.isNotEmptyVal(defendant.contactid.lastname) ? defendant.contactid.lastname : "";
                    var defendantName = defendantFirstName + " " + defendantLastName;
                    var newDefendant = {
                        id: defendant.defendantid,
                        name: defendantName,
                        type: 2 // 2 refer defendant role
                    };
                    return newDefendant;
                }
            });
            plaintiffDefendantsArray = plaintiffDefendantsArray.concat(defendants);

            var otherParties = otherParties.map(function (otherParty) {
                if (utils.isNotEmptyVal(otherParty.contactid)) {
                    // var otherPartyName = utils.isNotEmptyVal(otherParty.firstname) ? otherParty.firstname : "";
                    // otherPartyName += "" + utils.isNotEmptyVal(otherParty.lastname) ? otherParty.lastname : "";
                    var otherFirstName = utils.isNotEmptyVal(otherParty.firstname) ? otherParty.firstname : "";
                    var otherLastName = utils.isNotEmptyVal(otherParty.lastname) ? otherParty.lastname : "";
                    var otherPartyName = otherFirstName + " " + otherLastName;

                    var newOtherParty = {
                        id: otherParty.mattercontactid,
                        name: otherPartyName,
                        type: 3 // 3 refer other party role
                    };
                    return newOtherParty;
                }
            });
            plaintiffDefendantsArray = plaintiffDefendantsArray.concat(otherParties);

            return plaintiffDefendantsArray;
        }

        /* group by Party Role */
        function groupPlaintiffDefendants(party) {
            if (party.type == 1) {
                return "Plaintiffs";
            }

            if (party.type == 2) {
                return "Defendants";
            }

            if (party.type == 3) {
                return "Other Party";
            }

            return "All";
        }

        function setPartyRole(selectedItem, insuranceObj) {
            if (insuranceObj.category == 10) {
                $scope.display.filters.plaintiffName = selectedItem.plaintiffName
                $scope.display.filters.party_role = 1;
            } else {
                $scope.display.filters.party_role = selectedItem.type;
            }
        }



        /* function to get the sendTo list (UserList+ContactList+ExternalContact) as searched */
        vm.getContactListForSMS = getContactListForSMS;
        function getContactListForSMS(name) {
            if (utils.isNotEmptyVal(name)) {

                var postObj = {};
                postObj.type = globalConstants.clientMessengerTypeList;
                postObj.first_name = utils.isNotEmptyVal(name) ? name : '';
                postObj.page_Size = 250

                matterFactory.getContactsByName(postObj, true)
                    .then(function (response) {
                        var data = response.data;
                        vm.sms_contact_list_compare = [];
                        contactFactory.setDataPropForContactsFromOffDrupalToNormalContact(data);
                        contactFactory.setNamePropForContactsOffDrupal(data);

                        var allLinkedContactId = vm.sms_contact_id_compare;
                        var responseData = angular.copy(data);
                        _.forEach(responseData, function (item, index) {
                            _.forEach(allLinkedContactId, function (it) {
                                if (item.contact_id == it) {
                                    data.splice(index, 1);
                                }
                            })
                        })
                        _.forEach(data, function (item) {
                            if (item.contact_type != "Global") {
                                vm.sms_contact_list_compare.push(item);
                            }
                        });
                        if (utils.isNotEmptyVal(vm.sms_contact_list_compare)) {
                            vm.sms_contact_list_compare = _.uniq(vm.sms_contact_list_compare, function (item) {
                                return item.contact_id;
                            });
                        }
                    });
            } else {
                vm.sms_contact_list_compare = [];
            }

        }
        var docModalInstance;
        vm.openSMSAttachmentForm = openSMSAttachmentForm;
        function openSMSAttachmentForm() {
            // if ($rootScope.isUsertSmsActive == 0) {
            //     notificationService.error('You do not have permission to send Messages. Please contact your SMP/Administrator.');
            //     return;
            // }
            var modalInstance = $modal.open({
                templateUrl: 'app/newSidebar/sms-attachment.html',
                controller: ['$scope', '$controller', '$modalInstance', '$rootScope', 'selectedSMSThread',
                    function ($scope, $controller, $modalInstance, $rootScope, selectedSMSThread) {

                        // Initialize the super class and extend it.
                        $.extend(this, $controller('NewSidebarCtrl', { $scope: $scope }));
                        //Variable initialization
                        var vm = this;
                        var sms_contact_list = [];
                        // var ids = JSON.parse(selectedSMSThread.threadMessages[0].recipientDetails);
                        var ids = selectedSMSThread.contactId;
                        var names = selectedSMSThread.contactName;
                        var threadId = selectedSMSThread.threadId;
                        vm.update = update;


                        // Called when the cancel button is pressed
                        vm.back = function () {
                            $modalInstance.dismiss('cancel');
                        };

                        $scope.$on('sms_contact_list', function (event, arr) {
                            sms_contact_list = arr;
                        });


                        //todo APi need
                        function update() {
                            var tempName = (vm.selectedModeForSidebarForSMS == 0) ? "Matter" : "Intake";

                            if ((vm.getMatterIdForSMS == '' || vm.getMatterIdForSMS == undefined)) {
                                notificationService.error("Please Select " + tempName);
                                return;
                            }
                            var isMatterId = parseInt(vm.getMatterIdForSMS);
                            var isNumMatterId = _.isNaN(isMatterId);
                            if (isNumMatterId) {
                                notificationService.error("Invalid " + tempName + " name");
                                return;
                            }

                            var contactIds12 = _.pluck(sms_contact_list, 'contactid');
                            var contactIds = contactIds12.map(Number);
                            var cmpContactIds = ids.split(',').map(Number);
                            var cmpContactNames = names.split(",");

                            var flag = true;

                            if (contactIds.length > 0) {
                                var tempCMPContactName = [];
                                _.forEach(cmpContactIds, function (item, index) {

                                    if (!_.contains(contactIds, parseInt(item))) {
                                        tempCMPContactName.push(cmpContactNames[index]);
                                        flag = false;
                                    }

                                    if (index == (cmpContactIds.length - 1)) {
                                        if (flag) {
                                            updateSMSAttachmentForm();
                                        } else {
                                            notificationService.error("The selected " + tempName + " is not linked with " + tempCMPContactName.join(", "));
                                        }
                                    }
                                });
                            } else {
                                notificationService.error("The selected " + tempName + " is not linked with contact");
                            }

                        }

                        function updateSMSAttachmentForm() {

                            var obj = {
                                "matterId": vm.getMatterIdForSMS ? parseInt(vm.getMatterIdForSMS) : null,
                                "isIntake": parseInt(vm.selectedModeForSidebarForSMS),
                                "threadId": threadId

                            };

                            newSidebarDataLayer.getSMSAttachmentForm(obj)
                                .then(function (response) {
                                    getAllSMSThreadFn(response);
                                    $modalInstance.close();
                                }, function (response) {
                                });
                        }


                    }],
                controllerAs: 'sidebarCtrl',
                windowClass: 'middle-pop-up',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    'selectedSMSThread': function () {
                        return vm.selectedSMSThread
                    }
                }
            });

            modalInstance.result.then(function (data) {
            }, function (error) {

            });

        }

        vm.exportSMS = exportSMS;
        function exportSMS() {
            newSidebarDataLayer.getSMSExport(vm.selectedSMSThread.threadId)
                .then(function (response) {
                    var filename = "Client_Messenger_Export.xlsx";
                    utils.downloadFile(response.data, filename, response.headers("Content-Type"));
                })
        }

        vm.printSMS = printSMS;
        function printSMS() {
            var formattedData = angular.copy(vm.selectedSMSThread);
            _.forEach(formattedData.threadMessages, function (item) {
                item['createdOn'] = $filter('utcDateFilter')(item.createdOn, 'hh:mm A');
            });
            var output = getprintSMS(formattedData);
            window.open().document.write(output);
        }


        function getprintSMS(printObj) {
            var mattername = null;
            if ((printObj.isIntake == 0 && !(printObj.matterId == null))) {
                mattername = 'Matter';
            } else if ((printObj.isIntake == 1 && !(printObj.matterId == null))) {
                mattername = 'Intake';
            }

            var html = "<html><title>Text Message</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>";
            html += '.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}';
            html += '.message-panel p.ng-binding {margin: 0 !important;}';
            html += '.message-scroll-panel {max-height: calc( 100vh - 310px) !important;padding: 10px !important;-webkit-border-radius: 5px;}';
            html += '.message-panel .right-block {background-color: #8c8e91;-webkit-border-radius: 5px;padding: 5px;max-width: 500px;min-width: 250px;width: inherit;float: right;display: block !important;clear: both;color: #000000 !important;margin: 5px 0;}';
            html += '.message-panel .left-block {background-color: #8c8e91;-webkit-border-radius: 5px;padding: 5px;max-width: 500px;min-width: 250px;width: inherit;display: block;clear: both;color: #000000 !important;margin: 5px 0;overflow: hidden;word-wrap: break-word;}';
            html += '.message-line-text {text-align: center;width: 100%;border-bottom: 1px dashed #ccc;line-height: 0px;padding-top: 15px;clear: both;}';
            html += '.message-line-text span {background-color: #e9eef0;padding: 0 10px;}';

            html += "@media print{ #printBtn{display:none}";
            html += '.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}';
            html += '.message-panel p.ng-binding {margin: 0 !important;}';
            html += '.message-scroll-panel {max-height: calc( 100vh - 310px) !important;padding: 10px !important;-webkit-border-radius: 5px;}';
            html += '.message-panel .right-block {background-color: #8c8e91;-webkit-border-radius: 5px;padding: 5px;max-width: 500px;min-width: 250px;width: inherit;float: right;display: block !important;clear: both;color: #000000 !important;margin: 5px 0;}';
            html += '.message-panel .left-block {background-color: #8c8e91;-webkit-border-radius: 5px;padding: 5px;max-width: 500px;min-width: 250px;width: inherit;display: block;clear: both;color: #000000 !important;margin: 5px 0;overflow: hidden;word-wrap: break-word;}';
            html += '.message-line-text {text-align: center;width: 100%;border-bottom: 1px dashed #ccc;line-height: 0px;padding-top: 15px;clear: both;}';
            html += '.message-line-text span {background-color: #e9eef0;padding: 0 10px;}';
            html += "}</style>";

            // html += "</style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Text Message</h1><div></div>";
            html += "<body>";
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "<div><h2 style='padding:0 0 0 10px; margin:20px 0 0 0'>" + printObj.contactName + "</h2></div>";
            if (mattername != null) {
                html += "<div><p style='padding:0 0 0 10px; margin:5px 0 0 0;font-size: 17px;'><strong>" + mattername + ":</strong> " + printObj.matterName + " </p></div>";
            }
            html += '<div class="col-md-12" style="padding: 0px 0px 100px 0px;"><div>';

            angular.forEach(printObj.threadMessages, function (item) {
                html += '<div class="message-panel">';

                if (item.titleDate != '') {
                    html += '<div class="message-line-text"><span>' + item.titleDate + '</span></div>';
                }
                if (item.isIncoming != 0) {
                    html += '<div style="display: block;clear: both;float:left;margin-top: 20px;">';
                    html += '   <span style="color:#51a7f9 !important;font-size:12px !important;margin-left: 5px;"><b>' + item.sentBy + '</b></span>';
                    if (item.documentName) {
                        html += '   <div class="left-block"><p style="white-space: pre-wrap;">' + item.documentName + '</p></div>';
                    } else {
                        html += '   <div class="left-block"><p style="white-space: pre-wrap;">' + item.messageText + '</p></div>';
                    }
                    html += '   <div style="clear: both;color:#677885 !important;font-size:12px !important;margin-left: 5px !important;">' + item.createdOn + '</div>';
                    html += '</div>';
                }
                if (item.isIncoming == 0) {
                    html += '<div style="display: block;clear: both;float:right;margin-top: 20px;">';
                    html += '   <span style="color:#f38f18 !important;font-size:12px !important;margin-right: 10px;float: right;"><b>' + item.sentBy + '</b></span>';
                    if (item.documentName) {
                        html += '   <div class="right-block"><p style="white-space: pre-wrap;">' + item.documentName + '</p></div>';
                    } else {
                        html += '   <div class="right-block"><p style="white-space: pre-wrap;">' + item.messageText + '</p></div>';
                    }
                    html += '   <div style="clear:both;padding: 0 10px !important;">';
                    if (item.sms_status != '' && item.sms_status != undefined) {
                        html += '       <div class="pull-left send-sms-txt" style="margin-right: 15px;margin-top: 2px;">Send via SMS to:' + item.sms_status + '</div>';
                    }
                    html += '       <div class="pull-right" style="color:#677885 !important;font-size:12px !important;">' + item.createdOn + '</div>';
                    html += '   </div>';
                    html += '</div>';
                }

                html += '</div>';
            });

            html += '</div></div>';

            html += "</body>";
            html += "</html>";
            return html;
        }

        /**
         * End: SMS
         */

        /**
         * Start: External Message
         */

        vm.resetExtMessagePage = resetExtMessagePage;
        function resetExtMessagePage() {
            vm.sendExtMessage = '';
            vm.ext_msg_matter_id = '';
            vm.ext_msg_contact_id = [];
        }

        vm.goToIntake = function (id) {
            $state.go("intake-overview", { 'intakeId': id });
        }

        function ext_msg_formatTypeaheadDisplay(matterid) {
            if (angular.isUndefined(matterid) || utils.isEmptyString(matterid)) {
                return undefined;
            }
            var matterInfo = _.find(vm.ext_msg_matters, function (matter) {
                return matter.matterId === matterid;
            });
            if (angular.isDefined(matterInfo) && angular.isDefined(matterInfo.matterId)) {
                vm.ext_msg_matter_id = matterInfo.matterId;
                vm.ext_msg_matter_name = utils.removeunwantedHTML(matterInfo.matterName);
                vm.ext_msg_contact = utils.removeunwantedHTML(matterInfo.contacts);
            }
            return matterInfo.matterName;
        }

        function ext_msg_searchMatters(searchString) {
            return newSidebarDataLayer.getCollaboratedMatter(searchString, vm.firmID)
                .then(function (response) {
                    if (response.length == 0) {
                        vm.ext_msg_matter_id = '';
                    }
                    vm.ext_msg_matters = response;
                    return response;
                });
        }

        function sendNewExternalMessages() {
            if (vm.externalMsgAddForm) {
                createNewExternalMsgGroup();
            } else {
                // sendNewExtMessages();
            }
        }

        function createNewExternalMsgGroup() {

            var liteUsers = [];
            var mmUsers = [{ "userId": localStorage.getItem('userId'), "lastSeen": 0 }];

            _.forEach(vm.ext_msg_contact_id, function (item) {
                var obj = {
                    "userId": item.liteUserId,
                    "lastSeen": 0,
                    "contactId": item.id
                };
                liteUsers.push(obj);
            });

            var data = {
                "caseId": vm.ext_msg_matter_id,
                "isIntake": 0,
                "firmId": vm.firmID,
                "liteUsers": liteUsers,
                "mmUsers": mmUsers,
            };

            newSidebarDataLayer.createNewExternalMsgGroup(data)
                .then(function (response) {
                    blockHideAndShow(false, false, false, true, false, false, false);
                    ext_msg_grouplistFn(true);
                    vm.ext_msg_contact_id = [];
                    vm.ext_msg_matter_id = [];
                    openExtMsgWebSocket(response, true);
                });

        }

        function openExtMsgWebSocket(threadId, grpCreatedFlag) {
            EXT_MSG_SOCKET_CONNECTION = newSidebarDataLayer.openExtMsgWebSocket(vm.firmID, threadId, EXT_MSG_SOCKET_CONNECTION);
            setNewSocketCallbacks(vm.sendExtMessage, vm.ext_msg_matter_id, vm.ext_msg_matter_name, grpCreatedFlag);
        }


        function setNewSocketCallbacks(message, matterId, matterName, grpCreatedFlag) {

            EXT_MSG_SOCKET_CONNECTION.onopen = function (event) {
                if (grpCreatedFlag) {
                    var json = {
                        "message": message ? message : '',
                        "authorId": localStorage.getItem('userId'),
                        "fromType": 1,
                        "authorName": localStorage.getItem('user_fname') + ' ' + localStorage.getItem('user_lname'),
                        "caseId": matterId,
                        "matterName": matterName
                    }
                    EXT_MSG_SOCKET_CONNECTION.send(JSON.stringify(json));
                    vm.sendExtMessage = '';
                }
            };

            /* Whenever there is a new message this function is called*/
            EXT_MSG_SOCKET_CONNECTION.onmessage = function (event) {
                var receivedMessage = JSON.parse(event.data);
                // If username is empty then assign 'Unknown' to user

                receivedMessage.authorName = (vm.firmID == receivedMessage.authorId) ? 'You' : receivedMessage.authorName;
                receivedMessage.authorName = (utils.isEmptyVal(receivedMessage.authorName)) ? 'Unknown' : receivedMessage.authorName;
                receivedMessage.username = receivedMessage.authorName;
                receivedMessage.message_type = receivedMessage.fromType;
                receivedMessage.messagetime = receivedMessage.messageDateTime;
                receivedMessage.messagecontent = receivedMessage.message;
                receivedMessage.message_side = (vm.firmID == receivedMessage.authorId) ? true : false;

                vm.messageDetails = utils.isEmptyVal(vm.messageDetails) ? [] : vm.messageDetails;


                var oldIndexDate = (vm.messageDetails.length != 0) ? moment.unix(vm.messageDetails[vm.messageDetails.length - 1].messageDateTime).format('MM/DD/YYYY') : '';
                var currentIndexDate = moment.unix(receivedMessage.messageDateTime).format('MM/DD/YYYY');
                if (oldIndexDate != currentIndexDate) {
                    receivedMessage.titleDate = currentIndexDate;
                } else {
                    receivedMessage.titleDate = "";
                }

                vm.messageDetails.push(receivedMessage);

                vm.sendExtMessage = '';
                // setTimeout(function () {
                //     $('#msg').scrollTop($('#msg')[0].scrollHeight);
                // }, 100);
                $scope.$apply();
            };

            EXT_MSG_SOCKET_CONNECTION.onerror = function (event) {
            }

            EXT_MSG_SOCKET_CONNECTION.onclose = function (event) {
            }
        }

        function closeNewExtMsgSocket() {
            if (EXT_MSG_SOCKET_CONNECTION) {
                EXT_MSG_SOCKET_CONNECTION.close();
            }
            // if (vm.selectedGroupId) {
            //     updateUserDetails(vm.selectedGroupId);
            // }
        }

        // $window.onbeforeunload = function () {
        //     if (EXT_MSG_SOCKET_CONNECTION && EXT_MSG_SOCKET_CONNECTION.readyState === WebSocket.OPEN) {
        //         EXT_MSG_SOCKET_CONNECTION.close();
        //     }
        //     if (vm.selectedGroupId) {
        //         updateUserDetails(vm.selectedGroupId);
        //     }
        //     if ($rootScope.SOCKET_NOTIFICATION &&  $rootScope.SOCKET_NOTIFICATION.readyState == WebSocket.OPEN) {
        //         $rootScope.SOCKET_NOTIFICATION.close();
        //     }
        // }

        /**
         * End: External Message
         */

        /**
        * Start: External Message List
        */


        function ext_msg_grouplistFn(grpCreatedFlag) {
            newSidebarDataLayer.getExternalMsgGroupList()
                .then(function (response) {
                    // vm.ext_msg_grouplist = response;
                    var data = response;
                    _.forEach(data, function (item) {
                        item['liteUsersNameIcon'] = _.pluck(item.liteUsers, 'fullName');
                        item['liteUsersName'] = (_.pluck(item.liteUsers, 'fullName')).join(", ");
                    });
                    vm.ext_msg_grouplist = data;
                    ext_msg_group_selectedFn(vm.ext_msg_grouplist[0], grpCreatedFlag)
                });
        }

        function ext_msg_group_selectedFn(data, grpCreatedFlag) {
            vm.ext_msg_group_selected_obj = data;
            if (!grpCreatedFlag) {
                closeNewExtMsgSocket();
            }
            newSidebarDataLayer.getExternalMsgSelectedGroupConversion(data.threadId)
                .then(function (response) {
                    // vm.messageDetails = response;
                    vm.messageDetails = formatedMessageDetails(response);
                    if (!grpCreatedFlag) {
                        openExtMsgWebSocket(data.threadId);
                    }
                });
        }


        function formatedMessageDetails(list) {
            var messageArr = [];
            _.forEach(list, function (receivedMessage) {
                receivedMessage.authorName = (vm.firmID == receivedMessage.authorId) ? 'You' : receivedMessage.authorName;
                receivedMessage.authorName = (utils.isEmptyVal(receivedMessage.authorName)) ? 'Unknown' : receivedMessage.authorName;
                receivedMessage.username = receivedMessage.authorName;
                receivedMessage.message_type = receivedMessage.fromType;
                receivedMessage.messagetime = receivedMessage.messageDateTime;
                receivedMessage.messagecontent = receivedMessage.message;
                receivedMessage.message_side = (vm.firmID == receivedMessage.authorId) ? true : false;
                // vm.messageDetails = utils.isEmptyVal(vm.messageDetails) ? [] : vm.messageDetails;
                var oldIndexDate = (list.length != 0) ? moment.unix(list[list.length - 1].messageDateTime).format('MM/DD/YYYY') : '';
                var currentIndexDate = moment.unix(receivedMessage.messageDateTime).format('MM/DD/YYYY');
                if (oldIndexDate != currentIndexDate) {
                    receivedMessage.titleDate = currentIndexDate;
                } else {
                    receivedMessage.titleDate = "";
                }

                messageArr.push(receivedMessage);
            });

            return messageArr;

        }


        //Send Message
        function onlySendNewExtMessages() {

            if (utils.isEmptyVal(vm.sendExtMessage)) {
                return;
            }

            var data = {
                "message": vm.sendExtMessage ? vm.sendExtMessage : '',
                "authorId": localStorage.getItem('userId'),
                "fromType": 1,
                "authorName": localStorage.getItem('user_fname') + localStorage.getItem('user_lname'),
                "caseId": vm.ext_msg_group_selected_obj.caseId,
                "matterName": vm.ext_msg_group_selected_obj.caseId.matterName
            }

            if (EXT_MSG_SOCKET_CONNECTION) {
                if (EXT_MSG_SOCKET_CONNECTION.readyState == 3) {
                    openExtMsgWebSocket(vm.ext_msg_group_selected_obj.ThreadId);
                    setTimeout(EXT_MSG_SOCKET_CONNECTION.send(JSON.stringify(data)), 5000);
                } else if (EXT_MSG_SOCKET_CONNECTION.readyState == 1) {
                    EXT_MSG_SOCKET_CONNECTION.send(JSON.stringify(data));
                }
            } else {
                openExtMsgWebSocket(vm.ext_msg_group_selected_obj.ThreadId);
                setTimeout(EXT_MSG_SOCKET_CONNECTION.send(JSON.stringify(data)), 5000);
            }


            /* Whenever there is a new message this function is called*/
            // EXT_MSG_SOCKET_CONNECTION.onmessage = function (event) {
            //     // console.log("Message Received");
            //     var receivedMessage = JSON.parse(event.data);
            //     // If username is empty then assign 'Unknown' to user

            //     receivedMessage.authorName = (vm.firmID == receivedMessage.authorId) ? 'You' : receivedMessage.authorName;
            //     receivedMessage.authorName = (utils.isEmptyVal(receivedMessage.authorName)) ? 'Unknown' : receivedMessage.authorName;
            //     receivedMessage.username = receivedMessage.authorName;
            //     receivedMessage.message_type = receivedMessage.fromType;
            //     receivedMessage.messagetime = receivedMessage.messageDateTime;
            //     receivedMessage.messagecontent = receivedMessage.message;
            //     receivedMessage.message_side = (vm.firmID == receivedMessage.authorId) ? true : false;

            //     vm.messageDetails = utils.isEmptyVal(vm.messageDetails) ? [] : vm.messageDetails;


            //     var oldIndexDate = (vm.messageDetails.length != 0) ? moment.unix(vm.messageDetails[vm.messageDetails.length - 1].messageDateTime).format('MM/DD/YYYY') : '';
            //     var currentIndexDate = moment.unix(receivedMessage.messageDateTime).format('MM/DD/YYYY');
            //     if (oldIndexDate != currentIndexDate) {
            //         receivedMessage.titleDate = currentIndexDate;
            //     } else {
            //         receivedMessage.titleDate = "";
            //     }

            //     vm.messageDetails.push(receivedMessage);

            //     vm.sendExtMessage = '';
            //     // setTimeout(function () {
            //     //     $('#msg').scrollTop($('#msg')[0].scrollHeight);
            //     // }, 100);
            //     $scope.$apply();
            // };


        }

        /**
        * End: External Message List
        */





        // vm.displayDataSelected = [];
        var sideBarScrollPost = null;
        vm.selectedPost = selectedPost;
        function selectedPost(obj) {
            vm.displayDataSelected = [];
            var fromNoticationcheck = sessionStorage.getItem('fromNotification');
            if (localStorage.getItem('sideBarScrollPostId') && fromNoticationcheck == "true") {
                sideBarScrollPost = JSON.parse(localStorage.getItem('sideBarScrollPostId'));
                obj = angular.copy(sideBarScrollPost);
                sessionStorage.removeItem('fromNotification');
                localStorage.removeItem('sideBarScrollPostId');
                var dataObj = _.filter(vm.displayData, function (msg) {
                    return msg.nid == obj.nid;
                });

                if (dataObj) {
                    obj = dataObj[0];
                }
                vm.displayDataSelected.push(obj);
                setTimeout(function () {
                    if (angular.isUndefined(obj)) {
                        return;
                    }
                    var container = $('#main-event'),
                        scrollTo = $('#' + obj.nid);
                    if (scrollTo.offset()) {
                        container.animate({
                            scrollTop: scrollTo.offset().top - $("#main-event").offset().top
                        }, 100);
                    }

                }, 50);
            } else {
                vm.displayDataSelected.push(obj);
            }
        }
    }

})();

(function () {
    angular.module('cloudlex.newSidebar')
        .factory('newSidebarHelper', newSidebarHelper);

    function newSidebarHelper() {
        return {
            getFiltersObj: getFiltersObj,
            getFollowObj: getFollowObj,
            getShowPostFromObj: getShowPostFromObj

        };

        function getFiltersObj(filters) {
            var formattedFilters = {};
            formattedFilters.matterID = filters.matterID;
            formattedFilters.pageNum = filters.pageNum;
            formattedFilters.is_intake = filters.is_intake;

            return formattedFilters;
        }

        function getFollowObj(filters) {
            var formattedFilters = {};
            formattedFilters.taskid = filters.post_id;
            formattedFilters.taskid = filters.follow;

            return formattedFilters;
        }

        function getShowPostFromObj(filters) {
            var formattedFilters = {};
            formattedFilters.matterID = filters.matterID;
            formattedFilters.is_intake = filters.is_intake;
            return formattedFilters;
        }
    }

})();

(function () {
    'use strict';
    angular
        .module('cloudlex.newSidebar')
        .controller('smsLimitCtrl', smsLimitCtrl);

    smsLimitCtrl.$inject = ['masterData', '$modalInstance', 'planInfo'];

    function smsLimitCtrl(masterData, $modalInstance, planInfo) {
        var vm = this;
        vm.planInfo = planInfo;
        vm.getRole = masterData.getUserRole();
        vm.is_admin = vm.getRole.is_admin;
        vm.close = close;
        function close() {
            $modalInstance.close();
        }
    }
})();
