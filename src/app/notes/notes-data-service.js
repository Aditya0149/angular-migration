
(function () {
    'use strict';

    angular
        .module('cloudlex.notes')
        .factory('notesDataService', notesDataService);

    notesDataService.$inject = ["$http", "$q", "globalConstants", '$filter', 'newSidebarDataLayer'];

    function notesDataService($http, $q, globalConstants, $filter, newSidebarDataLayer) {

        var serviceBase = {};
        var noteToBeEdited = {};
        serviceBase.GET_MATTER_INFO = globalConstants.webServiceBase + "matter/matter_index_edit/[ID].json";
        serviceBase.GET_MATTER_LIST = globalConstants.webServiceBase + "matter/getallmatters.json";
        serviceBase.GET_SIDEBAR_COMMENT = globalConstants.webServiceBase + "sidebar/notescomment/";
        serviceBase.savePermission = globalConstants.webServiceBase + "Cloudlex-Lite/v1/lite/disable-entity-access";

        // Off-Drupal for Matter Search
        serviceBase.GET_MATTER_LIST_OFF_DRUPAL = globalConstants.javaWebServiceBaseV4 + 'matter/getallmatters';

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
            serviceBase.GET_NOTE_USERS1 = globalConstants.matterBase + "notes/v1/matter/";
            serviceBase.GET_NOTE_CATEGORIES1 = globalConstants.matterBase + "notes/v1/categories";
        }
        var notesService = {
            setNoteToBeEdited: setNoteToBeEdited,
            getEditedNote: getEditedNote,
            getNotesCategories: getNotesCategories,
            addNote: addNote,
            editNote: editNote,
            deleteNote: deleteNote,
            getNoteUsers: getNoteUsers,
            getFilteredMyNotes: getFilteredMyNotes,
            getFilteredAllNotes: getFilteredAllNotes,
            getFilteredNotes: getFilteredNotes,
            matterInfo: matterInfo,
            getGlobalNotes: getGlobalNotes,
            getMatterList: getMatterList,
            exportMatterNotes: exportMatterNotes,
            customPageNum: 1,
            sidebarComment: sidebarComment,
            getNoteAttachments: getNoteAttachments,
            saveNotePermission: saveNotePermission,
            getSmsPrint: getSmsPrint,
            composemailHtml: composemailHtml,
            getSelectedSMSThread: getSelectedSMSThread,
            setSearchableData: setSearchableData
        };

        return notesService;

        function getSelectedSMSThread(noteId, matterId) {
            var deferred = $q.defer();
            newSidebarDataLayer.getSelectedSMSThread(noteId, matterId)
                .then(function (response) {
                    var data = response;
                    var oldIndexDate;
                    var currentIndexDate;
                    var getTimeArray = globalConstants.sidebarSMSTimeDifference;
                    data.threadMessages.slice(0).forEach(function (item) {
                        if (item.isIncoming == 1) {
                            var removeRec = false;
                            var nextIncomingMsg = _.filter(data.threadMessages, function (msg) {
                                return msg.createdOn > item.createdOn && msg.isIncoming == 1;
                            });
                            if (nextIncomingMsg && nextIncomingMsg.length > 0) {
                                var diff = moment.unix(nextIncomingMsg[0].createdOn).diff(moment.unix(item.createdOn), 'seconds');
                                if (diff > getTimeArray[0] && diff < getTimeArray[1]) {
                                    var index = data.threadMessages.indexOf(nextIncomingMsg[0]);
                                    data.threadMessages[index].messageText = [item.messageText, data.threadMessages[index].messageText].join(" ");

                                    removeRec = true;
                                }
                            }
                            if (removeRec) {
                                data.threadMessages.splice(data.threadMessages.indexOf(item), 1);
                            }
                        }

                    });

                    _.forEach(data.threadMessages, function (item, index) {
                        if (index != 0) {
                            oldIndexDate = moment.unix(data.threadMessages[index - 1].createdOn).format('MM/DD/YYYY');
                        }
                        currentIndexDate = moment.unix(item.createdOn).format('MM/DD/YYYY');
                        if (oldIndexDate != currentIndexDate) {
                            item.titleDate = currentIndexDate;
                        } else {
                            item.titleDate = "";
                        }

                        if (!item.documentName && item.mediaURL) {
                            var uriArr = item.mediaURL.split('/');
                            var filename = uriArr[uriArr.length - 1];
                            var dfilename = decodeURIComponent(filename);
                            var fileNameArr = dfilename.split('.');
                            var fileExt = fileNameArr[fileNameArr.length - 1];
                            var name = fileNameArr[0];
                            var urlRegex = /((-V1-)[0-9]*)/ig;
                            item.documentName = name.replace(urlRegex, function (url) {
                                return '.' + fileExt;
                            });
                        }

                        item.ext = item.documentName ? (item.documentName).split('.').pop().toLowerCase() : null;
                        item.isImage = (item.ext && (item.ext == 'png' || item.ext == 'jpeg' || item.ext == 'jpg')) ? true : false;
                    });
                    deferred.resolve(data);
                });
            return deferred.promise;
        }

        function composemailHtml(printSelectedMatterNotes, value) {
            var html = "";
            html += '<table style="border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:10pt; margin-top:10px; width:100%" cellspacing="0" cellpadding="0" border="0"><thead><tr>';
            html += '<tbody>';
            angular.forEach(printSelectedMatterNotes, function (note) {
                note.text = _.isNull(note.text) ? '' : note.text;
                note.fname = utils.isNotEmptyVal(note.user.first_name) ? note.user.first_name : '';
                note.lname = utils.isNotEmptyVal(note.user.last_name) ? note.user.last_name : '';

                // Linkedcontact on Email compose body
                note.linkcontactfname = _.pluck(note.linked_contact, 'first_name');
                note.linkcontactlname = _.pluck(note.linked_contact, 'last_name');
                note.linkfname = utils.isNotEmptyVal(note.linkcontactfname) ? note.linkcontactfname : '';
                note.linklname = utils.isNotEmptyVal(note.linkcontactlname) ? note.linkcontactlname : '';
                note.linkfullname = note.linkfname + " " + note.linklname;

                var linkedContact = [];
                if (note.linked_contact.length > 0) {
                    _.forEach(note.linked_contact, function (item) {
                        item.last_name = (utils.isEmptyVal(item.last_name) || item.last_name == null) ? "" : item.last_name;
                        item.first_name = (utils.isEmptyVal(item.first_name) || item.first_name == null) ? "" : item.first_name;
                        linkedContact.push(item.first_name + " " + item.last_name);
                    });
                } else {
                    linkedContact = " ";
                }


                var descCheck = (note.noteCategory.category_name == null) ? "Note" : note.noteCategory.category_name;
                var noteText;
                if (note.type == 'email') {
                    noteText = note.plaintext + '<br>' + note.text;
                } else if (note.type == 'sidebar' && note.noteCategory.notecategory_id == 1003) {
                    noteText = note.displayText.replace(/(?:\r\n|\r|\n)/g, '<br>');
                } else {
                    noteText = $filter('decodeHtmlEncoding')(note.text);
                }
                html += '   <tr><td>';
                html += '<tr><td width="12%"><b>Added on: </b></td><td style="width:88%"> ' + self.getFormattedDate(note.created_date) + '</td>';
                if ((value) && note.is_intake != 1) {
                    html += '<tr><td style="width:15%"><b>File #: </b></td><td style="width:85%"> ' + note.file_number + '</td></tr>';
                    html += '<tr><td style="width:16%;vertical-align: top;"><b>Matter Name: </b></td><td style="width:84%"> ' + note.matter_name + '</td></tr>';
                }
                else if ((value) && note.is_intake == 1) {
                    html += '<tr><td style="width:16%;vertical-align: top;"><b>Intake Name: </b></td><td style="width:84%"> ' + note.matter_name + '</td></tr>';
                }
                html += '<tr><td width="12%"><b>Added by: </b></td><td style="width:88%">' + note.fname + " " + note.lname + '</td>';
                html += '<tr><td width="20%"><b>Linked contact: </b></td><td style="width:80%"> ' + utils.removeunwantedHTML(linkedContact) + '</td>';
                html += '<tr><td width="10%" style="vertical-align: top;"><b>Note: </b></td><td style="width:90%"> ' + noteText + '</td>';
                html += '<tr><td width="12%"><b>Category: </b></td><td style="width:88%"> ' + descCheck + '</td>';
                html += '</td></tr><tr><td style="height:15px">-------</td></tr>';
            });
            html += '</tbody>';
            html += '<tbody></table>';
            return html;
        }
        function getSmsPrint(threadMessages) {
            var noteText = "<div>";
            angular.forEach(threadMessages, function (item) {
                var txtToPrint = item.messageText;
                if (item.documentName) {
                    txtToPrint = item.documentName;
                }

                noteText += '<div class="message-panel">';
                noteText += '<div class="message-line-text"></div>';
                noteText += '<div>' +
                    '                                <div class="row" style="border:none !important;padding:0 !important;">' +
                    '                                    <span class="col-md-3">From :</span>' +
                    '                                    <span class="col-md-9" style="font-size:12px !important;">' +
                    '                                        <b>' + item.sentBy + '</b>' +
                    '                                    </span>' +
                    '                                </div>' +
                    '                                <div class="row" style="border:none !important;padding:0 !important;">' +
                    '                                    <span class="col-md-3">Date & Time:</span>' +
                    '                                    <span class="col-md-9" style="font-size:12px !important;">' +
                    '                                        <b>' + $filter('utcDateFilter')(item.createdOn, 'MM-DD-YYYY hh:mm A', 1, 'start') + '</b>' +
                    '                                    </span>' +
                    '                                </div>' +
                    '                                <div class="row" style="border:none !important;padding:0 !important;">' +
                    '                                    <span class="col-md-3">Message :</span>' +
                    '                                    <div class="col-md-9">' +
                    '                                        <p style="white-space: pre-wrap;">' + txtToPrint + '</p>' +
                    '                                    </div>' +
                    '                                </div>' +
                    '                            </div>';
                noteText += '</div>';
            });
            noteText += '</div>';
            return noteText;
        }


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

        function setSearchableData(note) {
            var linkedNames = "";

            _.forEach(note.linked_contact, function (linkContact) {
                var fullLinkedName = [linkContact.first_name, linkContact.last_name].join(" ");
                linkedNames += fullLinkedName + " , "
            });
            var pos = linkedNames.lastIndexOf(' ,');
            if (pos > -1) {
                linkedNames = linkedNames.substring(0, pos);
            }

            note.contact_names = linkedNames;
            linkedNames = "";

            note.addedbyuser = [note.user.first_name, note.user.last_name].join(" ");
            if (note.noteCategory.notecategory_id == 1003) {
                note.displayText = utils.extractFileNameFromUrl(note.displayText);
            }
        }

        function exportMatterNotes(params, matterId) {
            // if (params.impFilter == '') {
            //     impFiltervalue = '';
            // } else if (params.impFilter == true) {
            //     impFiltervalue = 1;
            // } else if (params.impFilter == false) {
            //     impFiltervalue = 0;
            // }

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
            params.is_intake = 0;

            url = url + utils.getParamsNew(params);

            return $http({
                url: getURL(url, matterId),
                method: "GET",
                responseType: 'arraybuffer',
            })
        }

        function getNoteAttachments(noteId, is_intake) {
            return $http({
                url: serviceBase.Notes_Module + '/' + noteId + "/documents?is_intake=" + is_intake,
            });
        }

        // global notes
        function getGlobalNotes(pageNum) {
            return $http.get(getURL(serviceBase.Notes_Module),
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

        function addNote(matterID, note) {
            var deferred = $q.defer();
            $http({
                url: serviceBase.Notes_Module,
                method: "POST",
                data: note
            }).then(function (response) {
                deferred.resolve(response.data);
            }, function (error) {
                deferred.reject(error);
            });
            return deferred.promise;
        }

        function editNote(note) {

            var url = serviceBase.Notes_Module + '/' + note.note_id;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "PUT",
                data: note
            }).then(function (response) {
                deferred.resolve(response.data);
            }, function (error) {
                deferred.reject(error);
            });
            return deferred.promise;
        }

        function deleteNote(noteID) {
            var data = "noteIds=" + noteID.toString();
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
            // var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            var deferred = $q.defer();
            $http({
                url: serviceBase.GET_NOTE_USERS1 + matterID + "/users",
                method: "GET",
                // headers: token// Add params into headers
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;

        }

        function getFilteredNotes(matterID, params, pagenum, all) {
            var apiUrl = serviceBase.Notes_Module;
            if (matterID == 'global') {

            } else {
                apiUrl += '/' + matterID;
            }
            return fetchData(apiUrl, params, pagenum, all);
        }


        function getFilteredMyNotes(matterID, params, pagenum, all) {
            if (matterID == 'global') {
                var apiUrl = serviceBase.Notes_Module + '?' + "tab=myglobalnotes";
            } else {
                var apiUrl = serviceBase.Notes_Module + '?' + "tab=myglobalnotes" + '&matterid=' + matterID;
            }

            return fetchData(apiUrl, params, pagenum, all);
        }

        function getFilteredAllNotes(matterID, params, pagenum, all) {
            if (matterID == 'global') {
                var apiUrl = serviceBase.Notes_Module + '?' + "tab=allglobelnotes";
            } else {
                var apiUrl = serviceBase.Notes_Module + '?' + "tab=allglobelnotes" + 'matterid=' + matterID;
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

        // get matter specific info
        function matterInfo(matterID) {
            var url = getURL(serviceBase.GET_MATTER_INFO, matterID);
            return $http.get(url,
                {
                    // withCredentials: true
                });
        }


        // function getMatterList(contactName) {
        //     return $http.get(serviceBase.GET_MATTER_LIST,
        //         {
        //             params: {
        //                 name: contactName
        //             }
        //         })
        //         .then(function (response) {
        //             return response.data;
        //         });
        // }

        // Java Call for matter search
        function getMatterList(name) {
            var deferred = $q.defer();
            var data = { "matter_name": name }
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: serviceBase.GET_MATTER_LIST_OFF_DRUPAL,
                method: "POST",
                headers: token,
                data: data
            }).then(function (response) {
                    _.forEach(response.data, function (data) {
                        data['category_name'] = data.category;
                        data['filenumber'] = data.file_number;
                        data['matter_sub_type_name'] = data.sub_type;
                        data['matter_type_name'] = data.type;
                        data['matterid'] = (data.matter_id).toString();
                        data['name'] = data.matter_name;
                    });
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        function sidebarComment(id) {
            var url = serviceBase.GET_SIDEBAR_COMMENT + id + '.json';
            return $http.get(url);
        }

        function saveNotePermission(data) {
            var deferred = $q.defer();
            var url = serviceBase.savePermission;
            var deferred = $q.defer();
            // var token = {
            //     'clxAuthToken': localStorage.getItem('accessToken'),
            //     'Content-type': 'application/json'
            // }
            $http({
                url: url,
                method: "PUT",
                data: data,
                // headers: token// Add params into headers
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(response);
            });
            return deferred.promise;
        }

    };
})();

