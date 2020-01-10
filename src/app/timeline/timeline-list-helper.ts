require('../utils/genericUtils.js');
import * as moment from 'moment';
import * as _ from 'underscore';
import { Injectable } from '@angular/core';
declare var angular: angular.IAngularStatic;
declare var utils;

@Injectable()
export class TimelineListHelperService {
    static $inject = ['globalConstants'];
    constructor(private globalConstants) {}
    usersList;
    getuserList(users) {
        this.usersList = users;
    }

    setModifiedDisplayDate(timelineList) {
        _.forEach(timelineList, (timeline:any) => {
            timeline.date = moment.unix(timeline.date).format('DD MMM YYYY hh:mm A');
        });
    }

    //print start
    getPrintData(data, filter, sort, matterInfo) {
        var getTimelineDom = this.getTimelineDataPrint(data, filter, sort, matterInfo)
    }

    getTimelineDataPrint(data, filter, sort, matterInfo) {
        var headers = this.getGridHeaders();
        var headersForPrint = this.getHeadersForPrint(headers);
        var filtersForPrint = this.getFiltersObj(filter, sort, matterInfo);
        var printDom = this.getPrintTimeline(data, headersForPrint, filtersForPrint, sort);
        window.open().document.write(printDom);
    }

    // filter object for print

    // printdom
    getPrintTimeline(data, headers, filters, sort) {
        var html = "<html><title>Timeline List</title>";
        html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
        html += "<style>table tr { page-break-inside: always; }  </style>";
        html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}tbody {display:table-row-group;}</style>";
        html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + this.globalConstants.site_logo + " width='200px'/>";
        html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Timeline List </h1><div></div>";
        html += "<body>";
        html += "<div><h2 style='padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";
        html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
        html += "<tr>";
        angular.forEach(filters, (val, key) => {
            html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;' class='labelTxt'>";
            html += "<label><strong>" + key + " : </strong></label>";
            html += "<span style='padding:5px; '>  " + val + '</span>';
            html += "</div>";
        });
        html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
        html += "</tr>";
        html += '<tr>';
        angular.forEach(headers, (head) => {
            html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + head.display + "</th>";

        });
        html += '</tr>';

        html += '</tr>';


        angular.forEach(data, (tim) => {
            html += '<tr>';
            angular.forEach(headers, (head) => {
                tim[head.prop] = (_.isNull(tim[head.prop]) || angular.isUndefined(tim[head.prop]) || utils.isEmptyString(tim[head.prop])) ? " - " : tim[head.prop];

                html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + utils.removeunwantedHTML(tim[head.prop]) + "</td>";

            })
            html += '</tr>'
        })

        return html;

    }


    getFiltersObj(filter, sort, matterInfo) {
        var filterObj = {};

        filterObj['Matter Name'] = utils.isNotEmptyVal(matterInfo.matter_name) ? utils.removeunwantedHTML(matterInfo.matter_name) : '';
        filterObj['File #'] = utils.isNotEmptyVal(matterInfo.file_number) ? matterInfo.file_number : '';

        if (filter.activity_filter) {
            filterObj['Activity '] = filter.activity_filter.name;
        } else {
            filterObj['Activity '] = '';
        }

        if (filter.created_by_filter) {
            var user = _.find(this.usersList, (usr:any) => {
                return usr.uid == filter.created_by_filter;
            });
            filterObj['Created By'] = user.Name;
        } else {
            filterObj['Created By'] = '';
        }

        if (filter.updated_by_filter) {
            var user = _.find(this.usersList, (usr:any) => {
                return usr.uid == filter.updated_by_filter;
            });
            filterObj['Updated By'] = user.Name;
        } else {
            filterObj['Updated By'] = '';
        }

        // set from and to date for print view...
        var from = (filter.start_date) ? moment.unix(filter.start_date).format('MM/DD/YYYY') : '-';
        var to = (filter.end_date) ? moment.unix(filter.end_date).format('MM/DD/YYYY') : '-'
        filterObj['Date Range'] = 'from ' + from + ' to ' + to;

        filterObj['Sort Order'] = sort; //Bug#6596
        return filterObj
    }

    //extract headers

    getHeadersForPrint(headers) {
        var displayHeaders = [];
        _.forEach(headers, (head:any) => {
            if (head.displayName != 'User') {
                _.forEach(head.field, (field:any) => {
                    displayHeaders.push({
                        prop: field.prop,
                        display: field.printDisplay
                    });
                })
            }
        })
        return displayHeaders
    }


    //print end

    getGridHeaders() {
        return [

            {

                field: [{
                    html: '<div class="defaultprofileImage"><img ng-src="{{data.pic}}" width="50" height="50" style="border-radius: 10000px"></div>',
                    printDisplay: 'User'
                }],

                displayName: 'User',
                dataWidth: "10"
            },

            {
                field: [{
                    prop: 'user_name',
                    printDisplay: 'User'
                },
                {
                    prop: 'event',
                    template: 'bold',
                    printDisplay: 'Activity'
                }
                ],
                displayName: 'Activity',
                dataWidth: '30'
            },
            {
                field: [{
                    prop: 'details',
                    printDisplay: 'Details '
                }],
                displayName: 'Details',
                dataWidth: '30'
            },
            {
                field: [{
                    prop: 'date',
                    //   filter: 'utcDateFilter: \'DD MMM  YYYY\'',
                    printDisplay: 'Date and Time'
                }],
                displayName: 'Date and Time',
                dataWidth: '30'
            }

        ]
    } // helper      
} // helper      
