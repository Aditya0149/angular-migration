(function (angular) {
    'use strict';

    angular
        .module('cloudlex.report')
        .controller('ReportCtrl', ReportController)

    ReportController.$inject = ["$state", "masterData"]

    function ReportController($state, masterData) {
        var vm = this;

        vm.isActive = isActive;
        vm.changeReportView1 = changeReportView1;
        vm.sublinkstate = $state.current.name;
        vm.status = {};
        var matterPermissions = masterData.getPermissions();
        vm.matterValuatiion = _.filter(matterPermissions[0].permissions, function (per) {
            if (per.entity_id == '8') {
                return per;
            }
        });
        vm.mattersettlement = _.filter(matterPermissions[0].permissions, function (per) {
            if (per.entity_id == '9') {
                return per;
            }
        });
        var userRole = masterData.getUserRole();
        vm.isMD = userRole.role === 'Managing Partner/Attorney';
        vm.is_admin = userRole.is_admin;
        var taskStates = [
            'report.taskSummary',
            'report.taskAge'
        ];

        var documentStates = [
            'report.documentReport'
        ];

        var userStates = [
            'report.userActivity'
        ];

        (function () {
            if (taskStates.indexOf($state.current.name) > -1) {
                vm.status.tasks = true
            } else if (documentStates.indexOf($state.current.name) > -1) {
                vm.status.doc = true
            } else if (userStates.indexOf($state.current.name) > -1) {
                vm.status.user = true
            } else {
                vm.status.matters = true
            }
            //US#12586
            vm.getAccess = JSON.parse(localStorage.getItem('allFirmSetting'));
            _.forEach(vm.getAccess, function (item) {
                if (item.state == 'text_search') {
                    vm.checkAccess = item.enabled;
                }
            });
        })();


        function isActive(state) {
            var currentState = $state.current.name;
            return currentState === 'report.' + state;
        }

        function changeReportView1(stateName) {
            vm.sublinkstate = stateName;
            $state.go(stateName);
        }
    }


})(angular);




/*vm.allMatterObject = {
             "title": {
                 "displayName": "All Matter List",
                 "stateName": "report.allMatterListReport",
                 "subTitle": [
                     {
                         "displayName": "Upcoming SOLs",
                         "stateName": "report.upcomingSOLs"
                     },
                     {
                         "displayName": "Upcoming NOCs",
                         "stateName": "report.upcomingNOCs"
                     },
                     {
                         "displayName": "Matter in-took By Date",
                         "stateName": "report.matterInTookByDate"
                     },
                     {
                         "displayName": "Matter Status",
                         "stateName": "report.matterStatus"
                     },
                     {
                         "displayName": "Matter Type",
                         "stateName": "report.matterType"
                     }
                 ]
             }
         };

         vm.matterStageAgeObj = {
             "subTitle": {
                 "displayName": "Matter Stage Age",
                 "stateName": "report.allMatterListReport"
             }
         }

         vm.cntryAndVenueObj = {
             "subTitle": {
                 "displayName": "Country & Venue Summary",
                 "stateName": "report.allMatterListReport"
             }
         }

         vm.masterStatusReport = {
             "subTitle": {
                 "displayName": "Master Status Report",
                 "stateName": "report.allMatterListReport"
             }
         }

         vm.taskSummaryOjb = {
             "title": {
                 "displayName": "Task Summary",
                 "stateName": "report.allMatterListReport",
                 "subTitle": [
                     {
                         "displayName": "Status",
                         "stateName": "report.upcomingSOLs"
                     },
                     {
                         "displayName": "Priority",
                         "stateName": "report.upcomingNOCs"
                     },
                     {
                         "displayName": "Due Date",
                         "stateName": "report.upcomingNOCs"
                     }
                 ]
             }
         };*/


/*vm.reportEventObj = [
    {
        "title": {
            "displayName": "All Matter List",
            "stateName": "report.allMatterListReport"
        },
        "subTitle": [
            {
                "displayName": "Upcoming SOLs",
                "stateName": "report.upcomingSOLs"
            },
            {
                "displayName": "Upcoming NOCs",
                "stateName": "report.upcomingNOCs"
            },
            {
                "displayName": "Matter in-took By Date",
                "stateName": "report.matterInTookByDate"
            },
            {
                "displayName": "Matter Status",
                "stateName": "report.matterStatus"
            },
            {
                "displayName": "Matter Type",
                "stateName": "report.matterType"
            }
        ]
    },
    {
        "title": {
            "displayName": "Matter Stage Age",
            "stateName": "report.allMatterListReport"
        }
    },
    {
        "title": {
            "displayName": "Country & Venue Summary",
            "stateName": "report.allMatterListReport"
        }
    },
    {
        "title": {
            "displayName": "Master Status Report",
            "stateName": "report.allMatterListReport"
        }
    },
    {
        "title": {
            "displayName": "Task Summary",
            "stateName": "report.allMatterListReport"
        },
        "subTitle": [
            {
                "displayName": "Status",
                "stateName": "report.upcomingSOLs"
            },
            {
                "displayName": "Priority",
                "stateName": "report.upcomingNOCs"
            },
            {
                "displayName": "Due Date",
                "stateName": "report.upcomingNOCs"
            }
        ]
    }
]*/

