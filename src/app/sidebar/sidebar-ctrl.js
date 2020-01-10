(function () {
    'use strict';
    angular
        .module('cloudlex.sidebar')
        .controller('SidebarCtrl', SidebarController)
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

    SidebarController.$inject = ['$scope', '$rootScope', '$state', 'matterFactory', 'sidebarDataLayer', 'sidebarHelper',
        'notification-service', 'modalService', 'masterData', 'notificationDatalayer', 'messageFactory'];

    function SidebarController($scope, $rootScope, $state, matterFactory, sidebarDataLayer, sidebarHelper,
        notificationService, modalService, masterData, notificationDatalayer, messageFactory) {


        // On Page Refresh websocket user-update call
        if ((sessionStorage.getItem("webScoketsessionStorageObj") != 'undefined') && (sessionStorage.getItem("webScoketsessionStorageObj") != null) && (sessionStorage.getItem("webScoketsessionStorageObj") != '')) {
            var webScoketsessionStorageObj = JSON.parse(sessionStorage.getItem("webScoketsessionStorageObj"));
            messageFactory.updateUserDetails(webScoketsessionStorageObj.firmId, webScoketsessionStorageObj.matterId, webScoketsessionStorageObj.userId, webScoketsessionStorageObj.groupId)
                .then(function (response) {
                    // console.log(response);
                    getNotificationMessageCountData();
                });
            sessionStorage.removeItem('webScoketsessionStorageObj');
        }

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
        //US#4713 disable add edit delete  for grace period validity 
        var gracePeriodDetails = masterData.getUserRole();
        vm.isGraceOver = gracePeriodDetails.plan_subscription_status;

        /** Set  isPortalEnabled flag to show/hide client communicator icon **/
        if (!(angular.isDefined($rootScope.isPortalEnabled))) {
            $rootScope.isPortalEnabled = (gracePeriodDetails.client_portal == '1') ? true : false;
        }

        vm.resetPage = resetPage;
        vm.launchpad = JSON.parse(localStorage.getItem('launchpadSetting'));
        vm.launchpadAccess = (vm.launchpad.enabled == 1) ? true : false;


        vm.init = function () {
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
            vm.filters = {
                pageNum: 1,
                matterID: ''
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
            getNotificationMessageCountData();
            getAllPost();
        };

        $rootScope.$on('updateMsgCount', function (event, args) {
            // call message notification count function on loading script
            getMessageNotificationCount();
        });

        /**
         * get message notification count
         */
        function getMessageNotificationCount() {
            sidebarDataLayer.getNotificationCount()
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
            vm.clientCumDisable = false;

        }


        function singleEvent(post) {
            if (angular.isDefined(post) && angular.isDefined(post.comments) && angular.isDefined(post.comments) && post.comments.length != '') {
                vm.displaySingleCommentFlag = true;
            }
            vm.displayData.push(post);
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

        function getAllPost() {
            vm.showPostFromDataFlag = false;
            vm.moreFlag = false;
            var filterObj = sidebarHelper.getFiltersObj(vm.filters);
            var promesa = sidebarDataLayer.getAllPost(filterObj);
            promesa.then(function (posts) {
                convert(posts);
                //scroll to post start
                // var scrollPost = localStorage.getItem("sideBarScrollPostId");
                // if (utils.isNotEmptyVal(scrollPost)) {
                //     var container = $('#main-event'),
                //         scrollTo = scrollPost;
                //     container.animate({
                //         scrollTop: scrollTo.offset().top - $("#main-event").offset().top
                //     }, 100);
                //     localStorage.clear();
                // }
                //scroll to post end
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
            });
        }

        function getFollowingPost() {
            vm.indexVal = -1;
            vm.moreFlag = false;
            var filterObj = sidebarHelper.getFiltersObj(vm.filters);
            var promesa = sidebarDataLayer.getFollowingPost(filterObj);
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
            return matterInfo.name + '-' + matterInfo.filenumber;
        }

        function getTagAMatter() {
            vm.matterId = vm.getTagMatterId;
        }

        $scope.$watch(function () {
            return vm.showPostFromMatterid;
        }, function (newValue) {
            if (angular.isUndefined(newValue) || utils.isEmptyString(newValue)) {
                getAllPost();
            }
        });

        vm.searchShowPostFrom = searchShowPostFrom;
        vm.typeAHeadShowPostFrom = typeAHeadShowPostFrom;
        vm.getSHowPostFrom = getSHowPostFrom;
        var mattersForSHowPostFrom = [];

        function searchShowPostFrom(matterName) {
            return matterFactory.searchMatters(matterName)
                .then(function (response) {
                    mattersForSHowPostFrom = response.data;
                    return response.data;
                });
        }

        function typeAHeadShowPostFrom(matterid) {
            if (angular.isUndefined(matterid) || utils.isEmptyString(matterid)) {
                return undefined;
            }
            var matterInfo = _.find(mattersForSHowPostFrom, function (matter) {
                return matter.matterid === matterid;
            });
            if (angular.isDefined(matterInfo) && angular.isDefined(matterInfo.matterid)) {
                vm.showPostFromMatterid = matterInfo.matterid;
            }
            return matterInfo.name;
        }

        function getSHowPostFrom() {
            vm.showPostFromFilter.matterID = vm.showPostFromMatterid;
            var filterObj = sidebarHelper.getShowPostFromObj(vm.showPostFromFilter);
            var promesa = sidebarDataLayer.getAllPost(filterObj);
            promesa.then(function (posts) {
                vm.displayData = [];
                vm.moreFlag = false;
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

            });

        }

        function allPosts(param) {
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
            getAllPost();
        }

        function following(param) {
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
        }

        function followPost(postId, index) {
            vm.filters.pageNum = 1;
            vm.followData.post_id = postId;
            vm.followData.follow = "Follow";
            var promesa = sidebarDataLayer.postFollow(vm.followData);
            promesa.then(function (follow) {
                vm.followPostIndex = index;
                vm.displayData[index].user_following = "following";
                /* vm.displayData = [];
                 getAllPost();*/
            });
        };

        function unFollowPost(postId, index) {

            vm.filters.pageNum = 1;
            vm.followData.post_id = postId;
            vm.followData.follow = "Unfollow";
            var promesa = sidebarDataLayer.postFollow(vm.followData);
            promesa.then(function (follow) {
                //vm.displayData = [];
                if (vm.eventClick == 1) {
                    vm.followPostIndex = index;
                    vm.displayData[index].user_following = "unfollowing";
                    //getAllPost();
                } else {
                    vm.displayData.splice(index, 1);
                    vm.followingFlag = false;
                    //getFollowingPost();
                }
            });
        };

        function commentButtonClick(postId) {
            vm.addCommentFlag = true;
            vm.addCommentPostId = postId;
        };

        function cancelComment() {
            vm.addCommentFlag = false;
        };

        function saveComment(postId, index) {
            vm.addCommentData.post_id = postId;
            vm.addCommentData.comment = vm.newCommentText;
            var promesa = sidebarDataLayer.addComment(vm.addCommentData);
            promesa.then(function (posts) {
                vm.addCommentFlag = false;
                vm.displayData[index].comments = posts.data;
                vm.newCommentText = '';
            });
        };

        function deleteComment(postId, commentId, index) {
            var promesa = sidebarDataLayer.deleteComment(commentId);
            promesa.then(function (response) {
                if (angular.isDefined(response) && angular.isDefined(response.data) && response.data[0] == "Deleted") {
                    var originalDisplayData = vm.displayData;
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
                    vm.displayData = newDisplayData;
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
                var promesa = sidebarDataLayer.postCommentPost(vm.postData);
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
            sidebarDataLayer.editPost(newPost.nid, postMsg)
                .then(function (res) {
                    notificationService.success("Post edited successfully.");
                    vm.filters.pageNum = 1;
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
                sidebarDataLayer.deletePost(post.nid)
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
    }

})();

(function () {
    angular.module('cloudlex.sidebar')
        .factory('sidebarHelper', sidebarHelper);

    function sidebarHelper() {
        return {
            getFiltersObj: getFiltersObj,
            getFollowObj: getFollowObj,
            getShowPostFromObj: getShowPostFromObj

        };

        function getFiltersObj(filters) {
            var formattedFilters = {};
            formattedFilters.matterID = filters.matterID;
            formattedFilters.pageNum = filters.pageNum;

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

            return formattedFilters;
        }
    }

})();
