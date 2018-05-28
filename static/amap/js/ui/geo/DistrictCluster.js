AMapUI.weakDefine("ui/geo/DistrictCluster/lib/MyDistExplorer", [ "lib/utils", "ui/geo/DistrictExplorer/main" ], function(utils, DistrictExplorer) {
    function MyDistExplorer() {
        MyDistExplorer.__super__.constructor.apply(this, arguments);
    }
    utils.inherit(MyDistExplorer, DistrictExplorer);
    utils.extend(MyDistExplorer.prototype, {
        setActiveFeatures: function(features) {
            for (var activeMap = {}, i = 0, len = features.length; i < len; i++) activeMap[features[i].properties.adcode] = !0;
            this._activeMap = activeMap;
        },
        isActiveFeature: function(feature) {
            return !this._activeMap || !!this._activeMap[feature.properties.adcode];
        },
        getLocatedSubFeature: function(position) {
            var areaNodes = this._areaNodesForLocating;
            if (!areaNodes) return null;
            for (var i = 0, len = areaNodes.length; i < len; i++) {
                var featureIdx = areaNodes[i].getLocatedSubFeatureIndex(position);
                if (featureIdx >= 0) {
                    var feature = areaNodes[i].getSubFeaturesInPixel()[featureIdx];
                    if (this.isActiveFeature(feature)) return feature;
                    var parentFeature = areaNodes[i].getParentFeatureInPixel();
                    if (this.isActiveFeature(parentFeature)) return parentFeature;
                }
            }
            return null;
        }
    });
    return MyDistExplorer;
});

