
(function () {
    'use strict';

    angular
        .module('intake.notes')
        .factory('intakeNotesDataService', intakeNotesDataService);

    intakeNotesDataService.$inject = ["$http", "$q", "globalConstants", '$filter'];

    function intakeNotesDataService($http, $q, globalConstants, $filter) {

        var serviceBase = {};
        var noteToBeEdited = {};
        serviceBase.GET_MATTER_LIST = globalConstants.intakeServiceBase + "get-intake-list";
        serviceBase.GET_GLOBAL_ALLUSERS = globalConstants.intakeServiceBaseV2 + 'GetIntakeAllUsers';
        serviceBase.GET_SIDEBAR_COMMENT = globalConstants.webServiceBase + "sidebar/notescomment/";

        if (!globalConstants.useApim) {
            serviceBase.Notes_Module = globalConstants.javaWebServiceBaseV4 + "notes";
            serviceBase.MATTER_EXPORT1 = globalConstants.javaWebServiceBaseV4 + "notes/export/[ID]?";
            serviceBase.GLOBAL_EXPORT1 = globalConstants.javaWebServiceBaseV4 + "notes/export?";
            serviceBase.GET_NOTE_CATEGORIES1 = globalConstants.javaWebServiceBaseV4 + "notes/categories";
            serviceBase.GET_NOTE_USERS1 = globalConstants.javaWebServiceBaseV4 + "notes/matter/";
        } else {
            serviceBase.Notes_Module = globalConstants.matterBase + "notes/v1";
            serviceBase.MATTER_EXPORT1 = globalConstants.matterBase + "notes/v1/export/[ID]?";
            serviceBase.GLOBAL_EXPORT1 = globalConstants.matterBase + "notes/v1/export?";
            serviceBase.GET_NOTE_CATEGORIES1 = globalConstants.matterBase + "notes/v1/categories";
            serviceBase.GET_NOTE_USERS1 = globalConstants.matterBase + "notes/v1/matter/";
        }

        var notesService = {
            setNoteToBeEdited: setNoteToBeEdited,
            getEditedNote: getEditedNote,
            getNotesCategories: getNotesCategories,
            addNote: addNote,
            editNote: editNote,
            deleteNote: deleteNote,
            getNoteUsers: getNoteUsers,
            getGlobalAllUsers: getGlobalAllUsers,
            getFilteredMyNotes: getFilteredMyNotes,
            getFilteredAllNotes: getFilteredAllNotes,
            getFilteredNotes: getFilteredNotes,
            getGlobalNotes: getGlobalNotes,
            getMatterList: getMatterList,
            exportMatterNotes: exportMatterNotes,
            customPageNum: 1,
            sidebarComment: sidebarComment
        };

        return notesService;

        function setNoteToBeEdited(note) {

            if (utils.isEmptyObj(note) || utils.isEmptyVal(note)) {
                noteToBeEdited = {};
                return;
            }

            note.mode = 'edit';
            note.note_id = note.id;
            note.matter = setMatterInfo(note);
            setIsImportant(note);
            note.notecategory_id = note.catid;
            noteToBeEdited = note;
        }

        function setMatterInfo(note) {
            return {
                matterid: note.matterid,
                name: note.mattername,
                filenumber: note.file_number
            };
        }

        function setIsImportant(note) {
            var isImp = parseInt(note.is_important);
            if (isNaN(isImp)) {
                note.is_important = (utils.isEmptyVal(note.is_important) || note.is_important == "null") ? false : true;
            } else {
                note.is_important = isImp === 1;
            }
        }

        function getEditedNote() {
            return angular.copy(noteToBeEdited);
        }

        function exportMatterNotes(params, matterId) {
            var impFiltervalue;
            if (params.impFilter == '') {
                impFiltervalue = '';
            } else if (params.impFilter == true) {
                impFiltervalue = 1;
            } else if (params.impFilter == false) {
                impFiltervalue = 0;
            }

            if (matterId == 'global') {
                var apiUrl = serviceBase.GLOBAL_EXPORT1;
            } else {
                var apiUrl = serviceBase.MATTER_EXPORT1;
            }
            var url = apiUrl;

            if (params.contactIds) {
                var ids = _.pluck(params.contactIds, 'contactid');
                params.contactIds = ids.toString();
            } else {
                params.contactIds = "";
            }

            params.pageNum = 1;
            params.pageSize = 1000;
            params.is_intake = 1;

            url = url + utils.getParamsNew(params);

            return $http({
                url: getURL(url, matterId),
                method: "GET",
                //data:popUpFilters,
                responseType: 'arraybuffer',
            })
        }

        // global notes
        function getGlobalNotes(pageNum) {
            return $http.get(serviceBase.Notes_Module,
                {
                    // withCredentials: true,
                    params: {
                        pageNum: pageNum,
                        pageSize: 9
                    }
                }).then(function (response) {
                    return response.data;
                }, function (error) {
                    return error;
                });

        }

        function getNotesCategories() {
            // var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            var deferred = $q.defer();
            $http({
                url: serviceBase.GET_NOTE_CATEGORIES1,
                method: "GET",
                // headers: token// Add params into headers
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;

        }

        function addNote(note) {
            note.is_intake = "1";

            return $http({
                url: serviceBase.Notes_Module,
                method: "POST",
                data: note
            });
        }

        function editNote(note) {
            note.is_intake = "1";
            var url = serviceBase.Notes_Module + '/' + note.note_id;
            return $http({
                url: url,
                method: "PUT",
                data: note
            });
        }
        function deleteNote(noteID) {
            var data = "intakeNoteIds=" + noteID.toString();
            var url = serviceBase.Notes_Module;
            url += '?' + data;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "DELETE",
                // withCredentials: true
            }).success(function (response) {
                deferred.resolve(response);
            }).error(function (status, headers, config) {
                deferred.reject(status);
            })
            return deferred.promise;
        }

        function getNoteUsers(matterID) {
            return $http({
                url: serviceBase.GET_NOTE_USERS1 + matterID + "/users?is_intake=1",
                method: "GET",
            });

        }

        function getGlobalAllUsers() {
            var url = serviceBase.GET_GLOBAL_ALLUSERS;
            var deferred = $q.defer();
            // var token = {
            //     'Authorization': "Bearer " + localStorage.getItem('accessToken'),
            //     'Content-type': 'application/json'
            // }
            $http({
                url: url,
                method: "GET",
                // headers: token,
            })
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;

        }

        function getFilteredNotes(matterID, params, pagenum, all) {

            if (matterID == 'global') {
                var apiUrl = serviceBase.Notes_Module + '?' + "is_intake=1";
            } else {
                var apiUrl = serviceBase.Notes_Module + '/' + matterID + '?' + "is_intake=1";
            }

            return fetchData(apiUrl, params, pagenum, all);
        }


        function getFilteredMyNotes(matterID, params, pagenum, all) {

            if (matterID == 'global') {
                var apiUrl = serviceBase.Notes_Module + '?' + "tab=myglobalnotes&is_intake=1";
            } else {
                var apiUrl = serviceBase.Notes_Module + '?' + "tab=myglobalnotes&is_intake=1" + '&matterId=' + matterID;
            }

            return fetchData(apiUrl, params, pagenum, all);
        }

        function getFilteredAllNotes(matterID, params, pagenum, all) {

            if (matterID == 'global') {
                var apiUrl = serviceBase.Notes_Module + '?' + "tab=allglobelnotes&is_intake=1";
            } else {
                var apiUrl = serviceBase.Notes_Module + '?' + "tab=allglobelnotes&is_intake=1" + '&matterId=' + matterID;
            }

            return fetchData(apiUrl, params, pagenum, all);
        }

        function fetchData(apiUrl, params, pagenum, all) {
            notesService.customPageNum = pagenum;
            var impFiltervalue;
            if (params.impFilter == '') {
                impFiltervalue = '';
            } else if (params.impFilter == true) {
                impFiltervalue = 1;
            } else if (params.impFilter == false) {
                impFiltervalue = 0;
            }

            //set params
            if (params.linked_contact) {
                var ids = _.pluck(params.linked_contact, 'contactid');
                params.contactIds = ids.toString();
            } else {
                params.contactIds = "";
            }

            var filterObj = {
                pageNum: utils.isEmptyVal(all) ? pagenum : 1,
                pageSize: utils.isEmptyVal(all) ? 9 : 9999,
                catFilter: utils.isEmptyVal(params.catFilter) ? "" : params.catFilter.toString(),
                uidFilter: utils.isEmptyVal(params.uidFilter) ? "" : params.uidFilter.toString(),
                impFilter: impFiltervalue,
                start: params.start,
                end: params.end,
                contactIds: utils.isEmptyVal(params.contactIds) ? "" : params.contactIds
            };
            var timeZone = moment.tz.guess();
            filterObj.tz = timeZone;

            var matterId = utils.isNotEmptyVal(params.matterid) ? params.matterid.matterid : "";
            if (utils.isNotEmptyVal(matterId)) {
                filterObj.matterId = matterId;
            }
            return $http.get(apiUrl,
                {
                    // withCredentials: true,
                    method: 'Get',
                    params: filterObj
                }).then(function (response) {
                    return response.data;
                }, function (error) {
                    return error;
                });
        }

        function getURL(serviceUrl, id) {
            var url = serviceUrl.replace("[ID]", id);
            return url;
        }

        function getMatterList(intakeName, migrate) {
            var dataObj = {
                "page_number": 1,
                "page_size": 1000,
                "name": intakeName,
                "is_migrated": migrate
            };
            var deferred = $q.defer();
            // var token = {
            //     'Authorization': "Bearer " + localStorage.getItem('accessToken'),
            //     'Content-type': 'application/json'
            // }
            return $http({
                url: serviceBase.GET_MATTER_LIST,
                method: "POST",
                // headers: token,
                data: dataObj
            })
                .then(function (response) {
                    if (response.data.intakeData) {
                        _.forEach(response.data.intakeData, function (item, index) {
                            item.createdDate = moment.unix(item.createdDate).utc().format('MM/DD/YYYY');
                            item.dateIntake = item.dateOfIntake ? " - " + moment.unix(item.dateOfIntake).utc().format('MM/DD/YYYY') : "";
                        });
                        return response.data.intakeData;
                    } else {
                        return [];
                    }
                }, function (error) {
                    return [];
                });
        }

        function sidebarComment(id) {
            var url = serviceBase.GET_SIDEBAR_COMMENT + id + '.json';
            return $http.get(url);
        }

    };
})();
