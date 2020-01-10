(function () {

    'use strict';

    angular
        .module('intake.documents')
        .controller('intakeOfficeDocViewCtrl', intakeOfficeDocViewCtrl);

    intakeOfficeDocViewCtrl.$inject = ['inatkeDocumentsDataService', 'notification-service', '$state', 'intakeDocumentsConstants', '$rootScope'];

    function intakeOfficeDocViewCtrl(inatkeDocumentsDataService, notificationService, $state, intakeDocumentsConstants, $rootScope) {
        var self = this;
        var docdetails = {};
        var url, mode;
        docdetails = inatkeDocumentsDataService.getDocumentInfo();
        if (utils.isEmptyObj(docdetails)) {
            docdetails = JSON.parse(localStorage.getItem("intakeSelDocumentInfo"));
        }
        self.sessionId = localStorage.getItem("accessToken");
        self.matterId = docdetails.matterId;
        self.documentId = docdetails.documentId;
        // self.isEditPermission = docdetails.isEditPermission == 0 ? true : false;
        self.editdoc = false;
        self.editable = false;
        self.extType = docdetails.extType;
        self.doctype = docdetails.doctype;
        if (self.extType == "doc" || self.extType == "ppt" || self.extType == "xls") {
            self.extType = self.extType + "x";
        }
        var path = location.href;
        url = docdetails.docUrl;
        if (path.indexOf("file=") == -1) {
            self.documentId = docdetails.documentId;
            window.parent.document.title = docdetails.doc_name;
            $rootScope.$emit('favicon', docdetails.favIconUrl);
            mode = "view";
        } else {
            $state.go('intakeglobal-office-view');
            if (path.indexOf("wdInitialSession") != -1) {
                self.documentId = path.substring(path.indexOf('file=') + 5, path.indexOf('&wd'));
            }
            mode = path.substring(path.indexOf('mode=') + 5, path.indexOf('&file'));
            inatkeDocumentsDataService.getDocumentDetails(self.matterId, self.documentId)
                .then(function (response) {
                    window.parent.document.title = (response.documentname).split(".")[0];
                }, function (error) {
                    notificationService.error('Error loading document.');
                });
            var discData = JSON.parse(localStorage.getItem("discoveryIntake"));
            var wopiurl = intakeDocumentsConstants.RESTAPI.wopiUrl;
            wopiurl = wopiurl.replace("[type]", self.doctype);
            _.forEach(discData, function (data) {
                if ((self.extType === data.ext) && (data.actionName === mode)) {
                    $rootScope.$emit('favicon', data.favIconUrl);
                    url = ((data.url).split("<ui=").shift()) + "ui=en-US&rs=en-US&dchat=0&IsLicensedUser=0&WOPISrc=" + wopiurl + self.documentId;
                }
            });
        }
        self.openOfficeDoc = openOfficeDoc;

        function openOfficeDoc() {
            var curTimestamp = moment().unix();
            curTimestamp = moment.unix(curTimestamp).add(120, 'minutes');
            curTimestamp = ((curTimestamp).unix()) * 1000;
            document.getElementById("access_token").value = self.sessionId;
            document.getElementById("office_form").action = url;
            document.getElementById("access_token_ttl").value = curTimestamp;
            var frameholder = document.getElementById("frameholder");
            var office_frame = document.createElement("iframe");
            office_frame.name = "office_frame";
            office_frame.id = "office_frame";
            frameholder.appendChild(office_frame);
            document.getElementById("office_form").submit();

            $("#office_form").ready(function () {
                setTimeout(function () {
                    $("#nav").css('right', '-75px');
                }, 2000);
            });
        }
        openOfficeDoc();
    }
})();