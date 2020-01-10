(function (angular) {

    angular.module('cloudlex.report')
        .controller('KeywordSearchCtrl', KeywordSearchCtrl);

    KeywordSearchCtrl.$inject = ['$scope', '$rootScope', '$state', 'mailboxDataService', 'reportFactory', 'MyTree', 'IntakeMyTree', 'notification-service', '$timeout', 'globalConstants'];
    function KeywordSearchCtrl($scope, $rootScope, $state, mailboxDataService, reportFactory, MyTree, IntakeMyTree, notificationService, $timeout, globalConstants) {

        var vm = this;
        vm.getUsers = getUsers;
        vm.getSendToList = getSendToList;
        vm.save = save;
        vm.searchText = '';
        vm.recipientsUsers = [];
        $scope.list = angular.copy(MyTree);
        //Intake My tree
        $scope.intakeList = angular.copy(IntakeMyTree);
        vm.checkedList = [];
        //Intake my tree
        vm.intakeCheckedList = [];
        $scope.checkAllNode = true;
        //Intake My tree
        $scope.checkAllIntakeNode = true;
        vm.intakeKeywordSearchEnable = globalConstants.isIntakeKeywordSearchEnable;
        vm.isIntakeDisplay = false;
        vm.selectAll = selectAll;
        vm.selectAllIntake = selectAllIntake;
        var email_id = localStorage.getItem('user_email');
        var uid = localStorage.getItem('userId');
        var intakePermission = localStorage.getItem('isIntakeActive');
        if (uid != 2) {
            var firstLastname = localStorage.getItem('user_fname') + localStorage.getItem('user_lname');
            vm.recipientsUsers.push({ 'mail': email_id, 'firstLastname': firstLastname, 'lname': localStorage.getItem('user_lname'), 'name': localStorage.getItem('user_fname'), 'uid': localStorage.getItem('userId') });
        }
        if (vm.intakeKeywordSearchEnable == true && intakePermission == "1") {
            vm.isIntakeDisplay = true;
        }
        (function () {
            getUsers();
        })();

        $rootScope.$on('checkAll', function ($event, args) {
            $scope.checkAllNode = args;
        });
        //Intake My tree
        $rootScope.$on('checkAllIntake', function ($event, args) {
            $scope.checkAllIntakeNode = args;
        });
        function selectAll(all) {
            $timeout(function () {
                _.forEach($scope.list, function (item) {
                    item.isSelected = all;
                    if (item.items && item.items.length > 0) {
                        _.forEach(item.items, function (currentItem) {
                            currentItem.isSelected = all;
                            if (currentItem.items && currentItem.items.length > 0) {
                                _.forEach(currentItem.items, function (data) {
                                    data.isSelected = all;
                                })
                            }
                        })
                    }
                });
            }, 100)

        }
        //Intake my tree
        function selectAllIntake(all) {
            $timeout(function () {
                _.forEach($scope.intakeList, function (item) {
                    item.isSelected = all;
                    if (item.items && item.items.length > 0) {
                        _.forEach(item.items, function (currentItem) {
                            currentItem.isSelected = all;
                            if (currentItem.items && currentItem.items.length > 0) {
                                _.forEach(currentItem.items, function (data) {
                                    data.isSelected = all;
                                    _.forEach(data.items, function (data) {
                                        data.isSelected = all;
                                    })
                                })
                            }
                        })
                    }
                });
            }, 100)

        }
        function getUsers() {
            mailboxDataService.getAllUsers()
                .then(function (data) {
                    vm.firmUsers = data.data;
                }, function (error) {
                    notificationService.error('Unable to retreive firm users.');
                });
        }

        function getSendToList(name) {
            if (name != '') {
                mailboxDataService.getContactSearched(name)
                    .then(function (data) {
                        vm.sendToList = [];
                        var contacts = data.data.contacts
                        _.forEach(contacts, function (dataValue, dataKey) {
                            if (dataValue.email != null && dataValue.email != 'null' && dataValue.email != '') {
                                var emials = dataValue.email.split(',');
                                _.forEach(emials, function (eValue, eKey) {
                                    var addContact = {
                                        uid: dataValue.contactid,
                                        name: dataValue.firstname,
                                        lname: dataValue.lastname,
                                        firstLastname: dataValue.firstname + " " + dataValue.lastname,
                                        mail: eValue,
                                    };
                                    vm.sendToList.push(addContact);
                                });
                            }
                        });
                        var emailVal = (/\S+@\S+\.\S+/).test(name);
                        if (emailVal) {
                            var addContact = { uid: 0, role: 'External', firstLastname: name, name: name, mail: name };
                            vm.sendToList.push(addContact);
                        }
                        _.forEach(vm.firmUsers, function (currentItem) {
                            currentItem.firstLastname = currentItem.name + " " + currentItem.lname;
                        });
                        vm.sendToList = (vm.sendToList).concat(vm.firmUsers);
                    }, function (error) {
                        notificationService.error('Unable to retreive contacts.');
                    });
            }
        }

        vm.checkAddress = function (ids) {
            var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            var validateEmail = emailRegex.test(ids[ids.length - 1].mail);
            if (!validateEmail) {
                notificationService.error("Please enter valid email address!");
            }
        }

        function save() {
            if (utils.isEmptyVal(vm.searchText)) {
                notificationService.error("Please enter text");
                return;
            }
            if (vm.recipientsUsers.length == 0) {
                notificationService.error("Please enter recipients");
                return;
            }
            if (vm.checkedList.length == 0) {
                notificationService.error("Please select search criteria");
                return;
            }
            // //intake my tree
            // if (vm.intakeCheckedList.length == 0) {
            //     notificationService.error("Please select search criteria");
            //     return;
            // }
            var selectList = [];
            _.forEach(vm.checkedList, function (item) {
                switch (item) {
                    case 'MS':
                        selectList.push(item);
                        break;
                    case 'AP':
                        selectList.push('PN', 'DN', 'ON');
                        break;
                    case 'D':
                        selectList.push('ND', 'PD', 'PI', 'MM', 'BM', 'IM', 'EM', 'LM', 'PM');
                        break;
                    case 'MN':
                        selectList.push('MN');
                        break;
                    case 'DM':
                        selectList.push('DM');
                        break;
                    default:
                        selectList.push(item);
                        break;
                }
            });

            var selectIntakeList = [];

            _.forEach(vm.intakeCheckedList, function (item) {
                switch (item) {
                    case 'INTMT':
                        selectIntakeList.push('IN', 'IC', 'LI', 'DI');
                        break;
                    case 'INTD':
                        selectIntakeList.push('PB', 'SSN', 'NT', 'OC', 'PO', 'DS', 'PR', 'RC', 'ST', 'CT', 'SE', 'ZC', 'CO', 'PRN', 'PCN', 'PON', 'BN', 'VI', 'VID',
                            'ID', 'HI', 'TT', 'PD', 'VD', 'VT', 'IT', 'NI', 'BM', 'SI', 'STI', 'RD', 'PN', 'CN', 'CRD', 'SIT', 'APN', 'ACN', 'DLN', 'LTH', 'SC', 'YV', 'MV',
                            'CV', 'CLN', 'VII', 'MM', 'OV', 'ICI', 'OYV', 'OMV', 'OCV', 'OPC', 'OCN', 'TM', 'DH', 'IS', 'LR', 'IA', 'MCT', 'PE', 'MB', 'CLD', 'ND', 'BP',
                            'HWI', 'LHC', 'ILD', 'DJP', 'SA', 'CS', 'SB', 'SN', 'TD', 'AR', 'ISC', 'PRI', 'EGH', 'TAD', 'IM');
                        break;
                    case 'NL':
                        selectIntakeList.push('PB', 'SSN', 'NT');
                        break;
                    case 'INTEED':
                        selectIntakeList.push('OC', 'PO', 'DS', 'PR');
                        break;
                    case 'INTIND':
                        selectIntakeList.push('RC', 'ST', 'CT', 'SE', 'ZC', 'CO', 'PRN', 'PCN', 'PON', 'BN', 'VI', 'VID',
                            'ID', 'HI', 'TT', 'PD', 'VD', 'VT', 'IT', 'NI', 'BM', 'SI', 'STI', 'RD');
                        break;
                    case 'INTID':
                        selectIntakeList.push('PN', 'CN', 'CRD', 'SIT', 'APN', 'ACN', 'DLN', 'LTH', 'SC', 'YV', 'MV',
                            'CV', 'CLN', 'VII', 'MM', 'OV', 'ICI', 'OYV', 'OMV', 'OCV', 'OPC', 'OCN');
                        break;
                    case 'INTAI':
                        selectIntakeList.push('APN', 'ACN', 'DLN', 'LTH', 'SC', 'YV', 'MV',
                            'CV', 'CLN', 'VII', 'MM', 'OV', 'ICI');
                        break;
                    case 'INTODI':
                        selectIntakeList.push('OYV', 'OMV', 'OCV', 'OPC', 'OCN');
                        break;
                    case 'INTMMS':
                        selectIntakeList.push('TM', 'DH', 'IS', 'LR', 'IA', 'MCT', 'PE', 'MB');
                        break;
                    case 'INTOD':
                        selectIntakeList.push('CLD', 'ND', 'BP',
                            'HWI', 'LHC', 'ILD', 'DJP', 'SA', 'CS', 'SB', 'SN', 'TD', 'AR', 'ISC', 'PRI', 'EGH', 'TAD');
                        break;
                    case 'IM':
                        selectIntakeList.push('IM');
                        break;
                    case 'IN':
                        selectIntakeList.push('IN');
                        break;
                    case 'IC':
                        selectIntakeList.push('IC');
                        break;
                    case 'LI':
                        selectIntakeList.push('LI');
                        break;
                    case 'DI':
                        selectIntakeList.push('DI');
                        break;
                    case 'PB':
                        selectIntakeList.push('PB');
                        break;
                    case 'SSN':
                        selectIntakeList.push('SSN');
                        break;
                    case 'NT':
                        selectIntakeList.push('NT');
                        break;
                    case 'OC':
                        selectIntakeList.push('OC');
                        break;
                    case 'PO':
                        selectIntakeList.push('PO');
                        break;
                    case 'DS':
                        selectIntakeList.push('DS');
                        break;
                    case 'PR':
                        selectIntakeList.push('PR');
                        break;
                    case 'RC':
                        selectIntakeList.push('RC');
                        break;
                    case 'ST':
                        selectIntakeList.push('ST');
                        break;
                    case 'CT':
                        selectIntakeList.push('CT');
                        break;
                    case 'SE':
                        selectIntakeList.push('SE');
                        break;
                    case 'ZC':
                        selectIntakeList.push('ZC');
                        break;
                    case 'CO':
                        selectIntakeList.push('CO');
                        break;
                    case 'PRN':
                        selectIntakeList.push('PRN');
                        break;
                    case 'PCN':
                        selectIntakeList.push('PCN');
                        break;
                    case 'PON':
                        selectIntakeList.push('PON');
                        break;
                    case 'BN':
                        selectIntakeList.push('BN');
                        break;
                    case 'VI':
                        selectIntakeList.push('VI');
                        break;
                    case 'VID':
                        selectIntakeList.push('VID');
                        break;
                    case 'ID':
                        selectIntakeList.push('ID');
                        break;
                    case 'HI':
                        selectIntakeList.push('HI');
                        break;
                    case 'TT':
                        selectIntakeList.push('TT');
                        break;
                    case 'PD':
                        selectIntakeList.push('PD');
                        break;
                    case 'VD':
                        selectIntakeList.push('VD');
                        break;
                    case 'VT':
                        selectIntakeList.push('VT');
                        break;
                    case 'IT':
                        selectIntakeList.push('IT');
                        break;
                    case 'NI':
                        selectIntakeList.push('NI');
                        break;
                    case 'BM':
                        selectIntakeList.push('BM');
                        break;
                    case 'SI':
                        selectIntakeList.push('SI');
                        break;
                    case 'STI':
                        selectIntakeList.push('STI');
                        break;
                    case 'RD':
                        selectIntakeList.push('RD');
                        break;
                    case 'HID':
                        selectIntakeList.push('PN', 'CN', 'CRD', 'SIT');
                        break;
                    case 'PN':
                        selectIntakeList.push('PN');
                        break;
                    case 'CN':
                        selectIntakeList.push('CN');
                        break;
                    case 'CRD':
                        selectIntakeList.push('CRD');
                        break;
                    case 'SIT':
                        selectIntakeList.push('SIT');
                        break;
                    case 'APN':
                        selectIntakeList.push('APN');
                        break;
                    case 'ACN':
                        selectIntakeList.push('ACN');
                        break;
                    case 'DLN':
                        selectIntakeList.push('DLN');
                        break;
                    case 'LTH':
                        selectIntakeList.push('LTH');
                        break;
                    case 'SC':
                        selectIntakeList.push('SC');
                        break;
                    case 'YV':
                        selectIntakeList.push('YV');
                        break;
                    case 'MV':
                        selectIntakeList.push('MV');
                        break;
                    case 'CV':
                        selectIntakeList.push('CV');
                        break;
                    case 'CLN':
                        selectIntakeList.push('CLN');
                        break;
                    case 'VII':
                        selectIntakeList.push('VII');
                        break;
                    case 'MM':
                        selectIntakeList.push('MM');
                        break;
                    case 'OV':
                        selectIntakeList.push('OV');
                        break;
                    case 'ICI':
                        selectIntakeList.push('ICI');
                        break;
                    case 'OYV':
                        selectIntakeList.push('OYV');
                        break;
                    case 'OMV':
                        selectIntakeList.push('OMV');
                        break;
                    case 'OCV':
                        selectIntakeList.push('OCV');
                        break;
                    case 'OPC':
                        selectIntakeList.push('OPC');
                        break;
                    case 'OCN':
                        selectIntakeList.push('OCN');
                        break;
                    case 'TM':
                        selectIntakeList.push('TM');
                        break;
                    case 'DH':
                        selectIntakeList.push('DH');
                        break;
                    case 'IS':
                        selectIntakeList.push('IS');
                        break;
                    case 'LR':
                        selectIntakeList.push('LR');
                        break;
                    case 'IA':
                        selectIntakeList.push('IA');
                        break;
                    case 'MCT':
                        selectIntakeList.push('MCT');
                        break;
                    case 'PE':
                        selectIntakeList.push('PE');
                        break;
                    case 'MB':
                        selectIntakeList.push('MB');
                        break;
                    case 'CLD':
                        selectIntakeList.push('CLD');
                        break;
                    case 'ND':
                        selectIntakeList.push('ND');
                        break;
                    case 'BP':
                        selectIntakeList.push('BP');
                        break;
                    case 'HWI':
                        selectIntakeList.push('HWI');
                        break;
                    case 'LHC':
                        selectIntakeList.push('LHC');
                        break;
                    case 'ILD':
                        selectIntakeList.push('ILD');
                        break;
                    case 'DJP':
                        selectIntakeList.push('DJP');
                        break;
                    case 'SA':
                        selectIntakeList.push('SA');
                        break;
                    case 'CS':
                        selectIntakeList.push('CS');
                        break;
                    case 'SB':
                        selectIntakeList.push('SB');
                        break;
                    case 'SN':
                        selectIntakeList.push('SN');
                        break;
                    case 'TD':
                        selectIntakeList.push('TD');
                        break;
                    case 'AR':
                        selectIntakeList.push('AR');
                        break;
                    case 'ISC':
                        selectIntakeList.push('ISC');
                        break;
                    case 'PRI':
                        selectIntakeList.push('PRI');
                        break;
                    case 'EGH':
                        selectIntakeList.push('EGH');
                        break;
                    case 'TAD':
                        selectIntakeList.push('TAD');
                        break;
                    case 'INT':
                        selectIntakeList.push(item);
                        break;
                }
            });
            var finalObj = {};
            finalObj.search_text = vm.searchText;
            finalObj.email = _.pluck(vm.recipientsUsers, 'mail').toString();
            finalObj.entity = selectList.toString();
            if (vm.intakeKeywordSearchEnable == true && intakePermission == "1") {
                finalObj.intake_entity = selectIntakeList.toString();
            }
            reportFactory.textSearch(finalObj)
                .then(function (response) {
                    notificationService.success("Search criteria accepted. The report will be emailed to you shortly.");
                    vm.searchText = '';
                    vm.recipientsUsers = [];
                    vm.checkedList = [];
                    vm.intakeCheckedList = [];
                    $state.reload();
                })
        }


        // vm.nodes = [
        //     {
        //         id: 2, name: 'Matter', checked: true, showChild: false,

        //         children: [
        //             { id: 1, name: 'Matter Summary', checked: true, entity: 'MS' },
        //         ]
        //     },

        //     {
        //         id: 3, name: 'All Parties', checked: true, showChild: false,

        //         children: [
        //             { id: 9, name: 'Plaintiff Note', checked: true, entity: 'PN' },
        //             { id: 17, name: 'Defendant Note', checked: true, entity: 'DN' },
        //             { id: 18, name: 'Other Parties Note', checked: true, entity: 'ON' },
        //         ]
        //     },
        //     {
        //         id: 4, name: 'Details', checked: true, showChild: false,
        //         children: [{
        //             id: 1, name: 'Negligence-Liability', checked: true, showGrandChild: false,
        //             children: [
        //                 {
        //                     id: 3, name: 'Negligence-Liability Description', checked: true, entity: 'ND'
        //                 },
        //                 {
        //                     id: 4, name: 'Property Damage Details', checked: true, entity: 'PD'
        //                 }
        //             ]
        //         },
        //         {
        //             id: 13, name: 'Medical Information', checked: true, showGrandChild: false,
        //             children: [
        //                 { id: 5, name: 'Plaintiff bodily injury', checked: true, entity: 'PI' },
        //                 { id: 6, name: 'Memo', checked: true, entity: 'MM' },
        //             ]
        //         },
        //         {
        //             id: 14, name: 'Medical Bill', checked: true, showGrandChild: false,
        //             children: [
        //                 { id: 7, name: 'Memo', checked: true, entity: 'BM' },
        //             ]
        //         },
        //         {
        //             id: 5, name: 'Insurance', checked: true, showGrandChild: false,
        //             children: [
        //                 { id: 8, name: 'Memo', checked: true, entity: 'IM' },
        //             ]
        //         },
        //         {
        //             id: 6, name: 'Liens', checked: true, showGrandChild: false,
        //             children: [
        //                 { id: 9, name: 'Memo', checked: true, entity: 'LM' },
        //             ]
        //         },
        //         {
        //             id: 7, name: 'Expenses', checked: true, showGrandChild: false,
        //             children: [
        //                 { id: 10, name: 'Memo', checked: true, entity: 'EM' },
        //             ]
        //         },
        //         {
        //             id: 8, name: 'Settlement', checked: true, showGrandChild: false,
        //             children: [
        //                 { id: 11, name: 'Payment details Memo', checked: true, entity: 'PM' },
        //             ]
        //         }
        //         ],
        //     },
        //     {
        //         id: 15, name: 'Notes', checked: true, entity: 'MN'
        //     },
        //     {
        //         id: 16, name: 'All Document Memos', checked: true, entity: 'DM'
        //     }

        // ];

        // vm.toggleFlag = function (item, fromWhere) {
        //     if (fromWhere == 'child') {
        //         item.showChild = !item.showChild;
        //     } else {
        //         item.showGrandChild = !item.showGrandChild;
        //     }
        // }

        // vm.checkChange = function (node, from) {
        //     if (from == 'child') {
        //         var checkAll = _.some(node.children, function (item) {
        //             return item.checked == false;
        //         });
        //     } else {

        //     }

        //     if (checkAll) {
        //         node.checked = false;
        //     } else {
        //         node.checked = true;
        //     }
        // }

        vm.checkAddress = function (ids) {
            var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            var validateEmail = emailRegex.test(ids[ids.length - 1].mail);
            if (!validateEmail) {
                notificationService.error("Please enter valid email address!");
            }
        }

        // vm.selectAllNodes = function (node) {
        //     if (node.checked) {
        //         _.forEach(node.children, function (item) {
        //             item.checked = true;
        //             if (item.children && item.children.length > 0) {
        //                 _.forEach(item.children, function (child) {
        //                     child.checked = true;
        //                 })
        //             }
        //         })
        //     } else {
        //         _.forEach(node.children, function (item) {
        //             item.checked = false;
        //             if (item.children && item.children.length > 0) {
        //                 _.forEach(item.children, function (child) {
        //                     child.checked = false;
        //                 })
        //             }
        //         })
        //     }

        // }

    }

})(angular);