AMapUI.weakDefine("ui/geo/DistrictCluster/lib/BoundsItem", [ "lib/utils" ], function(utils) {
    function BoundsItem(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    utils.extend(BoundsItem, {
        getBoundsItemToExpand: function() {
            return new BoundsItem(Number.MAX_VALUE, Number.MAX_VALUE, (-1), (-1));
        },
        boundsContainPoint: function(b, p) {
            return b.x <= p.x && b.x + b.width >= p.x && b.y <= p.y && b.y + b.height >= p.y;
        },
        boundsContain: function(b1, b2) {
            return b1.x <= b2.x && b1.x + b1.width >= b2.x + b2.width && b1.y <= b2.y && b1.y + b1.height >= b2.y + b2.height;
        },
        boundsIntersect: function(b1, b2) {
            return b1.x <= b2.x + b2.width && b2.x <= b1.x + b1.width && b1.y <= b2.y + b2.height && b2.y <= b1.y + b1.height;
        }
    });
    utils.extend(BoundsItem.prototype, {
        containBounds: function(b) {
            return BoundsItem.boundsContain(this, b);
        },
        containPoint: function(p) {
            return BoundsItem.boundsContainPoint(this, p);
        },
        clone: function() {
            return new BoundsItem(this.x, this.y, this.width, this.height);
        },
        isEmpty: function() {
            return this.width < 0;
        },
        getMin: function() {
            return {
                x: this.x,
                y: this.y
            };
        },
        getMax: function() {
            return {
                x: this.x + this.width,
                y: this.y + this.height
            };
        },
        expandByPoint: function(x, y) {
            var minX, minY, maxX, maxY;
            if (this.isEmpty()) {
                minX = maxX = x;
                minY = maxY = y;
            } else {
                minX = this.x;
                minY = this.y;
                maxX = this.x + this.width;
                maxY = this.y + this.height;
                x < minX ? minX = x : x > maxX && (maxX = x);
                y < minY ? minY = y : y > maxY && (maxY = y);
            }
            this.x = minX;
            this.y = minY;
            this.width = maxX - minX;
            this.height = maxY - minY;
        },
        expandByBounds: function(bounds) {
            if (!bounds.isEmpty()) {
                var minX = this.x, minY = this.y, maxX = this.x + this.width, maxY = this.y + this.height, newMinX = bounds.x, newMaxX = bounds.x + bounds.width, newMinY = bounds.y, newMaxY = bounds.y + bounds.height;
                if (this.isEmpty()) {
                    minX = newMinX;
                    minY = newMinY;
                    maxX = newMaxX;
                    maxY = newMaxY;
                } else {
                    newMinX < minX && (minX = newMinX);
                    newMaxX > maxX && (maxX = newMaxX);
                    newMinY < minY && (minY = newMinY);
                    newMaxY > maxY && (maxY = newMaxY);
                }
                this.x = minX;
                this.y = minY;
                this.width = maxX - minX;
                this.height = maxY - minY;
            }
        },
        getTopLeft: function() {
            return {
                x: this.x,
                y: this.y
            };
        },
        getTopRight: function() {
            return {
                x: this.x + this.width,
                y: this.y
            };
        },
        getBottomLeft: function() {
            return {
                x: this.x,
                y: this.y + this.height
            };
        },
        getBottomRight: function() {
            return {
                x: this.x + this.width,
                y: this.y + this.height
            };
        }
    });
    return BoundsItem;
});

AMapUI.weakDefine("ui/geo/DistrictCluster/lib/DistMgr", [ "lib/utils", "./MyDistExplorer", "./BoundsItem" ], function(utils, DistrictExplorer, BoundsItem) {
    function DistMgr(opts) {
        this._opts = utils.extend({
            topAdcodes: [ 1e5 ]
        }, opts);
        this._touchMap = {};
        singleDistExplorer.loadMultiAreaNodes(this._opts.topAdcodes);
    }
    var singleDistExplorer = new DistrictExplorer(), singleCountryNode = null, nodeMap = {}, isDistReady = !1, waitFnList = [];
    utils.extend(DistMgr.prototype, {
        isExcludedAdcode: function(adcode) {
            var excludedAdcodes = this._opts.excludedAdcodes;
            return excludedAdcodes && excludedAdcodes.indexOf(adcode) >= 0;
        },
        traverseTopNodes: function(bounds, zoom, handler, finish, thisArg) {
            for (var topAdcodes = this._opts.topAdcodes, excludedAdcodes = this._opts.excludedAdcodes, i = 0, len = topAdcodes.length; i < len; i++) {
                var node = DistMgr.getNodeByAdcode(topAdcodes[i]);
                if (!node) throw new Error("Can not find adcode: " + topAdcodes[i]);
                DistMgr.traverseNode(node, bounds, zoom, handler, finish, thisArg, excludedAdcodes);
            }
        },
        tryClearCache: function(tag, maxLeft) {
            if (!(maxLeft < 0)) {
                var stack = [ singleCountryNode ], list = [], touchMap = this._touchMap;
                do {
                    var node = stack.pop();
                    node.children && stack.push.apply(stack, node.children);
                    var exTag = touchMap[node.adcode];
                    exTag && exTag !== tag && list.push(node.adcode);
                } while (stack.length);
                list.sort(function(a, b) {
                    var diff = touchMap[a] - touchMap[b];
                    return 0 === diff ? a - b : diff;
                });
                var toDelLen = list.length - maxLeft;
                if (!(toDelLen <= 0)) for (var i = 0; i < toDelLen; i++) singleDistExplorer.clearAreaNodeCacheByAdcode(list[i]) && this.touchAdcode(list[i], null);
            }
        },
        touchAdcode: function(adcode, tag) {
            this._touchMap[adcode] = tag;
        }
    });
    var staticMethods = {
        DistrictExplorer: DistrictExplorer,
        isReady: function() {
            return isDistReady;
        },
        getParentAdcode: function(adcode, acroutes) {
            if (!acroutes) {
                var node = DistMgr.getNodeByAdcode(adcode);
                if (!node) {
                    console.warn("Can not find node: " + adcode);
                    return null;
                }
                acroutes = node.acroutes;
            }
            return acroutes && acroutes.length ? acroutes[acroutes.length - 1] : null;
        },
        getSubIdx: function(subAdcode) {
            return DistMgr.getNodeByAdcode(subAdcode).childIdx;
        },
        getChildrenNum: function(adcode) {
            var node = DistMgr.getNodeByAdcode(adcode);
            return DistMgr.getChildrenNumOfNode(node);
        },
        getChildrenNumOfNode: function(node) {
            return node.children ? node.children.length : node.childrenNum || 0;
        },
        getNodeByAdcode: function(adcode) {
            var node = nodeMap[adcode];
            if (!node) {
                var areaNode = singleDistExplorer.getLocalAreaNode(("" + adcode).substr(0, 4) + "00");
                areaNode || (areaNode = singleDistExplorer.getLocalAreaNode(("" + adcode).substr(0, 2) + "0000"));
                if (!areaNode) return null;
                for (var subFeatures = areaNode.getSubFeaturesInPixel(), i = 0, len = subFeatures.length; i < len; i++) if (subFeatures[i].properties.adcode === adcode) return subFeatures[i].properties;
            }
            return node;
        },
        getNodeChildren: function(adcode) {
            var node = DistMgr.getNodeByAdcode(adcode);
            if (!node) return null;
            if (node.children) return node.children;
            if (node.childrenNum >= 0) {
                var areaNode = singleDistExplorer.getLocalAreaNode(adcode);
                if (!areaNode) return null;
                for (var children = [], subFeatures = areaNode.getSubFeaturesInPixel(), i = 0, len = subFeatures.length; i < len; i++) children.push(subFeatures[i].properties);
                return children;
            }
            return null;
        },
        getExplorer: function() {
            return singleDistExplorer;
        },
        traverseCountry: function(bounds, zoom, handler, finish, thisArg) {
            DistMgr.traverseNode(singleCountryNode, bounds, zoom, handler, finish, thisArg);
        },
        getNodeBoundsSize: function(node, zoom) {
            var pz = DistMgr.getPixelZoom(), scale = Math.pow(2, pz - zoom);
            return [ node.bbounds.width / scale, node.bbounds.height / scale ];
        },
        traverseNode: function(topNode, bounds, zoom, handler, finish, thisArg, excludedAdcodes) {
            if (!(excludedAdcodes && excludedAdcodes.indexOf(topNode.adcode) >= 0)) {
                if (BoundsItem.boundsIntersect(topNode.bbounds, bounds)) {
                    var children = topNode.children, hasChildren = children && children.length > 0;
                    if (zoom > topNode.idealZoom && hasChildren) for (var i = 0, len = children.length; i < len; i++) DistMgr.traverseNode(children[i], bounds, zoom, handler, null, thisArg, excludedAdcodes); else handler.call(thisArg, topNode);
                }
                finish && finish.call(thisArg);
            }
        },
        onReady: function(fn, thisArg, canSync) {
            isDistReady ? canSync ? fn.call(thisArg) : setTimeout(function() {
                fn.call(thisArg);
            }, 0) : waitFnList.push([ fn, thisArg ]);
        },
        getPixelZoom: function() {
            return singleCountryNode.pz;
        },
        loadAreaNode: function(adcode, callback, thisArg, callSync) {
            singleDistExplorer.loadAreaNode(adcode, callback, thisArg, callSync);
        }
    };
    utils.extend(DistMgr, staticMethods);
    !function() {
        function filteAreaTree(root) {
            var stack = [ root ];
            do {
                var node = stack.pop();
                nodeMap[node.adcode] = node;
                var bbox = node.bbox;
                node.bbounds = new BoundsItem(bbox[0], bbox[1], bbox[2], bbox[3]);
                node.bbox = null;
                if (node.children) for (var children = node.children, i = 0, len = children.length; i < len; i++) {
                    children[i].childIdx = i;
                    stack.push(children[i]);
                }
            } while (stack.length);
        }
        singleDistExplorer.loadAreaTree(function(error, areaTree) {
            if (error) throw error;
            filteAreaTree(areaTree);
            singleCountryNode = areaTree;
            isDistReady = !0;
            if (waitFnList.length) {
                for (var i = 0, len = waitFnList.length; i < len; i++) waitFnList[i][0].call(waitFnList[i][1]);
                waitFnList.length = 0;
            }
        });
    }();
    return DistMgr;
});

AMapUI.weakDefine("ui/geo/DistrictCluster/lib/DistCounter", [ "lib/utils", "./DistMgr" ], function(utils, DistMgr) {
    function DistCounter(opts) {
        this._opts = utils.extend({
            topAdcode: 1e5
        }, opts);
        this.clearData();
    }
    function getPosition(p) {
        return [ p.x, p.y ];
    }
    utils.extend(DistCounter.prototype, {
        clearData: function() {
            this._data = [];
            this._pointsMap = {};
        },
        setData: function(data) {
            this.clearData();
            this._data = data;
            this._updatePointsMap(this._opts.topAdcode, "all", data);
        },
        _updatePointsMap: function(adcode, tag, points) {
            var item = this._pointsMap[adcode];
            item || (item = this._pointsMap[adcode] = {});
            item[tag] = points;
            item[tag + "_pack"] = this._buildPackItemsByAdcode(adcode, points);
        },
        getPointsByAdcode: function(adcode, tag) {
            return this._pointsMap[adcode] ? this._pointsMap[adcode][tag || "all"] : [];
        },
        getPackItemsByAdcode: function(adcode, tag) {
            return this._pointsMap[adcode] ? this._pointsMap[adcode][(tag || "all") + "_pack"] : [];
        },
        _buildPackItemsByAdcode: function(adcode, points) {
            for (var packer = this._opts.pointPacker, items = [], i = 0, len = points.length; i < len; i++) items[i] = packer.call(this._opts.pointPackerThisArg, points[i]);
            return items;
        },
        calcDistGroup: function(adcode, subInclude, callback, thisArg) {
            var nodeInfo = DistMgr.getNodeByAdcode(adcode), routes = nodeInfo.acroutes || [ 1e5 ];
            if (subInclude && nodeInfo.acroutes) {
                routes = [].concat(routes);
                routes.push(adcode);
            }
            this._calcGroupWithRoutes(routes, 0, callback, thisArg);
        },
        _calcGroupWithRoutes: function(routes, idx, callback, thisArg) {
            function next() {
                idx < routes.length - 1 ? this._calcGroupWithRoutes(routes, idx + 1, callback, thisArg) : callback && callback.call(thisArg);
            }
            var adcode = routes[idx];
            if (this.getPointsByAdcode(adcode, "__done")) next.call(this); else {
                var points = this.getPointsByAdcode(adcode);
                if (!points) throw new Error("Not points found: ", adcode);
                DistMgr.getExplorer().loadAreaNode(adcode, function(error, areaNode) {
                    this._groupByAreaNode(areaNode, points);
                    next.call(this);
                }, this, !0);
            }
        },
        _groupByAreaNode: function(areaNode, points) {
            for (var groups = areaNode.groupByPosition(points, getPosition), isTopNode = areaNode.getAdcode() === this._opts.topAdcode, topPoints = [], i = 0, len = groups.length; i < len; i++) {
                var item = groups[i];
                if (item.subFeature) {
                    this._updatePointsMap(item.subFeature.properties.adcode, "all", item.points);
                    isTopNode && topPoints.push.apply(topPoints, item.points);
                } else this._updatePointsMap(areaNode.getAdcode(), "hanging", item.points);
            }
            isTopNode && this._updatePointsMap(areaNode.getAdcode(), "all", topPoints);
            this._updatePointsMap(areaNode.getAdcode(), "__done", !0);
        }
    });
    return DistCounter;
});

AMapUI.weakDefine("ui/geo/DistrictCluster/lib/kdbush/sort", [], function() {
    function sortKD(ids, coords, nodeSize, left, right, depth) {
        if (!(right - left <= nodeSize)) {
            var m = Math.floor((left + right) / 2);
            select(ids, coords, m, left, right, depth % 2);
            sortKD(ids, coords, nodeSize, left, m - 1, depth + 1);
            sortKD(ids, coords, nodeSize, m + 1, right, depth + 1);
        }
    }
    function select(ids, coords, k, left, right, inc) {
        for (;right > left; ) {
            if (right - left > 600) {
                var n = right - left + 1, m = k - left + 1, z = Math.log(n), s = .5 * Math.exp(2 * z / 3), sd = .5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1), newLeft = Math.max(left, Math.floor(k - m * s / n + sd)), newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
                select(ids, coords, k, newLeft, newRight, inc);
            }
            var t = coords[2 * k + inc], i = left, j = right;
            swapItem(ids, coords, left, k);
            coords[2 * right + inc] > t && swapItem(ids, coords, left, right);
            for (;i < j; ) {
                swapItem(ids, coords, i, j);
                i++;
                j--;
                for (;coords[2 * i + inc] < t; ) i++;
                for (;coords[2 * j + inc] > t; ) j--;
            }
            if (coords[2 * left + inc] === t) swapItem(ids, coords, left, j); else {
                j++;
                swapItem(ids, coords, j, right);
            }
            j <= k && (left = j + 1);
            k <= j && (right = j - 1);
        }
    }
    function swapItem(ids, coords, i, j) {
        swap(ids, i, j);
        swap(coords, 2 * i, 2 * j);
        swap(coords, 2 * i + 1, 2 * j + 1);
    }
    function swap(arr, i, j) {
        var tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    return sortKD;
});

AMapUI.weakDefine("ui/geo/DistrictCluster/lib/kdbush/range", [], function() {
    function range(ids, coords, minX, minY, maxX, maxY, nodeSize) {
        for (var x, y, stack = [ 0, ids.length - 1, 0 ], result = []; stack.length; ) {
            var axis = stack.pop(), right = stack.pop(), left = stack.pop();
            if (right - left <= nodeSize) for (var i = left; i <= right; i++) {
                x = coords[2 * i];
                y = coords[2 * i + 1];
                x >= minX && x <= maxX && y >= minY && y <= maxY && result.push(ids[i]);
            } else {
                var m = Math.floor((left + right) / 2);
                x = coords[2 * m];
                y = coords[2 * m + 1];
                x >= minX && x <= maxX && y >= minY && y <= maxY && result.push(ids[m]);
                var nextAxis = (axis + 1) % 2;
                if (0 === axis ? minX <= x : minY <= y) {
                    stack.push(left);
                    stack.push(m - 1);
                    stack.push(nextAxis);
                }
                if (0 === axis ? maxX >= x : maxY >= y) {
                    stack.push(m + 1);
                    stack.push(right);
                    stack.push(nextAxis);
                }
            }
        }
        return result;
    }
    return range;
});

AMapUI.weakDefine("ui/geo/DistrictCluster/lib/kdbush/within", [], function() {
    function within(ids, coords, qx, qy, r, nodeSize) {
        for (var stack = [ 0, ids.length - 1, 0 ], result = [], r2 = r * r; stack.length; ) {
            var axis = stack.pop(), right = stack.pop(), left = stack.pop();
            if (right - left <= nodeSize) for (var i = left; i <= right; i++) sqDist(coords[2 * i], coords[2 * i + 1], qx, qy) <= r2 && result.push(ids[i]); else {
                var m = Math.floor((left + right) / 2), x = coords[2 * m], y = coords[2 * m + 1];
                sqDist(x, y, qx, qy) <= r2 && result.push(ids[m]);
                var nextAxis = (axis + 1) % 2;
                if (0 === axis ? qx - r <= x : qy - r <= y) {
                    stack.push(left);
                    stack.push(m - 1);
                    stack.push(nextAxis);
                }
                if (0 === axis ? qx + r >= x : qy + r >= y) {
                    stack.push(m + 1);
                    stack.push(right);
                    stack.push(nextAxis);
                }
            }
        }
        return result;
    }
    function sqDist(ax, ay, bx, by) {
        var dx = ax - bx, dy = ay - by;
        return dx * dx + dy * dy;
    }
    return within;
});

AMapUI.weakDefine("ui/geo/DistrictCluster/lib/kdbush/kdbush", [ "./sort", "./range", "./within" ], function(sort, range, within) {
    function KDBush(points, nodeSize, ArrayType) {
        ArrayType = ArrayType || Array;
        this.nodeSize = nodeSize || 64;
        this.points = points;
        this.ids = new ArrayType(points.length);
        this.coords = new ArrayType(2 * points.length);
        for (var i = 0; i < points.length; i++) {
            this.ids[i] = i;
            this.coords[2 * i] = points[i].x;
            this.coords[2 * i + 1] = points[i].y;
        }
        sort(this.ids, this.coords, this.nodeSize, 0, this.ids.length - 1, 0);
    }
    KDBush.prototype = {
        destroy: function() {
            this.ids.length && (this.ids.length = 0);
            this.coords.length && (this.coords.length = 0);
        },
        range: function(minX, minY, maxX, maxY) {
            return range(this.ids, this.coords, minX, minY, maxX, maxY, this.nodeSize);
        },
        within: function(x, y, r) {
            return within(this.ids, this.coords, x, y, r, this.nodeSize);
        }
    };
    return KDBush;
});

AMapUI.weakDefine("ui/geo/DistrictCluster/lib/Point", [], function() {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    return Point;
});

AMapUI.weakDefine("ui/geo/DistrictCluster/lib/PointItem", [ "lib/utils", "./Point" ], function(utils, Point) {
    function PointItem(x, y, idx) {
        PointItem.__super__.constructor.apply(this, arguments);
        this.idx = idx;
    }
    utils.inherit(PointItem, Point);
    return PointItem;
});

AMapUI.weakDefine("ui/geo/DistrictCluster/lib/geomUtils", [], function() {
    function polygonClip(subjectPolygon, clipPolygon) {
        var cp1, cp2, s, e, outputList = subjectPolygon;
        cp1 = clipPolygon[clipPolygon.length - 2];
        for (var j = 0, jlen = clipPolygon.length - 1; j < jlen; j++) {
            cp2 = clipPolygon[j];
            var inputList = outputList;
            outputList = [];
            s = inputList[inputList.length - 1];
            for (var i = 0, len = inputList.length; i < len; i++) {
                e = inputList[i];
                if (clipInside(e, cp1, cp2)) {
                    clipInside(s, cp1, cp2) || outputList.push(clipIntersection(cp1, cp2, s, e));
                    outputList.push(e);
                } else clipInside(s, cp1, cp2) && outputList.push(clipIntersection(cp1, cp2, s, e));
                s = e;
            }
            cp1 = cp2;
        }
        if (outputList.length < 3) return [];
        outputList.push(outputList[0]);
        return outputList;
    }
    function pointOnSegment(p, p1, p2) {
        var tx = (p2[1] - p1[1]) / (p2[0] - p1[0]) * (p[0] - p1[0]) + p1[1];
        return Math.abs(tx - p[1]) < 1e-6 && p[0] >= p1[0] && p[0] <= p2[0];
    }
    function pointOnPolygon(point, vs) {
        for (var i = 0, len = vs.length; i < len - 1; i++) if (pointOnSegment(point, vs[i], vs[i + 1])) return !0;
        return !1;
    }
    function pointInPolygon(point, vs) {
        for (var x = point[0], y = point[1], inside = !1, i = 0, len = vs.length, j = len - 1; i < len; j = i++) {
            var xi = vs[i][0], yi = vs[i][1], xj = vs[j][0], yj = vs[j][1], intersect = yi > y != yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
            intersect && (inside = !inside);
        }
        return inside;
    }
    function getClosestPointOnSegment(p, p1, p2) {
        var t, x = p1[0], y = p1[1], dx = p2[0] - x, dy = p2[1] - y, dot = dx * dx + dy * dy;
        if (dot > 0) {
            t = ((p[0] - x) * dx + (p[1] - y) * dy) / dot;
            if (t > 1) {
                x = p2[0];
                y = p2[1];
            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }
        return [ x, y ];
    }
    function sqClosestDistanceToSegment(p, p1, p2) {
        var p3 = getClosestPointOnSegment(p, p1, p2), dx = p[0] - p3[0], dy = p[1] - p3[1];
        return dx * dx + dy * dy;
    }
    function sqClosestDistanceToPolygon(p, points) {
        for (var minSq = Number.MAX_VALUE, i = 0, len = points.length; i < len - 1; i++) {
            var sq = sqClosestDistanceToSegment(p, points[i], points[i + 1]);
            sq < minSq && (minSq = sq);
        }
        return minSq;
    }
    var clipInside = function(p, cp1, cp2) {
        return (cp2[0] - cp1[0]) * (p[1] - cp1[1]) > (cp2[1] - cp1[1]) * (p[0] - cp1[0]);
    }, clipIntersection = function(cp1, cp2, s, e) {
        var dc = [ cp1[0] - cp2[0], cp1[1] - cp2[1] ], dp = [ s[0] - e[0], s[1] - e[1] ], n1 = cp1[0] * cp2[1] - cp1[1] * cp2[0], n2 = s[0] * e[1] - s[1] * e[0], n3 = 1 / (dc[0] * dp[1] - dc[1] * dp[0]);
        return [ (n1 * dp[0] - n2 * dc[0]) * n3, (n1 * dp[1] - n2 * dc[1]) * n3 ];
    };
    return {
        sqClosestDistanceToPolygon: sqClosestDistanceToPolygon,
        sqClosestDistanceToSegment: sqClosestDistanceToSegment,
        pointOnSegment: pointOnSegment,
        pointOnPolygon: pointOnPolygon,
        pointInPolygon: pointInPolygon,
        polygonClip: polygonClip
    };
});

AMapUI.weakDefine("ui/geo/DistrictCluster/lib/simplify", [], function() {
    function getSqDist(p1, p2) {
        var dx = p1[0] - p2[0], dy = p1[1] - p2[1];
        return dx * dx + dy * dy;
    }
    function getSqSegDist(p, p1, p2) {
        var x = p1[0], y = p1[1], dx = p2[0] - x, dy = p2[1] - y;
        if (0 !== dx || 0 !== dy) {
            var t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
            if (t > 1) {
                x = p2[0];
                y = p2[1];
            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }
        dx = p[0] - x;
        dy = p[1] - y;
        return dx * dx + dy * dy;
    }
    function simplifyRadialDist(points, sqTolerance) {
        for (var point, prevPoint = points[0], newPoints = [ prevPoint ], i = 1, len = points.length; i < len; i++) {
            point = points[i];
            if (getSqDist(point, prevPoint) > sqTolerance) {
                newPoints.push(point);
                prevPoint = point;
            }
        }
        prevPoint !== point && newPoints.push(point);
        return newPoints;
    }
    function simplifyDPStep(points, first, last, sqTolerance, simplified) {
        for (var index, maxSqDist = sqTolerance, i = first + 1; i < last; i++) {
            var sqDist = getSqSegDist(points[i], points[first], points[last]);
            if (sqDist > maxSqDist) {
                index = i;
                maxSqDist = sqDist;
            }
        }
        if (maxSqDist > sqTolerance) {
            index - first > 1 && simplifyDPStep(points, first, index, sqTolerance, simplified);
            simplified.push(points[index]);
            last - index > 1 && simplifyDPStep(points, index, last, sqTolerance, simplified);
        }
    }
    function simplifyDouglasPeucker(points, sqTolerance) {
        var last = points.length - 1, simplified = [ points[0] ];
        simplifyDPStep(points, 0, last, sqTolerance, simplified);
        simplified.push(points[last]);
        return simplified;
    }
    function simplify(points, tolerance, highestQuality) {
        if (points.length <= 2 || 0 === tolerance) return points;
        var sqTolerance = void 0 !== tolerance ? tolerance * tolerance : 1;
        points = highestQuality ? points : simplifyRadialDist(points, sqTolerance);
        points = simplifyDouglasPeucker(points, sqTolerance);
        return points;
    }
    return simplify;
});

AMapUI.weakDefine("ui/geo/DistrictCluster/render/base", [ "lib/utils", "lib/event", "lib/SphericalMercator", "../lib/geomUtils", "../lib/simplify", "../lib/DistMgr", "../lib/BoundsItem" ], function(utils, EventCls, SphericalMercator, geomUtils, simplify, DistMgr, BoundsItem) {
    function BaseRender(mainIns, opts) {
        this._opts = utils.extend({
            featureEventSupport: !0,
            minHeightToShowSubFeatures: 630,
            minSiblingAvgHeightToShowSubFeatures: 600,
            minSubAvgHeightToShowSubFeatures: 300,
            viewBoundsClipPadding: 10,
            viewBoundsClipEnable: !0,
            polygonTolerance: 1,
            tryBackgroundDistrict: !0,
            areaNodeCacheLimit: -1
        }, opts);
        this._ins = mainIns;
        BaseRender.__super__.constructor.call(this, this._opts);
        this._isRendering = !1;
        this._loadLeft = 0;
        this._currentAreaNodes = [];
        this._currentFeatures = [];
        if (this._opts.featureEventSupport) {
            this._distExplorer = new DistMgr.DistrictExplorer({
                eventSupport: this._opts.featureEventSupport,
                map: this._ins.getMap()
            });
            var self = this;
            this._distExplorer.on("*", function(type, e) {
                self._triggerWithOriginalEventOnSelfAndIns.apply(self, [ type, e.originalEvent || e ].concat(Array.prototype.slice.call(arguments, 2)));
            });
        }
    }
    var baseId = 1;
    utils.inherit(BaseRender, EventCls);
    utils.extend(BaseRender.prototype, {
        zoomToShowSubFeatures: function(adcode, center) {
            var minZoomToShowSub = this.getMinZoomToShowSub(adcode);
            if (minZoomToShowSub >= 3) {
                var map = this._ins.getMap();
                if (map) {
                    if (!center) {
                        var treeNode = DistMgr.getNodeByAdcode(adcode);
                        center = treeNode.center;
                    }
                    map.setZoomAndCenter(minZoomToShowSub, center);
                }
            }
        },
        _triggerOnSelfAndIns: function() {
            this.trigger.apply(this, arguments);
            this._ins.trigger.apply(this._ins, arguments);
        },
        _triggerWithOriginalEventOnSelfAndIns: function() {
            this.triggerWithOriginalEvent.apply(this, arguments);
            this._ins.triggerWithOriginalEvent.apply(this._ins, arguments);
        },
        getPixelRatio: function() {
            return Math.min(2, Math.round(window.devicePixelRatio || 1));
        },
        refreshViewState: function() {
            if (!DistMgr.isReady()) return !1;
            var simpIns = this._ins;
            if (!simpIns.isReady()) return !1;
            var map = simpIns.getMap(), mapViewBounds = map.getBounds(), viewSize = map.getSize(), currZoom = map.getZoom(), maxZoom = simpIns.getMaxZoom(), scaleFactor = Math.pow(2, maxZoom - currZoom), northWest = mapViewBounds.getNorthWest(), topLeft = SphericalMercator.lngLatToPoint([ northWest.getLng(), northWest.getLat() ], DistMgr.getPixelZoom()), bounds = new BoundsItem(topLeft[0], topLeft[1], viewSize.width * scaleFactor, viewSize.height * scaleFactor);
            this._currentZoom = currZoom;
            this._currentScaleFactor = scaleFactor;
            this._currentViewBounds = bounds;
            this._currentViewBoundsInLngLat = mapViewBounds;
            this._currentPixelRatio = this.getPixelRatio();
        },
        renderViewport: function() {
            this._currentViewBounds || this.refreshViewState();
            if (!this._currentViewBounds) return !1;
            this.trigger("willRenderViewport");
            this._currentRenderId = baseId++;
            this._loadLeft = 0;
            this._currentAreaNodes.length = 0;
            this._currentFeatures.length = 0;
            this._renderViewDist(this._currentRenderId);
            this.trigger("didRenderViewport");
            this._isRendering = !1;
        },
        getCurrentRenderId: function() {
            return this._currentRenderId;
        },
        isRenderIdStillValid: function(renderId) {
            return renderId === this._currentRenderId;
        },
        _renderViewDist: function(renderId) {
            var adcodes2Render = [];
            this._ins.getDistMgr().traverseTopNodes(this._currentViewBounds, this._currentZoom, function(node) {
                adcodes2Render.push(node.adcode);
            }, function() {
                this.isRenderIdStillValid(renderId) && this._prepareFeatures(renderId, adcodes2Render);
            }, this);
        },
        getMinZoomToShowSub: function(adcode) {
            var treeNode = DistMgr.getNodeByAdcode(adcode);
            if (!treeNode || !treeNode.idealZoom) return -1;
            if (!treeNode._minZoomToShowSub) for (var zooms = this._ins.getZooms(), i = zooms[0]; i <= zooms[1]; i++) if (this.shouldShowSubOnZoom(treeNode, i)) {
                treeNode._minZoomToShowSub = i;
                break;
            }
            return treeNode._minZoomToShowSub || -1;
        },
        shouldShowSubOnZoom: function(treeNode, zoom) {
            if (!treeNode.idealZoom) return !1;
            if (treeNode._minZoomToShowSub && zoom >= treeNode._minZoomToShowSub) return !0;
            var boundsSize = DistMgr.getNodeBoundsSize(treeNode, zoom);
            if (1e5 === treeNode.adcode && boundsSize[1] > 400) return !0;
            if (boundsSize[1] < this._opts.minHeightToShowSubFeatures) return !1;
            var i, len, heightSum;
            if (treeNode.children) {
                var children = treeNode.children;
                heightSum = 0;
                len = children.length;
                if (len) {
                    for (i = 0; i < len; i++) {
                        boundsSize = DistMgr.getNodeBoundsSize(children[i], zoom);
                        heightSum += boundsSize[1];
                    }
                    if (heightSum / len < this._opts.minSubAvgHeightToShowSubFeatures) return !1;
                }
            }
            var parentAdcode = DistMgr.getParentAdcode(treeNode.adcode, treeNode.acroutes);
            if (parentAdcode) {
                var parentNode = DistMgr.getNodeByAdcode(parentAdcode), siblings = parentNode.children;
                siblings || console.error("No children bound", treeNode, parentNode);
                len = siblings.length;
                if (len > 1) {
                    heightSum = 0;
                    for (i = 0; i < len; i++) if (siblings[i].adcode !== treeNode.adcode) {
                        boundsSize = DistMgr.getNodeBoundsSize(siblings[i], zoom);
                        heightSum += boundsSize[1];
                    }
                    if (heightSum / (len - 1) < this._opts.minSiblingAvgHeightToShowSubFeatures) return !1;
                }
            }
            return !0;
        },
        _shouldShowSub: function(treeNode) {
            return this.shouldShowSubOnZoom(treeNode, this._currentZoom);
        },
        _prepareFeatures: function(renderId, adcodes) {
            var i, len, treeNode, justSelfList = [], showSubList = [];
            for (i = 0, len = adcodes.length; i < len; i++) {
                treeNode = DistMgr.getNodeByAdcode(adcodes[i]);
                if (!treeNode) throw new Error("Can not find node: " + adcodes[i]);
                this._shouldShowSub(treeNode) ? showSubList.push(adcodes[i]) : justSelfList.push(adcodes[i]);
            }
            this._prepareSelfFeatures(renderId, justSelfList);
            this._prepareSubFeatures(renderId, showSubList);
            this._checkLoadFinish(renderId);
        },
        _prepareSelfFeatures: function(renderId, adcodes) {
            var i, len, treeNode, toLoadAdcode, currZoom = this._currentZoom;
            for (i = 0, len = adcodes.length; i < len; i++) {
                treeNode = DistMgr.getNodeByAdcode(adcodes[i]);
                toLoadAdcode = null;
                if (treeNode.acroutes) {
                    var parentNode = DistMgr.getNodeByAdcode(treeNode.acroutes[treeNode.acroutes.length - 1]);
                    (!treeNode.idealZoom || currZoom < treeNode.idealZoom - 1 || Math.abs(currZoom - parentNode.idealZoom) <= Math.abs(treeNode.idealZoom - currZoom)) && (toLoadAdcode = parentNode.adcode);
                }
                this._loadAndRenderSelf(renderId, toLoadAdcode ? toLoadAdcode : adcodes[i], adcodes[i]);
            }
        },
        _prepareSubFeatures: function(renderId, adcodes) {
            var i, len;
            for (i = 0, len = adcodes.length; i < len; i++) this._loadAndRenderSub(renderId, adcodes[i]);
        },
        _renderSelf: function(renderId, adcode, areaNode, options) {
            options && options.isBackground || this._currentAreaNodes.push(areaNode);
            var feature;
            if (adcode === areaNode.getAdcode()) feature = areaNode.getParentFeatureInPixel(); else {
                var subFeatures = areaNode.getSubFeaturesInPixel(), subIdx = DistMgr.getSubIdx(adcode);
                feature = subFeatures[subIdx];
                if (!feature) {
                    console.warn("Werid, can not find sub feature", areaNode.getAdcode(), adcode);
                    return;
                }
                if (feature.properties.adcode !== adcode) {
                    console.warn("Sub adcode not match!!", subFeatures, subIdx);
                    return;
                }
            }
            this._ins.getDistCounter().calcDistGroup(adcode, !1, function() {
                this.isRenderIdStillValid(renderId) && this._prepRenderFeatureInPixel(renderId, feature, options);
            }, this);
        },
        _renderSub: function(renderId, areaNode, options) {
            options && options.isBackground || this._currentAreaNodes.push(areaNode);
            var subFeatures = areaNode.getSubFeaturesInPixel();
            this._ins.getDistCounter().calcDistGroup(areaNode.getAdcode(), !0, function() {
                if (this.isRenderIdStillValid(renderId)) for (var i = 0, len = subFeatures.length; i < len; i++) this._prepRenderFeatureInPixel(renderId, subFeatures[i], options);
            }, this);
        },
        _tryRenderAsBackground: function(renderId, adcode) {
            if (this.isRenderIdStillValid(renderId)) {
                var distExplorer = DistMgr.getExplorer(), areaNode = distExplorer.getLocalAreaNode(adcode), renderOpts = {
                    isBackground: !0
                };
                if (areaNode) this._renderSelf(renderId, adcode, areaNode, renderOpts); else {
                    var treeNode = DistMgr.getNodeByAdcode(adcode);
                    if (treeNode.acroutes) {
                        var acroutes = treeNode.acroutes, parentAdcode = acroutes[acroutes.length - 1];
                        areaNode = distExplorer.getLocalAreaNode(parentAdcode);
                        if (areaNode) {
                            this._renderSelf(renderId, adcode, areaNode, renderOpts);
                            return;
                        }
                    }
                }
            }
        },
        _checkLoadFinish: function(renderId) {
            if (0 === this._loadLeft) {
                var self = this;
                setTimeout(function() {
                    self.isRenderIdStillValid(renderId) && self._handleRenderFinish(renderId);
                }, 0);
            }
        },
        _handleRenderFinish: function(renderId) {
            this._setAreaNodesForLocating();
            this._triggerOnSelfAndIns("renderFinish", {
                renderId: renderId,
                features: this._currentFeatures
            });
            this._tryFreeMemery();
        },
        _setAreaNodesForLocating: function() {
            if (this._distExplorer) {
                this._distExplorer.setActiveFeatures(this._currentFeatures);
                this._distExplorer.setAreaNodesForLocating(this._currentAreaNodes);
            }
        },
        _tryFreeMemery: function() {
            this._ins.getDistMgr().tryClearCache(this._currentRenderId, this._opts.areaNodeCacheLimit);
        },
        _increaseLoadLeft: function() {
            this._loadLeft++;
        },
        _decreaseLoadLeft: function(renderId) {
            this._loadLeft--;
            0 === this._loadLeft && this._checkLoadFinish(renderId, !0);
        },
        _loadAndRenderSelf: function(renderId, loadAdcode, adcode) {
            this._ins.getDistMgr().touchAdcode(loadAdcode, renderId);
            var distExplorer = DistMgr.getExplorer(), areaNode = distExplorer.getLocalAreaNode(loadAdcode);
            if (areaNode) this._renderSelf(renderId, adcode, areaNode); else {
                this._opts.tryBackgroundDistrict && this._tryRenderAsBackground(renderId, adcode);
                this._increaseLoadLeft();
                distExplorer.loadAreaNode(loadAdcode, function(error, areaNode) {
                    if (this.isRenderIdStillValid(renderId)) {
                        error ? console.error(error) : this._renderSelf(renderId, adcode, areaNode, {
                            isAsync: !0
                        });
                        this._decreaseLoadLeft(renderId);
                    }
                }, this);
            }
        },
        _loadAndRenderSub: function(renderId, adcode) {
            this._ins.getDistMgr().touchAdcode(adcode, renderId);
            var distExplorer = DistMgr.getExplorer(), areaNode = distExplorer.getLocalAreaNode(adcode);
            if (areaNode) this._renderSub(renderId, areaNode); else {
                this._opts.tryBackgroundDistrict && this._tryRenderAsBackground(renderId, adcode);
                this._increaseLoadLeft();
                distExplorer.loadAreaNode(adcode, function(error, areaNode) {
                    if (this.isRenderIdStillValid(renderId)) {
                        error ? console.error(error) : this._renderSub(renderId, areaNode, {
                            isAsync: !0
                        });
                        this._decreaseLoadLeft(renderId);
                    }
                }, this);
            }
        },
        _createRingForRender: function(ring) {
            if (!ring.length) return ring;
            for (var newRing = [], viewBounds = this._currentViewBounds, scaleFactor = this._currentScaleFactor, i = 0, len = ring.length; i < len; i++) newRing[i] = [ (ring[i][0] - viewBounds.x) / scaleFactor, (ring[i][1] - viewBounds.y) / scaleFactor ];
            newRing = simplify(newRing, this._opts.polygonTolerance, !1);
            newRing.length < 3 && (newRing.length = 0);
            return newRing;
        },
        _buildRingBounds: function(ring) {
            for (var ringBounds = BoundsItem.getBoundsItemToExpand(), i = 0, len = ring.length; i < len; i++) {
                var p = ring[i];
                ringBounds.expandByPoint(p[0], p[1]);
            }
            return ringBounds;
        },
        doesNeedFeaturePolyons: function() {
            return !0;
        },
        _prepRenderFeatureInPixel: function(renderId, feature, options) {
            if (!this._ins.getDistMgr().isExcludedAdcode(feature.properties.adcode)) {
                options = utils.extend({
                    isBackground: !1,
                    isAsync: !1
                }, options);
                var dataItems = this._ins.getDistCounter().getPackItemsByAdcode(feature.properties.adcode), polygonsToRender = this._buildPolygonsToRender(feature, this.doesNeedFeaturePolyons(feature, dataItems));
                if (polygonsToRender) if (options.isBackground) this.renderBackgroundFeature(renderId, feature, polygonsToRender, dataItems, options); else {
                    this._currentFeatures.push(feature);
                    this.renderClusterMarker(renderId, feature, dataItems);
                    this.renderFeature(renderId, feature, polygonsToRender, dataItems, options);
                }
            }
        },
        _buildPolygonsToRender: function(feature, forRender) {
            for (var polygons = feature.geometry.coordinates, padding = this._opts.viewBoundsClipPadding, currBounds = this._currentViewBounds, x = -padding, y = -padding, width = currBounds.width / this._currentScaleFactor + 2 * padding, height = currBounds.height / this._currentScaleFactor + 2 * padding, rectRing = [ [ x, y ], [ x + width, y ], [ x + width, y + height ], [ x, y + height ], [ x, y ] ], polygonsToRender = [], clipEnable = forRender && this._opts.viewBoundsClipEnable, totalPointsNum = 0, i = 0, len = polygons.length; i < len; i++) {
                polygonsToRender[i] = [];
                for (var j = 0, jlen = polygons[i].length; j < jlen; j++) {
                    var ring = polygons[i][j];
                    ring._bounds || (ring._bounds = this._buildRingBounds(ring));
                    if (BoundsItem.boundsIntersect(ring._bounds, this._currentViewBounds)) {
                        ring = this._createRingForRender(ring);
                        if (clipEnable && ring.length) {
                            var cliped = geomUtils.polygonClip(ring, rectRing);
                            cliped.length < ring.length && (ring = cliped);
                        }
                        polygonsToRender[i].push(ring);
                        totalPointsNum += ring.length;
                    } else polygonsToRender[i].push([]);
                }
            }
            return totalPointsNum > 0 ? polygonsToRender : null;
        },
        renderFeature: function() {
            throw new Error("renderFeature has not been implemented!");
        },
        renderBackgroundFeature: function() {
            throw new Error("renderBackgroundFeature has not been implemented!");
        },
        renderClusterMarker: function() {
            throw new Error("renderClusterMarker has not been implemented!");
        },
        renderLater: function(delay) {
            if (!this._renderLaterId) {
                var self = this;
                this._renderLaterId = setTimeout(function() {
                    self.render();
                }, delay || 10);
            }
        },
        isRendering: function() {
            return this._isRendering;
        },
        render: function() {
            if (this._renderLaterId) {
                clearTimeout(this._renderLaterId);
                this._renderLaterId = null;
            }
            this._isRendering = !0;
            DistMgr.onReady(this.renderViewport, this, !0);
        },
        getOption: function(k) {
            return this._opts[k];
        },
        getOptions: function() {
            return this._opts;
        },
        setOption: function(k, v) {
            this._opts[k] = v;
        },
        setOptions: function(opts) {
            for (var k in opts) opts.hasOwnProperty(k) && this.setOption(k, opts[k]);
        }
    });
    return BaseRender;
});

AMapUI.weakDefine("ui/geo/DistrictCluster/lib/reqAnim", [], function() {
    window.requestAnimationFrame || !function() {
        for (var lastTime = 0, vendors = [ "ms", "moz", "webkit", "o" ], x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x] + "RequestAnimationFrame"];
            window.cancelAnimationFrame = window[vendors[x] + "CancelAnimationFrame"] || window[vendors[x] + "CancelRequestAnimationFrame"];
        }
        window.requestAnimationFrame || (window.requestAnimationFrame = function(callback) {
            var currTime = new Date().getTime(), timeToCall = Math.max(0, 16 - (currTime - lastTime)), id = window.setTimeout(function() {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        });
        window.cancelAnimationFrame || (window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        });
    }();
    return {
        requestAnimationFrame: window.requestAnimationFrame,
        cancelAnimationFrame: window.cancelAnimationFrame
    };
});

AMapUI.weakDefine("ui/geo/DistrictCluster/lib/AnimMgr", [ "lib/utils", "lib/event", "./reqAnim" ], function(utils, EventCls, reqAnim) {
    function compareAnimItem(a, b) {
        var diff = a.priority - b.priority;
        return diff ? -diff : a.id - b.id;
    }
    function AnimMgr() {
        AnimMgr.__super__.constructor.apply(this, arguments);
        this.animList = [];
        this.animReqId = null;
        this.baseId = 1;
        var self = this;
        this._selfHandleAnimList = function() {
            self._handleAnimList.apply(self, arguments);
        };
    }
    var requestAnimationFrame = reqAnim.requestAnimationFrame, cancelAnimationFrame = reqAnim.cancelAnimationFrame;
    utils.inherit(AnimMgr, EventCls);
    utils.extend(AnimMgr.prototype, {
        _handleAnimList: function() {
            this.animReqId = null;
            var animList = this.animList, i = 0, len = animList.length, animCount = 0;
            if (len) {
                for (var args = Array.prototype.slice.call(arguments, 0), list = [].concat(animList); i < len; i++) {
                    var item = list[i];
                    item.callback.apply(item.thisArg, args) !== !1 && animCount++;
                }
                list.length = 0;
                list = null;
            }
            this.triggerAnimAction(animCount);
            this._startHandleAnimList();
        },
        triggerAnimAction: function(count) {
            this.emit("didAnim", count);
        },
        triggerAnimActionLater: function(delay, count) {
            if (!this._triggerAnimTimeId) {
                var self = this;
                this._triggerAnimTimeId = setTimeout(function() {
                    self._triggerAnimTimeId = null;
                    self.triggerAnimAction(count || 1);
                }, delay || 10);
            }
        },
        _startHandleAnimList: function() {
            if (!this.animReqId) {
                var animList = this.animList;
                animList.length && (this.animReqId = requestAnimationFrame(this._selfHandleAnimList));
            }
        },
        getAnimListLength: function() {
            return this.animList.length;
        },
        clear: function() {
            for (var i = 0, len = this.animList.length; i < len; i++) {
                var item = this.animList[i];
                item.onClear && item.onClear.call(item.thisArg);
            }
            this.animList.length = 0;
            if (this.animReqId) {
                cancelAnimationFrame(this.animReqId);
                this.animReqId = null;
            }
        },
        addToAnimList: function(callback, options) {
            var item = utils.extend({
                priority: 0
            }, options, {
                id: this.baseId++,
                callback: callback
            }), animList = this.animList;
            animList.push(item);
            animList.sort(compareAnimItem);
            this._startHandleAnimList();
            return item.id;
        },
        removeFromAnimList: function(id) {
            for (var animList = this.animList, i = 0, len = animList.length; i < len; i++) if (animList[i].id === id) {
                animList.splice(i, 1);
                return !0;
            }
            return !1;
        }
    });
    return AnimMgr;
});

AMapUI.weakDefine("ui/geo/DistrictCluster/lib/MarkerMgr", [ "lib/utils", "lib/event" ], function(utils, EventCls) {
    function MarkerMgr(opts) {
        MarkerMgr.__super__.constructor.apply(this, arguments);
        this._opts = utils.extend({
            recycleLimit: 10
        }, opts);
        this._markers = [];
        this._recycledMarkers = [];
    }
    var constKeys = {
        tag: "_mkm_tag",
        data: "_mkm_d"
    };
    utils.inherit(MarkerMgr, EventCls);
    utils.extend(MarkerMgr.prototype, {
        clear: function() {
            this._clearMarkers(this._markers);
            this._markers.length = 0;
            this._recycledMarkers.length = 0;
        },
        _clearMarkers: function(markers) {
            for (var i = 0, len = markers.length; i < len; i++) this._clearMarker(markers[i]);
        },
        _clearMarker: function(m) {
            this.emit("markerWillClear", m);
            m.setMap(null);
            this.setTag(m, null);
            this.clearData(m);
            this.emit("markerDidClear", m);
        },
        _destroyMarker: function(m) {
            var content = m.getContent();
            utils.isHTMLElement(content) && (content.innerHTML = "");
        },
        find: function(tester, thisArg) {
            for (var markers = this._markers, i = 0, len = markers.length; i < len; i++) if (tester.call(thisArg, markers[i])) return markers[i];
            return null;
        },
        findByDataVal: function(k, v) {
            return this.find(function(m) {
                return this.getData(m, k) === v;
            }, this);
        },
        pickFromRecycle: function() {
            return this._recycledMarkers.shift();
        },
        addToRecycle: function(m) {
            this._clearMarker(m);
            this._recycledMarkers.push(m);
            if (this._recycledMarkers.length > this._opts.recycleLimit) {
                m = this._recycledMarkers.shift();
                this._destroyMarker(m);
            }
        },
        moveToRecycle: function(m) {
            var idx = this._markers.indexOf(m);
            idx >= 0 && this._markers.splice(idx, 1);
            this.addToRecycle(m);
        },
        add: function(m, tag) {
            this.setTag(m, tag);
            this._markers.indexOf(m) < 0 && this._markers.push(m);
        },
        recycleMarkers: function(tag) {
            for (var markers = this._markers, i = 0, len = markers.length; i < len; i++) if (tag !== this.getTag(markers[i])) {
                this.addToRecycle(markers[i]);
                markers.splice(i, 1);
                len--;
                i--;
            }
        },
        setTag: function(m, tag) {
            m[constKeys.tag] = tag;
        },
        getTag: function(m) {
            return m[constKeys.tag];
        },
        clearData: function(m) {
            m[constKeys.data] = null;
        },
        setData: function(m, k, v) {
            m[constKeys.data] || (m[constKeys.data] = {});
            m[constKeys.data][k] = v;
        },
        getData: function(m, k) {
            var data = m[constKeys.data];
            return data ? data[k] : null;
        }
    });
    return MarkerMgr;
});

AMapUI.weakDefine("ui/geo/DistrictCluster/render/default.strategy", [ "lib/utils", "lib/dom.utils", "../lib/DistMgr" ], function(utils, domUtils, DistMgr) {
    var clusterMarkerPositionStrategy = {
        "CENTER": function(feature) {
            return feature.properties.center;
        },
        "CENTROID": function(feature) {
            var props = feature.properties;
            return props.centroid || props.center;
        },
        "AVERAGE_POINTS_POSITION": function(feature, dataItems) {
            if (!dataItems.length) return feature.properties.center;
            var i, len, lng = 0, lat = 0;
            for (i = 0, len = dataItems.length; i < len; i++) {
                lng += dataItems[i].position[0];
                lat += dataItems[i].position[1];
            }
            return [ lng / len, lat / len ];
        }
    }, clusterMarkerStrategy = {
        "DEFAULT": function(feature, dataItems, recycledMarker) {
            var container, title, body, nodeClassNames = {
                title: "amap-ui-district-cluster-marker-title",
                body: "amap-ui-district-cluster-marker-body",
                container: "amap-ui-district-cluster-marker"
            };
            if (recycledMarker) {
                container = recycledMarker.getContent();
                title = domUtils.getElementsByClassName(nodeClassNames.title, "span", container)[0];
                body = domUtils.getElementsByClassName(nodeClassNames.body, "span", container)[0];
            } else {
                container = document.createElement("div");
                title = document.createElement("span");
                title.className = nodeClassNames.title;
                body = document.createElement("span");
                body.className = nodeClassNames.body;
                container.appendChild(title);
                container.appendChild(body);
            }
            var props = feature.properties, routeNames = [], classNameList = [ nodeClassNames.container, "level_" + props.level, "adcode_" + props.adcode ];
            if (props.acroutes) for (var acroutes = props.acroutes, i = 0, len = acroutes.length; i < len; i++) {
                classNameList.push("descendant_of_" + acroutes[i]);
                i === len - 1 && classNameList.push("child_of_" + acroutes[i]);
                i > 0 && routeNames.push(DistMgr.getNodeByAdcode(acroutes[i]).name);
            }
            container.className = classNameList.join(" ");
            if (routeNames.length > 0) {
                routeNames.push(props.name);
                container.setAttribute("title", routeNames.join(">"));
            } else container.removeAttribute("title");
            title.innerHTML = utils.escapeHtml(props.name);
            body.innerHTML = dataItems.length;
            var resultMarker = recycledMarker || new AMap.Marker({
                topWhenClick: !0,
                offset: new AMap.Pixel((-20), (-30)),
                content: container
            });
            this.trigger("clusterMarkerUpdate", {
                feature: feature,
                dataItems: dataItems,
                marker: resultMarker,
                domNodes: {
                    container: container,
                    title: title,
                    body: body
                }
            });
            return resultMarker;
        }
    };
    return {
        clusterMarkerPositionStrategy: clusterMarkerPositionStrategy,
        clusterMarkerStrategy: clusterMarkerStrategy
    };
});

AMapUI.weakDefine("ui/geo/DistrictCluster/render/default", [ "lib/utils", "lib/dom.utils", "./base", "../lib/AnimMgr", "../lib/MarkerMgr", "../lib/DistMgr", "./default.strategy" ], function(utils, domUtils, BaseRender, AnimMgr, MarkerMgr, DistMgr, clusterStrategy) {
    function CanvasRender(simpIns, opts) {
        this._opts = utils.extend({
            styleKeysForCanvas: [ "globalAlpha", "fillStyle", "strokeStyle", "lineJoin", "lineCap", "lineDashOffset", "lineWidth", "miterLimit", "shadowBlur", "shadowColor", "shadowOffsetX", "shadowOffsetY" ],
            animEnable: !0,
            animDuration: 300,
            clusterMarkerRecycleLimit: 30,
            getFeatureStyle: function() {
                return null;
            },
            getClusterMarkerPosition: clusterStrategy.clusterMarkerPositionStrategy.CENTER,
            getClusterMarker: clusterStrategy.clusterMarkerStrategy.DEFAULT,
            clusterMarkerEventSupport: !0,
            clusterMarkerKeepConsistent: !0,
            clusterMarkerEventNames: [ "click" ],
            clusterMarkerClickToShowSub: !0,
            featureClickToShowSub: !1
        }, opts);
        this._opts = utils.nestExtendObjs({}, [ defaultNestedOpts, this._opts ]);
        for (var k in defaultNestedOpts) defaultNestedOpts.hasOwnProperty(k) && utils.isObject(this._opts[k]) && utils.isObject(defaultNestedOpts[k]) && (this._opts[k] = utils.extend({}, defaultNestedOpts[k], this._opts[k]));
        CanvasRender.__super__.constructor.call(this, simpIns, this._opts);
        this._isVisible = !0;
        this._hoverFeature = null;
        this.on("hoverFeatureChanged", this._handleHoverFeatureChanged);
        this.on("renderFinish", this._renderFinishHandler);
        this._canvasTags = [];
        this._clusterMarkerMgr = new MarkerMgr({
            recycleLimit: this._opts.clusterMarkerRecycleLimit
        });
        var self = this;
        this._clusterMarkerMgr.on("markerWillClear", function(m) {
            self._clearClusterMarker(m);
        });
        this._ins.on("willClearData", function() {
            self._clusterMarkerMgr.recycleMarkers(-1);
        });
        this._opts.clusterMarkerClickToShowSub && this.on("clusterMarkerClick", this._handleClusterMarkerClick);
        this._opts.featureClickToShowSub && this.on("featureClick", this._handleFeatureClick);
        this._animSeed = 1;
        this._animMgr = new AnimMgr();
        this._initContainter();
        isCanvasSupported ? this._loadDeps(this._setupCustomLayer) : this._setupMapRender();
    }
    var defaultNestedOpts = {
        featureStyle: {
            lineJoin: "round",
            lineCap: "round",
            fillStyle: "rgba(102,170,0,0.5)",
            lineWidth: 2,
            strokeStyle: "rgb(31, 119, 180)",
            hoverOptions: {
                fillStyle: "rgba(255,255,255,0.2)"
            }
        },
        featureStyleByLevel: {
            country: {
                fillStyle: "rgba(49, 163, 84, 0.8)"
            },
            province: {
                fillStyle: "rgba(116, 196, 118, 0.7)"
            },
            city: {
                fillStyle: "rgba(161, 217, 155, 0.6)"
            },
            district: {
                fillStyle: "rgba(199, 233, 192, 0.5)"
            }
        }
    }, isCanvasSupported = domUtils.isCanvasSupported();
    utils.inherit(CanvasRender, BaseRender);
    utils.extend(CanvasRender.prototype, {
        _handleHoverFeatureChanged: function(e, hoverFeature) {
            this._hoverFeature = hoverFeature;
            if (hoverFeature) {
                this._drawHoverFeature(hoverFeature);
                this._showOverlayContainer();
            } else this._hideOverlayContainer();
        },
        _drawHoverFeature: function(feature) {
            if (feature) {
                var canvas = this._getCanvas("overlay"), ctx = this._getCanvasCxt("overlay"), gotContent = !1;
                if (canvas) {
                    this._resetCanvas(canvas);
                    var dataItems = this._ins.getDistCounter().getPackItemsByAdcode(feature.properties.adcode), styleOptions = this._getFeatureStyleOptions(feature, dataItems);
                    if (styleOptions && styleOptions.hoverOptions) {
                        var polygons = this._buildPolygonsToRender(feature, !0);
                        if (polygons) {
                            this.drawHoverFeaturePolygons(ctx, polygons, utils.extend({}, styleOptions, styleOptions.hoverOptions), feature, dataItems);
                            gotContent = !0;
                        }
                    }
                }
                domUtils.toggleClass(canvas, "amap-ui-hide", !gotContent);
            }
        },
        _hideOverlayContainer: function() {
            domUtils.addClass(this._overlayContainter, "amap-ui-hide");
        },
        _showOverlayContainer: function() {
            domUtils.removeClass(this._overlayContainter, "amap-ui-hide");
        },
        _createCanvas: function(tag, container) {
            var canvas = document.createElement("canvas");
            canvas.className = tag.toLowerCase() + "-canvas";
            this["_" + tag + "Canvas"] = canvas;
            this["_" + tag + "CanvasCxt"] = canvas.getContext("2d");
            container.appendChild(canvas);
            this._canvasTags.push(tag);
        },
        _getCanvas: function(tag) {
            return this["_" + tag + "Canvas"];
        },
        _getCanvasCxt: function(tag) {
            return this["_" + tag + "CanvasCxt"];
        },
        _setCanvasSizeByTag: function(targetTag, width, height) {
            for (var i = 0, len = this._canvasTags.length; i < len; i++) {
                var tag = this._canvasTags[i];
                if (!targetTag || tag === targetTag) {
                    var canvas = this._getCanvas(tag);
                    this._setCanvasSize(canvas, width, height);
                }
            }
        },
        _lngLat2Array: function(lngLat) {
            return lngLat.getLng ? [ lngLat.getLng(), lngLat.getLat() ] : lngLat;
        },
        _clearClusterMarker: function(marker) {
            this._bindClusterMarkerEvents(marker, !1);
            var clusterData = this._clusterMarkerMgr.getData(marker, "clusterData");
            this._triggerOnSelfAndIns("clusterMarkerRemove", marker, clusterData);
        },
        _bindClusterMarkerEvents: function(marker, on) {
            if (marker) for (var action = on ? "on" : "off", clusterMarkerEventNames = this._opts.clusterMarkerEventNames, i = 0, len = clusterMarkerEventNames.length; i < len; i++) marker[action](clusterMarkerEventNames[i], this._handleClusterMarkerEvent, this);
        },
        _handleClusterMarkerEvent: function(e) {
            var type = e.type, marker = e.target, clusterData = this._clusterMarkerMgr.getData(marker, "clusterData");
            this._triggerWithOriginalEventOnSelfAndIns("clusterMarker" + utils.ucfirst(type), e, clusterData);
        },
        _handleClusterMarkerClick: function(e, clusterData) {
            this.zoomToShowSubFeatures(clusterData.feature.properties.adcode, e.target.getPosition());
        },
        _handleFeatureClick: function(e, feature) {
            this.zoomToShowSubFeatures(feature.properties.adcode, e.originalEvent.lnglat);
        },
        renderClusterMarker: function(renderId, feature, dataItems) {
            var props = feature.properties, adcode = props.adcode, clusterMarkerMgr = this._clusterMarkerMgr, marker = clusterMarkerMgr.findByDataVal("adcode", adcode);
            if (marker && this._opts.clusterMarkerKeepConsistent) clusterMarkerMgr.setTag(marker, renderId); else {
                if (!this._opts.getClusterMarkerPosition) return null;
                var fromPosition = null, targetPosition = this._opts.getClusterMarkerPosition.call(this, feature, dataItems);
                if (targetPosition && this._currentViewBoundsInLngLat.contains(targetPosition)) {
                    if (!this._opts.getClusterMarker) return null;
                    marker = this._opts.getClusterMarker.call(this, feature, dataItems, marker || clusterMarkerMgr.pickFromRecycle());
                    if (marker) {
                        clusterMarkerMgr.setData(marker, "adcode", adcode);
                        var clusterData = {
                            adcode: adcode,
                            feature: feature,
                            dataItems: dataItems
                        };
                        clusterMarkerMgr.setData(marker, "clusterData", clusterData);
                        var map = this._ins.getMap();
                        marker.getMap() !== map && marker.setMap(map);
                        this._triggerOnSelfAndIns("clusterMarkerAdd", marker, clusterData);
                        if (this._opts.clusterMarkerEventSupport) {
                            marker.setClickable(!0);
                            marker.setCursor("pointer");
                            this._bindClusterMarkerEvents(marker, !0);
                        } else {
                            marker.setClickable(!1);
                            marker.setCursor("default");
                        }
                        clusterMarkerMgr.add(marker, renderId);
                        var parentAdcode = DistMgr.getParentAdcode(adcode, props.acroutes), parentMarker = clusterMarkerMgr.findByDataVal("adcode", parentAdcode);
                        parentMarker && parentMarker.getMap() === map && (fromPosition = parentMarker.getPosition());
                        fromPosition ? this._animChildComeOut(renderId, marker, fromPosition, targetPosition) : marker.setPosition(targetPosition);
                        var children = DistMgr.getNodeChildren(adcode);
                        if (children) for (var i = 0, len = children.length; i < len; i++) {
                            var childMarker = clusterMarkerMgr.findByDataVal("adcode", children[i].adcode);
                            childMarker && this._animChildGoBack(renderId, childMarker, targetPosition);
                        }
                    }
                }
            }
        },
        _animChildComeOut: function(renderId, marker, parentPosition, targetPosition) {
            this.animateMarkerPosition(renderId, marker, parentPosition, targetPosition);
        },
        _animChildGoBack: function(renderId, childMarker, parentPosition) {
            this._clusterMarkerMgr.setTag(childMarker, renderId);
            this.animateMarkerPosition(renderId, childMarker, childMarker.getPosition(), parentPosition, function() {
                this._clusterMarkerMgr.moveToRecycle(childMarker);
            });
        },
        animateMarkerPosition: function(renderId, marker, fromPosition, targetPosition, finish) {
            fromPosition = this._lngLat2Array(fromPosition);
            targetPosition = this._lngLat2Array(targetPosition);
            var xDiff = targetPosition[0] - fromPosition[0], yDiff = targetPosition[1] - fromPosition[1];
            this.animateByPercent(renderId, this._opts.animDuration, function(percent) {
                marker.setPosition([ fromPosition[0] + xDiff * percent, fromPosition[1] + yDiff * percent ]);
            }, function() {
                marker.getMap() && this.isRenderIdStillValid(renderId) && marker.setPosition(targetPosition);
                finish && finish.call(this);
            });
        },
        _renderFinishHandler: function(e, record) {
            var renderId = record.renderId;
            this._resetBackground(renderId);
            this._clusterMarkerMgr.recycleMarkers(renderId);
        },
        _resetBackground: function(renderId) {
            var canvas = this._getCanvas("background");
            this.isRenderIdStillValid(renderId) && this._resetCanvas(canvas);
        },
        _initContainter: function() {
            var container = document.createElement("div");
            this._container = container;
            var districtContainter = document.createElement("div");
            districtContainter.className = "district-container";
            this._createCanvas("background", districtContainter);
            this._createCanvas("foreground", districtContainter);
            container.appendChild(districtContainter);
            var overlayContainter = document.createElement("div");
            overlayContainter.className = "overlay-container amap-ui-hide";
            this._overlayContainter = overlayContainter;
            this._createCanvas("overlay", overlayContainter);
            container.appendChild(overlayContainter);
        },
        getLayer: function() {
            return this.layer;
        },
        _setupCustomLayer: function() {
            var map = this._ins.getMap();
            map.setDefaultCursor("default");
            this.layer = new AMap.CustomLayer(this._container, {
                visible: this._isVisible,
                zIndex: this._ins.getOption("zIndex"),
                zooms: [ 1, 20 ],
                map: map
            });
            domUtils.addClass(this._container, "amap-ui-district-cluster-container");
            var self = this;
            this.layer.render = function() {
                self._refreshAndRender();
            };
        },
        _setupMapRender: function() {
            var map = this._ins.getMap();
            if (map) {
                var debouncedRender = utils.debounce(this._refreshAndRender, 10);
                map.on("zoomend", debouncedRender, this);
                map.on("moveend", debouncedRender, this);
                this._isReady = !0;
                this.renderLater(10);
            }
        },
        _refreshAndRender: function() {
            this.refreshViewState();
            this.render();
        },
        _setCanvasSize: function(canvas, w, h) {
            var pixelRatio = this.getPixelRatio();
            canvas.width = w * pixelRatio;
            canvas.height = h * pixelRatio;
            canvas.style.width = w + "px";
            canvas.style.height = h + "px";
        },
        _resetCanvas: function(canvas) {
            if (canvas) {
                canvas.width = canvas.width;
                canvas.height = canvas.height;
            }
        },
        _loadDeps: function(callback) {
            var self = this;
            AMap.plugin([ "AMap.CustomLayer" ], function() {
                self._isReady = !0;
                callback && callback.call(self);
                self.emit("ready");
            });
        },
        onReady: function(fn, thisArg) {
            var finalCall = function() {
                fn.call(thisArg);
            };
            this._isReady ? setTimeout(finalCall, 0) : this.once("ready", finalCall);
        },
        render: function() {
            if (!this._isReady || this.isHidden() === !0) return !1;
            var map = this._ins.getMap(), size = map.getSize();
            this._animMgr.clear();
            this._setCanvasSizeByTag(null, size.width, size.height);
            CanvasRender.__super__.render.apply(this, arguments);
            this._drawHoverFeature(this._hoverFeature);
        },
        setOption: function(k, v) {
            utils.isObject(defaultNestedOpts[k]) && utils.isObject(v) && (v = utils.nestExtendObjs({}, [ defaultNestedOpts[k], v ]));
            CanvasRender.__super__.setOption.call(this, k, v);
        },
        _fillAndStroke: function(ctx, styleOptions) {
            for (var styleKeys = this._opts.styleKeysForCanvas, i = 0, len = styleKeys.length; i < len; i++) {
                var skey = styleKeys[i];
                styleOptions[skey] && (ctx[skey] = styleOptions[skey]);
            }
            styleOptions.fillStyle && ctx.fill();
            if (styleOptions.borderStyle && styleOptions.borderWidth || 0 === styleOptions.borderWidth) {
                ctx.strokeStyle = styleOptions.borderStyle;
                ctx.lineWidth = (styleOptions.lineWidth + 2 * styleOptions.borderWidth) * this._currentPixelRatio;
                ctx.stroke();
            }
            if (styleOptions.strokeStyle && styleOptions.lineWidth) {
                ctx.strokeStyle = styleOptions.strokeStyle;
                styleOptions.lineWidth && (ctx.lineWidth = styleOptions.lineWidth * this._currentPixelRatio);
                styleOptions.strokeDashArray && ctx.setLineDash && ctx.setLineDash(styleOptions.strokeDashArray);
                ctx.stroke();
            }
            styleOptions.styleOptions && this._fillAndStroke(ctx, styleOptions.styleOptions);
        },
        doesNeedFeaturePolyons: function(feature, dataItems) {
            var styleOptions = this._getFeatureStyleOptions(feature, dataItems);
            return !!styleOptions;
        },
        _getFeatureStyleOptions: function(feature, dataItems) {
            if (!isCanvasSupported) return null;
            var styleGetter = this._opts.getFeatureStyle;
            if (!styleGetter) return this._opts.featureStyle;
            var styleOptions = styleGetter.call(null, feature, dataItems);
            return styleOptions === !1 ? null : utils.extend({}, this._opts.featureStyle, this._opts.featureStyleByLevel[feature.properties.level], styleOptions);
        },
        _lineRing: function(ctx, points) {
            if (!(points.length < 2)) {
                var pixelRatio = this._currentPixelRatio;
                ctx.moveTo(points[0][0] * pixelRatio, points[0][1] * pixelRatio);
                for (var i = 1, len = points.length; i < len; i++) ctx.lineTo(points[i][0] * pixelRatio, points[i][1] * pixelRatio);
            }
        },
        _linePolygons: function(ctx, polygons) {
            ctx.beginPath();
            for (var j = 0, jlen = polygons.length; j < jlen; j++) for (var i = 0, len = polygons[j].length; i < len; i++) this._lineRing(ctx, polygons[j][i]);
        },
        drawMuliPolygons: function(ctx, polygons, styleOptions) {
            ctx.save();
            this._linePolygons(ctx, polygons);
            this._fillAndStroke(ctx, styleOptions);
            ctx.restore();
        },
        animateByPercent: function(renderId, timeSpan, animStep, finish) {
            if (this._opts.animEnable) var endTime = null, lastPercent = 0, percent = 0, animId = this._animMgr.addToAnimList(function(ts) {
                var isStillValid = this.isRenderIdStillValid(renderId);
                if (endTime) {
                    percent = 1 - (endTime - ts) / timeSpan;
                    percent > 1 && (percent = 1);
                } else endTime = ts + timeSpan;
                if (!(percent < 1 && percent - lastPercent < .01)) {
                    lastPercent = percent;
                    isStillValid && animStep.call(this, percent);
                    var isDone = !isStillValid || percent >= 1;
                    if (isDone) {
                        this._animMgr.removeFromAnimList(animId);
                        finish && finish.call(this, percent);
                    }
                }
            }, {
                thisArg: this,
                onClear: function() {
                    finish && finish.call(this, percent);
                }
            }); else finish && finish.call(this, 1);
        },
        animatePolygonsByPercent: function(canvas, ctx, polygons, styleOptions, percent) {
            if (percent) {
                ctx.save();
                this._linePolygons(ctx, polygons);
                ctx.clip();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (percent < 1) {
                    this._fillAndStroke(ctx, utils.extend({}, styleOptions, {
                        strokeStyle: null
                    }));
                    var lineWidth = styleOptions.lineWidth || 2, animLwRange = [ lineWidth, Math.max(6, 2 * lineWidth) ];
                    this._fillAndStroke(ctx, utils.extend({}, styleOptions, {
                        fillStyle: null,
                        strokeStyle: styleOptions.strokeStyle || "black",
                        globalAlpha: percent,
                        lineWidth: animLwRange[1] - (percent - .5) * (percent - .5) * (animLwRange[1] - animLwRange[0]) / .25
                    }));
                }
                ctx.restore();
            }
        },
        renderBackgroundFeature: function(renderId, feature, polygons, dataItems, options) {
            return this.renderFeature(renderId, feature, polygons, dataItems, options);
        },
        renderFeature: function(renderId, feature, polygons, dataItems, options) {
            var styleOptions = this._getFeatureStyleOptions(feature, dataItems);
            if (styleOptions) {
                var canvasTag = options.isBackground ? "background" : "foreground", ctx = this._getCanvasCxt(canvasTag), isSubFeature = feature.properties.subFeatureIndex >= 0;
                if (isSubFeature && !options.isBackground && options.isAsync) {
                    var canvas = this._getCanvas(canvasTag);
                    this.animateByPercent(renderId, this._opts.animDuration, function(percent) {
                        this.animatePolygonsByPercent(canvas, ctx, polygons, styleOptions, percent);
                    }, function() {
                        this.isRenderIdStillValid(renderId) && this.drawFeaturePolygons(ctx, polygons, styleOptions, feature, dataItems);
                    });
                } else this.drawFeaturePolygons(ctx, polygons, styleOptions, feature, dataItems);
            }
        },
        drawFeaturePolygons: function(ctx, polygons, styleOptions, feature, dataItems) {
            this.drawMuliPolygons(ctx, polygons, styleOptions);
        },
        drawHoverFeaturePolygons: function(ctx, polygons, styleOptions, feature, dataItems) {
            this.drawMuliPolygons(ctx, polygons, styleOptions);
        },
        isHidden: function() {
            return this.layer ? !this.layer.get("visible") : this._isVisible;
        },
        show: function() {
            if (this.isHidden()) {
                this._isVisible = !0;
                if (this.layer) {
                    this.layer.show();
                    this.layer.render();
                }
                return !0;
            }
        },
        hide: function() {
            if (!this.isHidden()) {
                this._isVisible = !1;
                this.layer && this.layer.hide();
                this._hoverFeature = null;
                this._clusterMarkerMgr.recycleMarkers(-1);
                return !0;
            }
        }
    });
    return CanvasRender;
});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/geo/DistrictCluster/assets/default", [], function() {});

AMapUI.weakDefine("ui/geo/DistrictCluster/main", [ "lib/event", "lib/utils", "lib/dom.utils", "./lib/DistCounter", "./lib/DistMgr", "./lib/BoundsItem", "./lib/kdbush/kdbush", "./lib/PointItem", "./render/base", "./render/default", "./render/default.strategy", "css!./assets/default" ], function(EventCls, utils, domUtils, DistCounter, DistMgr, BoundsItem, KDBush, PointItem, BaseRender, DefaultRender, clusterStrategy) {
    function DistrictCluster(opts) {
        this._opts = utils.extend({
            zooms: [ 3, 20 ],
            autoSetFitView: !0,
            renderConstructor: DefaultRender,
            renderOptions: null,
            boundsQuerySupport: !1,
            topAdcodes: [ 1e5 ],
            excludedAdcodes: null
        }, opts);
        DistrictCluster.__super__.constructor.call(this, this._opts);
        var RenderConstructor = this._opts.renderConstructor;
        this._distMgr = new DistMgr({
            topAdcodes: this._opts.topAdcodes,
            excludedAdcodes: this._opts.excludedAdcodes
        });
        this._distCounter = new DistCounter({
            pointPackerThisArg: this,
            pointPacker: function(p) {
                return this._packDataItem(p);
            }
        });
        this.renderEngine = new RenderConstructor(this, this._opts.renderOptions);
        this._opts.data && this.setData(this._opts.data);
    }
    utils.extend(DistrictCluster, {
        Render: {
            Base: BaseRender,
            Default: DefaultRender
        },
        supportCanvas: domUtils.isCanvasSupported(),
        ClusterMarkerPositionStrategy: clusterStrategy.clusterMarkerPositionStrategy,
        ClusterMarkerStrategy: clusterStrategy.clusterMarkerStrategy
    });
    utils.inherit(DistrictCluster, EventCls);
    utils.extend(DistrictCluster.prototype, {
        getMinZoomToShowSub: function(adcode) {
            return this.renderEngine.getMinZoomToShowSub(adcode);
        },
        getAreaNodeProps: function(adcode) {
            return DistMgr.getNodeByAdcode(adcode);
        },
        getClusterRecord: function(adcode, callback) {
            var treeNode = DistMgr.getNodeByAdcode(adcode);
            if (treeNode) {
                adcode = treeNode.adcode;
                var toLoadAdcode = adcode, asSub = !1;
                if (!DistMgr.getChildrenNumOfNode(treeNode)) {
                    toLoadAdcode = DistMgr.getParentAdcode(adcode, treeNode.acroutes);
                    asSub = !0;
                }
                var distCounter = this._distCounter;
                distCounter.calcDistGroup(toLoadAdcode, !0, function() {
                    if (callback) {
                        for (var treeNode = DistMgr.getNodeByAdcode(toLoadAdcode), children = DistMgr.getNodeChildren(toLoadAdcode), subList = [], i = 0, len = children.length; i < len; i++) {
                            subList[i] = {
                                adcode: children[i].adcode,
                                name: children[i].name,
                                dataItems: distCounter.getPackItemsByAdcode(children[i].adcode)
                            };
                            if (asSub && subList[i].adcode === adcode) {
                                callback(null, subList[i]);
                                return;
                            }
                        }
                        var result = {
                            adcode: toLoadAdcode,
                            name: treeNode.name,
                            dataItems: distCounter.getPackItemsByAdcode(toLoadAdcode),
                            hangingDataItems: distCounter.getPackItemsByAdcode(toLoadAdcode, "hanging"),
                            children: subList
                        };
                        callback(null, result);
                    }
                }, this);
            } else callback && callback("AreaNode not exists: " + adcode);
        },
        getDistrictExplorer: function() {
            return DistMgr.getExplorer();
        },
        getRender: function() {
            return this.renderEngine;
        },
        getRenderOption: function(k) {
            return this.renderEngine.getOption(k);
        },
        getRenderOptions: function() {
            return this.renderEngine.getOptions();
        },
        zoomToShowSubFeatures: function() {
            this.renderEngine.zoomToShowSubFeatures.apply(this.renderEngine, arguments);
        },
        renderLater: function() {
            this.renderEngine.renderLater.apply(this.renderEngine, arguments);
        },
        render: function() {
            this.renderEngine.render.apply(this.renderEngine, arguments);
        },
        getDistMgr: function() {
            return this._distMgr;
        },
        _clearData: function() {
            this.trigger("willClearData");
            this._data ? this._data.list.length = 0 : this._data = {
                list: [],
                bounds: null
            };
            this._data.source = null;
            this._data.bounds = null;
            this._data.kdTree = null;
            this._distCounter.clearData();
            this.trigger("didClearData");
        },
        _buildDataItems: function(data) {
            for (var opts = this._opts, posGetter = opts.getPosition, list = this._data.list, bounds = this._data.bounds, idx = 0, len = data.length; idx < len; idx++) {
                var point = data[idx], lngLat = posGetter.call(this, point, idx);
                if (lngLat) {
                    lngLat.getLng && (lngLat = [ lngLat.getLng(), lngLat.getLat() ]);
                    list[idx] = new PointItem(lngLat[0], lngLat[1], idx);
                    bounds.expandByPoint(lngLat[0], lngLat[1]);
                }
            }
        },
        getDataItemsByBounds: function(bounds) {
            var kdTree = this._data.kdTree;
            if (!kdTree) return null;
            for (var min = bounds.getSouthWest(), max = bounds.getNorthEast(), list = this._data.list, idxList = kdTree.range(min.getLng(), min.getLat(), max.getLng(), max.getLat()), dataItems = [], i = 0, len = idxList.length; i < len; i++) dataItems[i] = this._packDataItem(list[idxList[i]]);
            return dataItems;
        },
        getDataItemsInView: function() {
            var map = this.getMap();
            return map ? this.getDataItemsByBounds(map.getBounds()) : null;
        },
        _buildKDTree: function() {
            if (!this._opts.boundsQuerySupport) return !1;
            var dataStore = this._data;
            if (dataStore.kdTree) {
                dataStore.kdTree.destroy();
                dataStore.kdTree = null;
            }
            this.trigger("willBuildKDTree");
            dataStore.kdTree = new KDBush(this._data.list);
            this.trigger("didBuildKDTree", dataStore.kdTree);
        },
        _packDataItem: function(pointItem) {
            if (!pointItem) return null;
            if (!pointItem._packedItem) {
                var idx = pointItem.idx, position = [ pointItem.x, pointItem.y ];
                pointItem._packedItem = {
                    dataIndex: idx,
                    dataItem: this._data.source[idx],
                    position: position
                };
            }
            return pointItem._packedItem;
        },
        _buildData: function(data) {
            this._clearData();
            this.trigger("willBuildData", data);
            this._data.source = data;
            this._data.bounds = BoundsItem.getBoundsItemToExpand();
            this._buildDataItems(data);
            this._buildKDTree();
            this._distCounter.setData(this._data.list);
            this.trigger("didBuildData", data);
        },
        setData: function(data) {
            data || (data = []);
            this._buildData(data);
            this.renderLater(10);
            data.length && this._opts.autoSetFitView && this.setFitView();
        },
        isReady: function() {
            return DistMgr.isReady() && !!this._data;
        },
        setFitView: function() {
            var nodeBounds = this._data.bounds, map = this.getMap(), mapBounds = new AMap.Bounds([ nodeBounds.x, nodeBounds.y ], [ nodeBounds.x + nodeBounds.width, nodeBounds.y + nodeBounds.height ]);
            map && map.setBounds(mapBounds, null, null, !0);
        },
        getDistCounter: function() {
            return this._distCounter;
        },
        getMap: function() {
            return this._opts.map;
        },
        getMaxZoom: function() {
            return this._opts.zooms[1];
        },
        getMinZoom: function() {
            return this._opts.zooms[0];
        },
        getZooms: function() {
            return this._opts.zooms;
        },
        getOption: function(k) {
            return this._opts[k];
        },
        getOptions: function() {
            return this._opts;
        },
        onRenderReady: function(fn, thisArg) {
            return this.getRender().onReady(fn, thisArg || this);
        },
        isHidden: function() {
            return this.getRender().isHidden();
        },
        show: function() {
            return this.getRender().show();
        },
        hide: function() {
            return this.getRender().hide();
        }
    });
    return DistrictCluster;
});

AMapUI.weakDefine("ui/geo/DistrictCluster", [ "ui/geo/DistrictCluster/main" ], function(m) {
    return m;
});

!function(c) {
    var d = document, a = "appendChild", i = "styleSheet", s = d.createElement("style");
    s.type = "text/css";
    d.getElementsByTagName("head")[0][a](s);
    s[i] ? s[i].cssText = c : s[a](d.createTextNode(c));
}(".amap-ui-district-cluster-container{cursor:default;-webkit-backface-visibility:hidden;-webkit-transform:translateZ(0) scale(1,1)}.amap-ui-district-cluster-container canvas{position:absolute}.amap-ui-district-cluster-container .amap-ui-hide{display:none!important}.amap-ui-district-cluster-container .overlay-title,.amap-ui-district-cluster-marker{color:#555;background-color:#fffeef;font-size:12px;white-space:nowrap;position:absolute}.amap-ui-district-cluster-container .overlay-title{padding:2px 6px;display:inline-block;z-index:99999;border:1px solid #7e7e7e;border-radius:2px}.amap-ui-district-cluster-container .overlay-title:after,.amap-ui-district-cluster-container .overlay-title:before{content:'';display:block;position:absolute;margin:auto;width:0;height:0;border:solid transparent;border-width:5px}.amap-ui-district-cluster-container .overlay-title.left{transform:translate(10px,-50%)}.amap-ui-district-cluster-container .overlay-title.left:before{top:5px}.amap-ui-district-cluster-container .overlay-title.left:after{left:-9px;top:5px;border-right-color:#fffeef}.amap-ui-district-cluster-container .overlay-title.left:before{left:-10px;border-right-color:#7e7e7e}.amap-ui-district-cluster-container .overlay-title.top{transform:translate(-50%,-130%)}.amap-ui-district-cluster-container .overlay-title.top:before{left:0;right:0}.amap-ui-district-cluster-container .overlay-title.top:after{bottom:-9px;left:0;right:0;border-top-color:#fffeef}.amap-ui-district-cluster-container .overlay-title.top:before{bottom:-10px;border-top-color:#7e7e7e}.amap-ui-district-cluster-marker{border:1px solid #8e8e8e;width:auto;height:22px;border-radius:5px 5px 5px 0;left:0;top:0}.amap-ui-district-cluster-marker:after,.amap-ui-district-cluster-marker:before{content:'';display:block;position:absolute;width:0;height:0;border:solid rgba(0,0,0,0);border-width:6px;left:13px}.amap-ui-district-cluster-marker:after{bottom:-12px;border-top-color:#fffeef}.amap-ui-district-cluster-marker:before{bottom:-13px;border-top-color:#8e8e8e}.amap-ui-district-cluster-marker span{vertical-align:middle;padding:3px 5px;display:inline-block;height:16px;line-height:16px}.amap-ui-district-cluster-marker-title{border-radius:5px 0 0 0}.amap-ui-district-cluster-marker-body{background-color:#dc3912;color:#fff;border-radius:0 5px 5px 0}.amap-ui-district-cluster-marker.level_country .amap-ui-district-cluster-marker-body{background-color:#36c}.amap-ui-district-cluster-marker.level_province .amap-ui-district-cluster-marker-body{background-color:#dc3912}.amap-ui-district-cluster-marker.level_city .amap-ui-district-cluster-marker-body{background-color:#909}.amap-ui-district-cluster-marker.level_district .amap-ui-district-cluster-marker-body{background-color:#d47}");