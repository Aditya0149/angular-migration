angular.module('cloudlex.matter')
    .factory('contactFactory', ['$modal', '$http', '$q', 'contactConstants', function ($modal, $http, $q, contactConstants) {

        var contatFactory = {};

        contatFactory.addContact = function (data) {
            var deferred = $q.defer();
            /*$http({
              url: contactConstants.RESTAPI.addContact,
              method: "POST",
                    data: data,
              withCredentials: true
                }).success(function (response) {
                deferred.resolve(response);
                }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });*/

            $http.post(contactConstants.RESTAPI.addContact, data)
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;

        };

        contatFactory.getUsersInFirm = function () {
            return $http.get(contactConstants.RESTAPI.getStaffInFirmUrl);
        }

        contatFactory.getAttorneyList = function () {
            var data = { "type": "attorney" };
            var deferred = $q.defer();
            $http({
                url: contactConstants.RESTAPI.attorneyList,
                method: "GET",
                params: data,
                withCredentials: true
            }).success(function (response) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.resolve(ee);
            });

            return deferred.promise;
        }

        contatFactory.getStaffList = function () {
            var data = { "type": "staff" };
            var deferred = $q.defer();
            $http({
                url: contactConstants.RESTAPI.staffList,
                method: "GET",
                params: data,
                withCredentials: true
            }).success(function (response) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.resolve(ee);
            });

            return deferred.promise;

        };

        contatFactory.getUsersList = function () {
            var deferred = $q.defer();
            $http({
                url: contactConstants.RESTAPI.usersList,
                method: "GET",
                withCredentials: true
            }).success(function (response) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.resolve(ee);
            });

            return deferred.promise;

        };

        contatFactory.getRefferedList = function () {
            var data = {};
            var deferred = $q.defer();
            $http({
                url: contactConstants.RESTAPI.refferedList,
                method: "GET",
                params: data,
                withCredentials: true
            }).success(function (response) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.resolve(ee);
            });

            return deferred.promise;

        };

        contatFactory.getCourtList = function () {
            var deferred = $q.defer();
            $http({
                url: contactConstants.RESTAPI.courts,
                method: "GET",
                withCredentials: true,
            }).success(function (response) {
                deferred.resolve(response);
            });

            return deferred.promise;
        };

        contatFactory.getCourtContactList = function (data) {
            var deferred = $q.defer();
            $http({
                url: contactConstants.RESTAPI.courtContacts,
                method: "GET",
                params: data,
                withCredentials: true,
            }).success(function (response) {
                deferred.resolve(response);
            });

            return deferred.promise;
        };

        contatFactory.getContactsByName = function (name) {
            var url = contactConstants.RESTAPI.getContactsUrl;
            var params = { params: { 'fname': name } };
            return $http.get(url, params);
        };

        contatFactory.setNamePropForContacts = function (contacts) {
            _.forEach(contacts, function (contact) {
                contact.name = contact.firstname + " " + contact.lastname;
            });
        }

        //in our display value and model value are different for the input box
        //therefore we are formatting our display value based on the model value of the input box
        contatFactory.formatTypeaheadDisplay = function (contact) {
            if (angular.isUndefined(contact)) {
                return undefined;
            }
            //if name prop is not present concat firstname and lastname
            return (contact.name || (contact.firstname + " " + contact.lastname));
        }

        contatFactory.openContactModal = function () {
            return $modal.open({
                templateUrl: 'app/contact/add-contact.html',
                controller: 'ContactCtrl as addContact',
                backdrop: 'static',
                keyboard: false
            });
        }

        return contatFactory;

    }]);
