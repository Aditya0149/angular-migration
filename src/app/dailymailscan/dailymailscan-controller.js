/* Daily Mail Scan module controller. 
 * */
(function () {

	'use strict';

	angular
		.module('cloudlex.dailymailscan')
		.controller('DailymailscanCtrl', DailymailscanCtrl);

	DailymailscanCtrl.$inject = ['$timeout', '$scope', '$state', 'loginDatalayer', 'dailyMailScanDataService', 'globalConstants', 'dailymailListHelper', 'notification-service', 'modalService', 'usSpinnerService', 'masterData'];

	function DailymailscanCtrl($timeout, $scope, $state, loginDatalayer, dailyMailScanDataService, globalConstants, dailymailListHelper, notificationService, modalService, usSpinnerService, masterData) {

		var self = this;

		/*Variables*/
		self.activeTab = 'uploadeddailymail';
		self.userRole = '';
		self.uploadedList = {
			data: [],
			count: 0,
			totallength: 0,
			pageNum: 1,
		};
		self.unindexedList = {
			data: [],
			count: 0,
			totallength: 0,
			pageNum: 1,
		};
		var filterddocs = false;
		var alluploaded = false;
		self.hideUpDocPager = false;
		self.hideUnDocPager = false;
		var allunindexed = false;
		self.enableUpload = false;
		self.editDocDetails = [];
		self.editUploadedStatus = [];
		/*File Upload variables*/
		self.dailydropzoneObj = '';
		self.fileUploaParam = '';
		var fileuploadURL = '';
		self.fileUpload = false;
		self.cancelfileUpload = false;
		self.maxNumfiles = 20;
		self.multidocCount = 0;
		self.multiFilesdata = [];
		self.multiuploadError = 0;
		self.successMultiUpload = 0;
		var maxFileSize = 250;

		//US#4713 disable add edit delete 
		var gracePeriodDetails = masterData.getUserRole();
		self.isGraceOver = gracePeriodDetails.plan_subscription_status;



		self.display = dailymailListHelper.displayOptions();

		/*function handlers*/
		self.activateTab = activateTab;
		self.allUploadedSelected = allUploadedSelected;
		self.selectAllUploaded = selectAllUploaded;
		self.isUploadedSelected = isUploadedSelected;
		self.retainTextValue = retainTextValue;
		self.getNextLimitUploaded = getNextLimitUploaded;
		self.sortUploaded = sortUploaded;
		self.filterRetain = filterRetain;
		// self.createSearchFilterTag = createSearchFilterTag;
		self.cancleFilterTags = cancleFilterTags;
		self.deleteUploaded = deleteUploaded;
		self.downloadDocument = downloadDocument;
		self.viewDailyMailScan = viewDailyMailScan;
		self.enableUploadArea = enableUploadArea;
		self.keepSessionalive = keepSessionalive;
		self.removeAllFiles = removeAllFiles;
		self.editUnindexed = editUnindexed;
		self.addComments = addComments;
		self.removeComments = removeComments;
		self.editUploaded = editUploaded;
		self.editStatus = editStatus;
		self.revertStatus = revertStatus;
		self.resetPage = resetPage;
		(function () {
			saveUserRole();
			self.uploadedGridOptions = {
				headers: dailymailListHelper.getUploadedGridHeaders(),
				uploadedSelectedItems: [],
			};
			self.unindexedGridOptions = {
				headers: dailymailListHelper.getUnindexedGridHeaders(),
				unindexedSelectedItems: [],
			};
			getUploaded();
			getfiltertext();
			retainTextValue();


		})();

		function resetPage() {
			self.display = dailymailListHelper.displayOptions();

			//sortUploaded(); =
			self.uploadedList.data = [];
			self.unindexedList.data = [];
			searchReset();

			self.uploadedGridOptions.uploadedSelectedItems = [];
			self.unindexedGridOptions.unindexedSelectedItems = [];
			$("textarea[name='comments']").val("");
		}

		function retainTextValue() {
			if (self.activeTab == 'uploadeddailymail') {
				var filtertext = localStorage.getItem("dailyMailSearchTxt");
				if (utils.isNotEmptyVal(filtertext)) {
					self.showSearch = true;
				}
			}
			if (self.activeTab == 'unindexeddailymail') {
				var filtertext = localStorage.getItem("dMailSearchUnindex");
				if (utils.isNotEmptyVal(filtertext)) {
					self.showunindexedSearch = true;
				}
			}

		}

		function searchReset() {
			self.display.unindexed.filterText = '';
			self.display.uploaded.filterText = '';
			localStorage.setItem("dailyMailSearchTxt", self.display.uploaded.filterText);
			localStorage.setItem("dMailSearchUnindex", self.display.unindexed.filterText);
			if (self.activeTab == 'uploadeddailymail') {
				self.display.uploaded.filterText = '';
				var filtertext = localStorage.setItem("dailyMailSearchTxt", self.display.uploaded.filterText);
				self.showSearch = false;
				getUploaded();
			}
			else if (self.activeTab == 'unindexeddailymail') {
				self.display.unindexed.filterText = '';
				var filtertext = localStorage.setItem("dMailSearchUnindex", self.display.unindexed.filterText);
				self.showunindexedSearch = false;
				getUnindexed();
			}

		}

		/* Get user role and save it */
		function saveUserRole() {
			dailyMailScanDataService.getUserRole()
				.then(function (response) {
					//self.userRole="LexviasuperAdmin";
					self.userRole = response.data.role;
				});

		}

		/* Toggel active tab*/
		function activateTab(toActive) {
			if (toActive != self.activeTab) {
				self.activeTab = toActive;
				if (toActive == 'uploadeddailymail' && self.display.uploaded.uploadedListReceived == false) {
					self.uploadedList.data = [];
					getUploaded();
				} else if (toActive == 'unindexeddailymail' && self.display.unindexed.unindexedListReceived == false) {
					self.unindexedList.data = [];
					getUnindexed();
					getfiltertext();
					//retainTextValue();				    
				}
			}
		}

		function getfiltertext() {
			if (self.activeTab == 'uploadeddailymail') {
				var filtertext = localStorage.getItem("dailyMailSearchTxt");
				if (utils.isNotEmptyVal(filtertext)) {
					self.display.uploaded.filterText = filtertext;
				}
			}
			else if (self.activeTab == 'unindexeddailymail') {
				var filtertext = localStorage.getItem("dMailSearchUnindex");
				if (utils.isNotEmptyVal(filtertext)) {
					self.display.unindexed.filterText = filtertext;
				}
			}
		}
		/* Get uploaded documents*/
		function getUploaded() {
			var promesa = dailyMailScanDataService.getUploadedDailymail(self.display.uploaded.sortby, self.display.uploaded.sortorder, self.uploadedList.pageNum, alluploaded);
			promesa.then(function (data) {
				if (alluploaded || data.data && data.data.length < 100) {
					self.hideUpDocPager = true;
				}
				self.display.uploaded.uploadedListReceived = true;
				if (self.filterddocs == true) {
					self.uploadedList.data = data.data;
					self.uploadedList.count = data.data.length;
					self.uploadedList.totallength = data.data.length;
					self.filterddocs = false;
				} else {
					if (alluploaded) {
						self.uploadedList.data = data.data;
					} else {
						if (self.uploadedList.data.length == 0) {
							self.uploadedList.data = data.data;
						} else {
							_.forEach(data.data, function (item, index) {
								self.uploadedList.data.push(item);
							});
						}
					}
					self.uploadedList.count = data.data.length;
					self.uploadedList.totallength = parseInt(self.uploadedList.totallength) + parseInt(data.data.length);
				}

				self.uploadedGridOptions.selectAll = false;
				self.uploadedGridOptions.uploadedSelectedItems = [];
				_.forEach(data.data, function (item) {
					item.dateuploaded_date = moment.unix(item.dateuploaded_date).format('MM/DD/YYYY')
				})
			}, function (reason) {
				notificationService.error('Uploaded documents list not loaded');
			});
		}

		/* Get unindexed documents*/
		function getUnindexed() {
			var promesa = dailyMailScanDataService.getUnindexedDailymail(self.unindexedList.pageNum, allunindexed);
			promesa.then(function (data) {
				if (allunindexed || data.data && data.data.length < 100) {
					self.hideUnDocPager = true;
				}
				self.display.unindexed.unindexedListReceived = true;
				if (allunindexed) {
					self.unindexedList.data = data.data;
				} else {
					if (self.unindexedList.data.length == 0) {
						self.unindexedList.data = data.data;
					}
					else {
						_.forEach(data.data, function (item) {
							self.unindexedList.data.push(item);
						});
					}
				}
				self.unindexedList.count = data.data.length;
				self.unindexedList.totallength = parseInt(self.unindexedList.totallength) + parseInt(data.data.length);

				self.unindexedGridOptions.selectAll = false;
				self.unindexedGridOptions.unindexedSelectedItems = [];

			}, function (reason) {
				notificationService.error('Unindexed documents list not loaded');
			});
		}

		/*Select all the uploaded and unindexed documents*/
		function allUploadedSelected() {
			if (self.activeTab == 'uploadeddailymail') {
				var dataCopy = angular.copy(self.uploadedList.data);
				return self.uploadedGridOptions.uploadedSelectedItems.length === dataCopy.length;
			} else if (self.activeTab == 'unindexeddailymail') {
				var dataCopy = angular.copy(self.unindexedList.data);
				return self.unindexedGridOptions.unindexedSelectedItems.length === dataCopy.length;
			}
		}

		/*check all uploaded and unindexed documents selected*/
		function selectAllUploaded(selected) {
			if (self.activeTab == 'uploadeddailymail') {
				if (selected) {
					var dataCopy = angular.copy(self.uploadedList.data);
					self.uploadedGridOptions.uploadedSelectedItems = dataCopy;
				} else {
					self.uploadedGridOptions.uploadedSelectedItems = [];
				}
			} else if (self.activeTab == 'unindexeddailymail') {
				if (selected) {
					var dataCopy = angular.copy(self.unindexedList.data);
					self.unindexedGridOptions.unindexedSelectedItems = dataCopy;
				} else {
					self.unindexedGridOptions.unindexedSelectedItems = [];
				}
			}
		}

		/*check if uploaded and unindexed document is selected*/
		function isUploadedSelected(doc) {
			if (self.activeTab == 'uploadeddailymail') {
				self.display.uploaded.uploadedSelected[doc.id] =
					dailymailListHelper.isUploadDocumentSelected(self.uploadedGridOptions.uploadedSelectedItems, doc);
				return self.display.uploaded.uploadedSelected[doc.id];
			} else if (self.activeTab == 'unindexeddailymail') {
				self.display.unindexed.unindexedSelected[doc.id] =
					dailymailListHelper.isUploadDocumentSelected(self.unindexedGridOptions.unindexedSelectedItems, doc);
				return self.display.unindexed.unindexedSelected[doc.id];
			}
		}

		/*Get more Uploaded Documenets*/
		function getNextLimitUploaded(all) {
			if (self.activeTab == 'uploadeddailymail') {
				self.uploadedList.pageNum = parseInt(self.uploadedList.pageNum) + parseInt(1);
				if (all == 'all') {
					alluploaded = true;
				}
				getUploaded();
			} else if (self.activeTab == 'unindexeddailymail') {
				self.unindexedList.pageNum = parseInt(self.unindexedList.pageNum) + parseInt(1);
				if (all == 'all') {
					allunindexed = true;
				}
				getUnindexed();
			}
		}

		/*Sort the uploaded documents*/
		function sortUploaded(sortkey, sortorder) {
			self.filterddocs = true;
			self.display.uploaded.sortby = sortkey;
			self.display.uploaded.sortorder = sortorder;
			self.uploadedList.pageNum = 1;
			alluploaded = false;
			getUploaded();
		}

		//function for  retaintion of search field       
		function filterRetain() {
			if (self.activeTab == 'uploadeddailymail') {
				var filtertext = self.display.uploaded.filterText;
				localStorage.setItem("dailyMailSearchTxt", filtertext);
			}
			else if (self.activeTab == 'unindexeddailymail') {
				var filtertext = self.display.unindexed.filterText;
				localStorage.setItem("dMailSearchUnindex", filtertext);
			}
		}

		/*Create Search filter tag for both uploaded and unindexed documents*/
		// function createSearchFilterTag()
		// {
		// 	if(self.activeTab == 'uploadeddailymail'){
		// 		self.display.uploaded.filtertags = dailymailListHelper.createSearchFilterTag(self.display.uploaded.filterText,self.display.uploaded.filtertags);
		// 	} else if(self.activeTab == 'unindexeddailymail'){
		// 		self.display.unindexed.filtertags = dailymailListHelper.createSearchFilterTag(self.display.unindexed.filterText,self.display.unindexed.filtertags);
		// 	}
		// }

		/*Cancle the search filter tag*/
		function cancleFilterTags(cancelled) {
			if (self.activeTab == 'uploadeddailymail') {
				self.display.uploaded.filterText = '';
			} else if (self.activeTab == 'unindexeddailymail') {
				self.display.unindexed.filterText = '';
			}
		}

		/*Delete the Uploaded and Unindexed documents */
		function deleteUploaded(selectedUpDoc, selectedData) {
			if (utils.isNotEmptyVal(self.display.uploaded.filterText) && allUploadedSelected()) {
				selectedUpDoc = selectedData;
			}


			var modalOptions = {
				closeButtonText: 'Cancel',
				actionButtonText: 'Delete',
				headerText: 'Delete ?',
				bodyText: 'Are you sure you want to delete ?'
			};

			// confirm before delete
			modalService.showModal({}, modalOptions).then(function () {
				var docdata = {};
				if (self.activeTab == 'uploadeddailymail') {

					docdata['docID'] = _.pluck(selectedUpDoc, 'id');

					var promesa = dailyMailScanDataService.deleteUploadedDocument(docdata);
					promesa.then(function (data) {
						notificationService.success('Documents deleted successfully');
						angular.forEach(docdata['docID'], function (datavalue, datakey) {
							var index = _.findIndex(self.uploadedList.data, { id: datavalue });
							self.uploadedList.data.splice(index, 1);
						});
						self.uploadedGridOptions.selectAll = false;
						self.uploadedGridOptions.uploadedSelectedItems = [];
					}, function (error) {
						notificationService.error('Unable to delete documents');
					});

				} else if (self.activeTab == 'unindexeddailymail') {

					docdata['docID'] = _.pluck(self.unindexedGridOptions.unindexedSelectedItems, 'id');

					var promesa = dailyMailScanDataService.deleteUnindexedDocument(docdata);
					promesa.then(function (data) {
						notificationService.success('Documents deleted successfully');
						angular.forEach(docdata['docID'], function (datavalue, datakey) {
							var index = _.findIndex(self.unindexedList.data, { id: datavalue });
							self.unindexedList.data.splice(index, 1);
						});
						self.unindexedGridOptions.selectAll = false;
						self.unindexedGridOptions.unindexedSelectedItems = [];

					}, function (error) {
						notificationService.error('Unable to delete documents');
					});
				}
			});
		}

		/*Download the document*/
		function downloadDocument(docId, typeOfDoc) {
			if (!angular.isUndefined(docId) && !angular.isUndefined(typeOfDoc) && docId != '' && typeOfDoc != '') {
				var documentId = [];
				documentId.push(docId);
				var type = typeOfDoc;

			} else {
				if (self.activeTab == 'uploadeddailymail') {
					var documentId = _.pluck(self.uploadedGridOptions.uploadedSelectedItems, 'id');
					var type = 'dms';
				} else if (self.activeTab == 'unindexeddailymail') {
					var documentId = _.pluck(self.unindexedGridOptions.unindexedSelectedItems, 'id');
					var type = 'undms';
				}
			}
			_.forEach(documentId, function (documentId) {
				dailyMailScanDataService.downloadDocument(documentId, type)
					.then(function (response) {
						if (response && response != '') {
							var doc;
							if (self.activeTab == 'uploadeddailymail') {
								self.uploadedGridOptions.uploadedSelectedItems = [];
								doc = _.where(self.uploadedList.data, { id: documentId });//self.uploadedList.data.find(o => o.id == documentId);
							} else if (self.activeTab == 'unindexeddailymail') {
								self.unindexedGridOptions.unindexedSelectedItems = [];
								doc = _.where(self.unindexedList.data, { id: documentId });//self.unindexedList.data.find(o=>o.id == documentId);
							}
							//window.open(response, '_blank');
							utils.downloadFile(response, doc[0].name, "Content-Type");
						} else {
							notificationService.error('Unable to download document');
						}
					}, function (error) {
						notificationService.error('Unable to download document');
					});
			});


		}

		/*View Dailymailscan document*/
		function viewDailyMailScan(uri, docId, typeOfDoc) {
			var uriArr = uri.split('/');
			var filename = uriArr[uriArr.length - 2] + '/' + uriArr[uriArr.length - 1];
			var extension = filename.substr((filename.lastIndexOf('.') + 1));
			extension = angular.lowercase(extension);
			if (extension == 'pdf' || extension == 'txt' || extension == 'png' || extension == 'jpg' || extension == 'jpeg' || extension == 'gif') {
				var viewurl = dailymailListHelper.createViewURL(uri);
				viewurl = globalConstants.webServiceBase + viewurl;
				window.open(viewurl, '_blank');
			} else {
				downloadDocument(docId, typeOfDoc);
			}

		}

		/* Enable Upload div and Initialize dropzone */
		function enableUploadArea() {
			self.enableUpload = true;
			if (self.userRole == 'LexviasuperAdmin') {
				self.fileUploaParam = { 'comment': '' };
				fileuploadURL = globalConstants.javaWebServiceBaseV4 + 'dailymailscan/unindexdailymail';

			} else {
				self.fileUploaParam = { 'status': 'Pending' };
				fileuploadURL = globalConstants.javaWebServiceBaseV4 + 'dailymailscan';

			}

			if (!self.dailydropzoneObj || self.dailydropzoneObj == '') {
				initializeUpload();
			}
		}

		/* Dummy call to server to keep session alive*/
		function keepSessionalive() {
			dailyMailScanDataService.keepSessionalive()
				.then(function (response) { });
		}

		/* clear the set interval*/
		function clearSetInterval() {
			clearInterval(sessionalive);
		}

		/* Check file size */
		function checkfileSize(size) {
			if (size >= 1024 * 1024 / 10) {
				var sizeofFile = size / (1024 * 1024 / 10);
				sizeofFile = Math.round(sizeofFile) / 10;
				if (sizeofFile > 250) {
					return 0;
				}
			}
			return 1;
		}

		var sessionalive;
		/*Initialize multifile upload*/
		function initializeUpload() {
			var usernotified = false;
			self.dailydropzoneObj = new Dropzone("#multidropzone", {
				url: fileuploadURL,//,
				method: "POST",
				withCredentials: true,
				parallelUploads: 10,
				uploadMultiple: false,
				maxFilesize: maxFileSize,
				createImageThumbnails: false,
				maxFiles: self.maxNumfiles,
				params: self.fileUploaParam,
				autoProcessQueue: true,
				addRemoveLinks: false,
				dictDefaultMessage:
					'<span class="sprite default-document-single-upload"></span><h2 class="margin-top10px">Drop File Here</h2>',
				dictRemoveFile: '',
				accept: function (file, done) {
					self.fileUpload = true;
					$scope.$apply();
					usSpinnerService.spin('pageSpinner');
					sessionalive = setInterval(keepSessionalive, 900000);
					return done();
				},
				init: function () {
					this.on("addedfile", function (file) {
						//self.fileUploaParam.name = file.name;
						var receivedSizeCheck = checkfileSize(file.size);
						/* check if maximum file count has reached*/
						if (receivedSizeCheck === 1) {
							if (self.multidocCount == self.maxNumfiles) {
								if (usernotified == false) {
									usernotified = true;
									notificationService.success("Only " + self.maxNumfiles + " are allowed to upload at a time");
								}
							} else {
								var _this = this;
								var size = this.filesize(file.size);
								size = size.replace("<strong>", "");
								size = size.replace("</strong>", "");

								self.multiFilesdata.push({ docnum: self.multidocCount, fileName: file.name, fileSize: size, fileProgress: 0, error: '' });
								self.multidocCount = parseInt(self.multidocCount) + parseInt(1);

								/* create remove icon binding */
								self.removeMultifile = function (filename) {

									var index = _.findIndex(self.multiFilesdata, { fileName: filename });
									if (self.multiFilesdata[index].error == '' && (!self.multiFilesdata[index].success || self.multiFilesdata[index].success == '')) {
										var modalOptions = {
											closeButtonText: 'Cancel',
											actionButtonText: 'Delete',
											headerText: 'Delete ?',
											bodyText: 'Are you sure you want to delete ?'
										};
										modalService.showModal({}, modalOptions).then(function () {
											removeUploadingfile(filename, index);
										});
									} else {
										removeUploadingfile(filename, index);
									}
								}
							}
							$scope.$apply();
						} else {
							//notificationService.error("File not accepted. May be file size is grate than 250 MB");
						}

					});

					this.on("uploadprogress", function (files) {

						var filename = files.name;
						jQuery.grep(self.multiFilesdata, function (a) {
							if (a.fileName == filename) {
								a.fileProgress = files.upload.progress;
								return a;
							}
						});
						$scope.$apply();
					});

					this.on("processing", function (files) {

					});

				},
				fallback: function () {
				},
				success: function (file) {

					var index = _.findIndex(self.multiFilesdata, { fileName: file.name });
					self.multiFilesdata[index].success = "Document uploaded";
					//self.multiFilesdata.splice(index, 1);

					self.successMultiUpload = parseInt(self.successMultiUpload) + parseInt(1);
					$scope.$apply();

					if ((parseInt(self.multiuploadError) + parseInt(self.successMultiUpload)) == self.multidocCount) {
						usSpinnerService.stop('pageSpinner');
						clearSetInterval();
					}

					if (self.multiuploadError == 0 && (self.successMultiUpload == self.multidocCount)) {
						notificationService.success("Document uploaded successfully");
						destroyDropzone();
					} else if (self.multiuploadError > 0 && (self.successMultiUpload < self.multidocCount)) {
						notificationService.error("Some Document are not uploaded.");
						self.cancelfileUpload = true;

					}

					return true;
				},
				error: function (file, message) {
					if (file.status != 'canceled' && file.status == 'error') {

						var receivedSizeCheck = checkfileSize(file.size);

						if (receivedSizeCheck === 0) {
							notificationService.error("File not accepted. May be file size is greater than 250 MB");
						} else {
							$scope.$apply(function () {

								if (file.xhr.status == 401) {
									loginDatalayer.logoutUser()
										.then(function () {
											notificationService.error('You are unauthorized to access this service.');
											localStorage.clear();
											$state.go('login');
										});
									return;
								}

								var filename = file.name;
								var index = _.findIndex(self.multiFilesdata, { fileName: file.name });
								if (index >= 0) {
									if (file.xhr && $.trim(file.xhr.responseText) != '') {
										var ferror = (JSON.parse(file.xhr.responseText)).message;
									} else {
										var ferror = "Document not uploaded.Please try again.";
									}

									self.multiFilesdata[index].error = ferror;
									self.multiuploadError = parseInt(self.multiuploadError) + parseInt(1);
								}

								if ((parseInt(self.multiuploadError) + parseInt(self.successMultiUpload)) == self.multidocCount) {
									usSpinnerService.stop('pageSpinner');
									self.cancelfileUpload = true;
									clearSetInterval();
								}
							});
						}
					}
				},
				headers: {
					'Authorization': "Bearer " + localStorage.getItem('accessToken')
				},
				dictResponseError: 'Error while uploading file!',
				previewTemplate: '<span></span>',
			});
		}

		/* remove uploading file from dropzone*/
		function removeUploadingfile(filename, index) {
			var dropzoneQueued = self.dailydropzoneObj.getAcceptedFiles();
			var filetoremove = _.find(dropzoneQueued, { name: filename });
			self.dailydropzoneObj.cancelUpload(filetoremove);

			if (self.multiFilesdata[index].error != '') {
				self.multiuploadError = parseInt(self.multiuploadError) - parseInt(1);
				//$scope.$apply();
			}
			self.multiFilesdata.splice(index, 1);

			self.multidocCount = self.multiFilesdata.length;

			if (self.multidocCount == 0) {
				notificationService.success("There is no document in queue to upload.");
				self.fileUpload = false;
				self.cancelfileUpload = false;
			}
		}

		/*Destroy Dropzon and navigate back to listing*/
		function destroyDropzone() {
			if (self.dailydropzoneObj) {
				self.dailydropzoneObj.destroy();
				self.dailydropzoneObj.removeAllFiles(true);
			}
			self.dailydropzoneObj = '';
			self.fileUploaParam = '';
			self.multidocCount = 0;
			self.multiFilesdata = [];
			self.multiuploadError = 0;
			self.successMultiUpload = 0;
			self.filterddocs = true;

			if (self.userRole == 'LexviasuperAdmin') {
				self.unindexedList.data = [];
				getUnindexed();
			} else {
				self.uploadedList.data = [];
				getUploaded();
			}

			self.fileUpload = false;
			self.enableUpload = false;
		}

		/* remove all uploading files */
		function removeAllFiles() {
			self.fileUpload = false;
			self.multidocCount = 0;
			self.multiFilesdata = [];
			self.multiuploadError = 0;
			self.successMultiUpload = 0;
			self.cancelfileUpload = false;
			self.dailydropzoneObj.removeAllFiles();
		}

		/* Add comments for Unindexed Documents */
		function editUnindexed(docid) {
			var doc = _.find(self.unindexedList.data, function (dc) {
				if (dc.id == docid) {
					dc.editable = 1;
				}
				return dc.id == docid;
			});
			self.editDocDetails[docid] = doc;
		}

		/* Add comment on unindexed documents */
		function addComments(docid) {
			if ($.trim(self.editDocDetails[docid].newComment) != '') {
				dailyMailScanDataService.updateComments(docid, self.editDocDetails[docid].newComment)
					.then(function (response) {
						var docIndex = _.findIndex(self.unindexedList.data, { id: docid });
						if (docIndex != -1) {
							self.unindexedList.data[docIndex].comment = response.data.comment;
						}

						notificationService.success('Comment added successfully');
						removeComments(docid);
					}, function (error) {
						var docIndex = _.findIndex(self.unindexedList.data, { id: docid });
						if (docIndex != -1) {
							self.unindexedList.data[docIndex].newComment = self.editDocDetails[docid].comment;
						}
						notificationService.error('Comment not added please try again');
					});
			} else {
				notificationService.error('Please add comment to save.');
			}
		}

		/* Remove comments if added and hide textarea */
		function removeComments(docid) {
			var docIndex = _.findIndex(self.unindexedList.data, { id: docid });
			if (docIndex != -1) {
				self.unindexedList.data[docIndex].editable = 0;
				self.unindexedList.data[docIndex].newComment = '';
			}
		}

		/*Function to change the status edit view*/
		function editUploaded(docid) {
			var doc = _.find(self.uploadedList.data, function (dc) {
				if (dc.id == docid) {
					dc.editable = 1;
				}
				return dc.id == docid;
			});
			self.editUploadedStatus[docid] = doc;
		}

		/* Add comment on unindexed documents */
		function editStatus(docid) {
			dailyMailScanDataService.changeStatus(docid, self.editUploadedStatus[docid].newstatus)
				.then(function (response) {
					self.display.uploaded.uploadedfiltered = false;

					var docIndex = _.findIndex(self.uploadedList.data, { id: docid });
					if (docIndex != -1) {
						self.uploadedList.data[docIndex].status = self.editUploadedStatus[docid].newstatus;
						self.uploadedList.data[docIndex].editable = 0;
					}

					notificationService.success('Status Updated successfully');
					$timeout(function () {
						self.display.uploaded.uploadedfiltered = true;
					}, 200);
				}, function (error) {
					self.uploadedList.data[index].newstatus = self.uploadedList.data[index].status;
					notificationService.error('Status not updated please try again');
				});
		}

		/* Remove comments if added and hide textarea */
		function revertStatus(docid) {
			var docIndex = _.findIndex(self.uploadedList.data, { id: docid });
			if (docIndex != -1) {
				self.uploadedList.data[docIndex].newstatus = self.uploadedList.data[docIndex].status;
				self.uploadedList.data[docIndex].editable = 0;
			}
		}

	}
})();


