(function () {
    angular
        .module('cloudlex.matter')
        .controller('linkUploadDocCtrl', linkUploadDocCtrl);

    linkUploadDocCtrl.$inject = ['$rootScope', '$modalInstance', '$scope', 'usSpinnerService', 'documentsDataService', 'linkDocInfo', 'userSession', 'documentsConstants', 'notification-service', 'mailboxDataService'];

    function linkUploadDocCtrl($rootScope, $modalInstance, $scope, usSpinnerService, documentsDataService, linkDocInfo, userSession, documentsConstants, notificationService, mailboxDataService) {
        var vm = this;
        vm.selectionLists = {};
        vm.linkDocInfo = linkDocInfo.selectedItems;
        vm.linkDocInfo.type = linkDocInfo.type;
        vm.linkDocInfo.isLinkDoc = true;
        vm.singleFileName = '';
        vm.fileUpload = false;
        vm.singlefileUpload = false;
        var fileCount = 1;
        vm.matterId = (vm.linkDocInfo.matter_id || vm.linkDocInfo.matterid || vm.linkDocInfo.matter.matter_id);
        vm.initializeSingleFileDropnzone = initializeSingleFileDropnzone;
        vm.initializeSingleFileDropnzonePHP = initializeSingleFileDropnzonePHP;
        vm.processDocuments = processDocuments;
        vm.dropzoneObj;
        vm.uploadFile = uploadFile;
        vm.removeUploadingDocument = removeUploadingDocument;
        vm.resetDropzone = resetDropzone;
        vm.selectionLists.isLinkDoc = [
            { label: "Link Existing", value: true },
            { label: "Upload New", value: false }
        ];
        vm.pageSize = 250;
        var sessionalive;

        (function () {
            getDocList(vm.linkDocInfo.type);
        })();

        function resetDropzone(isLinkDoc) {
            if (!isLinkDoc) {
                if (vm.dropzoneObj) {
                    removeUploadingDocument();
                } else {
                    initializeSingleFileDropnzone();
                }
            } else {
                if (vm.dropzoneObj) {
                    removeUploadingDocument();
                }
            }
        }

        function setCatName(cat) {
            var docCategoryName;
            switch (cat) {
                case "liens":
                    docCategoryName = "Liens"
                    break;
                case 'medicalbill':
                    docCategoryName = "Medical Bills"
                    break;
                case 'insurance':
                    docCategoryName = "Insurance"
                    break;
                case 'expense':
                    docCategoryName = "Expenses"
                    break;
                case 'medicalrecord':
                    docCategoryName = "Medical Records"
                    break;
                default:
                    return false;
            }
            return docCategoryName;
        }

        function getDocList(cat) {
            var catName = setCatName(cat);
            documentsDataService.getDocumentsList(true, vm.matterId, false, '1', vm.pageSize, '1', 'asc', '', false).then(function (data) {
                vm.documentsList = data.documents;
                vm.documentsList = _.filter(vm.documentsList, function (doc) {
                    return doc.doc_category.doc_category_name == catName
                });
                //Bug#11017
                var docIds = "[" + _.pluck(vm.documentsList, 'doc_id').toString() + "]";
                mailboxDataService.getdocumentsize(docIds)
                    .then(function (response) {
                        _.forEach(vm.documentsList, function (currentItem) {
                            _.forEach(response.data, function (item) {
                                if (currentItem.doc_id == item.documentid) {
                                    currentItem.documentsize = item.documentsize;
                                }
                            });
                        });
                    });

            }, function (reason) {
                notificationService.error('document list not loaded');
            });
        }


        /* Dummy call to server to keep session alive*/
        function keepSessionalive() {
            documentsDataService.keepSessionalive()
                .then(function (response) { });
        }


        vm.close = function () {
            $modalInstance.close();
            $rootScope.$broadcast('unCheckSelectedItems');
        }


        function uploadFile() {
            if (!vm.dropzoneObj) {
                initializeSingleFileDropnzone();
            }
        }

        /* Check file size */
        function checkfileSize(size) {
            if (size >= 1024 * 1024 / 10) {
                var sizeofFile = size / (1024 * 1024 / 10);
                sizeofFile = Math.round(sizeofFile) / 10;
                if (sizeofFile > 500) {
                    return 0;
                }
            }
            return 1;
        }

        /* clear the set interval*/
        function clearSetInterval() {
            clearInterval(sessionalive);
        }

        function initializeSingleFileDropnzonePHP() {
            vm.dropzoneObj = new Dropzone("#singledropzone", {
                url: documentsConstants.RESTAPI.linkDocument,
                method: "POST",
                withCredentials: true,
                parallelUploads: 1,
                uploadMultiple: false,
                maxFilesize: 500,
                createImageThumbnails: false,
                maxFiles: 1,
                params: vm.linkDocInfo,
                autoProcessQueue: false,
                addRemoveLinks: false,
                dictDefaultMessage:
                    '<span class="sprite default-document-single-upload"></span><h2 class="margin-top10px">Drop File Here</h2>',
                dictRemoveFile: '',
                accept: function (file, done) {
                    if (file.size == 0) {
                        notificationService.error("Cannot upload 0kb document");
                        removeUploadingDocument();
                        return;
                    }
                    vm.singlefileUpload = true;
                    vm.singleuploadError = '';
                    sessionalive = setInterval(keepSessionalive, 900000);
                    $scope.$apply();
                    return done();
                },
                init: function () {
                    this.on("addedfile", function (file) {
                        if (fileCount == 1) {
                            var receivedSizeCheck = checkfileSize(file.size);
                            if (receivedSizeCheck === 1) {
                                vm.singleFileName = file.name;
                                var size = this.filesize(file.size);
                                size = size.replace("<strong>", "");
                                size = size.replace("</strong>", "");
                                vm.singleFileSize = size;
                                $scope.$apply();
                                fileCount = parseInt(fileCount) + 1;
                            }
                        }

                    });

                    this.on("uploadprogress", function (files) {
                        if (files) {
                            vm.singleFileProgress = files.upload.progress;
                            $scope.$apply();
                        }
                    });

                    this.on("error", function (files, response, xhr) {

                    });
                },
                fallback: function () {
                },
                success: function (file) {
                    usSpinnerService.stop('pageSpinner');
                    clearSetInterval();
                    $modalInstance.close();
                    notificationService.success("Document uploaded successfully");
                    removeUploadingDocument();
                    return true;
                },
                error: function (file, message) {
                    var displayError = true;
                    var receivedSizeCheck = checkfileSize(file.size);
                    if (receivedSizeCheck === 0) {
                        ferror = "Size of file should not be greater than 500 MB";
                    } else if (message === "You can not upload any more files.") {
                        var ferror = "You can not upload more than one file in single file upload";
                        displayError = false;
                        notificationService.error(message);
                        return;
                    } else {

                        if (file.xhr.status == 401) {
                            loginDatalayer.logoutUser()
                                .then(function () {
                                    notificationService.error('You are unauthorized to access this service.');
                                    localStorage.clear();
                                    $state.go('login');
                                });
                            return;
                        }

                        removeUploadingDocument();
                        if (file.xhr && $.trim(file.xhr.responseText) != '') {
                            var ferror = file.xhr.responseText;
                        } else {
                            var ferror = "Document not uploaded.Please try again.";
                        }
                    }
                    notificationService.error(message[0]);
                    if (displayError) {
                        $scope.$apply(function () {
                            vm.singleuploadError = message[0];
                            usSpinnerService.stop('pageSpinner');
                            clearSetInterval();

                        });
                    }
                },
                headers: { 'X-CSRF-Token': userSession.getToken() },
                dictResponseError: 'Error while uploading file!',
                previewTemplate: '<span></span>'
            });
        }


        /*Initialize the single file upload*/
        function initializeSingleFileDropnzone() {
            vm.dropzoneObj = new Dropzone("#singledropzone", {
                url: documentsConstants.RESTAPI.linkDocument1,
                method: "POST",
                withCredentials: true,
                parallelUploads: 1,
                uploadMultiple: false,
                maxFilesize: 500,
                createImageThumbnails: false,
                maxFiles: 1,
                params: vm.linkDocInfo,
                autoProcessQueue: false,
                addRemoveLinks: false,
                dictDefaultMessage:
                    '<span class="sprite default-document-single-upload"></span><h2 class="margin-top10px">Drop File Here</h2>',
                dictRemoveFile: '',
                accept: function (file, done) {
                    if (file.size == 0) {
                        notificationService.error("Cannot upload 0kb document");
                        removeUploadingDocument();
                        return;
                    }
                    vm.singlefileUpload = true;
                    vm.singleuploadError = '';
                    sessionalive = setInterval(keepSessionalive, 900000);
                    $scope.$apply();
                    return done();
                },
                init: function () {
                    this.on("addedfile", function (file) {
                        if (fileCount == 1) {
                            var receivedSizeCheck = checkfileSize(file.size);
                            if (receivedSizeCheck === 1) {
                                vm.singleFileName = file.name;
                                var size = this.filesize(file.size);
                                size = size.replace("<strong>", "");
                                size = size.replace("</strong>", "");
                                vm.singleFileSize = size;
                                $scope.$apply();
                                fileCount = parseInt(fileCount) + 1;
                            }
                        }

                    });

                    this.on("uploadprogress", function (files) {
                        if (files) {
                            vm.singleFileProgress = files.upload.progress;
                            $scope.$apply();
                        }
                    });

                    this.on("error", function (files, response, xhr) {

                    });
                },
                fallback: function () {
                },
                success: function (file) {
                    usSpinnerService.stop('pageSpinner');
                    clearSetInterval();
                    $modalInstance.close();
                    notificationService.success("Document uploaded successfully");
                    removeUploadingDocument();
                    return true;
                },
                error: function (file, message) {
                    var displayError = true;
                    var receivedSizeCheck = checkfileSize(file.size);

                    if (receivedSizeCheck === 0) {
                        var ferror = "Size of file should not be greater than 500 MB";
                    } else if (message.message === "You can not upload any more files.") {
                        var ferror = "You can not upload more than one file in single file upload";
                        displayError = false;
                        notificationService.error(message);
                        return;
                    } else {

                        if (file.xhr.status == 401) {
                            loginDatalayer.logoutUser()
                                .then(function () {
                                    notificationService.error('You are unauthorized to access this service.');
                                    localStorage.clear();
                                    $state.go('login');
                                });
                            return;
                        }

                        removeUploadingDocument();
                        if (file.xhr && $.trim(file.xhr.responseText) != '') {
                            var ferror = file.xhr.responseText;
                        } else {
                            var ferror = "Document not uploaded.Please try again.";
                        }
                    }
                    if (message.message) {
                        notificationService.error(message.message);
                    } else {
                        if (receivedSizeCheck == 0) {
                            notificationService.error("Size of file should not be greater than 500 MB");
                        } else {
                            notificationService.error('Upload Error ');

                        }
                    }
                    if (displayError) {
                        $scope.$apply(function () {
                            vm.singleuploadError = message.message;
                            usSpinnerService.stop('pageSpinner');
                            clearSetInterval();

                        });
                    }
                },
                //headers: { 'X-CSRF-Token': userSession.getToken() },
                headers: { 'Authorization': "Bearer " + localStorage.getItem('accessToken') },
                dictResponseError: 'Error while uploading file!',
                previewTemplate: '<span></span>'
            });
        }


        /*Remove going on upload  document */
        function removeUploadingDocument(cancel) {
            if (vm.dropzoneObj) {
                fileCount = 1;
                vm.documentProcessing = false;
                vm.dropzoneObj.removeAllFiles();
                vm.singleFileProgress = 0;
                vm.singleFileName = '';
                vm.singleFileSize = '';
                vm.singleuploadError = '';
                vm.singlefileUpload = false;
            }

        }

        //  link existing document function 
        function linkExsitingDocument(mattdetailid, mattdetailName, docuemntId, party_id, party_role) {

            var postData = {
                matter_detail_id: mattdetailid,
                matter_detail_name: mattdetailName,
                document_id: docuemntId,
                associated_party_id: party_id,
                associated_party_role: party_role
            }
            documentsDataService.linkExsitingDocument(postData)
                .then(function (data) {
                    $modalInstance.close();
                    notificationService.success('document linked successfully');
                }, function (reason) {
                    notificationService.error('error in linking docuemnt');
                });
        }

        /*Process the documents queue */
        function processDocuments(type, isLinkDoc) {

            if (isLinkDoc) {
                if (vm.linkDocInfo.selectedDoc && (vm.linkDocInfo.selectedDoc.documentsize == 0 || vm.linkDocInfo.selectedDoc.documentsize == null)) {
                    notificationService.error("Cannot upload 0kb file");
                    return;
                }
                var createParamData = setMoreInfo(type);
                if (vm.linkDocInfo.selectedDoc != undefined) {
                    linkExsitingDocument(createParamData.more_info_type_id, createParamData.more_info_type, vm.linkDocInfo.selectedDoc.doc_id, createParamData.associated_party_id, createParamData.party_role);
                }
                else {
                    notificationService.error("Please select document");
                }
            } else {
                if (vm.singlefileUpload == true) {
                    var singledovParams = createParam(type);
                    if (singledovParams === false) { return false; }
                    vm.dropzoneObj.options.params = singledovParams;
                    vm.documentProcessing = true;
                    vm.dropzoneObj.processQueue();
                }
                else {
                    notificationService.error("Please select document");
                }
                sessionalive = setInterval(keepSessionalive, 900000);
                usSpinnerService.spin('pageSpinner');
            }
        }


        /*Create params fro single file upload*/
        function createParam(type) {
            var singledovParams = {};
            singledovParams.uploadtype = 'fresh';
            var createParamData = setMoreInfo(type);
            angular.extend(singledovParams, createParamData);
            // if (createParamData === false) { return false; }
            return singledovParams;
        }

        function setMoreInfo(doctype) {
            var moreInfoParams = {};
            switch (doctype) {
                case "liens":
                    if (vm.linkDocInfo.isLinkDoc && vm.linkDocInfo.selectedDoc != undefined) {
                        moreInfoParams.doc_id = vm.linkDocInfo.selectedDoc.documentid || vm.linkDocInfo.selectedDoc.doc_id;
                    }
                    moreInfoParams.documentname = (vm.linkDocInfo.isLinkDoc && vm.linkDocInfo.selectedDoc) ? vm.linkDocInfo.selectedDoc.documentname || vm.linkDocInfo.selectedDoc.doc_name : vm.singleFileName;
                    moreInfoParams.categoryid = 22;
                    moreInfoParams.more_info_type_id = vm.linkDocInfo.lien_id;
                    moreInfoParams.more_info_type = vm.linkDocInfo.type;
                    moreInfoParams.matter_id = parseInt(vm.linkDocInfo.matter_id);
                    moreInfoParams.associated_party_id = vm.linkDocInfo.associated_party_id;
                    moreInfoParams.party_role = vm.linkDocInfo.party_role;
                    break;
                case 'medicalbill':
                    if (vm.linkDocInfo.isLinkDoc && vm.linkDocInfo.selectedDoc != undefined) {
                        moreInfoParams.doc_id = vm.linkDocInfo.selectedDoc.documentid || vm.linkDocInfo.selectedDoc.doc_id;
                    }
                    moreInfoParams.categoryid = 8;
                    moreInfoParams.documentname = (vm.linkDocInfo.isLinkDoc && vm.linkDocInfo.selectedDoc) ? vm.linkDocInfo.selectedDoc.documentname || vm.linkDocInfo.selectedDoc.doc_name : vm.singleFileName;
                    moreInfoParams.matter_id = parseInt(vm.linkDocInfo.matter_id);
                    moreInfoParams.more_info_type_id = vm.linkDocInfo.medical_bill_id;
                    moreInfoParams.more_info_type = doctype;
                    moreInfoParams.associated_party_id = angular.isDefined(vm.linkDocInfo.associated_party_id) ? vm.linkDocInfo.associated_party_id : '';
                    moreInfoParams.party_role = angular.isDefined(vm.linkDocInfo.party_role) ? vm.linkDocInfo.party_role : '';
                    break;
                case 'insurance':
                    if (vm.linkDocInfo.isLinkDoc && vm.linkDocInfo.selectedDoc != undefined) {
                        moreInfoParams.doc_id = vm.linkDocInfo.selectedDoc.documentid || vm.linkDocInfo.selectedDoc.doc_id;
                    }
                    moreInfoParams.categoryid = 6;
                    moreInfoParams.documentname = (vm.linkDocInfo.isLinkDoc && vm.linkDocInfo.selectedDoc) ? vm.linkDocInfo.selectedDoc.documentname || vm.linkDocInfo.selectedDoc.doc_name : vm.singleFileName;
                    moreInfoParams.more_info_type_id = vm.linkDocInfo.insurance_id;
                    moreInfoParams.more_info_type = vm.linkDocInfo.type;
                    moreInfoParams.matter_id = parseInt(vm.linkDocInfo.matter_id);
                    moreInfoParams.associated_party_id = vm.linkDocInfo.associated_party_id;
                    moreInfoParams.party_role = vm.linkDocInfo.party_role;
                    break;
                case 'expense':
                    if (vm.linkDocInfo.isLinkDoc && vm.linkDocInfo.selectedDoc != undefined) {
                        moreInfoParams.doc_id = vm.linkDocInfo.selectedDoc.documentid || vm.linkDocInfo.selectedDoc.doc_id;
                    }
                    moreInfoParams.categoryid = 15;
                    moreInfoParams.documentname = (vm.linkDocInfo.isLinkDoc && vm.linkDocInfo.selectedDoc) ? vm.linkDocInfo.selectedDoc.documentname || vm.linkDocInfo.selectedDoc.doc_name : vm.singleFileName;
                    moreInfoParams.more_info_type_id = vm.linkDocInfo.expense_id;
                    moreInfoParams.more_info_type = doctype;
                    moreInfoParams.matter_id = parseInt(vm.linkDocInfo.matter.matter_id);
                    moreInfoParams.associated_party_id = angular.isUndefined(vm.linkDocInfo.associated_party) ? '' : vm.linkDocInfo.associated_party.associated_party_id;
                    moreInfoParams.party_role = vm.linkDocInfo.associated_party.associated_party_role;
                    break;
                case 'medicalrecord':
                    if (vm.linkDocInfo.isLinkDoc && vm.linkDocInfo.selectedDoc != undefined) {
                        moreInfoParams.doc_id = vm.linkDocInfo.selectedDoc.documentid || vm.linkDocInfo.selectedDoc.doc_id;
                    }
                    moreInfoParams.categoryid = 7;
                    moreInfoParams.documentname = (vm.linkDocInfo.isLinkDoc && vm.linkDocInfo.selectedDoc) ? vm.linkDocInfo.selectedDoc.documentname || vm.linkDocInfo.selectedDoc.doc_name : vm.singleFileName;
                    moreInfoParams.matter_id = parseInt(vm.linkDocInfo.matter_id);
                    moreInfoParams.more_info_type_id = vm.linkDocInfo.medical_information_id;
                    moreInfoParams.more_info_type = doctype;
                    moreInfoParams.associated_party_id = angular.isDefined(vm.linkDocInfo.associated_party_id) ? vm.linkDocInfo.associated_party_id : '';
                    moreInfoParams.party_role = angular.isDefined(vm.linkDocInfo.party_role) ? vm.linkDocInfo.party_role : '';
                    break;
                default:
                    return false;
            }
            return moreInfoParams;
        }

    }

})();
