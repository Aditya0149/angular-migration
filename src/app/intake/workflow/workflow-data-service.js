
(function (angular) {

    angular.module('intake.workflow')
        .factory('intakeworkFlowDataService', workFlowDataService);

    workFlowDataService.$inject = ['$http', 'globalConstants', '$q'];
    function workFlowDataService($http, globalConstants, $q) {

        var urls = {
            workflowList: globalConstants.intakeServiceBaseV2 + 'workflow/workflow_apply/',
            deleteWorkflow: globalConstants.intakeServiceBaseV2 + 'workflow/',
            getMatterUsers: globalConstants.intakeServiceBaseV2 + 'matter/getassignedusers_for_matter/',
            rolelist: globalConstants.intakeServiceBaseV2 + '/practice/all_user_role',
            assignedUserUrl: globalConstants.intakeServiceBaseV2 + 'staffsinfirm'
        };

        function getParams(params) {
            var querystring = "";
            angular.forEach(params, function (value, key) {
                querystring += key + "=" + value;
                querystring += "&";
            });
            return querystring.slice(0, querystring.length - 1);
        }

        return {
            getWorkflowList: _getWorkflowList,
            deleteWorkflow: _deleteWorkflow,
            getMatterUsers: _getMatterUsers,
            getRoleList: _getRoleList,
            getAssignedUserData: _getAssignedUserData
        };

        function _getRoleList() {
            var url = urls.rolelist;
            return $http.get(url);
        }

        function _getWorkflowList(matterID) {
            var url = urls.workflowList + matterID;
            return $http.get(url);
        }

        function _getMatterUsers(matterID) {
            var url = urls.getMatterUsers + matterID + '.json';
            return $http.get(url);
        }

        function _getAssignedUserData(requestFilters) {

            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            var url = urls.assignedUserUrl;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                withCredentials: true,
                headers: token
            }).success(function (response) {
                deferred.resolve(response);
            });
            return deferred.promise;
        }

        function _deleteWorkflow(workflowIds, matterID) {
            var data = { 'workflowIds': workflowIds.toString() };
            var url = urls.deleteWorkflow + matterID + '?' + getParams(data);
            return $http({
                url: url,
                method: "DELETE"
            });
        }
    }


})(angular);
