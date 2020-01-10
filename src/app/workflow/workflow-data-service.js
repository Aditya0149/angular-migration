
(function (angular) {

    angular.module('cloudlex.workflow')
    .factory('workFlowDataService', workFlowDataService);

    workFlowDataService.$inject = ['$http', 'globalConstants'];
    function workFlowDataService($http, globalConstants) {

        var urls = {
            workflowList: globalConstants.javaWebServiceBaseV4 + 'workflow_apply/',
            deleteWorkflow: globalConstants.javaWebServiceBaseV4 + 'workflow_apply/',
            getMatterUsers: globalConstants.webServiceBase + 'matter/getassignedusers_for_matter/',
            rolelist: globalConstants.webServiceBase+ '/practice/all_user_role'
		 };

        function getParams(params) {
            var querystring = "";
            angular.forEach(params, function(value, key) {
                querystring += key + "=" + value;
                querystring += "&";
            });
            return querystring.slice(0, querystring.length - 1);
        }

        return {
            getWorkflowList: _getWorkflowList,
            deleteWorkflow: _deleteWorkflow,
            getMatterUsers : _getMatterUsers,
            getRoleList: _getRoleList
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
            var url = urls.getMatterUsers + matterID +'.json';
            return $http.get(url);
        }

        function _deleteWorkflow(workflowIds,matterID) {
            var data = { 'workflowIds': workflowIds.toString()};
            var url = urls.deleteWorkflow +matterID+'?' + getParams(data);           
           return $http({
                url: url,
                method: "DELETE"
            });
        }
    }


})(angular);
