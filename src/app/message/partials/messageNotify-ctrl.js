/* Message controller*/
(function () {

    'use strict';

    angular
        .module('cloudlex.message')
        .controller('MessageNotifyCtrl', MessageNotifyCtrl);

    MessageNotifyCtrl.$inject = ['$rootScope', '$modalInstance', 'messaged', 'messageFactory', 'notification-service', 'masterData', 'matterFactory'];

    function MessageNotifyCtrl($rootScope, $modalInstance, messaged, messageFactory, notificationService, masterData, matterFactory) {
        var vm = this;
        vm.searchMatters = searchMatters;
        vm.formatTypeaheadDisplay = formatTypeaheadDisplay;
        vm.filterObj = {};
        vm.closePopUp = closePopUp;
        vm.sendMessages = sendMessages;
        vm.getNotifyDetails = getNotifyDetails;
        vm.getMessageDetails = getMessageDetails;
        vm.pageSize = 50;
        vm.date = new Date();
        vm.todayDate = moment(vm.date).format('MM/DD/YYYY');
        vm.todayTime = moment(vm.date).format('HH:mm a');
        vm.messageMatterId;
        // vm.client_portal = true;
        //vm.all_matter = '0';
        vm.scrollUp = scrollUp;
        vm.checkMsgId = false;
        vm.sortMessage = sortMessage;

        (function () {
            init();
        })();

        function init() {
            vm.firmId = masterData.getUserRole();
            vm.masterData = masterData.getMasterData();
            getNotifyDetails(messaged);
            getMessageDetails(vm.validMessage.matter_id);
        }


        //Function to getMessage when scroll up
        function scrollUp() {
            vm.checkMsgId = true;
            getMessageDetails(vm.getmatterId);
        }

        function sortMessage(sortedMessage) {
            //Sorting messages and update the object 
            sortedMessage = sortedMessage.sort(function (var1, var2) {
                var previous_timestamp = var1.messagetime, present_timestamp = var2.messagetime;
                if (previous_timestamp > present_timestamp)
                    return 1;
                if (previous_timestamp < present_timestamp)
                    return -1;
                return 0;
            });
            return sortedMessage;
        }


        function getMessageDetails(matterid) {
            vm.getmatterId = matterid;
            var prevMessageId = (vm.checkMsgId == false) ? '0' : vm.firstMsgId;
            messageFactory.getMessage(matterid, vm.pageSize, prevMessageId)
                .then(function (res) {
                    if (utils.isEmptyVal(res.data.data)) {
                        notificationService.error("No more messages to load");
                        return;
                    }
                    matterFactory.getMatterOverview(matterid)
                        .then(function (response) {
                            var data = response.data.matter_info[0];
                            vm.checkMessage = [{ 'matter_name': data.matter_name, 'file_number': data.file_number, 'index_number': data.index_number, 'dateofincidence': data.dateofincidence, 'intake_date': data.intake_date }]
                        })

                    if (res.data.data.length > 0) {
                        //to find the last message id for save messages.
                        vm.messageId = res.data.data[0].id;
                        vm.firstMsgId = (utils.isEmptyVal(res.data.data)) ? '0' : res.data.data[res.data.data.length - 1].id;
                        if (vm.checkMsgId == true) {
                            vm.checkMsgId = false;
                            _.forEach(res.data.data, function (key) {
                                vm.messageDetails.unshift(key);
                            });
                        } else {
                            vm.messageDetails = res.data.data;
                        }
                        // If username is empty then assign 'Unknown' to user 
                        _.forEach(vm.messageDetails, function (item) {
                            item.username = (utils.isEmptyVal(item.username)) ? 'Unknown' : item.username;
                        })

                        vm.checkType = _.filter(vm.messageDetails, function (data) {
                            return data.message_type == 'CL';
                        });
                        var sortedMessage = sortMessage(vm.messageDetails);
                        vm.messageDetails = {};
                        vm.messageDetails = sortedMessage;
                    } else {
                        return vm.messageDetails = [{ 'matter_id': matterid }];
                    }
                })
        }

        //Notification messages
        function getNotifyDetails(checkMessage) {
            vm.validMessage = checkMessage;
            vm.messageMatterId = vm.validMessage.matter_id;
        }

        function closePopUp() {
            $rootScope.$broadcast('updateMessageList', { msg: vm.messageDetails });
            $modalInstance.dismiss();

        }

        var matters = [];
        function searchMatters(matterName) {
            // var client_portal = (vm.client_portal == 0) ? "0" ? (vm.client_portal == 0) : "1";
            if (vm.client_portal == true) {
                var client_portal = 0;
            } else {
                var client_portal = 1;
            }
            vm.validMatter = "";
            return matterFactory.searchMatters(matterName, client_portal)
                .then(function (response) {
                    matters = response.data;
                    return response.data;
                });
        }

        //Save message  
        function sendMessages(messageInfo) {
            if (utils.isEmptyVal(vm.sendMessage)) {
                return;
            }
            vm.sendMessageDetail = {};
            vm.sendMessageDetail.matter_id = messageInfo[0].matter_id;
            vm.sendMessageDetail.message = vm.sendMessage;
            vm.sendMessageDetail.last_msg_id = (utils.isEmptyVal(vm.messageDetails)) ? '0' : vm.messageId;

            messageFactory.saveMessage(vm.sendMessageDetail)
                .then(function (response) {
                    var data = response.data;
                    // If username is empty then assign 'Unknown' to user 
                    _.forEach(data, function (item) {
                        item.username = (utils.isEmptyVal(item.username)) ? 'Unknown' : item.username;
                    })
                    //update the get obj show msessage on grid
                    _.forEach(data, function (item, index) {
                        vm.messageDetails.push(item);
                        (index == data.length - 1) ? vm.messageId = item.id : '';
                    })
                    vm.sendMessage = '';
                }, function (error) {
                    if (error.status == 406) {
                        notificationService.error(error.data[0]);
                        vm.sendMessage = '';
                        return;
                    }
                    notificationService.error("Unable to send Message");
                })
        }

        function formatTypeaheadDisplay(matterid) {
            if (angular.isUndefined(matterid) || utils.isEmptyString(matterid)) {
                return undefined;
            }
            vm.validMatter = _.find(matters, function (matter) {
                return matter.matterid === matterid;
            });
            var matterInfo = _.find(matters, function (matter) {
                return matter.matterid === matterid;
            });
            //Get message for search matters
            getMessageDetails(matterid);

            var matterId = [{ 'matter_id': vm.messageMatterId }];
            $rootScope.$broadcast('updateMessageList', { msg: matterId });
            vm.messageMatterId = matterid;
            return matterInfo.matter_name;
        }
    }
})();


