require('../utils/genericUtils.js');
import * as moment from 'moment-timezone';
import * as _ from 'underscore';
import { Injectable } from '@angular/core';
declare var utils;

@Injectable()
export class TimelineDataService {
    static $inject = ["$http", "$q", "globalConstants"];
    serviceBase:any = {};
    constructor(private $http, private $q, private globalConstants) {
        this.serviceBase.GET_MATTER_INFO = this.globalConstants.webServiceBase + "matter/matter_index_edit/[ID].json";

        //API URL Constants Off Drupal
        this.serviceBase.GET_TIMELINE_OFFDRUPAL = this.globalConstants.javaWebServiceBaseV4 + "timeline/get-timeline/[ID]";
        this.serviceBase.GET_TIMELINE_REPORTS_OFFDRUPAL = this.globalConstants.javaWebServiceBaseV4 + 'timeline/timeline-export/[ID]';
    }
    
    

    // get matter details



    eventsService = {
        getTimeline_offDrupal: this.getTimeline_offDrupal,
        matterInfo: this.matterInfo,
        downloadTimelinelist: this.downloadTimelinelist
    };

    

    getURL(serviceUrl, id) {
        var url = serviceUrl.replace("[ID]", id);
        return url;
    }

    getTimeline_offDrupal(filtersApplied, matterID) {
        var deferred = this.$q.defer();
        var url = this.getURL(this.serviceBase.GET_TIMELINE_OFFDRUPAL, matterID);
        url = url + '?' + utils.getIntakeParams(filtersApplied);
        var tz = utils.getTimezone();
        var timeZone = moment.tz.guess();    
        
        url += '&tz=' + timeZone;

        var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') };
        this.$http({
            url: url,
            method: "GET",
            headers: token// Add params into headers
        }).success((response, status, headers, config) => {
            deferred.resolve(response);
        }).error((ee, status, headers, config) => {
            deferred.reject(ee);
        });
        return deferred.promise;
    }

    // get matter specific info
    matterInfo(matterID) {
        var url = this.getURL(this.serviceBase.GET_MATTER_INFO, matterID);
        return this.$http.get(url,
            {
                withCredentials: true
            });
    }

    //Off Drupal Export US : 12369
    downloadTimelinelist(popUpFilters, pageFilters, matterID) {

        var deferred = this.$q.defer();
        var url = this.getURL(this.serviceBase.GET_TIMELINE_REPORTS_OFFDRUPAL, matterID);
        url += '?' + utils.getIntakeParams(popUpFilters);
        var tz = utils.getTimezone();
        var timeZone = moment.tz.guess();    
        url += '&tz=' + timeZone;

        var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
        this.$http({
            url: url,
            method: "GET",
            headers: token,// Add params into headers
            responseType: 'arraybuffer'
        }).success((response, status, headers, config) => {
            deferred.resolve(response);
        }).error((ee, status, headers, config) => {
            deferred.reject(ee);
        });
        return deferred.promise;
    }
}
