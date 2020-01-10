
(function () {
    'use strict';

    angular
        .module('cloudlex.notes')
        .factory('launcherNotesDataService', launcherNotesDataService);

    launcherNotesDataService.$inject = ["$http", "$q", "globalConstants", '$filter'];

    function launcherNotesDataService($http, $q, globalConstants, $filter) {

        var serviceBase = {};
        if (!globalConstants.useApim) {
            serviceBase.Notes_Module = globalConstants.javaWebServiceBaseV4 + "notes";
            serviceBase.GLOBAL_EXPORT1 = globalConstants.javaWebServiceBaseV4 + "notes/export?";
            serviceBase.GET_NOTE_CATEGORIES1 = globalConstants.javaWebServiceBaseV4 + "notes/categories";
        } else {
            serviceBase.Notes_Module = globalConstants.matterBase + "notes/v1";
            serviceBase.GLOBAL_EXPORT1 = globalConstants.matterBase + "notes/v1/export?";
            serviceBase.GET_NOTE_CATEGORIES1 = globalConstants.matterBase + "notes/v1/categories";
        }

        var notesService = {
            getNotesCategories: getNotesCategories,
            deleteNote: deleteNote,
            getFilteredMyNotes: getFilteredMyNotes,
            getFilteredAllNotes: getFilteredAllNotes,
            exportMatterNotes: exportMatterNotes,
            customPageNum: 1
        };

        return notesService;

        function exportMatterNotes(params) {


            var apiUrl = serviceBase.GLOBAL_EXPORT1;
            var url = apiUrl;

            if (params.contactIds) {
                var ids = _.pluck(params.contactIds, 'contactid');
                params.contactIds = ids.toString();
            } else {
                params.contactIds = "";
            }

            var is_intake;
            if (params.showMatterEvents == '1') {
                if (params.showIntakeEvents == '1') {
                    is_intake = 2;
                } else {
                    is_intake = 0;
                }
            } else {
                if (params.showIntakeEvents == '1') {
                    is_intake = 1;
                }
            }

            delete params.showIntakeEvents;
            delete params.showMatterEvents;
            delete params.matterId;

            params.pageNum = 1;
            params.pageSize = 1000;
            params.is_intake = is_intake;

            url = url + utils.getParamsNew(params);

            return $http({
                url: url,
                method: "GET",
                responseType: 'arraybuffer',
            })
        }

        function getNotesCategories() {
            var deferred = $q.defer();
            $http({
                url: serviceBase.GET_NOTE_CATEGORIES1,
                method: "GET"
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;

        }

        function deleteNote(matterNoteIds, intakeNoteIds) {
            var data = "noteIds=" + matterNoteIds.toString() + '&intakeNoteIds=' + intakeNoteIds.toString();
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

        function getFilteredMyNotes(params, pagenum, all) {
            var is_intake;
            if (params.showMatterEvents == '1') {
                if (params.showIntakeEvents == '1') {
                    is_intake = 2;
                } else {
                    is_intake = 0;
                }
            } else {
                if (params.showIntakeEvents == '1') {
                    is_intake = 1;
                } else {
                    var deferred = $q.defer();
                    deferred.resolve({ notes: [], totalCount: 0 });
                    return deferred.promise;
                }
            }
            var apiUrl = serviceBase.Notes_Module + '?' + "tab=myglobalnotes&is_intake=" + is_intake;

            return getNotes(apiUrl, params, pagenum, all);
        }

        function getFilteredAllNotes(params, pagenum, all) {
            var is_intake;
            if (params.showMatterEvents == '1') {
                if (params.showIntakeEvents == '1') {
                    is_intake = 2;
                } else {
                    is_intake = 0;
                }
            } else {
                if (params.showIntakeEvents == '1') {
                    is_intake = 1;
                } else {
                    var deferred = $q.defer();
                    deferred.resolve({ notes: [], totalCount: 0 });
                    return deferred.promise;
                }
            }
            var apiUrl = serviceBase.Notes_Module + '?' + "tab=allglobelnotes&is_intake=" + is_intake;

            return getNotes(apiUrl, params, pagenum, all);
        }

        function getNotes(apiUrl, params, pagenum, all) {
            // check if the important value is not set, if empty ignore imp filter
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

    };
})();

