(function () {

    angular
        .module('intake.components')
        .factory('donutHelperForIntake', donutHelperForIntake);

    function donutHelperForIntake() {
        return {
            getValuesForDonut: getValuesForDonut,
            getNames: getNames
        }

        //we have to get the array in [key,values.......] format
        function getValuesForDonut(data, donutFor, donutVal) {
            var values = [];
            var donutForUniqueValues = getKeyValuePair(data, donutFor, donutVal);
            var keys = _.pluck(donutForUniqueValues, 'key');
            keys = _.unique(keys);
            _.forEach(keys, function (key, index) {
                var valForKey = _.pluck(_.where(donutForUniqueValues, { key: key }), 'value');
                valForKey.unshift(key);
                values.push(valForKey);
            })
            return values;
        }

        function getNames(data, donutFor, displayName) {
            var displayKeyValues = getKeyValuePair(data, donutFor, displayName);
            var namesObj = {}
            _.forEach(displayKeyValues, function (keyVal) {
                namesObj[keyVal.key] = keyVal.value;
            })
            return namesObj;
        }

        function getKeyValuePair(data, donutFor, donutVal) {
            var donutForData = [];
            _.forEach(data, function (item) {
                var data = {
                    key: getDonutValue(item, donutFor),
                    value: getDonutValue(item, donutVal)
                };
                donutForData.push(data);
            });
            return donutForData;
        }

        function getDonutValue(obj, valFor) {
            var keys = valFor.split('.');
            var val = obj;
            _.forEach(keys, function (key) {
                val = val[key];
            })
            return val;
        }
    }


    angular
        .module('intake.components')
        .directive('clxC3Donut', donut);

    donut.$inject = ['donutHelperForIntake', '$rootScope'];
    function donut(donutHelperForIntake, $rootScope) {

        var donutDirective = {
            restrict: "E",
            scope: {
                onClick: '&',
                data: '=',
                title: '@',
                bindTo: '@',
                displayVal: '@',
                donutFor: '@',
                donutVal: '@',
            },
            link: linkFn,
        };

        return donutDirective;

        function linkFn(scope, el, attr, clxC3) {
            var values = donutHelperForIntake.getValuesForDonut(scope.data, scope.donutFor, scope.donutVal),
                names = donutHelperForIntake.getNames(scope.data, scope.donutFor, scope.displayVal),
                title = scope.title + 'Attorney(s)',
                selectedId;

            var chart = c3.generate({
                bindto: "#" + scope.bindTo,
                data: {
                    selection: {
                        enabled: true,
                        multiple: false
                    },
                    columns: values,
                    names: names,
                    onclick: function (d) { onChartClick(d) },
                    onmouseout: function () { onMouseOut() },
                    type: 'donut',
                },
                legend: {
                    show: false
                },
                tooltip: {
                    format: {
                        value: function (value, ratio, id) {
                            return value;
                        }
                    }
                },
                donut: {
                    title: title,

                    label: {
                        format: function (value) {
                            return;
                        }
                    },
                    width: 30
                }
            });

            /*var label = d3.select('text.c3-chart-arcs-title');
            label.html(''); // remove existant text
            label.insert('tspan').text(title).attr('dy', 0).attr('x', 4).attr('class', 'donut-val');
            label.insert('tspan').text('Attorneys').attr('dy', 20).attr('x', 0);
*/
            //donut Reset issue fixed
            $rootScope.resetDonut = function () {
                selectedId = undefined;
                onMouseOut();;
            };
            function onChartClick(d) {


                if (selectedId === d.id) {
                    selectedId = undefined;
                    chart.defocus();
                    chart.focus();
                    scope.onClick()();
                } else {
                    scope.onClick()(d);
                    selectedId = d.id;
                    chart.defocus();
                    chart.focus(selectedId);
                }
            }

            function onMouseOut() {
                chart.defocus();
                if (angular.isDefined(selectedId)) {
                    chart.focus(selectedId);
                } else {
                    chart.focus();
                }
            }
        }
    }

})();

