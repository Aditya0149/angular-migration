(function (utils) {
    //--------------------time manipulation functions----------------------------//
    utils.getUTCStartFromMoment = function (start) {
        var strtDt = new Date(Date.UTC(
            parseInt(start.format('YYYY')),
            parseInt(start.format('MM')) - 1,
            parseInt(start.format('DD')), 0, 0, 0, 0));

        return moment(strtDt.getTime()).unix();
    };

    utils.getUTCEndFromMoment = function (end) {
        var endDt = new Date(Date.UTC(
            parseInt(end.format('YYYY')),
            parseInt(end.format('MM')) - 1,
            parseInt(end.format('DD')), 23, 59, 59, 0));

        return moment(endDt.getTime()).unix();
    };

    utils.subtractUTCOffset = function (_date) {
        var date = angular.copy(_date);
        var utcDateOfSameDate = new Date(Date.UTC(_date.getFullYear(), _date.getMonth(), _date.getDate(), 0, 0, 0, 0));
        return utcDateOfSameDate;
    };

    utils.setFulldayTime = function (timestamp, setTimeFor) {
        var date = _getUtcMoment(timestamp);
        var isCorrectFullDayTime;
        var time = _getTimeString(date);
        isCorrectFullDayTime = _isTimeValid(time, setTimeFor);
        date = isCorrectFullDayTime ? date : moment.unix(timestamp);
        return moment(date.valueOf()).unix();
    };

    utils.isValidDateRange = function (start, end) {
        if (start == end) {
            return utils.isValidFullDayDate(start, 'start');
            //return false;
        }

        var isStartValid = utils.isValidFullDayDate(start, 'start');
        var isEndValid = utils.isValidFullDayDate(end, 'end');
        return isStartValid && isEndValid;
    };

    utils.getDateWithoutTimestamp = function (timestamp) {
        return _getUtcMoment(timestamp);
    };

    utils.isValidFullDayDate = function (timestamp, dateFor) {
        var date = _getUtcMoment(timestamp);
        var time = _getTimeString(date);
        return _isTimeValid(time, dateFor);
    };

    utils.getUTCMoment = function (timestamp) {
        return _getUtcMoment(timestamp);
    };

    utils.removeunwantedHTML = function (value) {
        return _removeunwantedHTML(value);
    };

    function _getUtcMoment(timestamp) {
        var format = 'ddd MMM DD YYYY HH:mm:ss';
        var date = moment.unix(timestamp);
        date = date.utc().format(format);
        date = moment(date, format);
        return date;
    }

    function _getTimeString(date) {
        return utils.prependZero(date.hour()) + ':' +
            utils.prependZero(date.minute()) + ':' +
            utils.prependZero(date.second());
    }

    function _isTimeValid(time, timeFor) {
        switch (timeFor) {
            case 'start':
                return time === '00:00:00';
            case 'end':
                return time === '23:59:59';
        }
    }
    function _removeunwantedHTML(value) {
        if (utils.isHTML(value)) {
            value = utils.replaceHtmlEntites(value.replace(/<\/?[^>]+>/gi, ''));
        }
        return value;
    }
    //-------------------------------------------------------------------------//


    //--------------------------------utility functions-----------------------//

    function _appendEnvPath() {
        return window.clxAppConstants.env;
    }

    utils.appendAzureAPIIntakeEnvPath = function () {
        return window.clxAppConstants.intakeBase;
    }

    utils.appendAzureAPIMatterEnvPath = function () {
        return window.clxAppConstants.matterBase;
    }

    utils.appendAzureAPIOcp_Apim_Subscription_KeyPath = function () {
        return window.clxAppConstants.Ocp_Apim_Subscription_Key;
    }

    utils.getSidebarSMSTimeDifference = function () {
        return window.clxAppConstants.sidebarSMSTimeDifference;
    }

    utils.getWebServiceBase = function () {
        return _appendEnvPath();
    };

    utils.getJavaWebServiceBaseV1 = function () {
        return _appendEnvPath() + window.clxAppConstants.javaWebServiceBaseV1;
    };

    utils.getJavaWebServiceBaseV2 = function () {
        return _appendEnvPath() + window.clxAppConstants.javaWebServiceBaseV2;
    };

    utils.getJavaWebServiceBaseV4 = function () {
        return _appendEnvPath() + window.clxAppConstants.javaWebServiceBaseV4;
    };
    utils.getJavaWebServiceBaseV5 = function () {
        return _appendEnvPath() + window.clxAppConstants.javaWebServiceBaseV5;
    };

    utils.getIntakeServiceBase = function () {
        return _appendEnvPath() + window.clxAppConstants.intakeServiceBase;
    };

    utils.getIntakeServiceBaseV2 = function () {
        return _appendEnvPath() + window.clxAppConstants.intakeServiceBaseV2;
    };

    utils.getZohoSignUp1 = function () {
        return _appendEnvPath() + window.clxAppConstants.zohoSignUp1;
    };

    utils.getWebSocketWebServiceBase = function () {
        return window.clxAppConstants.webSocketServiceBase;
    }

    utils.getWebSocketServiceEnable = function () {
        return window.clxAppConstants.webSocketServiceEnable;
    }

    utils.getAzureSearchServiceEnable = function () {
        return window.clxAppConstants.azureSearchServiceEnable;
    }
    utils.getIntakeKeywordSearchEnable = function () {
        return window.clxAppConstants.isIntakeKeywordSearchEnable;
    }

    utils.getWebServiceRedirectUrl = function () {
        return window.clxAppConstants.webServiceRedirectUrl;
    };

    utils.getImagesPath = function () {
        return window.clxAppConstants.images_path;
    };

    utils.getLogoPath = function () {
        return window.clxAppConstants.site_logo;
    };

    utils.getHideSMS = function () {
        return window.clxAppConstants.hideSMS;
    };

    utils.startsWith = function (originalString, inputString) {
        if (!originalString) {
            return false;
        }
        return originalString.substring(0, inputString.length) === inputString;
    }

    utils.getCreateFirmRecaptcha = function () {
        return window.clxAppConstants.createFirmRecaptcha;
    };

    utils.getDownloadOfficeConnectorURL = function () {
        return window.clxAppConstants.downloadOfficeConnectorURL;
    };

    utils.getDownloadOutlookConnectorURL = function () {
        return window.clxAppConstants.downloadOutlookConnectorURL;
    };

    utils.getDownloadOfficeConnectorURLforMAC = function () {
        return window.clxAppConstants.downloadOfficeConnectorURLforMAC;
    };

    utils.getSignalrURL = function () {
        return window.clxAppConstants.signalrUrl;
    };

    utils.getSignalrOn = function () {
        return window.clxAppConstants.useSignalr;
    };

    utils.getApimOn = function () {
        return window.clxAppConstants.useApim;
    };

    utils.getAutoLogoutTime = function () {
        return window.clxAppConstants.autoLogoutTime;
    };

    utils.isEmptyVal = function (val) {
        if (angular.isUndefined(val)) {
            return true;
        }

        if (_.isNull(val)) {
            return true;
        }

        if (val instanceof Array) {
            return val.length === 0;
        }

        if (utils.isEmptyString(val)) {
            return true
        }

        if (_.isNaN(val)) {
            return true
        }

        return false;
    }

    utils.isNotEmptyVal = function (val) {
        return !utils.isEmptyVal(val)
    }

    utils.isHTML = function (str) {
        var a = document.createElement('div');
        a.innerHTML = str;
        for (var c = a.childNodes, i = c.length; i--;) {
            if (c[i].nodeType == 1) return true;
        }
        return false;
    }

    utils.prependZero = function (i) {
        if (i < 10) {
            i = "0" + i;
        }
        return i;
    }

    utils.byteCount = function (s) {
        return encodeURI(s).split(/%..|./).length - 1;
    };

    utils.pad = function (d) {
        return (d < 10) ? '0' + d.toString() : d.toString();
    }

    utils.getTextFromHtml = function (html) {
        html = $("<div/>").html(html).text();
        return html;
    }

    utils.replaceHtmlEntites = (function () {
        var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
        var translate = {
            "nbsp": " ",
            "amp": "&",
            "quot": "\"",
            "lt": "<",
            "gt": ">"
        };
        return function (s) {
            if (s) {
                return (s.replace(translate_re, function (match, entity) {
                    return translate[entity];
                }));
            } else {
                return "";
            }

        }
    })();

    utils.replaceQuoteWithActual = (function (text) {
        var translate_re = /&(quot);/g;
        var translate = {
            "quot": "\""
        };
        return (text.replace(translate_re, function (match, entity) {
            return translate[entity];
        }));
    });

    utils.escapeHTML = function (html) {
        return html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    //move array element from old index to new index
    utils.moveArrayElement = function (array, old_index, new_index) {
        if (new_index >= array.length) {
            var k = new_index - array.length;
            while ((k--) + 1) {
                array.push(undefined);
            }
        }
        array.splice(new_index, 0, array.splice(old_index, 1)[0]);
    };

    utils.replaceNullByEmptyString = function (obj) {
        angular.forEach(obj, function (val, key) {
            if (angular.isUndefined(val) || _.isNull(val)) {
                obj[key] = "";
            }
        });
    }

    utils.replaceNullByEmptyStringArray = function (array) {
        _.forEach(array, function (obj) {
            utils.replaceNullByEmptyString(obj);
        });
    }

    utils.endsWith = function (string, suffix) {
        return string.indexOf(suffix, string.length - suffix.length) !== -1;
    };

    utils.isEmptyObj = function (obj) {
        if (angular.isUndefined(obj)) {
            return true
        }
        if (_.isNull(obj)) {
            return true;
        }
        return Object.keys(obj).length === 0;
    }

    utils.isEmptyString = function (str) {
        return str.toString().trim().length === 0;
    }

    utils.isNotEmptyString = function (str) {
        return str.toString().trim().length > 0;
    }

    utils.getParams = function (params) {
        params.tz = utils.getTimezone();
        var querystring = "";
        angular.forEach(params, function (value, key) {
            querystring += key + "=" + value;
            querystring += "&";
        });
        return querystring.slice(0, querystring.length - 1);
    };

    utils.getReportParams = function (params) {
        params.time_zone = utils.getTimezone();
        var querystring = "";
        angular.forEach(params, function (value, key) {
            querystring += key + "=" + value;
            querystring += "&";
        });
        return querystring.slice(0, querystring.length - 1);
    };

    utils.getContactReportParams = function (params) {
        delete params.tz;
        delete params.contactid;
        var querystring = "";
        angular.forEach(params, function (value, key) {
            querystring += key + "=" + value;
            querystring += "&";
        });
        return querystring.slice(0, querystring.length - 1);
    };

    utils.getIntakeParams = function (params) {
        var querystring = "";
        angular.forEach(params, function (value, key) {
            querystring += key + "=" + value;
            querystring += "&";
        });
        return querystring.slice(0, querystring.length - 1);
    };
    utils.getParamsNew = function (params) {
        var tz = utils.getTimezone();
        var timeZone = moment.tz.guess();
        params.tz = timeZone;
        var querystring = "";
        angular.forEach(params, function (value, key) {
            querystring += key + "=" + value;
            querystring += "&";
        });
        return querystring.slice(0, querystring.length - 1);
    };
    utils.getParamsForIntake = function (params) {
        params.tz = utils.getTimezone();
        var querystring = "";
        angular.forEach(params, function (value, key) {
            if (utils.isNotEmptyVal(value)) {
                querystring += key + "=" + value;
                querystring += "&";
            }

        });
        return querystring.slice(0, querystring.length - 1);
    };
    utils.getParamsOnly = function (params) {
        var querystring = "";
        angular.forEach(params, function (value, key) {
            querystring += key + "=" + value;
            querystring += "&";
        });
        return querystring.slice(0, querystring.length - 1);
    };

    utils.getTimezone = function () {
        var offset = new Date().getTimezoneOffset(),
            o = Math.abs(offset);
        return (offset < 0 ? "+" : "-") + ("00" + Math.floor(o / 60)).slice(-2) + ":" + ("00" + (o % 60)).slice(-2);
    };

    utils.contains = function (string, what) {
        return string.indexOf(what) > -1;
    };

    utils.extractFileNameFromUrl = function (text) {
        var urlRegex = /(https?):\/\/(www\.)?[a-z0-9\.:].*?(?=\s)/ig;
        return text.replace(urlRegex, function (url) {
            var uriArr = url.split('/');
            var filename = uriArr[uriArr.length - 1];
            filename = decodeURIComponent(filename);
            var fileNameArr = filename.split('.');
            var fileExt = fileNameArr[fileNameArr.length - 1];
            var name = fileNameArr[0];
            var docNameRegex = /((-V1-)[0-9]*)/ig;
            return name.replace(docNameRegex, function (url) {
                return '.' + fileExt;
            });
        });
    }

    //--------------------------------------------------------------------------------------//


    /************************date utils********************************************/

    /****Full Day UTC timestamp****/
    utils.getUTCTimeStamp = function (selectedDate) {
        selectedDate = moment(selectedDate).unix();
        selectedDate = moment.unix(selectedDate).format('YYYY-MM-DD');
        var UTCDate = moment(selectedDate + " 0:00 +0000", "YYYY-MM-DD HH:mm Z");
        var timeStamp = moment(UTCDate).unix();
        return timeStamp;
    }

    utils.getUTCTimeStampEnd = function (selectedDate) {
        var date = new Date(selectedDate);
        var year = date.getUTCFullYear();
        var month = date.getUTCMonth();
        var day = date.getUTCDate();
        var startHour = Date.UTC(year, month, day, 23, 59, 59);
        var timestamp = startHour / 1000;
        return timestamp;
    }

    utils.getUTCTimeStampEndDay = function (selectedDate) {
        var date = new Date(selectedDate);
        var year = date.getUTCFullYear();
        var month = date.getUTCMonth();
        var day = date.getDate();
        var startHour = Date.UTC(year, month, day, 23, 59, 59);
        var timestamp = startHour / 1000;
        return timestamp;
    }

    utils.getUTCTimeStampStart = function (selectedDate) {
        var date = new Date(selectedDate);
        var year = date.getUTCFullYear();
        var month = date.getUTCMonth();
        var day = date.getUTCDate();
        var startHour = Date.UTC(year, month, day, 00, 00, 00);
        var timestamp = startHour / 1000;
        return timestamp;
    }

    /**********/

    /** Non Full day timestamp */
    utils.getTimestampEnd = function (selectedDate) {
        var date = moment.unix(selectedDate).endOf('day');
        date = date.utc();
        date = date.toDate();
        date = new Date(date);
        date = moment(date.getTime()).unix();
        return date;
    }

    utils.getTimestampStart = function (selectedDate) {
        var date = moment.unix(selectedDate).startOf('day');
        date = date.utc();
        date = date.toDate();
        date = new Date(date);
        date = moment(date.getTime()).unix();
        return date;
    }

    utils.getStartOfDayTimestamp = function (date) {
        var startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        var timestamp = startOfDay / 1000;
        return timestamp;
    }

    utils.getFormattedDateString = function (date) {
        if (angular.isUndefined(date) || date == '') {
            return;
        }
        var yyyy = date.getFullYear().toString();
        var mm = (date.getMonth() + 1).toString(); // getMonth() is zero-based
        var dd = date.getDate().toString();
        return (mm[1] ? mm : "0" + mm[0]) + '/' + (dd[1] ? dd : "0" + dd[0]) + '/' + yyyy; // padding
    }

    utils.getStartOfDayUTCDate = function (d) {
        return new Date(
            d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate()
        );
    }

    utils.getUTCDateObj = function () {
        var now = new Date();
        var now_utc = new Date(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            now.getUTCHours(),
            now.getUTCMinutes(),
            now.getUTCSeconds());
        return now_utc;
    }

    utils.getUTCDate = function (now) {
        var now_utc = new Date(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            now.getUTCHours(),
            now.getUTCMinutes(),
            now.getUTCSeconds());
        return now_utc;
    }

    utils.convertUTCtoDate = function (timestamp) {
        return new Date(timestamp * 1000);
    }

    utils.convertUTCtoUTCString = function (timestamp) {
        return utils.convertUTCtoDate(timestamp).toUTCString();
    }
    /****************************************************************************/

    utils.firstDayOfWeek = function (year, week) {

        // Jan 1 of 'year'
        var d = new Date(year, 0, 1),
            offset = d.getTimezoneOffset();

        // ISO: week 1 is the one with the year's first Thursday 
        // so nearest Thursday: current date + 4 - current day number
        // Sunday is converted from 0 to 7
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));

        // 7 days * (week - overlapping first week)
        d.setTime(d.getTime() + 7 * 24 * 60 * 60 * 1000 *
            (week + (year == d.getFullYear() ? -1 : 0)));

        // daylight savings fix
        d.setTime(d.getTime() +
            (d.getTimezoneOffset() - offset) * 60 * 1000);

        // back to Monday (from Thursday)
        d.setDate(d.getDate() - 3);

        var timestamp = moment(d.getTime()).unix();

        return moment.unix(timestamp);
    }

    var opts = {
        lines: 13, // The number of lines to draw
        length: 16, // The length of each line
        width: 5, // The line thickness
        radius: 20, // The radius of the inner circle
        corners: 1, // Corner roundness (0..1)
        rotate: 0, // The rotation offset
        direction: 1, // 1: clockwise, -1: counterclockwise
        color: '#000', // #rgb or #rrggbb or array of colors
        speed: 1.4, // Rounds per second
        trail: 60, // Afterglow percentage
        shadow: false, // Whether to render a shadow
        hwaccel: false, // Whether to use hardware acceleration
        className: 'spinner', // The CSS class to assign to the spinner
        zIndex: 2e9, // The z-index (defaults to 2000000000)
        top: '50%', // Top position relative to parent
        left: '50%' // Left position relative to parent
    };
    var target = document.getElementById('foo');
    //var spinner = new Spinner(opts);

    utils.startSpinner = function () {
        spinner.spin(target);
    }

    utils.stopSpinner = function () {
        spinner.stop();
    }

    utils.dataURItoBlob = function dataURItoBlob(dataURI) {
        var byteString = atob(dataURI.split(',')[1]);
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: 'image/jpeg' });
    }

    utils.getURL = function (url, id) {
        var url = url.replace("[ID]", id);
        return url;
    }

    utils.check_cookie = function (userNameFor) {
        var cookieKey = "default_app=";
        var userName = localStorage.getItem('user_email');
        if (userNameFor) {
            userName = userNameFor;
        }
        cookieKey = userName + '@' + cookieKey;
        if (document.cookie.split(';').filter(function (item) {
            var cookiesValue = item;
            return item.indexOf(cookieKey) >= 0
        }).length) {
            if (document.cookie.split(';').filter(function (item) {
                return item.indexOf(cookieKey + 'MM') >= 0
            }).length) {
                return "MM";
            } else if (document.cookie.split(';').filter(function (item) {
                return item.indexOf(cookieKey + 'IM') >= 0
            }).length) {
                return "IM";
            } else if (document.cookie.split(';').filter(function (item) {
                return item.indexOf(cookieKey + 'RE') >= 0
            }).length) {
                return "RE";
            } else if (document.cookie.split(';').filter(function (item) {
                return item.indexOf(cookieKey + 'AR') >= 0
            }).length) {
                return "AR";
            } else {
                return "";
            }

        } else {
            return "";
        }
    }

    utils.delete_cookie = function (name) {
        document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }

    utils.removeDefaultApp = function (link, userNameFor) {
        var exstingDefaultApp = utils.check_cookie(userNameFor);
        if (exstingDefaultApp == link) {
            var userName = localStorage.getItem('user_email');
            if (userNameFor) {
                userName = userNameFor;
            }
            utils.delete_cookie(userName + "@default_app");
            return;
        }
    }

    utils.checkIfAppActive = function (appList, appKey) {
        var appPermissions = _.filter(appList, function (entity) {
            if (entity.app_code == appKey) {
                return entity;
            }
        });
        if (appPermissions && appPermissions.length > 0) {
            return appPermissions[0].is_active == 1 && appPermissions[0].permission == 1 ? 1 : 0
        } else {
            return 0;
        }
    }

    utils.downloadFile = function (data, filename, mime) {
        // It is necessary to create a new blob object with mime-type explicitly set
        // otherwise only Chrome works like it should
        var blob = new Blob([data], { type: mime || 'application/octet-stream' });
        if (typeof window.navigator.msSaveBlob !== 'undefined') {
            // IE doesn't allow using a blob object directly as link href.
            // Workaround for "HTML7007: One or more blob URLs were
            // revoked by closing the blob for which they were created.
            // These URLs will no longer resolve as the data backing
            // the URL has been freed."
            window.navigator.msSaveBlob(blob, filename);
            return;
        }
        // Other browsers
        // Create a link pointing to the ObjectURL containing the blob
        var blobURL = window.URL.createObjectURL(blob);
        var tempLink = document.createElement('a');
        tempLink.style.display = 'none';
        tempLink.href = blobURL;
        tempLink.setAttribute('download', filename);
        // Safari thinks _blank anchor are pop ups. We only want to set _blank
        // target if the browser does not support the HTML5 download attribute.
        // This allows you to download files in desktop safari if pop up blocking
        // is enabled.
        if (typeof tempLink.download === 'undefined') {
            //tempLink.setAttribute('target', '_blank');
            window.location = blobURL;
        } else {
            document.body.appendChild(tempLink);
            setTimeout(function () {
                tempLink.click();
                document.body.removeChild(tempLink);
            }, 10);

            setTimeout(function () {
                // For Firefox it is necessary to delay revoking the ObjectURL
                window.URL.revokeObjectURL(blobURL);
            }, 100);
        }

    }

    utils.mapKeys = function (data) {
        var obj = {};
        obj.contact_type = JSON.parse(data.matter_contact_type);
        obj.user_permission = JSON.parse(data.user_permissions);

        var salutations = JSON.parse(data.matter_contact_salutations);
        obj.matter_contact_salutations = [];
        _.forEach(salutations, function (item) {
            var list = {};
            list.id = item.id;
            list.value = item.name;
            obj.matter_contact_salutations.push(list);
        })

        obj.category = [];
        _.forEach(data.category, function (item) {
            var list = {};
            list.id = item.id.toString();
            list.name = item.name;
            obj.category.push(list);
        })

        obj.contries = [];
        _.forEach(data.countries, function (item) {
            var list = {};
            list.id = item.id.toString();
            list.code = item.code;
            list.name = item.name;
            obj.contries.push(list);
        })

        obj.event_reschedule_reason = [];
        _.forEach(data.event_reschedule_reasons, function (item) {
            var list = {};
            list.reason_id = item.reason_id.toString();
            list.reason_order = item.reason_order.toString();
            list.reason_name = item.reason_name;
            obj.event_reschedule_reason.push(list);
        })

        obj.states = [];
        _.forEach(data.states, function (item) {
            var list = {};
            list.id = item.id.toString();
            list.value = item.value;
            list.name = item.name;
            obj.states.push(list);
        })

        obj.venues = [];
        _.forEach(data.venues, function (item) {
            var list = {};
            list.id = item.id.toString();
            list.jurisdiction_id = item.jurisdiction_id.toString();
            list.name = item.name;
            obj.venues.push(list);
        })

        obj.type = [];
        _.forEach(data.matter_types, function (item) {
            var list = {};
            list.id = item.id.toString();
            list.name = item.name;
            list['sub-type'] = [];
            _.forEach(item.sub_type, function (currentItem) {
                var array = {};
                array.id = currentItem.id.toString();
                array.name = currentItem.name;
                list['sub-type'].push(array);
            });
            obj.type.push(list);
        })

        obj.contact_roles = [];
        _.forEach(data.contact_roles, function (item) {
            var list = {};
            list.contactroleid = item.contact_id.toString();
            list.contactrolename = item.contact_role_name;
            obj.contact_roles.push(list);
        })

        obj.documents_cat = [];
        _.forEach(data.document_categories, function (item) {
            var list = {};
            list.Id = item.doc_category_id.toString();
            list.Name = item.doc_category_name;
            obj.documents_cat.push(list);
        })

        obj.event_types = [];
        _.forEach(data.event_types, function (item) {
            var list = {};
            list.LabelId = item.label_id.toString();
            list.Name = item.name;
            list.is_critical = item.is_critical.toString();
            list.is_deadline = item.is_deadline.toString();
            obj.event_types.push(list);
        })

        obj.google_calendar_color_codes = [];
        _.forEach(data.google_calendar_color_codes, function (item) {
            var list = {};
            list.background = item.background;
            list.foreground = item.foreground;
            list.g_colorid = item.google_colorid.toString();
            list.id = item.id.toString();
            list.type = item.type;
            obj.google_calendar_color_codes.push(list);
        })

        obj.intake_taskcategories = [];
        _.forEach(data.intake_task_categories, function (item) {
            var list = {};
            list.categoryname = item.intake_category_name;
            list.intake_task_subcategory_id = item.intake_task_subcategory_id.toString();
            list.name = item.intake_sub_category_name;
            list.intake_taskcategory_id = item.intake_task_category_id.toString();
            obj.intake_taskcategories.push(list);
        })

        obj.jurisdictions = [];
        _.forEach(data.jurisdiction, function (item) {
            var list = {};
            list.id = item.jurisdiction_id.toString();
            list.name = item.name;
            obj.jurisdictions.push(list);
        })

        obj.matter_contact_roles = [];
        _.forEach(data.matter_contact_roles, function (item) {
            var list = {};
            list.cid = item.contact_id.toString();;
            list.c_role_name = item.contact_role_name;
            obj.matter_contact_roles.push(list);
        })

        obj.statuses = [];
        _.forEach(data.mattes_statuses, function (item) {
            var list = {};
            list.id = item.matter_status_id.toString();
            list.name = item.matter_status_name;
            list['sub-status'] = [];
            _.forEach(item.matter_sub_status, function (currentItem) {
                var array = {};
                array.id = currentItem.matter_sub_status_id.toString();
                array.name = currentItem.matter_sub_status_name;
                list['sub-status'].push(array);
            });
            obj.statuses.push(list);
        })

        obj.motion_statuses = [];
        _.forEach(data.motion_statuses, function (item) {
            var list = {};
            list.id = item.motion_status_id.toString();
            list.motion_status_type = item.motion_status_type;
            list.name = item.motion_status_name;
            obj.motion_statuses.push(list);
        })

        obj['law-types'] = [];
        _.forEach(data.law_types, function (item) {
            var list = {};
            list.id = item.law_type_id.toString();;
            list.name = item.law_type_name;
            obj['law-types'].push(list);
        })
        obj.motion_types = [];
        _.forEach(data.motion_types, function (item) {
            var list = {};
            list.id = item.motion_type_id.toString();
            list.name = item.motion_type_name;
            obj.motion_types.push(list);
        })

        obj.notes_cat = [];
        _.forEach(data.notes_category, function (item) {
            var list = {};
            list.notecategory_id = item.note_category_id.toString();
            list.name = item.name;
            obj.notes_cat.push(list);
        })

        obj.referred_statuses = [];
        _.forEach(data.referred_statuses, function (item) {
            var list = {};
            list.id = item.referred_status_id.toString();
            list.name = item.referred_status_name;
            obj.referred_statuses.push(list);
        })

        obj.taskcategories = [];
        _.forEach(data.task_categories, function (item) {
            var list = {};
            list.name = item.name;
            list.categoryname = item.category_name;
            list.practiceareaid = item.practiceareaid.toString();
            list.taskcategoryid = item.task_categoryid.toString();
            list.tasksubcategoryid = item.task_sub_categoryid.toString();
            obj.taskcategories.push(list);
        })
        return obj;
    }

    utils.resizeNiceScroll = function () {
        $("body").getNiceScroll().resize();
    }

    utils.getLocation = function (sectors) {
        var placeArr = [];
        _.forEach(sectors, function (item) {
            switch (item) {
                case 1: //event
                    placeArr.push("Event");
                    break;
                case 2: //task
                    placeArr.push("Task");
                    break;
                case 3: //reminders
                    placeArr.push("Event_Reminder");
                    placeArr.push("Task_Reminder");
                    break;
                case 4: //Email
                    placeArr.push("Email");
                    break;
                case 5://sms
                    placeArr.push("Client_Messenger");
                    break;
                case 6://Sidebar_Comment
                    placeArr.push("Sidebar_Comment");
                    placeArr.push("Sidebar_Post");
                    break;
                case 7:
                    placeArr.push("Matter");
                    break;
                case 8:
                    placeArr.push("Intake");
                    break;
            }
        });
        return placeArr;
    }

    utils.processNotification = function (res) {
        var now = moment(new Date()); //todays date
        _.forEach(res, function (currentItem) {
            var end = moment.unix(currentItem.created_on); // another date
            var duration = moment.duration(now.diff(end));
            currentItem.createdHoursBack = Math.floor(duration.asHours());
            currentItem.createdMinuteBack = Math.floor(duration.asMinutes());
            currentItem.notiDots = false;
            //
            if (currentItem.notification_type == "Sidebar_Comment") {
                var notData = JSON.parse(currentItem.notification_text);
                currentItem.text = notData.notification_text;
                currentItem.nid = notData.nid;
                currentItem.comment = notData.comment_body_value;
                currentItem.post = notData.body_value;
            }
            if (currentItem.notification_type == "Sidebar_Post") {
                var notData = JSON.parse(currentItem.notification_text);
                currentItem.text = notData.notification_text;
                currentItem.nid = notData.nid;
                currentItem.post = notData.body_value;
            }
            if (currentItem.notification_type == "Email") {
                var notData = JSON.parse(currentItem.notification_text);
                currentItem.mail_body = notData.mail_body;
                currentItem.senders_name = notData.senders_name;
                currentItem.subject = notData.subject;
            }
            if (currentItem.notification_type == "Event") {
                currentItem.text = currentItem.notification_text;
                currentItem.type = 'event';
            }
            if (currentItem.notification_type == "Task") {
                currentItem.text = currentItem.notification_text;
                currentItem.type = 'task';
            }
            if (currentItem.notification_type == "Event_Reminder") {
                var notData = JSON.parse(currentItem.notification_text);
                currentItem.text = notData.notification_text;
                currentItem.type = 'event';
            }
            if (currentItem.notification_type == "Task_Reminder") {
                var notData = JSON.parse(currentItem.notification_text);
                currentItem.text = notData.notification_text;
                currentItem.type = 'task';
            }
         
            if (currentItem.notification_type == "Matter") {
                currentItem.text = currentItem.notification_text;
                currentItem.type = 'matter';
            }

            if (currentItem.notification_type == "Intake") {
                currentItem.text = currentItem.notification_text;
                currentItem.type = 'intake';
            }

            if (currentItem.notification_type == "Client_Messenger") {
                var notData = JSON.parse(currentItem.notification_text);
                currentItem.sender_name = notData.sender_name;
                currentItem.text = notData.message;
                currentItem.is_sms = notData.is_sms;
            }

        });

        return res;
    }


    var ConvertBase = function (num) {
        return {
            from: function (baseFrom) {
                return {
                    to: function (baseTo) {
                        return parseInt(num, baseFrom).toString(baseTo);
                    }
                };
            }
        };
    };

    // binary to decimal
    ConvertBase.bin2dec = function (num) {
        return ConvertBase(num).from(2).to(10);
    };

    // binary to hexadecimal
    ConvertBase.bin2hex = function (num) {
        return ConvertBase(num).from(2).to(16);
    };

    // decimal to binary
    ConvertBase.dec2bin = function (num, size) {
        var s = ConvertBase(num).from(10).to(2);
        while (s.length < (size || 4)) { s = "0" + s; }
        return s;
    };

    // decimal to hexadecimal
    ConvertBase.dec2hex = function (num) {
        return ConvertBase(num).from(10).to(16);
    };

    // hexadecimal to binary
    ConvertBase.hex2bin = function (num) {
        return ConvertBase(num).from(16).to(2);
    };

    // hexadecimal to decimal
    ConvertBase.hex2dec = function (num) {
        return ConvertBase(num).from(16).to(10);
    };

    utils.ConvertBase = ConvertBase;

    /*
    * Usage example: BDS
    * ConvertBase.bin2dec('111'); // '7'
    * ConvertBase.dec2hex('42'); // '2a'
    * ConvertBase.hex2bin('f8'); // '11111000'
    * ConvertBase.dec2bin('22'); // '10110'
    */

})(window.utils = {})
