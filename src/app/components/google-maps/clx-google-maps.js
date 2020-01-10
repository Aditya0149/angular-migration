(function () {
    'use strict';

    angular
        .module('cloudlex.components')
        .factory('googleMapHelper', function () {
            return {
                setMarkers: _setMarkers,
                getMarkerWithLabelObj: _getMarkerWithLabelObj,
                getMarkerContent: _getMarkerContent

            }

            function _setMarkers(markerData, initialize) {
                var zipCodes = Object.keys(markerData),
                    geocoder = new google.maps.Geocoder(),
                    i = 0,
                    markers = [];

                setMarkers();
                function setMarkers() {
                    if (i === zipCodes.length) {
                        initialize(markers);
                    } else {

                        var mattersAtZipcode = markerData[zipCodes[i]];
                        geocoder.geocode({ address: zipCodes[i], region: 'US' }, function (results, status) {
                            if (status == google.maps.GeocoderStatus.OK) {
                                var lat = results[0].geometry.location.lat();
                                var lng = results[0].geometry.location.lng();
                                markers.push({
                                    location: new google.maps.LatLng(lat, lng),
                                    content: mattersAtZipcode
                                });
                                i++;
                                setMarkers();
                            } else {
                                i++;
                                setMarkers();
                            }
                        })
                    }
                }
            }

            function _getMarkerWithLabelObj(map, position, content) {
                return {
                    position: position,
                    icon: 'styles/images/map-icon.png',
                    labelContent: "<h3>" + content.length + "</h3>",
                    labelClass: "labels",
                    labelAnchor: new google.maps.Point(4, 25),
                    labelStyle: {
                        opacity: 0.75,
                        'font-weight': 'bold',
                        'font-size': 12 + 'px'
                    },
                    zIndex: 999999,
                    map: map
                }
            }

            function _getMarkerContent(matters) {
                var html = "";
                _.forEach(matters.slice(0, 4), function (matter) {
                    html += '<div><a href="#/matter-overview/' + matter.matter_id + '">' + matter.matter_name + '</a></div>';
                })
                if ((matters.length - 4) > 0) {
                    var moreString = matters.length - 4 + " More";
                    html += '<div>' + moreString + '</div>';
                }
                return html;
            }
        })

    angular
        .module('cloudlex.components')
        .directive('clxGoogleMap', googleMapDirective)

    googleMapDirective.$inject = ['$state', 'googleMapHelper'];

    function googleMapDirective($state, googleMapHelper) {

        var mapDirective = {
            restrict: "E",
            scope: {
                venue: '=',
                markerData: '='
            },
            link: linkFn
        };

        return mapDirective;

        function linkFn(scope) {
            var myCenter;

            scope.$watch('venue', function (venue) {
                if (angular.isDefined(venue)) {
                    setMap(venue);
                }
            })

            scope.$watch('markerData', function (markerData) {
                if (angular.isDefined(markerData)) {
                    googleMapHelper.setMarkers(markerData, initialize);
                }
            }, true)

            function setMap(venue) {
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({ 'address': venue + ', us' }, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        myCenter = results[0].geometry.location;
                    }
                })
            }


            function initialize(markers) {
                var mapProp = {
                    center: myCenter,
                    scrollwheel: false,
                    navigationControl: false,
                    mapTypeControl: false,
                    scaleControl: false,
                    zoom: 10,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
                var infoWindow,
                    map = new google.maps.Map(document.getElementById("googleMap"), mapProp);

                function setMarker(map, position, content) {
                    var marker;
                    var markerOptions = {
                        position: position,
                        map: map,
                        icon: 'styles/images/map-icon.png'
                    };

                    marker = new MarkerWithLabel(googleMapHelper.getMarkerWithLabelObj(map, position, content))

                    google.maps.event.addListener(marker, 'click', function () {
                        // close window if not undefined
                        if (infoWindow !== void 0) {
                            infoWindow.close();
                        }
                        // create new window
                        var infoWindowOptions = {
                            content: googleMapHelper.getMarkerContent(content)
                        };
                        infoWindow = new google.maps.InfoWindow(infoWindowOptions);
                        //google.maps.event.addListener(infoWindow, 'domready', function () {
                        //    $('#more').click(function () {
                        //        $state.go('matter-list');
                        //    })
                        //});

                        infoWindow.open(map, marker);
                    });

                    function gotoMatterList() {
                        alert("done");
                    }
                    return marker;
                }

                _.forEach(markers, function (marker) {
                    setMarker(map, marker.location, marker.content);
                })
            }
        }
    }
})();