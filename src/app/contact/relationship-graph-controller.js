;

(function () {

    'use strict';

    angular
        .module('cloudlex.contact')
        .directive('treeView', treeView)
        .controller('RelationshipGraphCtrl', RelationshipGraphCtrl);

    RelationshipGraphCtrl.$inject = ['$scope', '$rootScope', 'contactFactory', '$modalInstance', 'contactdetails'];
    treeView.$inject = ['$rootScope'];
    function treeView($rootScope) {

        return {
            restrict: 'E',
            scope: {
                treeJson: '=',
                filterRole: '=',
                filterPreselectRole: '=',
                ctrlFn: '&callbackFun'
            },
            link: function link(scope, el, attr) {
                var values = scope.treeJson;
                var filters = [];
                var paths = [];
                // Filter Node data
                scope.$on('filterNodeData', function (event, args) {
                    filterMatterContactRoles(args);
                });

                function filterMatterContactRoles(args, treeJsonArgs) {
                    // filter node data
                    paths = [];
                    var values = (treeJsonArgs == undefined) ? scope.treeJson : treeJsonArgs;
                    if (values != undefined) {
                        if (args.length > 0) {
                            paths = searchTreeCustom(values, args);
                        } else {
                            root = values;
                            //values is the flare.json 
                            select2_data = extract_select2_data(values, [], 0)[1];//I know, not the prettiest...
                            root.x0 = height / 2;
                            root.y0 = 0;
                            root.children.forEach(collapse);
                            update(root);
                        }
                        if (paths.length != 0) {
                            root = paths;
                            //values is the flare.json 
                            select2_data = extract_select2_data(values, [], 0)[1];//I know, not the prettiest...
                            root.x0 = height / 2;
                            root.y0 = 0;
                            root.children.forEach(collapse);
                            update(root);
                        }
                    }
                }

                /**
                 * Custom filter for matter/contact nodes
                 */
                function searchTreeCustom(tree, filters) {
                    var treetemp = [];
                    var newtree = [];
                    var treewest = [];
                    if (tree.children != undefined) {

                        for (var i = 0; i < tree.children.length; i++) {
                            for (var j = 0; j < filters.length; j++) {
                                if (tree.children[i].relation == filters[j].id) {
                                    if (tree.children[i]._children != undefined || tree.children[i].children != undefined) {
                                        treetemp.push(secondLevelSearch(tree.children[i], filters));
                                    } else {
                                        treetemp.push(tree.children[i]);
                                    }
                                }
                            }
                            (tree.children.length == i + 1 && treetemp.length > 0) ? newtree = { 'name': tree.name, 'nodeType': tree.nodeType, 'children': treetemp } : "";
                        }
                    } else {
                        if (tree.relation == filters) {
                            treetemp.push(tree);
                        }
                    }
                    return newtree;
                }

                /**
                 * second level search for contact matter
                 */
                function secondLevelSearch(tree, filters) {
                    var treesecondtemp = [];
                    var newsecondtree = [];
                    var treeView = (tree._children) ? tree._children : tree.children;
                    for (var i = 0; i < treeView.length; i++) {
                        for (var j = 0; j < filters.length; j++) {
                            if (treeView[i].relation == filters[j].id) {
                                treesecondtemp.push(treeView[i]);
                            }
                        }
                        (treeView.length == i + 1 && treesecondtemp.length > 0) ? newsecondtree = { 'name': tree.name, 'nodeType': tree.nodeType, 'relation': tree.relation, 'children': treesecondtemp } : newsecondtree = { 'name': tree.name, 'nodeType': tree.nodeType, 'relation': tree.relation };
                    }
                    return newsecondtree;
                }

                var div = d3.select("body")
                    .append("div") // declare the tooltip div
                    .attr("class", "tooltip")
                    .style("opacity", 0);

                var margin = { top: 20, right: 120, bottom: 20, left: 120 },
                    width = 800 - margin.right - margin.left,
                    height = 450 - margin.top - margin.bottom;
                var i = 0, duration = 750, root, select2_data;
                var radius = 8;
                var diameter = 960;
                var tree = d3.layout.tree()
                    .size([height, width]);

                var diagonal = d3.svg.diagonal()
                    .projection(function (d) { return [d.y, d.x]; });

                var svg = d3.select(el[0]).append("svg")
                    .attr("width", width + margin.right + margin.left)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                //recursively collapse children
                function collapse(d) {
                    if (d.children) {
                        d._children = d.children;
                        d._children.forEach(collapse);
                        d.children = null;
                    }
                }

                // Toggle children on click.
                function click(d) {
                    if (d.depth == 2) {
                        var nodeGraphParams = {
                            'id': d.id,
                            'pid': d.pid,
                            'type': d.nodeType,
                            'insurance_filter': 0,
                            'name': d.name
                        };
                        scope.ctrlFn({ args: nodeGraphParams }); // next level API call
                        $rootScope.deSelectAll(); // default select roles
                        filterMatterContactRoles(scope.filterPreselectRole); // filter matter contact list on preselected roles
                        return;
                    }
                    if (d.children) {
                        d._children = d.children;
                        d.children = null;
                    }
                    else {
                        d.children = d._children;
                        d._children = null;
                    }
                    update(d); // create node graph
                }

                // hightlight link node graph for search roles
                function openPaths(paths) {
                    for (var i = 0; i < paths.length; i++) {
                        if (paths[i].uid !== "1") {//i.e. not root
                            paths[i].class = 'found';
                            if (paths[i]._children) { //if children are hidden: open them, otherwise: don't do anything
                                paths[i].children = paths[i]._children;
                                paths[i]._children = null;
                            }
                            update(paths[i]);
                        }
                    }
                }

                /**
                 * Create Node Graph at innitial level (select contact)
                 */
                scope.$on('createTreeView', function (event, args) {
                    // API call or take data from service
                    var values = args;
                    _.forEach(values.children, function (value) {
                        if (value.children.length == 0) {
                            delete value.children;
                        }
                    })
                    if (values.children.length == 0) {
                        root = values;
                        //values is the flare.json 
                        select2_data = extract_select2_data(values, [], 0)[1];//I know, not the prettiest...
                        root.x0 = height / 2;
                        root.y0 = 0;
                        root.children.forEach(collapse);
                        update(root);
                    } else {
                        if (args) {
                            filterMatterContactRoles(scope.filterRole, args);
                        }
                    }
                });

                //attach search box listener
                scope.$on("roleSearch", function (event, args) {
                    var paths = searchTree(scope.treeJson, args.c_role_name, []);
                    if (typeof (paths) !== "undefined") {
                        update(scope.treeJson);
                        openPaths(paths);
                    }
                });

                // d3.select(self.frameElement).style("height", "800px");
                /**
                 * Update Nodes and link according to node JSON
                 */
                function update(source) {
                    // Compute the new tree layout.
                    var nodes = "",
                        links = "";
                    nodes = tree.nodes(root).reverse(),
                        links = tree.links(nodes);

                    // Normalize for fixed-depth.
                    nodes.forEach(function (d) { d.y = d.depth * 180; });

                    // Update the nodesâ€¦
                    var node = svg.selectAll("g.node")
                        .data(nodes, function (d) { return d.uid || (d.uid = ++i); });

                    // Enter any new nodes at the parent's previous position.
                    var nodeEnter = node.enter().append("g")
                        .attr("class", "node")
                        .attr("transform", function (d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
                        .on("mouseover", mouseover)
                        .on("mouseout", mouseout)
                        .on("click", click);

                    // append node circle with link relation
                    nodeEnter.append("circle")
                        .attr("r", 1e-6)
                        .style("fill", function (d) {
                            return d.children || d._children ? "lightsteelblue" : "#fff";
                        });

                    // set matter/contact node name
                    nodeEnter.append("text")
                        .attr("x", function (d) { return d.children || d._children ? -14 : 14; })
                        .attr("dy", ".80em")
                        .attr("text-anchor", function (d) { return d.children || d._children ? "end" : "start"; })
                        .text(function (d) { return d.relation; })
                        .style("fill-opacity", 1e-6);

                    // Transition nodes to their new position.
                    var nodeUpdate = node.transition()
                        .duration(duration)
                        .attr("transform", function (d) { return "translate(" + d.y + "," + d.x + ")"; });

                    // create matter/contact node for every levels
                    nodeUpdate.select("circle")
                        .attr("r", "0.6em")
                        .style("fill", function (d) {
                            // selected matter/contac color set
                            if (d.depth == 0) {
                                return "#A4A4A4";
                            }
                            if (d.relation.indexOf('Plaintiff') !== -1) {
                                return "#F5BCA9";
                            } else if (d.relation.indexOf('Defendant') !== -1) {
                                return "#A9BCF5";
                            } else if (d.relation.indexOf('Spouse') !== -1) {
                                return "#F2F5A9";
                            } else if (d.relation.indexOf('Siblings') !== -1) {
                                return "#A9F5A9";
                            } else if (d.relation.indexOf('Relatives') !== -1) {
                                return "#A9F5A9";
                            } else {
                                return "#F5A9A9";
                            }
                        })
                        // set matter/contact node stroke high light if children are available
                        .style("stroke", function (d) {
                            if (d._children != undefined) {
                                return "#A4A4A4"; // TODO color need to decide
                            }
                            // selected matter/contac color set
                            if (d.depth == 0) {
                                return "#A4A4A4";
                            }
                        })
                        // set matter/contact node stroke width if children are available
                        .style("stroke-width", function (d) {
                            if (d._children != undefined) {
                                return "1.5px";
                            }
                            // selected matter/contac color set
                            if (d.depth == 0) {
                                return "1.5px";
                            }
                        });

                    nodeUpdate.select("text")
                        .style("fill-opacity", 1);

                    // Transition exiting nodes to the parent's new position.
                    var nodeExit = node.exit().transition()
                        .duration(duration)
                        .attr("transform", function (d) { return "translate(" + source.y + "," + source.x + ")"; })
                        .remove();

                    nodeExit.select("circle")
                        .attr("r", 1e-6);

                    nodeExit.select("text")
                        .style("fill-opacity", 1e-6);

                    // Update the links
                    var link = svg.selectAll("path.link")
                        .data(links, function (d) { return d.target.uid; });

                    // Update the link text
                    var linktext = svg.selectAll("g.link")
                        .data(links, function (d) {
                            return d.target.uid;
                        });

                    // linktext.enter()
                    //     .insert("g")
                    //     .attr("class", "link")
                    //     .append("text")
                    //     .attr("dy", "0.20em")
                    //     .attr("text-anchor", "middle")
                    //     .text(function (d) {
                    //         //console.log(d.target.name);
                    //         return d.target.relation;
                    //     });

                    // Transition link text to their new positions

                    linktext.transition()
                        .duration(duration)
                        .attr("transform", function (d) {
                            return "translate(" + ((d.source.y + d.target.y) / 2) + "," + ((d.source.x + d.target.x) / 2.05) + ")";
                        })

                    // Enter any new links at the parent's previous position.
                    link.enter().insert("path", "g")
                        .attr("class", "link")
                        .attr("d", function (d) {
                            var o = { x: source.x0, y: source.y0 };
                            return diagonal({ source: o, target: o });
                        });

                    // Transition links to their new position.
                    link.transition()
                        .duration(duration)
                        .attr("d", diagonal)
                        .style("stroke", function (d) {
                            if (d.target.class === "found") {
                                return "#ff4136";
                            }
                        });

                    //Transition exiting link text to the parent's new position.
                    linktext.exit().transition()
                        .remove();

                    // Transition exiting nodes to the parent's new position.
                    link.exit().transition()
                        .duration(duration)
                        .attr("d", function (d) {
                            var o = { x: source.x, y: source.y };
                            return diagonal({ source: o, target: o });
                        })
                        .remove();

                    // Stash the old positions for transition.
                    nodes.forEach(function (d) {
                        d.x0 = d.x;
                        d.y0 = d.y;
                    });

                }

                /**
                 * Show matter/ contact name on hover event
                 */
                function mouseover(d) {
                    d3.select(this).append("text")
                        .attr("class", "hover")
                        .attr('transform', function (d) {
                            if (d.depth == 2) {
                                return 'translate(-120, 0)';
                            } else {
                                return 'translate(10, -10)';
                            }
                        })
                        .text(d.nodeType + ": " + d.name);
                }

                /**
                 * Calculate radius for node
                 */
                function computeRadius(d) {
                    if (d.children || d._children) return radius + (radius * nbEndNodes(d) / 10);
                    else return radius;
                }

                function nbEndNodes(n) {
                    var nb = 0;
                    if (n.children) {
                        n.children.forEach(function (c) {
                            nb += nbEndNodes(c);
                        });
                    }
                    else if (n._children) {
                        n._children.forEach(function (c) {
                            nb += nbEndNodes(c);
                        });
                    }
                    else nb++;

                    return nb;
                }

                // Toggle children on click.
                function mouseout(d) {
                    d3.select(this).select("text.hover").remove();
                }

                /**
                 * Search role
                 */
                function searchTree(obj, search, path) {
                    if (obj.relation === search) { //if search is found return, add the object to the path and return it
                        path.push(obj);
                        //return path;
                    }
                    if (obj.children || obj._children) { //if children are collapsed d3 object will have them instantiated as _children
                        var children = (obj.children) ? obj.children : obj._children;
                        for (var i = 0; i < children.length; i++) {
                            path.push(obj);// we assume this path is the right one
                            var found = searchTree(children[i], search, path);
                            // if (found) {// we were right, this should return the bubbled-up path from the first if statement
                            //     return found;
                            // }
                            // else {//we were wrong, remove this parent from the path and continue iterating
                            //     path.pop();
                            // }
                        }
                    }
                    else {//not the right object, return false so it will continue to iterate in the loop
                        return false;
                    }
                    return path;
                }

                function extract_select2_data(node, leaves, index) {
                    if (node.children) {
                        for (var i = 0; i < node.children.length; i++) {
                            index = extract_select2_data(node.children[i], leaves, index)[0];
                        }
                    }
                    else {
                        leaves.push({ uid: ++index, text: node.name });
                    }
                    return [index, leaves];
                }

            }
        }
    };

    /**
     * Node graph Controller 
     */
    function RelationshipGraphCtrl($scope, $rootScope, contactFactory, $modalInstance, contactdetails) {

        var self = this;
        self.tree = []; // object for tree json
        self.directiveCallbackFun = directiveCallbackFun;
        self.contactrRoles = {};
        self.defaultRoles = [];
        self.filterRoles = [];
        self.insurnceAdjusterFilter = false;
        self.insuranceFilterFlag = true;
        (function () {
            // directiveCallbackFun(); // default API call getting first selected contact node graph
            contactmatterRoles(); // getting list of matter contact roles
        })();
        /**
         * directive function callback for getting tree json
         */
        function directiveCallbackFun(nodeGraphParams) {
            self.defaultInitialRoles = [];
            // Create JSON for node graph API request
            if (nodeGraphParams == undefined) {
                var nodeGraphParams = {
                    'id': contactdetails[0].contactid,
                    'pid': "",
                    'type': "Contact",
                    'insurance_filter': 0,
                    'name': contactdetails[0].name
                };
            }
            var promesa = contactFactory.nodegraph(nodeGraphParams);
            promesa.then(function (response) {
                self.tree = response;
                if (self.insurnceAdjusterFilter) {
                    $scope.$broadcast('createTreeView', self.tree);
                } else {
                    $rootScope.defaultSelectRoles(self.defaultRoles);
                    $scope.$broadcast('createTreeView', self.tree);
                }

            }, function (reason) {

            });

        }

        /**
         * Reset node graph
         */
        self.directiveFn = function () {
            self.insurnceAdjusterFilter = false;
            directiveCallbackFun(undefined);
            self.selectedModel = [];
            self.roleSearch = "";
        }

        /**
         * Filter node graph
         */
        self.filterNodeData = function () {
            $scope.$broadcast('filterNodeData', self.typeFilters);
        }

        /**
         * Matter contact role relation
         */
        function contactmatterRoles() {
            var promesa = contactFactory.matterContactRoles();
            promesa.then(function (response) {
                var uniqueRoles = _.uniq(response, function (e) {
                    return e.c_role_name;
                });
                var plaintiff = [];
                var defendant = [];
                var spouse = [];
                var family = [];
                var other = [];
                var roleConcatArr = [];
                _.filter(uniqueRoles, function (value) {
                    if (value.c_role_name.indexOf('Plaintiff') !== -1) {
                        plaintiff.push(value);
                        self.defaultRoles.push(value);
                    } else if (value.c_role_name.indexOf('Defendant') !== -1) {
                        defendant.push(value);
                        self.defaultRoles.push(value);
                    } else if (value.c_role_name.indexOf('Spouse') !== -1) {
                        spouse.push(value);
                        self.defaultRoles.push(value);
                    } else if (value.c_role_name.indexOf('Siblings') !== -1) {
                        family.push(value);
                        self.defaultRoles.push(value);
                    } else if (value.c_role_name.indexOf('Relatives') !== -1) {
                        family.push(value);
                        self.defaultRoles.push(value);
                    } else {
                        other.push(value);
                    }
                });
                self.contactMatterRoles = roleConcatArr.concat(plaintiff, defendant, spouse, family, other);
                _.forEach(self.defaultRoles, function (value) {
                    self.filterRoles.push({ 'id': value.c_role_name });
                });
                directiveCallbackFun();

            }, function (reason) {

            });
        }

        // get filter contact and matter graph on selected roles
        self.getSelectRolesDetails = function (args) {
            self.insurnceAdjusterFilter = false;
            _.forEach(args, function (value) {
                if (value.id == "Insurance Adjuster") {
                    self.insurnceAdjusterFilter = true;
                }
            });
            (self.insurnceAdjusterFilter) ? self.insuranceFilterFlag = self.insuranceFilterFlag : self.insuranceFilterFlag = true;
            if (self.insurnceAdjusterFilter) {
                if (self.insuranceFilterFlag) {
                    var nodeGraphParams = {
                        'id': contactdetails[0].contactid,
                        'pid': "",
                        'type': "Contact",
                        'insurance_filter': 1,
                        'name': contactdetails[0].name
                    };
                    self.insuranceFilterFlag = false;
                    directiveCallbackFun(nodeGraphParams);
                    self.filterRoles = self.selectedModel;
                } else {
                    $scope.$broadcast('filterNodeData', args);
                }

            } else {
                $scope.$broadcast('filterNodeData', args);
            }
        }

        // search roles
        self.roleCustomSearch = function () {
            var selectRole = self.roleSearch;
            $scope.$broadcast('roleSearch', selectRole)
        }

        //  close model popup
        self.cancel = function () {
            $modalInstance.close();
            $rootScope.nodeModelClose();
        }
    }

})();




