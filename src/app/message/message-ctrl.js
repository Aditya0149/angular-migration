/* Message controller*/
(function () {

    'use strict';

    angular
        .module('cloudlex.message')
        .controller('MessageController', MessageController);

    MessageController.$inject = ['$scope', '$rootScope', 'messageFactory', 'notification-service', 'masterData', 'profileDataLayer', 'matterFactory', '$location', '$anchorScroll', 'globalConstants', 'notificationDatalayer', 'searchDatalayer', '$window'];

    function MessageController($scope, $rootScope, messageFactory, notificationService, masterData, profileDataLayer, matterFactory, $location, $anchorScroll, globalConstants, notificationDatalayer, searchDatalayer, $window) {
        var vm = this;
        var socket;
        var webSocketUrl;
        var count = 0;
        var oldSocketMatterId;
        vm.searchMatters = searchMatters;
        vm.formatTypeaheadDisplay = formatTypeaheadDisplay;
        vm.filterObj = {};
        vm.closePopUp = closePopUp;
        vm.sendMessages = sendMessages;
        vm.getMessageData = getMessageData;
        vm.setSelectedMsg = setSelectedMsg;
        vm.changeSMSView = changeSMSView;
        vm.webSocketPageNum = 2;
        vm.webSocketPageSize = 5;
        vm.date = new Date();
        vm.todayDate = moment(vm.date).format('MM/DD/YYYY');
        vm.todayTime = moment(vm.date).format('HH:mm a');
        vm.checkMatter = false;
        vm.scrollUp = scrollUp;
        vm.checkMsgId = false;
        vm.client_portal = '0';
        vm.message = '1';
        vm.plaintiffMessageList = [];
        vm.plaintiffMatterList = [];
        vm.matterPlaintiffs = [];
        vm.plaintiffs = [];
        vm.allMatterList = [];
        vm.allMatter = undefined;
        vm.selected = 0;
        vm.showSelectedPlaintiffs = false;
        vm.smsSelectedPlaintiff = "";
        vm.checkChange = checkChange;
        //Start: Group-Chat-Message Client-Portal
        vm.GCFlag = false;
        vm.addGCFlag = false;
        vm.GCCFlag = false;
        vm.IGLFlag = true;
        vm.IGLSideFlag = true;
        vm.addGroupChat = addGroupChat;
        vm.saveGroupChat = saveGroupChat;
        vm.cancelGroupChat = cancelGroupChat;
        vm.goToMessageList = goToMessageList;
        vm.matterSelected = matterSelected;
        vm.sendNewMessages = sendNewMessages;
        vm.messageWindowFlag = messageWindowFlag;
        vm.updateUserDetails = updateUserDetails;
        var SOCKET_CONNECTION;
        vm.goToMessageListFromIMGL = goToMessageListFromIMGL;
        //End: Group-Chat-Message Client-Portal

        (function () {
            init();
        })();

        function init() {
            vm.firmId = masterData.getUserRole();
            setUserDetails();
            vm.masterData = masterData.getMasterData();
            getMessageNotification();
            getIncomingMessageGroupList();
            getNotificationMessageCountData();
        }

        function setUserDetails() {
            var response = profileDataLayer.getViewProfileData();
            response.then(function (data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    vm.userDetails = data[0];
                }
            });
        }
        //Function to getMessage when scroll up
        function scrollUp() {
            if (utils.isNotEmptyVal(vm.messageDetails)) {
                vm.checkMsgId = true;
                getNewMessageData(vm.getmatterId);
            }
        }

        function closePopUp() {
            $modalInstance.close();
        }

        var matters = [];
        function searchMatters(matterName) {
            var client_portal = "1";
            vm.validMatter = "";
            return searchDatalayer
                .search(matterName, "matters")
                .then(function (response) {
                    matters = response.data.data.matters;
                    return response.data.data.matters;
                });
        }

        // validate send button disablity
        vm.validate = function () {
            var smsCheck = (vm.sms == undefined) ? "0" : vm.sms;
            if (vm.selectedPlaintiffs.length > 0) {
                if (smsCheck == "0") {
                    return true;
                }
            }
            else if (vm.matterPlaintiffs.length == 0) {
                return true;
            }
            return false;
        }

        //Send Message
        function sendMessages(messageInfo, matterid) {
            if (utils.isEmptyVal(vm.sendMessage)) {
                return;
            }
            vm.sendMessageDetail = {};
            vm.sendMessageDetail.matter_id = utils.isEmptyVal(messageInfo) ? vm.getmatterId : matterid;
            vm.sendMessageDetail.message = vm.sendMessage;
            vm.sendMessageDetail.last_msg_id = (utils.isEmptyVal(vm.messageDetails)) ? '0' : vm.messageId;
            var smsCheck = (vm.sms == undefined) ? "0" : vm.sms;

            // validate sms plaintiffs are selected or not
            if (smsCheck == "1") {
                if (vm.selectedPlaintiffs.length == 0) {
                    notificationService.error("Please select plaintiffs for SMS sending!");
                    return;
                }
            }

            var messageObj = {};
            messageObj.fromUserName = vm.userDetails.fname + " " + vm.userDetails.lname;
            messageObj.firmId = (vm.firmId.firm_id) ? parseInt(vm.firmId.firm_id) : "";
            messageObj.fromType = 'CL';
            messageObj.fromUserId = (vm.firmId.uid) ? parseInt(vm.firmId.uid) : "";
            messageObj.message = vm.sendMessage;
            messageObj.matterId = utils.isEmptyVal(messageInfo) ? parseInt(vm.getmatterId) : parseInt(matterid);

            messageObj = JSON.stringify(messageObj);
            socket.send(messageObj);

            if (smsCheck == "1") {
                sendSMS(vm.selectedPlaintiffs, vm.messageId, vm.sendMessage);
            }
            // messageFactory.saveMessage(vm.sendMessageDetail)
            //     .then(function (response) {
            //         var data = response.data;
            //         // If username is empty then assign 'Unknown' to user 
            //         _.forEach(data, function (item) {
            //             item.username = (utils.isEmptyVal(item.username)) ? 'Unknown' : item.username;
            //         });

            //         _.forEach(data, function (item, index) {
            //             vm.messageDetails.push(item);
            //             (index == data.length - 1) ? vm.messageId = item.id : '';
            //         });

            //         /**
            //          * Check SMS send call
            //          */
            //         if (smsCheck == "1") {
            //             sendSMS(vm.selectedPlaintiffs, vm.messageId, vm.sendMessage);
            //         }

            //         _.forEach(vm.messageDetails, function (item, index) {
            //             var oldIndexDate = (index != 0) ? moment.unix(vm.messageDetails[index - 1].messagetime).format('MM/DD/YYYY') : '';
            //             var currentIndexDate = moment.unix(item.messagetime).format('MM/DD/YYYY');
            //             if (oldIndexDate != currentIndexDate) {
            //                 item.titleDate = currentIndexDate;
            //             } else {
            //                 item.titleDate = "";
            //             }
            //         });
            //         vm.sendMessage = '';
            //         setTimeout(function () {
            //             $('#messageList').scrollTop($('#messageList')[0].scrollHeight);
            //         }, 50);
            //     }, function (error) {
            //         //to check client portal is enable or not
            //         if (error.status == 406) {
            //             notificationService.error(error.data[0]);
            //             vm.sendMessage = '';
            //             return
            //         }
            //         notificationService.error("Unable to send Message");
            //     })
        }

        function formatTypeaheadDisplay(matter) {
            if (matter) {
                vm.getmatterId = matter.matter_id;
                vm.getMatterName = matter.matter_name;
            }
            if (angular.isUndefined(matter) || utils.isEmptyString(matter)) {
                return undefined;
            } else {
                messageWindowFlag(true, false, false, false);
            }

            vm.validMatter = _.find(matters, function (item) {
                return item.matter_id === matter.matter_id;
            });
            var matterInfo = _.find(matters, function (item) {
                return item.matter_id === matter.matter_id;
            });
            vm.checkMatter = true; //flag to enable send button
            vm.firstMsgId = 0;
            vm.messageDetails = [];
            vm.selectedGroup = 1000;
            //getMessageData(matterid, '0');
            getNewSelectedMatterPlaintiffs(matter.matter_id);
            matterFactory.getMatterOverview(matter.matter_id)
                .then(function (response) {
                    var data = response.data.matter_info[0];
                    var clUsers = response.data

                    vm.checkMessage = [{ 'matter_name': data.matter_name, 'file_number': data.file_number, 'index_number': data.index_number, 'dateofincidence': data.dateofincidence, 'intake_date': data.intake_date }]

                    var attorneys = _.pluck(clUsers.assigned_users.attorney, 'uid');
                    var paralegals = _.pluck(clUsers.assigned_users.paralegal, 'uid');
                    var partner = _.pluck(clUsers.assigned_users.partner, 'uid');
                    var smpOnly = _.pluck(clUsers.assigned_users.subscriber, 'uid');
                    var staff = _.pluck(clUsers.assigned_users.staffs, 'uid');

                    vm.clUsers = attorneys.concat(paralegals).concat(partner).concat(smpOnly).concat(staff);

                    getGroupsByMatterId(matter.matter_id);



                })
            return matterInfo.matter_name;
        }

        function sortMessage(sortedMessage) {
            //sort object in ascending order on the bases of time
            sortedMessage = sortedMessage.sort(function (var1, var2) {
                var previous_timestamp = var1.messageDateTime, present_timestamp = var2.messageDateTime;
                if (previous_timestamp > present_timestamp)
                    return 1;
                if (previous_timestamp < present_timestamp)
                    return -1;
                return 0;
            });
            return sortedMessage;
        }

        //Retrieve Message
        function getMessageData(matterid, msgId) {
            vm.getmatterId = matterid;
            var lastLoadedMessageId = 0;
            var prevMessageId = (vm.checkMsgId == true) ? vm.firstMsgId : msgId;
            messageFactory.getMessage(vm.firmId.firm_id, matterid, vm.firmId.uid, vm.pageNum, vm.pageSize)
                .then(function (res) {
                    if (oldSocketMatterId == matterid || !oldSocketMatterId) {
                        vm.pageNum++;
                    }
                    else {
                        vm.pageNum = 0;
                    }
                    if (utils.isEmptyVal(res.data.messageDetails)) {
                        notificationService.error("No more messages to load");
                        (vm.checkMsgId) ? vm.checkMsgId = false : '';
                        if (!socket) {
                            openSocket(matterid);
                            // webSocketUrl = globalConstants.webSocketServiceBase + "CloudlexMessenger/serverendpoint/" + vm.firmId.firm_id + "/" + vm.plaintiffMessageList[0].matter_id + "/" + vm.firmId.uid + "/" + localStorage.getItem('accessToken');
                            // socket = new WebSocket(webSocketUrl);
                        }
                        else {
                            if (oldSocketMatterId && oldSocketMatterId != matterid) {
                                closeSocket();
                                openSocket(matterid);
                            }


                            // webSocketUrl = globalConstants.webSocketServiceBase + "CloudlexMessenger/serverendpoint/" + vm.firmId.firm_id + "/" + vm.plaintiffMessageList[0].matter_id + "/" + vm.firmId.uid + "/" + localStorage.getItem('accessToken');
                            // socket = new WebSocket(webSocketUrl); 

                        }
                        // webSocketUrl = globalConstants.webSocketServiceBase + "CloudlexMessenger/serverendpoint/" + vm.firmId.firm_id + "/" + matterid + "/" + vm.firmId.uid + "/" + localStorage.getItem('accessToken');
                        // socket = new WebSocket(webSocketUrl);
                        // setSocketCallbacks();
                        return;
                    }

                    if (res.data.messageDetails.length > 0) {
                        //if user initiates message then last message id should be "0"
                        vm.messageId = res.data.messageDetails[res.data.messageDetails.length - 1].id;
                        vm.firstMsgId = (utils.isEmptyVal(res.data.messageDetails)) ? '0' : res.data.messageDetails[0].id;
                        if (vm.checkMsgId == true) {
                            //set scroll to old message location
                            lastLoadedMessageId = vm.messageDetails[0].id;
                            vm.messageDetails = _.union(vm.messageDetails, res.data.messageDetails);
                        } else {
                            vm.messageDetails = res.data.messageDetails;
                        }

                        //Object to hold fromtype CP
                        vm.checkType = _.filter(vm.messageDetails, function (data) {
                            return data.message_type == 'CL';
                        });

                        var sortedMessage = sortMessage(vm.messageDetails);
                        vm.messageDetails = {};
                        vm.messageDetails = sortedMessage;

                        // If username is empty then assign 'Unknown' to user 
                        _.forEach(vm.messageDetails, function (item, index) {
                            item.username = (utils.isEmptyVal(item.fromUserName)) ? 'Unknown' : item.fromUserName;
                            var oldIndexDate = (index != 0) ? moment.unix(vm.messageDetails[index - 1].messageDateTime).format('MM/DD/YYYY') : '';
                            var currentIndexDate = moment.unix(item.messageDateTime).format('MM/DD/YYYY');
                            if (oldIndexDate != currentIndexDate) {
                                item.titleDate = currentIndexDate;
                            } else {
                                item.titleDate = "";
                            }
                        });

                        if (vm.checkMsgId) {
                            // set scroll to last loaded message
                            $location.hash("anchor" + lastLoadedMessageId);
                            $anchorScroll();
                            setTimeout(function () {
                                window.history.replaceState({}, '#/dashboard#anchor' + lastLoadedMessageId, '#/dashboard');
                            }, 50);
                            vm.checkMsgId = false;
                        } else {
                            setTimeout(function () {
                                $('#messageList').scrollTop($('#messageList')[0].scrollHeight);
                            }, 50);
                        }

                        // update unread count of selected message
                        updateNotificationCount(matterid);

                    } else {
                        (vm.checkMsgId) ? vm.checkMsgId = false : '';
                    }

                    if (!socket) {
                        openSocket(matterid);
                        // webSocketUrl = globalConstants.webSocketServiceBase + "CloudlexMessenger/serverendpoint/" + vm.firmId.firm_id + "/" + vm.plaintiffMessageList[0].matter_id + "/" + vm.firmId.uid + "/" + localStorage.getItem('accessToken');
                        // socket = new WebSocket(webSocketUrl);
                    }
                    else {
                        if (oldSocketMatterId && oldSocketMatterId != matterid) {
                            closeSocket();
                            openSocket(matterid);
                        }


                        // webSocketUrl = globalConstants.webSocketServiceBase + "CloudlexMessenger/serverendpoint/" + vm.firmId.firm_id + "/" + vm.plaintiffMessageList[0].matter_id + "/" + vm.firmId.uid + "/" + localStorage.getItem('accessToken');
                        // socket = new WebSocket(webSocketUrl); 

                    }
                    // webSocketUrl = globalConstants.webSocketServiceBase + "CloudlexMessenger/serverendpoint/" + vm.firmId.firm_id + "/" + matterid + "/" + vm.firmId.uid + "/" + localStorage.getItem('accessToken');
                    // socket = new WebSocket(webSocketUrl);
                    // setSocketCallbacks();
                });
        }


        function openSocket(matterid) {
            webSocketUrl = globalConstants.webSocketServiceBase + "CloudlexMessenger/serverendpoint/" + vm.firmId.firm_id + "/" + matterid + "/" + vm.firmId.uid + "/" + localStorage.getItem('accessToken');
            socket = new WebSocket(webSocketUrl);
            setSocketCallbacks();
            if (!oldSocketMatterId) {
                oldSocketMatterId = matterid;
            }
        }

        setInterval(function () {
            if (socket && socket.readyState) {
                // console.log("socket = " + socket.readyState);
                // console.log("ctrl = " + $scope.$id);

            }
        }, 40000);
        /**
         * Update message notification count and 
         */
        function updateNotificationCount(matterid) {
            _.forEach(vm.plaintiffMessageList, function (currentItem, index) {
                if (currentItem.matter_id == matterid) {
                    if (currentItem.unread_count != 0) {
                        //delete matter message notification
                        messageFactory.getDeleteMessageNotification(matterid)
                            .then(function (success) {

                                // call $emit to update plaintiff message count
                                $rootScope.$emit('updateMsgCount', {});
                            }, function (error) {
                                notificationService.error("Unable to delete message notification.");
                            });
                    }
                    currentItem.unread_count = 0;
                }
            });

        }

        /**
         * message notification list
         */
        function getMessageNotification() {
            messageFactory.getPlaintiffMessageNotificationList()
                .then(function (res) {
                    if (utils.isNotEmptyVal(res.data)) {
                        vm.plaintiffMessageList = res.data.data;
                        vm.plaintiffMatterList = angular.copy(vm.plaintiffMessageList);
                        vm.plaintiffMatterList.unshift({ 'matter_id': undefined, 'matter_name': 'All matters' });
                        // check lenth on msg list and get first default selected messsage details
                        if (vm.plaintiffMessageList.length > 0) {
                            if (!socket) {
                                openSocket(vm.plaintiffMessageList[0].matter_id);
                                // webSocketUrl = globalConstants.webSocketServiceBase + "CloudlexMessenger/serverendpoint/" + vm.firmId.firm_id + "/" + vm.plaintiffMessageList[0].matter_id + "/" + vm.firmId.uid + "/" + localStorage.getItem('accessToken');
                                // socket = new WebSocket(webSocketUrl);
                            }
                            else {
                                if (oldSocketMatterId && oldSocketMatterId != vm.plaintiffMessageList[0].matter_id) {
                                    closeSocket();
                                    openSocket(vm.plaintiffMessageList[0].matter_id);
                                }


                                // webSocketUrl = globalConstants.webSocketServiceBase + "CloudlexMessenger/serverendpoint/" + vm.firmId.firm_id + "/" + vm.plaintiffMessageList[0].matter_id + "/" + vm.firmId.uid + "/" + localStorage.getItem('accessToken');
                                // socket = new WebSocket(webSocketUrl); 

                            }
                            getMessageData(vm.plaintiffMessageList[0].matter_id);
                            getSelectedMatterPlaintiffs(vm.plaintiffMessageList[0].matter_id);
                        }
                    } else { vm.messageList = []; }
                });
        }

        function setSocketCallbacks() {

            socket.onopen = function (event) {
                // console.log('Connection Established');
                // console.log(socket);
                // if (prevState != "matter.messages" && vm.matterDetails) {
                //     getMessages(vm.matterDetails);
                // }
            };

            /* Whenever there is a new message this function is called*/
            socket.onmessage = function (event) {
                // console.log("Message Received");
                var receivedMessage = JSON.parse(event.data);
                // If username is empty then assign 'Unknown' to user

                receivedMessage.fromUserName = (vm.firmId.uid == receivedMessage.fromUserId) ? 'You' : receivedMessage.fromUserName;
                receivedMessage.fromUserName = (utils.isEmptyVal(receivedMessage.fromUserName)) ? 'Unknown' : receivedMessage.fromUserName;
                receivedMessage.username = receivedMessage.fromUserName;
                receivedMessage.message_type = receivedMessage.fromType;
                receivedMessage.messagetime = receivedMessage.messageDateTime;
                receivedMessage.messagecontent = receivedMessage.message;

                vm.messageDetails = utils.isEmptyVal(vm.messageDetails) ? [] : vm.messageDetails;


                var oldIndexDate = (vm.messageDetails.length != 0) ? moment.unix(vm.messageDetails[vm.messageDetails.length - 1].messageDateTime).format('MM/DD/YYYY') : '';
                var currentIndexDate = moment.unix(receivedMessage.messageDateTime).format('MM/DD/YYYY');
                if (oldIndexDate != currentIndexDate) {
                    receivedMessage.titleDate = currentIndexDate;
                } else {
                    receivedMessage.titleDate = "";
                }

                vm.messageDetails.push(receivedMessage);

                vm.sendMessage = '';
                // setTimeout(function () {
                //     $('#msg').scrollTop($('#msg')[0].scrollHeight);
                // }, 100);
                $scope.$apply();
            };

            socket.onerror = function (event) {
                // console.log("Error Occurred");
            }

            socket.onclose = function (event) {
                if (count > 1) {
                    // console.log('Error Occurred: Error Code-' + event.code + 'Error Message: ' + event.reason);
                    // notificationService.error('Error' + event.code);
                }
                else if (event.code != 1000 && event.code != 1001) {
                    count++;
                    setTimeout(function () {
                        socket = new WebSocket(webSocketUrl);
                        setSocketCallbacks();
                    }, 1000);
                }
                else if (event.code == 1001) {//For reopening Socket Connection
                    // console.log("Socket Closed: " + event.reason)
                    setTimeout(function () {
                        socket = new WebSocket(webSocketUrl);
                        setSocketCallbacks();
                    }, 1000);
                }
            }
        }
        function closeSocket() {
            if (socket && socket.readyState && socket.readyState == 1) {
                socket.close();
                // console.log("Old Socket Closed");
            }
        }

        /*
        Function to send message if user presses enter
        */
        function checkChange($event) {
            // console.log("Here");
            if ($event.keyCode == 13 && vm.sendMessage.trim() != '' && !$event.altKey && !$event.shiftKey && !$event.ctrlKey) {
                vm.sendMessages(vm.matterDetails);
            }
            else if ($event.keyCode == 13 && ($event.altKey || $event.shiftKey || $event.ctrlKey)) {
                vm.sendMessage += '\n';
            }
        }
        /**
         * Set active class for selected message from message notification list
         */
        function setSelectedMsg(index, matter_id) {
            vm.selected = index;
            vm.getmatterId = matter_id;
            vm.firstMsgId = 0;
            getMessageData(matter_id, '0');
            getSelectedMatterPlaintiffs(matter_id);
        }

        /**
         * Get plaintiff list based on matter plaintiff message notification selection
         */
        function getSelectedMatterPlaintiffs(matter_id) {
            vm.matterPlaintiffs = [], vm.selectedPlaintiffs = [], vm.sms = "0";
            vm.plaintiffs = undefined;
            messageFactory.getMatterPlaintiffs(matter_id)
                .then(function (res) {
                    if (utils.isNotEmptyVal(res.data)) {
                        vm.matterPlaintiffs = res.data.data;

                        vm.uniqMatterPlaintiff = _.uniq(vm.matterPlaintiffs, function (item) {
                            return item.contactid.contactid;
                        });
                    } else {
                        vm.matterPlaintiffs = [];
                    }
                });
        }

        /**
         * Get plaintiff list based on matter plaintiff message notification selection
         */
        function getNewSelectedMatterPlaintiffs(matter_id) {
            vm.matterPlaintiffs = [], vm.selectedPlaintiffs = [], vm.sms = "0";
            vm.plaintiffs = undefined;
            messageFactory.getMatterPlaintiffsForMessage(matter_id)
                .then(function (res) {
                    if (utils.isNotEmptyVal(res)) {
                        vm.matterPlaintiffs = res;

                        vm.uniqMatterPlaintiff = _.uniq(vm.matterPlaintiffs, function (item) {
                            return item.user_id;
                        });

                    } else {
                        vm.matterPlaintiffs = [];
                    }
                });
        }

        /**
         * set name and label id for multiselect drop down 
         */
        function getPlaintiffForSms(plaintiffs) {
            // sort ascending order 
            plaintiffs.sort(function (a, b) {
                return a.contactid.firstname == b.contactid.firstname ? 0 : a.contactid.firstname < b.contactid.firstname ? -1 : 1;
            });
            var plaintiffsForSms = [];
            _.forEach(plaintiffs, function (plaintiffKey, index) {
                if (utils.isNotEmptyVal(plaintiffKey.contactid.phone_number)) {
                    plaintiffKey.Name = plaintiffKey.contactid.firstname + " " + plaintiffKey.contactid.lastname;
                    plaintiffKey.cellNo = utils.isNotEmptyVal(plaintiffKey.contactid.phone_number) ? plaintiffKey.contactid.phone_number : '';
                    plaintiffKey.LabelId = plaintiffKey.plaintiffid;
                    plaintiffsForSms.push(plaintiffKey);
                }
            });
            return plaintiffsForSms;
        }

        /**
         * SMS Send
         */
        function sendSMS(plaintiff_id, message_id, message_body) {
            var selectedPlaintiffs = [];
            _.forEach(plaintiff_id, function (key) {
                selectedPlaintiffs.push(key.id);
            });
            var params = {
                message_id: message_id,
                message_body: message_body,
                plaintiff_id: selectedPlaintiffs.toString()
            }
            messageFactory.sendSMS(params)
                .then(function (success) {
                    var status = [];
                    _.forEach(success.data, function (success_key) {
                        status.push(success_key.plaintiff_name);
                    });
                    vm.smsSelectedPlaintiff = status.toString();
                    _.forEach(vm.messageDetails, function (item, index) {
                        if (index == vm.messageDetails.length - 1) {
                            item.sms_status = vm.smsSelectedPlaintiff;
                        } else {
                            item.sms_status = '';
                        }
                    });
                    vm.showSelectedPlaintiffs = true;
                }, function (error) {
                    notificationService.error("Unable to send SMS!");
                });
        }

        /**
         * change SMS plaintiffs view 
         */
        function changeSMSView() {
            vm.showSelectedPlaintiffs = false;
            // vm.sms = "0";
            // vm.selectedPlaintiffs = [];
        }

        /**
         * check validation for send button 
         */
        function checkSendValidation() {
            vm.sendMessage == '' || vm.sendMessage == undefined
        }

        //Start:  Group-Chat-Message Client-Portal
        function getGroupsByMatterId(matterid) {
            messageFactory.getGroupsByMatterId(matterid)
                .then(function (response) {
                    vm.groupList = response;
                }, function (error) {
                });
        }

        function addGroupChat() {
            vm.addGCFlag = true;
            resetAddGroupChatForm();
            messageWindowFlag(false, false, true, false);
        }

        function saveGroupChat(data) {
            var obj = (data);
            var cpUsers = _.map(obj.cpUsers, function (item) { return { "userId": item } });
            var clUsers = _.map(vm.clUsers, function (item) { return { "userId": item } });

            var createNewGroup = {
                "cpUsers": cpUsers,
                "clUsers": clUsers,
                "groupTitle": obj.groupTitle,
                "caseType": "M",
                "caseId": vm.getmatterId,
                "matterName": vm.getMatterName,
            }

            messageFactory.createNewGroup(createNewGroup)
                .then(function (response) {
                    getGroupsByMatterId(vm.getmatterId);
                    messageWindowFlag(true, false, false, false);
                    resetAddGroupChatForm();
                }, function (error) {
                    messageWindowFlag(false, false, true, false);
                    resetAddGroupChatForm();
                });
        }

        function cancelGroupChat() {
            messageWindowFlag(true, false, false, false);
            resetAddGroupChatForm();
        }

        function resetAddGroupChatForm() {
            vm.createGroup = {
                groupTitle: '',
                cpUsers: []
            }
        }



        function goToMessageList(group) {
            vm.webSocketPageNum = 2;
            vm.webSocketPageSize = 5;
            if (utils.isEmptyVal(vm.selectedGroupId)) {
                vm.selectedGroupObj = group;
                vm.selectedGroupId = group.groupId;
            } else {
                closeNewSocket();
                vm.selectedGroupId = group.groupId;
            }

            messageFactory.getAllConversationHistory(group)
                .then(function (response) {
                    response = sortMessage(response);
                    _.forEach(response, function (item, index) {
                        var oldIndexDate = (index != 0) ? moment.unix(response[index - 1].messageDateTime).format('MM/DD/YYYY') : '';
                        var currentIndexDate = moment.unix(item.messageDateTime).format('MM/DD/YYYY');
                        if (oldIndexDate != currentIndexDate) {
                            item.titleDate = currentIndexDate;
                        } else {
                            item.titleDate = "";
                        }
                    });

                    vm.messageDetails = response;

                    messageWindowFlag(false, true, false, false);
                    openNewSocket(group);
                    updateUserDetails(vm.selectedGroupId);
                    // getNotificationMessageCountData();
                }, function (error) {
                });
        }



        function goToMessageListFromIMGL(group) {
            vm.webSocketPageNum = 2;
            vm.webSocketPageSize = 5;
            if (utils.isEmptyVal(vm.selectedGroupId)) {
                vm.selectedGroupId = group.groupId;
            } else {
                closeNewSocket();
                vm.selectedGroupId = group.groupId;
            }
            // getIncomingMessageGroupList();
            messageFactory.getAllConversationHistory(group)
                .then(function (response) {
                    response = sortMessage(response);
                    _.forEach(response, function (item, index) {
                        var oldIndexDate = (index != 0) ? moment.unix(response[index - 1].messageDateTime).format('MM/DD/YYYY') : '';
                        var currentIndexDate = moment.unix(item.messageDateTime).format('MM/DD/YYYY');
                        if (oldIndexDate != currentIndexDate) {
                            item.titleDate = currentIndexDate;
                        } else {
                            item.titleDate = "";
                        }
                    });

                    vm.messageDetails = response;
                    messageWindowFlag(false, true, false, false, true);
                    vm.IGLSideFlag = true;
                    openNewSocket(group, true);
                    updateUserDetails(vm.selectedGroupId);
                    // getNotificationMessageCountData();
                }, function (error) {
                });
        }

        function matterSelected(data) {
        }


        //Send Message
        function sendNewMessages() {

            if (utils.isEmptyVal(vm.sendMessage)) {
                return;
            }

            var data = {
                "fromType": "CL",
                "authorId": parseInt(vm.userDetails.uid),
                "authorName": vm.userDetails.firm_name + " " + vm.userDetails.lname,
                "firmId": parseInt(vm.firmId.firm_id),
                "matterId": parseInt(vm.getmatterId),
                "message": vm.sendMessage
            }

            if (SOCKET_CONNECTION.readyState == 3) {
                openNewSocket(vm.selectedGroupObj, false);
                setTimeout(SOCKET_CONNECTION.send(JSON.stringify(data)), 5000);
            } else {
                SOCKET_CONNECTION.send(JSON.stringify(data));
            }


            /* Whenever there is a new message this function is called*/
            SOCKET_CONNECTION.onmessage = function (event) {
                // console.log("Message Received");
                var receivedMessage = JSON.parse(event.data);
                // If username is empty then assign 'Unknown' to user

                receivedMessage.authorName = (vm.firmId.uid == receivedMessage.authorId) ? 'You' : receivedMessage.authorName;
                receivedMessage.authorName = (utils.isEmptyVal(receivedMessage.authorName)) ? 'Unknown' : receivedMessage.authorName;
                receivedMessage.authorName = receivedMessage.authorName;
                receivedMessage.fromType = receivedMessage.fromType;
                receivedMessage.messageDateTime = receivedMessage.messageDateTime;
                receivedMessage.message = receivedMessage.message;

                vm.messageDetails = utils.isEmptyVal(vm.messageDetails) ? [] : vm.messageDetails;


                var oldIndexDate = (vm.messageDetails.length != 0) ? moment.unix(vm.messageDetails[vm.messageDetails.length - 1].messageDateTime).format('MM/DD/YYYY') : '';
                var currentIndexDate = moment.unix(receivedMessage.messageDateTime).format('MM/DD/YYYY');
                if (oldIndexDate != currentIndexDate) {
                    receivedMessage.titleDate = currentIndexDate;
                } else {
                    receivedMessage.titleDate = "";
                }

                vm.messageDetails.push(receivedMessage);

                vm.sendMessage = '';
                // setTimeout(function () {
                //     $('#msg').scrollTop($('#msg')[0].scrollHeight);
                // }, 100);
                $scope.$apply();
            };


        }


        function messageWindowFlag(boolean1, boolean2, boolean3, boolean4, boolean5) {
            vm.GCFlag = boolean1;
            vm.GCCFlag = boolean2;
            vm.addGCFlag = boolean3;
            vm.IGLFlag = boolean4;
            vm.IGLSideFlag = boolean5 ? boolean5 : false;
        }

        function updateUserDetails(groupId) {
            messageFactory.updateUserDetails(vm.firmId.firm_id, vm.getmatterId, vm.userDetails.uid, groupId)
                .then(function (response) {
                    // console.log(response);
                    getNotificationMessageCountData();
                });
        }


        //Retrieve Message
        function getNewMessageData(matterid, msgId) {
            vm.getmatterId = matterid;
            var lastLoadedMessageId = 0;
            var prevMessageId = (vm.checkMsgId == true) ? vm.firstMsgId : msgId;
            messageFactory.getNewMessage(vm.selectedGroupId, vm.webSocketPageNum, vm.webSocketPageSize)
                .then(function (res) {
                    if (oldSocketMatterId == matterid || !oldSocketMatterId) {
                        vm.webSocketPageNum++;
                    }
                    else {
                        vm.webSocketPageNum = 2;
                    }
                    if (utils.isEmptyVal(res)) {
                        notificationService.error("No more messages to load");
                        (vm.checkMsgId) ? vm.checkMsgId = false : '';
                        // if (!SOCKET_CONNECTION) {
                        //     openNewSocket(group, flag) 
                        // }
                        // else {
                        //     if (oldSocketMatterId && oldSocketMatterId != matterid) {
                        //         closeNewSocket();
                        //         openNewSocket(group, flag) 
                        //     }
                        // }
                        return;
                    }

                    if (res.length > 0) {
                        //if user initiates message then last message id should be "0"
                        vm.messageId = res[res.length - 1].messageDateTime;
                        vm.firstMsgId = (utils.isEmptyVal(res)) ? '0' : res[0].messageDateTime;
                        if (vm.checkMsgId == true) {
                            if (vm.webSocketPageNum <= 3) {
                                //set scroll to old message location
                                lastLoadedMessageId = vm.messageDetails[4].messageDateTime;
                            } else {
                                lastLoadedMessageId = vm.messageDetails[0].messageDateTime;
                            }
                            vm.messageDetails = _.union(vm.messageDetails, res);
                        } else {
                            vm.messageDetails = res;
                        }

                        //Object to hold fromtype CP
                        vm.checkType = _.filter(vm.messageDetails, function (data) {
                            return data.message_type == 'CL';
                        });

                        var sortedMessage = sortMessage(vm.messageDetails);
                        vm.messageDetails = {};
                        vm.messageDetails = sortedMessage;

                        // If username is empty then assign 'Unknown' to user 
                        _.forEach(vm.messageDetails, function (item, index) {
                            item.username = (utils.isEmptyVal(item.fromUserName)) ? 'Unknown' : item.fromUserName;
                            var oldIndexDate = (index != 0) ? moment.unix(vm.messageDetails[index - 1].messageDateTime).format('MM/DD/YYYY') : '';
                            var currentIndexDate = moment.unix(item.messageDateTime).format('MM/DD/YYYY');
                            if (oldIndexDate != currentIndexDate) {
                                item.titleDate = currentIndexDate;
                            } else {
                                item.titleDate = "";
                            }
                        });

                        if (vm.checkMsgId) {
                            // set scroll to last loaded message
                            $location.hash(lastLoadedMessageId);
                            $anchorScroll();
                            setTimeout(function () {
                                window.history.replaceState({}, '#/dashboard#anchor' + lastLoadedMessageId, '#/dashboard');
                            }, 50);
                            vm.checkMsgId = false;
                        } else {
                            setTimeout(function () {
                                $('#messageList').scrollTop($('#messageList')[0].scrollHeight);
                            }, 50);
                        }

                        // update unread count of selected message
                        updateNotificationCount(matterid);

                    } else {
                        (vm.checkMsgId) ? vm.checkMsgId = false : '';
                    }

                    // if (!socket) {
                    //     openSocket(matterid);
                    // }
                    // else {
                    //     if (oldSocketMatterId && oldSocketMatterId != matterid) {
                    //         closeNewSocket();
                    //         openSocket(matterid);
                    //     }
                    // }

                });
        }

        function openNewSocket(group, flag) {

            var webScoketsessionStorageObj = {
                firmId: vm.firmId.firm_id,
                matterId: vm.getmatterId,
                userId: vm.userDetails.uid,
                groupId: group.groupId

            }
            sessionStorage.setItem("webScoketsessionStorageObj", JSON.stringify(webScoketsessionStorageObj));

            var matterId;
            if (flag) {
                vm.getmatterId = group.caseId;
                matterId = vm.getmatterId;
            } else {
                matterId = vm.getmatterId;
            }
            var socketType = 'message'; // either message or notification
            SOCKET_CONNECTION = messageFactory.openWebSocket(vm.firmId.firm_id, matterId, vm.userDetails.uid, group.groupId, socketType, SOCKET_CONNECTION);
            setNewSocketCallbacks(group, flag);
            // if (!oldSocketMatterId) {
            //     oldSocketMatterId = vm.getmatterId;
            // }
        }


        function setNewSocketCallbacks(group, flag) {

            SOCKET_CONNECTION.onopen = function (event) {
                // console.log('Connection Established');
                // console.log(event);
                // if (prevState != "matter.messages" && vm.matterDetails) {
                //     getMessages(vm.matterDetails);
                // }
            };

            /* Whenever there is a new message this function is called*/
            SOCKET_CONNECTION.onmessage = function (event) {
                // console.log("Message Received");
                var receivedMessage = JSON.parse(event.data);
                // If username is empty then assign 'Unknown' to user

                receivedMessage.fromUserName = (vm.firmId.uid == receivedMessage.fromUserId) ? 'You' : receivedMessage.fromUserName;
                receivedMessage.fromUserName = (utils.isEmptyVal(receivedMessage.fromUserName)) ? 'Unknown' : receivedMessage.fromUserName;
                receivedMessage.username = receivedMessage.fromUserName;
                receivedMessage.message_type = receivedMessage.fromType;
                receivedMessage.messagetime = receivedMessage.messageDateTime;
                receivedMessage.messagecontent = receivedMessage.message;

                vm.messageDetails = utils.isEmptyVal(vm.messageDetails) ? [] : vm.messageDetails;


                var oldIndexDate = (vm.messageDetails.length != 0) ? moment.unix(vm.messageDetails[vm.messageDetails.length - 1].messageDateTime).format('MM/DD/YYYY') : '';
                var currentIndexDate = moment.unix(receivedMessage.messageDateTime).format('MM/DD/YYYY');
                if (oldIndexDate != currentIndexDate) {
                    receivedMessage.titleDate = currentIndexDate;
                } else {
                    receivedMessage.titleDate = "";
                }

                vm.messageDetails.push(receivedMessage);

                vm.sendMessage = '';
                // setTimeout(function () {
                //     $('#msg').scrollTop($('#msg')[0].scrollHeight);
                // }, 100);
                $scope.$apply();
            };

            SOCKET_CONNECTION.onerror = function (event) {
                // console.log("Error Occurred");
            }

            SOCKET_CONNECTION.onclose = function (event) {
                // console.log("on closed " + event);
                if (count > 1) {
                    // console.log('Error Occurred: Error Code-' + event.code + 'Error Message: ' + event.reason);
                    // notificationService.error('Error' + event.code);
                }
                else if (event.code != 1000 && event.code != 1001) {
                    count++;
                    setTimeout(function () {
                        openNewSocket(group, false)
                        // setNewSocketCallbacks();
                    }, 1000);
                }
                else if (event.code == 1001) {//For reopening Socket Connection
                    // console.log("Socket Closed: " + event.reason)
                    setTimeout(function () {
                        openNewSocket(group, false)
                        // setNewSocketCallbacks();
                    }, 1000);
                }
            }
        }

        function closeNewSocket() {
            if (SOCKET_CONNECTION) {
                SOCKET_CONNECTION.close();
                // console.log("Old Socket Closed");
            }
            if (vm.selectedGroupId) {
                updateUserDetails(vm.selectedGroupId);
            }

        }

        $window.onbeforeunload = function () {
            if (SOCKET_CONNECTION && SOCKET_CONNECTION.readyState === WebSocket.OPEN) {
                SOCKET_CONNECTION.close();
            }
            if (vm.selectedGroupId) {
                updateUserDetails(vm.selectedGroupId);
            }
            if ($rootScope.SOCKET_NOTIFICATION && $rootScope.SOCKET_NOTIFICATION.readyState == WebSocket.OPEN) {
                $rootScope.SOCKET_NOTIFICATION.close();
            }
        }



        function getIncomingMessageGroupList() {
            vm.IGLFlag = true;
            notificationDatalayer.getNewMessageList()
                .then(function (res) {
                    if (utils.isNotEmptyVal(res)) {
                        //Incoming-Message-Group_list
                        vm.IMGList = res.groupDetails;
                    } else { vm.IMGList = []; }
                })
        }

        function getNotificationMessageCountData() {
            notificationDatalayer.getNewMessageList()
                .then(function (res) {
                    // console.log(res);
                    vm.messageCount = utils.isNotEmptyVal(res.TotalCount) ? res.TotalCount : 0;
                    $rootScope.$emit('messageNotificationCount', vm.messageCount);
                })
        }

        $rootScope.$on('messageList', function (event, data) {
            var arr = [];
            var msgCount = 0;
            _.forEach(data.groupDetails, function (item) {
                if (item.caseId == vm.getmatterId) {
                    arr.push(item);
                }
                if (item.groupId == vm.selectedGroupId) {
                    item.notificationCount = 0;
                }
                // if (item.caseId == vm.getmatterId) {
                if (vm.selectedGroupId) {
                    if (item.notificationCount > 0 && !(item.groupId == vm.selectedGroupId)) {
                        msgCount = msgCount + 1;
                    }
                } else {
                    if (item.notificationCount > 0) {
                        msgCount = msgCount + 1;
                    }
                }

                // }
            });

            vm.groupList = arr;
            vm.IMGList = data.groupDetails;
            vm.messageCount = utils.isNotEmptyVal(msgCount) ? msgCount : 0;
            $rootScope.$emit('messageNotificationCount', vm.messageCount);
            // $scope.apply();
        });

        /*destroy method for stop calling methods repetevly  */
        $scope.$on('$destroy', function () {
            // console.log("in $destroy ");
            closeNewSocket();
            sessionStorage.removeItem('webScoketLocalStorageObj');
        });

        //End:  Group-Chat-Message Client-Portal


    }
})();