(function () {
	angular.module('cloudlex.dailymailscan')
		.factory('dailymailListHelper', dailymailListHelper);

	function dailymailListHelper() {
		return {
			getUploadedGridHeaders: getUploadedGridHeaders,
			getUnindexedGridHeaders: getUnindexedGridHeaders,
			displayOptions: displayOptions,
			isUploadDocumentSelected: isUploadDocumentSelected,
			createSearchFilterTag: createSearchFilterTag,
			createViewURL: createViewURL,
		}

		function getUploadedGridHeaders() {
			return [{
				displayName: 'Document Name',
				dataWidth: "25",
				field: [{
					prop: 'name',
					template: 'underline',
					href: '#'
				}],
			},
			{
				displayName: 'Uploaded By',
				dataWidth: "25",
				field: [{
					prop: 'uploadBy',
					template: 'bold',
				}],
			},
			{
				displayName: 'Uploaded On',
				dataWidth: "20",
				field: [{
					prop: 'dateuploaded_date',
				}],
			},
			{
				displayName: 'Status',
				dataWidth: "25",
				field: [{
					prop: 'status',
				}],
			}];
		}

		function getUnindexedGridHeaders() {
			return [{
				displayName: 'Document Name',
				dataWidth: "40",
				field: [{
					prop: 'name',
					template: 'underline',
					href: '#'
				}],
			},
			{
				displayName: 'Comments',
				dataWidth: "40",
				field: [{
					prop: 'comment',
					template: 'inhtml',
				}],
			}];

		}

		function displayOptions() {
			var display = {};
			display.uploaded = {
				uploadedfiltered: true,
				uploadedListReceived: false,
				uploadedSelected: {},
				sortSeleted: 'Document Name',
				sortby: '1',
				sortorder: 'asc',
				filtertags: [],
				filterText: '',
			};

			display.unindexed = {
				unindexedfiltered: true,
				unindexedListReceived: false,
				unindexedSelected: {},
				filtertags: [],
				filterText: '',
			};

			return display;
		}

		function isUploadDocumentSelected(documentList, doc) {
			var ids = _.pluck(documentList, 'id');
			return ids.indexOf(doc.id) > -1;
		}

		function createSearchFilterTag(filterText, filtertags) {
			if (filterText && filterText != '') {
				var index = _.findIndex(filtertags, { key: 'SS' });
				if (index >= 0) {
					filtertags[index].value = 'Search : ' + filterText;
				} else {
					var sFilter = {};
					sFilter.value = 'Search : ' + filterText;
					sFilter.key = 'SS';
					filtertags.push(sFilter);
				}
			} else {
				var index = _.findIndex(filtertags, { key: 'SS' });
				filtertags.splice(index, 1);
			}
			return filtertags;
		}

		function createViewURL(uri) {
			var uriArr = uri.split('/');
			var filename = uriArr[uriArr.length - 2] + '/' + uriArr[uriArr.length - 1];
			var filenameArr = filename.split('.');
			var extension = filenameArr[filenameArr.length - 1].toLowerCase();

			try {
				var dfilename = decodeURIComponent(filename);
				filename = dfilename;
			} catch (err) {
			}
			var filenameEncoded = encodeURIComponent(filename);

			var viewUrl = "lexviafiles/downloadfile/ViewDocument?filename=" + filenameEncoded + "&&containername=" + uriArr[uriArr.length - 3];
			return viewUrl;
		}
	}
})();    