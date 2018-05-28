AMapUI.weakDefine("ui/misc/PathSimplifier/lib/kdbush/sort", [], function() {
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

AMapUI.weakDefine("ui/misc/PathSimplifier/lib/kdbush/range", [], function() {
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

AMapUI.weakDefine("ui/misc/PathSimplifier/lib/kdbush/within", [], function() {
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

AMapUI.weakDefine("ui/misc/PathSimplifier/lib/kdbush/kdbush", [ "./sort", "./range", "./within" ], function(sort, range, within) {
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

AMapUI.weakDefine("ui/misc/PathSimplifier/lib/BoundsItem", [ "lib/utils" ], function(utils) {
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
        intersectBounds: function(b) {
            return BoundsItem.boundsIntersect(this, b);
        },
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

AMapUI.weakDefine("ui/misc/PathSimplifier/lib/Point", [ "lib/utils" ], function(utils) {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    utils.extend(Point.prototype, {
        squaredDistance: function(p) {
            var dx = p.x - this.x, dy = p.y - this.y;
            return dx * dx + dy * dy;
        },
        distance: function(p) {
            return Math.sqrt(this.squaredDistance(p));
        },
        maxAxisDistance: function(p) {
            var dx = p.x - this.x, dy = p.y - this.y;
            return Math.max(Math.abs(dx), Math.abs(dy));
        },
        getAngleDegree: function(p) {
            return this.getAngleRadians(p) / Math.PI * 180;
        },
        getAngleRadians: function(p) {
            var dx = p.x - this.x, dy = p.y - this.y, rotation = Math.atan(dx / dy);
            0 === dx ? rotation = dy > 0 ? Math.PI : 0 : 0 === dy ? rotation = dx > 0 ? Math.PI / 2 : -Math.PI / 2 : dx > 0 && dy > 0 ? rotation = Math.PI - rotation : dx < 0 && dy < 0 ? rotation = -rotation : dx > 0 && dy < 0 ? rotation = -rotation : dx < 0 && dy > 0 && (rotation = Math.PI - rotation);
            return rotation;
        }
    });
    return Point;
});

AMapUI.weakDefine("ui/misc/PathSimplifier/lib/PointItem", [ "lib/utils", "./Point" ], function(utils, Point) {
    function PointItem(x, y, idx) {
        PointItem.__super__.constructor.apply(this, arguments);
        this.idx = idx;
    }
    utils.inherit(PointItem, Point);
    return PointItem;
});

AMapUI.weakDefine("ui/misc/PathSimplifier/lib/simplify", [], function() {
    function getSqDist(p1, p2) {
        var dx = p1.x - p2.x, dy = p1.y - p2.y;
        return dx * dx + dy * dy;
    }
    function getSqSegDist(p, p1, p2) {
        var x = p1.x, y = p1.y, dx = p2.x - x, dy = p2.y - y;
        if (0 !== dx || 0 !== dy) {
            var t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
            if (t > 1) {
                x = p2.x;
                y = p2.y;
            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }
        dx = p.x - x;
        dy = p.y - y;
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

AMapUI.weakDefine("ui/misc/PathSimplifier/lib/PointForRender", [ "lib/utils", "./PointItem" ], function(utils, PointItem) {
    function PointForRender() {
        PointForRender.__super__.constructor.apply(this, arguments);
    }
    utils.inherit(PointForRender, PointItem);
    utils.extend(PointForRender, {
        translate: function(point, viewBounds, scaleFactor) {
            return point ? new PointForRender((point.x - viewBounds.x) / scaleFactor, (point.y - viewBounds.y) / scaleFactor, point.idx) : null;
        },
        translateList: function(points, viewBounds, scaleFactor) {
            for (var result = [], i = 0, len = points.length; i < len; i++) result.push(PointForRender.translate(points[i], viewBounds, scaleFactor));
            return result;
        }
    });
    return PointForRender;
});

AMapUI.weakDefine("ui/misc/PathSimplifier/lib/lineHelper", [ "./Point" ], function(Point) {
    function intersectLineLine(a1, a2, b1, b2) {
        var result = !1, ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x), ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x), u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
        if (0 !== u_b) {
            var ua = ua_t / u_b, ub = ub_t / u_b;
            0 <= ua && ua <= 1 && 0 <= ub && ub <= 1 && (result = !0);
        }
        return result;
    }
    function intersectLineRectangle(a1, a2, bounds) {
        for (var topLeft = bounds.getTopLeft(), bottomRight = bounds.getBottomRight(), topRight = bounds.getTopRight(), bottomLeft = bounds.getBottomLeft(), lineTests = [ [ topLeft, topRight, a1, a2 ], [ topRight, bottomRight, a1, a2 ], [ bottomRight, bottomLeft, a1, a2 ], [ bottomLeft, topLeft, a1, a2 ] ], i = 0, len = lineTests.length; i < len; i++) if (intersectLineLine.apply(null, lineTests[i])) return !0;
        return !1;
    }
    function getClosestPointOnSegment(p, p1, p2) {
        var t, x = p1.x, y = p1.y, dx = p2.x - x, dy = p2.y - y, dot = dx * dx + dy * dy;
        if (dot > 0) {
            t = ((p.x - x) * dx + (p.y - y) * dy) / dot;
            if (t > 1) {
                x = p2.x;
                y = p2.y;
            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }
        return new Point(x, y);
    }
    function sqClosestDistanceToSegment(p, p1, p2) {
        var p3 = getClosestPointOnSegment(p, p1, p2), dx = p.x - p3.x, dy = p.y - p3.y;
        return dx * dx + dy * dy;
    }
    return {
        getClosestPointOnSegment: getClosestPointOnSegment,
        sqClosestDistanceToSegment: sqClosestDistanceToSegment,
        intersectLineRectangle: intersectLineRectangle,
        intersectLineLine: intersectLineLine
    };
});

AMapUI.weakDefine("ui/misc/PathSimplifier/lib/SegItemForRender", [ "lib/utils", "./PointForRender", "./BoundsItem", "./lineHelper", "./simplify" ], function(utils, PointForRender, BoundsItem, lineHelper, simplify) {
    function SegItemForRender(owner, startIdx, endIdx) {
        this.startIdx = startIdx;
        this.endIdx = endIdx;
        this.owner = owner;
        this.pointNum = endIdx - startIdx + 1;
        this.isSimplified = !1;
        this.pathPoints = null;
        this.keyPoints = null;
    }
    utils.extend(SegItemForRender.prototype, {
        destroy: function() {
            this.owner = null;
            this.pathPoints = null;
            this.keyPoints = null;
        },
        getPathByPointIdxRange: function(minIdx, maxIdx) {
            var pathPoints = this.pathPoints, pointsLen = pathPoints.length, rangePoints = [];
            if (!pointsLen || maxIdx - minIdx < 0) return rangePoints;
            minIdx = Math.max(pathPoints[0].idx, minIdx);
            maxIdx = Math.min(pathPoints[pointsLen - 1].idx, maxIdx);
            if (minIdx <= maxIdx) for (var i = 0; i < pointsLen; i++) if (!(pathPoints[i].idx < minIdx)) {
                if (pathPoints[i].idx > maxIdx) break;
                rangePoints.push(pathPoints[i]);
            }
            return rangePoints;
        },
        buildSeg: function(viewBounds, scaleFactor, keepAllPoints, opts) {
            var pathTolerance = Math.max(0, opts.pathTolerance), pathNearTolerance = Math.max(pathTolerance, Math.max(3, opts.pathNearTolerance)), keyPointTolerance = opts.keyPointTolerance > 0 ? Math.max(0, opts.keyPointTolerance) : opts.keyPointTolerance, startIdx = this.startIdx, endIdx = this.endIdx, segPoints = [], points = this.owner.pathData.points;
            startIdx > 0 && viewBounds.containPoint(points[startIdx]) && startIdx--;
            endIdx < points.length - 1 && viewBounds.containPoint(points[endIdx]) && endIdx++;
            for (var j = startIdx; j <= endIdx; j++) {
                var p = points[j], segPoint = new PointForRender(p.x / scaleFactor, p.y / scaleFactor, p.idx);
                segPoints.push(segPoint);
            }
            this.pointNum = segPoints.length;
            if (keepAllPoints) {
                this.pathPoints = this.pathNearPoints = this.keyPoints = segPoints;
                this.isSimplified = !1;
            } else {
                this.pathPoints = simplify(segPoints, pathTolerance, !1);
                this.isSimplified = !0;
                this.keyPoints = keyPointTolerance >= 0 ? simplify(this.pathPoints, keyPointTolerance, !1) : [];
                this.keyPoints.length < 2 && (this.keyPoints = []);
                this.pathNearPoints = simplify(this.pathPoints, pathNearTolerance, !1);
            }
            for (var xdiff = viewBounds.x / scaleFactor, ydiff = viewBounds.y / scaleFactor, pathPoints = this.pathPoints, pathPointsLen = pathPoints.length, i = 0; i < pathPointsLen; i++) {
                var point = pathPoints[i];
                point.x -= xdiff;
                point.y -= ydiff;
            }
            this.owner.isStartPointIdx(pathPoints[0].idx) && (this.pathStartPoint = pathPoints[0]);
            this.owner.isEndPointIdx(pathPoints[pathPointsLen - 1].idx) && (this.pathEndPoint = pathPoints[pathPointsLen - 1]);
        },
        getMinSqDistanceToPoint: function(p) {
            for (var points = this.pathNearPoints, minSqDist = Number.MAX_VALUE, i = 0, len = points.length; i < len - 1; i++) {
                var sqDist = lineHelper.sqClosestDistanceToSegment(p, points[i], points[i + 1]);
                sqDist < minSqDist && (minSqDist = sqDist);
            }
            return minSqDist;
        },
        getPointsForIndex: function() {
            if (this.keyPoints.length) return this.keyPoints;
            var points = [];
            this.pathStartPoint && points.push(this.pathStartPoint);
            this.pathEndPoint && points.push(this.pathEndPoint);
            return points;
        }
    });
    return SegItemForRender;
});

AMapUI.weakDefine("ui/misc/PathSimplifier/lib/PathSegsForRender", [ "lib/utils", "./SegItemForRender", "./BoundsItem" ], function(utils, SegItemForRender, BoundsItem) {
    function PathSegsForRender(idx, pathData) {
        this.idx = idx;
        this.pathData = pathData;
        this.segs = [];
        this.viewBounds = null;
        this.scaleFactor = null;
        this.renderBounds = null;
        this.pathLineWidth = 0;
        this.pointRadius = 0;
    }
    utils.extend(PathSegsForRender.prototype, {
        getZIndex: function() {
            return this.pathData.zIndex;
        },
        getPathIndex: function() {
            return this.pathData.pathIndex;
        },
        isStartPointIdx: function(idx) {
            return idx === this.pathData.startIdx;
        },
        isEndPointIdx: function(idx) {
            return idx === this.pathData.startIdx + this.pathData.length - 1;
        },
        getPathSegsByPointIdxRange: function(minIdx, maxIdx) {
            for (var segs = this.segs, paths = [], i = 0, len = segs.length; i < len; i++) {
                var pathPoints = segs[i].getPathByPointIdxRange(minIdx, maxIdx);
                if (pathPoints.length) {
                    var segItem = this.getEmptySegItemForRender();
                    segItem.pathPoints = pathPoints;
                    paths.push(segItem);
                }
            }
            return paths;
        },
        getEmptySegItemForRender: function() {
            return new SegItemForRender(null, 0, 0);
        },
        destroy: function() {
            this.pathData = this.viewBounds = this.renderBounds = null;
            var segs = this.segs;
            this.segs = null;
            for (var i = 0, len = segs.length; i < len; i++) segs[i].destroy();
            segs.length = 0;
        },
        getPointsNum: function() {
            for (var total = 0, segs = this.segs, i = 0, len = segs.length; i < len; i++) total += segs[i].pointNum;
            return total;
        },
        addSeg: function(start, end) {
            this.segs.push(new SegItemForRender(this, start, end));
        },
        buildSegs: function(viewBounds, scaleFactor, keepAllPoints, opts) {
            this.viewBounds = viewBounds;
            this.scaleFactor = scaleFactor;
            this.renderBounds = new BoundsItem(0, 0, viewBounds.width / scaleFactor, viewBounds.height / scaleFactor);
            for (var segs = this.segs, i = 0, len = segs.length; i < len; i++) segs[i].buildSeg(viewBounds, scaleFactor, keepAllPoints, opts);
        },
        getMinSqDistanceToPoint: function(p) {
            for (var minSqDist = Number.MAX_VALUE, segs = this.segs, i = 0, len = segs.length; i < len; i++) {
                var sqDist = segs[i].getMinSqDistanceToPoint(p);
                sqDist < minSqDist && (minSqDist = sqDist);
            }
            return minSqDist;
        },
        getPointsForIndex: function() {
            for (var points = [], segs = this.segs, i = 0, len = segs.length; i < len; i++) points.push.apply(points, segs[i].getPointsForIndex());
            return points;
        }
    });
    return PathSegsForRender;
});

AMapUI.weakDefine("ui/misc/PathSimplifier/lib/quicksort", [], function() {
    function swap(array, i, j) {
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
        return array;
    }
    function partition(array, left, right) {
        var maxEnd, cmp = array[right - 1], minEnd = left;
        for (maxEnd = left; maxEnd < right - 1; maxEnd += 1) if (array[maxEnd] <= cmp) {
            swap(array, maxEnd, minEnd);
            minEnd += 1;
        }
        swap(array, minEnd, right - 1);
        return minEnd;
    }
    function quickSort(array, left, right) {
        if (left < right) {
            var p = partition(array, left, right);
            quickSort(array, left, p);
            quickSort(array, p + 1, right);
        }
        return array;
    }
    return function(array) {
        return quickSort(array, 0, array.length);
    };
});

AMapUI.weakDefine("ui/misc/PathSimplifier/lib/PathSearcher", [ "lib/utils", "./BoundsItem", "./lineHelper", "./PathSegsForRender", "./quicksort" ], function(utils, BoundsItem, lineHelper, PathSegsForRender, quicksort) {
    function PathSearcher() {}
    utils.extend(PathSearcher.prototype, {
        setRelData: function(data) {
            this.pathList = data.list;
            this.kdTree = data.kdTree;
            this.wholeBounds = data.bounds;
        },
        within: function(x, y, r) {
            for (var pointIdxList = this.kdTree.within(x, y, r), results = [], pointsList = this.kdTree.points, i = 0, len = pointIdxList.length; i < len; i++) results.push(pointsList[pointIdxList[i]]);
            return results;
        },
        search: function(bounds) {
            if (!this.pathList || !this.kdTree) return [];
            if (bounds.containBounds(this.wholeBounds)) return this._buildWholePathSegs();
            var pointIndexes = this._searchInBounds(bounds);
            pointIndexes.push.apply(pointIndexes, this._searchOutBounds(bounds));
            var ranges = this._calcConsecutiveRanges(pointIndexes);
            return this._buildPathSegs(ranges);
        },
        _searchInBounds: function(bounds) {
            return this.kdTree.range(bounds.x, bounds.y, bounds.x + bounds.width, bounds.y + bounds.height);
        },
        _searchOutBounds: function(bounds) {
            for (var result = [], pathList = this.pathList, boundsIntersect = BoundsItem.boundsIntersect, boundsContain = BoundsItem.boundsContain, i = 0, len = pathList.length; i < len; i++) !boundsContain(bounds, pathList[i].bounds) && boundsIntersect(bounds, pathList[i].bounds) && result.push.apply(result, this._searchOutBoundsWithPath(pathList[i], bounds));
            return result;
        },
        _searchOutBoundsWithPath: function(pathInfo, bounds) {
            for (var points = pathInfo.points, boundsGroup = pathInfo.boundsGroup, startIdx = pathInfo.startIdx, lastInsert = -1, result = [], boundsIntersect = BoundsItem.boundsIntersect, boundsContain = BoundsItem.boundsContain, boundsContainPoint = BoundsItem.boundsContainPoint, j = 0, jlen = boundsGroup.length; j < jlen; j++) if (!boundsContain(bounds, boundsGroup[j][2]) && boundsIntersect(bounds, boundsGroup[j][2])) for (var i = boundsGroup[j][0], rangeEnd = boundsGroup[j][1]; i < rangeEnd; i++) {
                var currPoint = points[i], nextPoint = points[i + 1];
                if (!boundsContainPoint(bounds, currPoint)) if (boundsContainPoint(bounds, nextPoint)) i++; else if (lineHelper.intersectLineRectangle(currPoint, nextPoint, bounds)) {
                    i !== lastInsert && result.push(i + startIdx);
                    result.push(i + 1 + startIdx);
                    lastInsert = i + 1;
                }
            }
            return result;
        },
        _buildWholePathSegs: function() {
            for (var pathList = this.pathList, segs = [], i = 0, len = pathList.length; i < len; i++) {
                var pathInfo = pathList[i], record = new PathSegsForRender(i, pathInfo);
                record.addSeg(0, pathInfo.length - 1);
                segs.push(record);
            }
            return segs;
        },
        _buildPathSegs: function(ranges) {
            function add2Group(j, start, end) {
                var startIdx = pathList[j].startIdx;
                segMap[j] || (segMap[j] = new PathSegsForRender(j, pathList[j]));
                segMap[j].addSeg(start - startIdx, end - startIdx);
            }
            var i, len, j, segMap = {}, pathList = this.pathList, jStart = 0, jlen = pathList.length;
            for (i = 0, len = ranges.length; i < len; i++) {
                var segStartIdx = ranges[i][0], segEndIdx = ranges[i][1];
                for (j = jStart; j < jlen; j++) {
                    var pathStartIdx = pathList[j].startIdx, pathEndIdx = pathList[j].startIdx + pathList[j].length - 1;
                    if (segStartIdx >= pathStartIdx && segStartIdx <= pathEndIdx) {
                        if (segEndIdx <= pathEndIdx) {
                            add2Group(j, segStartIdx, segEndIdx);
                            break;
                        }
                        add2Group(j, segStartIdx, pathEndIdx);
                        segStartIdx = pathEndIdx + 1;
                    }
                }
                jStart = j;
            }
            var pathSegs = [];
            for (i = 0, len = pathList.length; i < len; i++) segMap[i] && pathSegs.push(segMap[i]);
            return pathSegs;
        },
        _calcConsecutiveRanges: function(numbers) {
            quicksort(numbers);
            var i, len = numbers.length;
            if (numbers[len - 1] - numbers[0] === len - 1) return [ [ numbers[0], numbers[len - 1] ] ];
            var ranges = [], startIdx = numbers[0];
            for (i = 1; i < len; i++) if (numbers[i] !== numbers[i - 1] + 1) {
                ranges.push([ startIdx, numbers[i - 1] ]);
                startIdx = numbers[i];
            }
            ranges.push([ startIdx, numbers[len - 1] ]);
            return ranges;
        }
    });
    return PathSearcher;
});

AMapUI.weakDefine("ui/misc/PathSimplifier/lib/quickSelect", [], function() {
    function swap(arr, i, j) {
        var tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    function defaultCompare(a, b) {
        return a < b ? -1 : a > b ? 1 : 0;
    }
    function quickselect(arr, k, left, right, compare) {
        for (;right > left; ) {
            if (right - left > 600) {
                var n = right - left + 1, m = k - left + 1, z = Math.log(n), s = .5 * Math.exp(2 * z / 3), sd = .5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1), newLeft = Math.max(left, Math.floor(k - m * s / n + sd)), newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
                quickselect(arr, k, newLeft, newRight, compare);
            }
            var t = arr[k], i = left, j = right;
            swap(arr, left, k);
            compare(arr[right], t) > 0 && swap(arr, left, right);
            for (;i < j; ) {
                swap(arr, i, j);
                i++;
                j--;
                for (;compare(arr[i], t) < 0; ) i++;
                for (;compare(arr[j], t) > 0; ) j--;
            }
            if (0 === compare(arr[left], t)) swap(arr, left, j); else {
                j++;
                swap(arr, j, right);
            }
            j <= k && (left = j + 1);
            k <= j && (right = j - 1);
        }
    }
    return function(arr, k, left, right, compare) {
        quickselect(arr, k, left || 0, right || arr.length - 1, compare || defaultCompare);
    };
});

AMapUI.weakDefine("ui/misc/PathSimplifier/lib/RBush", [ "./quickSelect" ], function(quickselect) {
    function rbush(maxEntries, format) {
        if (!(this instanceof rbush)) return new rbush(maxEntries, format);
        this._maxEntries = Math.max(4, maxEntries || 9);
        this._minEntries = Math.max(2, Math.ceil(.4 * this._maxEntries));
        format && this._initFormat(format);
        this.clear();
    }
    function findItem(item, items, equalsFn) {
        if (!equalsFn) return items.indexOf(item);
        for (var i = 0; i < items.length; i++) if (equalsFn(item, items[i])) return i;
        return -1;
    }
    function calcBBox(node, toBBox) {
        distBBox(node, 0, node.children.length, toBBox, node);
    }
    function distBBox(node, k, p, toBBox, destNode) {
        destNode || (destNode = createNode(null));
        destNode.minX = 1 / 0;
        destNode.minY = 1 / 0;
        destNode.maxX = -(1 / 0);
        destNode.maxY = -(1 / 0);
        for (var child, i = k; i < p; i++) {
            child = node.children[i];
            extend(destNode, node.leaf ? toBBox(child) : child);
        }
        return destNode;
    }
    function extend(a, b) {
        a.minX = Math.min(a.minX, b.minX);
        a.minY = Math.min(a.minY, b.minY);
        a.maxX = Math.max(a.maxX, b.maxX);
        a.maxY = Math.max(a.maxY, b.maxY);
        return a;
    }
    function compareNodeMinX(a, b) {
        return a.minX - b.minX;
    }
    function compareNodeMinY(a, b) {
        return a.minY - b.minY;
    }
    function bboxArea(a) {
        return (a.maxX - a.minX) * (a.maxY - a.minY);
    }
    function bboxMargin(a) {
        return a.maxX - a.minX + (a.maxY - a.minY);
    }
    function enlargedArea(a, b) {
        return (Math.max(b.maxX, a.maxX) - Math.min(b.minX, a.minX)) * (Math.max(b.maxY, a.maxY) - Math.min(b.minY, a.minY));
    }
    function intersectionArea(a, b) {
        var minX = Math.max(a.minX, b.minX), minY = Math.max(a.minY, b.minY), maxX = Math.min(a.maxX, b.maxX), maxY = Math.min(a.maxY, b.maxY);
        return Math.max(0, maxX - minX) * Math.max(0, maxY - minY);
    }
    function contains(a, b) {
        return a.minX <= b.minX && a.minY <= b.minY && b.maxX <= a.maxX && b.maxY <= a.maxY;
    }
    function intersects(a, b) {
        return b.minX <= a.maxX && b.minY <= a.maxY && b.maxX >= a.minX && b.maxY >= a.minY;
    }
    function createNode(children) {
        return {
            children: children,
            height: 1,
            leaf: !0,
            minX: 1 / 0,
            minY: 1 / 0,
            maxX: -(1 / 0),
            maxY: -(1 / 0)
        };
    }
    function multiSelect(arr, left, right, n, compare) {
        for (var mid, stack = [ left, right ]; stack.length; ) {
            right = stack.pop();
            left = stack.pop();
            if (!(right - left <= n)) {
                mid = left + Math.ceil((right - left) / n / 2) * n;
                quickselect(arr, mid, left, right, compare);
                stack.push(left, mid, mid, right);
            }
        }
    }
    rbush.prototype = {
        all: function() {
            return this._all(this.data, []);
        },
        search: function(bbox) {
            var node = this.data, result = [], toBBox = this.toBBox;
            if (!intersects(bbox, node)) return result;
            for (var i, len, child, childBBox, nodesToSearch = []; node; ) {
                for (i = 0, len = node.children.length; i < len; i++) {
                    child = node.children[i];
                    childBBox = node.leaf ? toBBox(child) : child;
                    intersects(bbox, childBBox) && (node.leaf ? result.push(child) : contains(bbox, childBBox) ? this._all(child, result) : nodesToSearch.push(child));
                }
                node = nodesToSearch.pop();
            }
            return result;
        },
        collides: function(bbox) {
            var node = this.data, toBBox = this.toBBox;
            if (!intersects(bbox, node)) return !1;
            for (var i, len, child, childBBox, nodesToSearch = []; node; ) {
                for (i = 0, len = node.children.length; i < len; i++) {
                    child = node.children[i];
                    childBBox = node.leaf ? toBBox(child) : child;
                    if (intersects(bbox, childBBox)) {
                        if (node.leaf || contains(bbox, childBBox)) return !0;
                        nodesToSearch.push(child);
                    }
                }
                node = nodesToSearch.pop();
            }
            return !1;
        },
        load: function(data) {
            if (!data || !data.length) return this;
            if (data.length < this._minEntries) {
                for (var i = 0, len = data.length; i < len; i++) this.insert(data[i]);
                return this;
            }
            var node = this._build(data.slice(), 0, data.length - 1, 0);
            if (this.data.children.length) if (this.data.height === node.height) this._splitRoot(this.data, node); else {
                if (this.data.height < node.height) {
                    var tmpNode = this.data;
                    this.data = node;
                    node = tmpNode;
                }
                this._insert(node, this.data.height - node.height - 1, !0);
            } else this.data = node;
            return this;
        },
        insert: function(item) {
            item && this._insert(item, this.data.height - 1);
            return this;
        },
        clear: function() {
            this.data = createNode([]);
            return this;
        },
        remove: function(item, equalsFn) {
            if (!item) return this;
            for (var i, parent, index, goingUp, node = this.data, bbox = this.toBBox(item), path = [], indexes = []; node || path.length; ) {
                if (!node) {
                    node = path.pop();
                    parent = path[path.length - 1];
                    i = indexes.pop();
                    goingUp = !0;
                }
                if (node.leaf) {
                    index = findItem(item, node.children, equalsFn);
                    if (index !== -1) {
                        node.children.splice(index, 1);
                        path.push(node);
                        this._condense(path);
                        return this;
                    }
                }
                if (goingUp || node.leaf || !contains(node, bbox)) if (parent) {
                    i++;
                    node = parent.children[i];
                    goingUp = !1;
                } else node = null; else {
                    path.push(node);
                    indexes.push(i);
                    i = 0;
                    parent = node;
                    node = node.children[0];
                }
            }
            return this;
        },
        toBBox: function(item) {
            return item;
        },
        compareMinX: compareNodeMinX,
        compareMinY: compareNodeMinY,
        toJSON: function() {
            return this.data;
        },
        fromJSON: function(data) {
            this.data = data;
            return this;
        },
        _all: function(node, result) {
            for (var nodesToSearch = []; node; ) {
                node.leaf ? result.push.apply(result, node.children) : nodesToSearch.push.apply(nodesToSearch, node.children);
                node = nodesToSearch.pop();
            }
            return result;
        },
        _build: function(items, left, right, height) {
            var node, N = right - left + 1, M = this._maxEntries;
            if (N <= M) {
                node = createNode(items.slice(left, right + 1));
                calcBBox(node, this.toBBox);
                return node;
            }
            if (!height) {
                height = Math.ceil(Math.log(N) / Math.log(M));
                M = Math.ceil(N / Math.pow(M, height - 1));
            }
            node = createNode([]);
            node.leaf = !1;
            node.height = height;
            var i, j, right2, right3, N2 = Math.ceil(N / M), N1 = N2 * Math.ceil(Math.sqrt(M));
            multiSelect(items, left, right, N1, this.compareMinX);
            for (i = left; i <= right; i += N1) {
                right2 = Math.min(i + N1 - 1, right);
                multiSelect(items, i, right2, N2, this.compareMinY);
                for (j = i; j <= right2; j += N2) {
                    right3 = Math.min(j + N2 - 1, right2);
                    node.children.push(this._build(items, j, right3, height - 1));
                }
            }
            calcBBox(node, this.toBBox);
            return node;
        },
        _chooseSubtree: function(bbox, node, level, path) {
            for (var i, len, child, targetNode, area, enlargement, minArea, minEnlargement; ;) {
                path.push(node);
                if (node.leaf || path.length - 1 === level) break;
                minArea = minEnlargement = 1 / 0;
                for (i = 0, len = node.children.length; i < len; i++) {
                    child = node.children[i];
                    area = bboxArea(child);
                    enlargement = enlargedArea(bbox, child) - area;
                    if (enlargement < minEnlargement) {
                        minEnlargement = enlargement;
                        minArea = area < minArea ? area : minArea;
                        targetNode = child;
                    } else if (enlargement === minEnlargement && area < minArea) {
                        minArea = area;
                        targetNode = child;
                    }
                }
                node = targetNode || node.children[0];
            }
            return node;
        },
        _insert: function(item, level, isNode) {
            var toBBox = this.toBBox, bbox = isNode ? item : toBBox(item), insertPath = [], node = this._chooseSubtree(bbox, this.data, level, insertPath);
            node.children.push(item);
            extend(node, bbox);
            for (;level >= 0 && insertPath[level].children.length > this._maxEntries; ) {
                this._split(insertPath, level);
                level--;
            }
            this._adjustParentBBoxes(bbox, insertPath, level);
        },
        _split: function(insertPath, level) {
            var node = insertPath[level], M = node.children.length, m = this._minEntries;
            this._chooseSplitAxis(node, m, M);
            var splitIndex = this._chooseSplitIndex(node, m, M), newNode = createNode(node.children.splice(splitIndex, node.children.length - splitIndex));
            newNode.height = node.height;
            newNode.leaf = node.leaf;
            calcBBox(node, this.toBBox);
            calcBBox(newNode, this.toBBox);
            level ? insertPath[level - 1].children.push(newNode) : this._splitRoot(node, newNode);
        },
        _splitRoot: function(node, newNode) {
            this.data = createNode([ node, newNode ]);
            this.data.height = node.height + 1;
            this.data.leaf = !1;
            calcBBox(this.data, this.toBBox);
        },
        _chooseSplitIndex: function(node, m, M) {
            var i, bbox1, bbox2, overlap, area, minOverlap, minArea, index;
            minOverlap = minArea = 1 / 0;
            for (i = m; i <= M - m; i++) {
                bbox1 = distBBox(node, 0, i, this.toBBox);
                bbox2 = distBBox(node, i, M, this.toBBox);
                overlap = intersectionArea(bbox1, bbox2);
                area = bboxArea(bbox1) + bboxArea(bbox2);
                if (overlap < minOverlap) {
                    minOverlap = overlap;
                    index = i;
                    minArea = area < minArea ? area : minArea;
                } else if (overlap === minOverlap && area < minArea) {
                    minArea = area;
                    index = i;
                }
            }
            return index;
        },
        _chooseSplitAxis: function(node, m, M) {
            var compareMinX = node.leaf ? this.compareMinX : compareNodeMinX, compareMinY = node.leaf ? this.compareMinY : compareNodeMinY, xMargin = this._allDistMargin(node, m, M, compareMinX), yMargin = this._allDistMargin(node, m, M, compareMinY);
            xMargin < yMargin && node.children.sort(compareMinX);
        },
        _allDistMargin: function(node, m, M, compare) {
            node.children.sort(compare);
            var i, child, toBBox = this.toBBox, leftBBox = distBBox(node, 0, m, toBBox), rightBBox = distBBox(node, M - m, M, toBBox), margin = bboxMargin(leftBBox) + bboxMargin(rightBBox);
            for (i = m; i < M - m; i++) {
                child = node.children[i];
                extend(leftBBox, node.leaf ? toBBox(child) : child);
                margin += bboxMargin(leftBBox);
            }
            for (i = M - m - 1; i >= m; i--) {
                child = node.children[i];
                extend(rightBBox, node.leaf ? toBBox(child) : child);
                margin += bboxMargin(rightBBox);
            }
            return margin;
        },
        _adjustParentBBoxes: function(bbox, path, level) {
            for (var i = level; i >= 0; i--) extend(path[i], bbox);
        },
        _condense: function(path) {
            for (var siblings, i = path.length - 1; i >= 0; i--) if (0 === path[i].children.length) if (i > 0) {
                siblings = path[i - 1].children;
                siblings.splice(siblings.indexOf(path[i]), 1);
            } else this.clear(); else calcBBox(path[i], this.toBBox);
        },
        _initFormat: function(format) {
            var compareArr = [ "return a", " - b", ";" ];
            this.compareMinX = new Function("a", "b", compareArr.join(format[0]));
            this.compareMinY = new Function("a", "b", compareArr.join(format[1]));
            this.toBBox = new Function("a", "return {minX: a" + format[0] + ", minY: a" + format[1] + ", maxX: a" + format[2] + ", maxY: a" + format[3] + "};");
        }
    };
    return rbush;
});

AMapUI.weakDefine("ui/misc/PathSimplifier/lib/RBushItem", [], function() {
    function RBushItem(d, x1, y1, x2, y2) {
        this.d = d;
        this.minX = x1;
        this.minY = y1;
        this.maxX = x2;
        this.maxY = y2;
    }
    return RBushItem;
});

AMapUI.weakDefine("ui/misc/PathSimplifier/render/base", [ "lib/utils", "lib/event", "../lib/simplify", "../lib/BoundsItem", "../lib/PointItem", "../lib/PointForRender", "../lib/PathSegsForRender", "../lib/PathSearcher", "../lib/RBush", "../lib/RBushItem" ], function(utils, EventCls, simplify, BoundsItem, PointItem, PointForRender, PathSegsForRender, PathSearcher, RBush, RBushItem) {
    function BaseRender(simpIns, opts) {
        this._opts = utils.extend({
            eventSupport: !0,
            eventSupportInvisible: !0,
            mouseEventNames: [ "click" ],
            mousemoveDebounceWait: 10,
            renderAllPointsIfNumberBelow: -1,
            pathTolerance: 2,
            pathNearTolerance: 5,
            keyPointTolerance: -1,
            mousePickRadius: 3,
            comparePathSeg: function(p1, p2) {
                if (p1 === p2) return 0;
                var zIndexDiff = p2.getZIndex() - p1.getZIndex();
                return 0 !== zIndexDiff ? zIndexDiff : p2.getPathIndex() - p1.getPathIndex();
            }
        }, opts);
        BaseRender.__super__.constructor.call(this, this._opts);
        this._debouncedHandleMousemove = this._opts.mousemoveDebounceWait > 1 ? utils.debounce(this._handleMousemove, this._opts.mousemoveDebounceWait) : this._handleMousemove;
        this._ins = simpIns;
        this._pathSearcher = new PathSearcher();
        this._rTreeForEleIndex = new RBush();
        this._lastMousePos = {};
        this._isRendering = !1;
        this._opts.eventSupport && this._bindEvents(!0);
    }
    utils.inherit(BaseRender, EventCls);
    utils.extend(BaseRender.prototype, {
        getPathSimplifierInstance: function() {
            return this._ins;
        },
        getPixelRatio: function() {
            return Math.min(2, Math.round(window.devicePixelRatio || 1));
        },
        _bindEvents: function(on) {
            for (var action = on ? "on" : "off", map = this._ins.getMap(), mouseEventNames = this._opts.mouseEventNames, i = 0, len = mouseEventNames.length; i < len; i++) map[action](mouseEventNames[i], this._handleMouseEvent, this);
            AMap.UA.mobile || map[action]("mousemove", this._debouncedHandleMousemove, this);
        },
        _getTargetsUndermouse: function(e) {
            var pathSeg, i, len, radius = this._opts.mousePickRadius, pos = e.pixel, points = [], pathSegs = [], pathSegsIdxMap = {};
            if (this._currentPathSegs) {
                var items = this._rTreeForEleIndex.search(new RBushItem(null, pos.x - radius, pos.y - radius, pos.x + radius, pos.y + radius));
                if (items.length) for (i = 0, len = items.length; i < len; i++) points.push(items[i].d); else if (this._opts.eventSupportInvisible) {
                    var viewBounds = this._currentViewBounds, scaleFactor = this._currentScaleFactor, pathPoints = this._pathSearcher.within(viewBounds.x + pos.x * scaleFactor, viewBounds.y + pos.y * scaleFactor, radius * scaleFactor);
                    points = PointForRender.translateList(pathPoints, viewBounds, scaleFactor);
                }
                if (points.length) {
                    if (points.length > 1) {
                        var self = this;
                        points.sort(function(a, b) {
                            var pathA = self._getPathSegByPointIdx(a.idx), pathB = self._getPathSegByPointIdx(b.idx), result = self._opts.comparePathSeg(pathA, pathB);
                            if (0 !== result) return result;
                            var sa = a.squaredDistance(pos), sb = b.squaredDistance(pos);
                            return sa - sb;
                        });
                    }
                    for (i = 0; i < 1; i++) {
                        pathSeg = this._getPathSegByPointIdx(points[i].idx);
                        if (!pathSegsIdxMap[pathSeg.idx]) {
                            pathSegsIdxMap[pathSeg.idx] = !0;
                            pathSegs.push(pathSeg);
                        }
                    }
                } else {
                    var closestPathSeg = this._pickClosestPathSeg(this._currentPathSegs, pos, radius);
                    closestPathSeg && pathSegs.push(closestPathSeg);
                }
            }
            return {
                points: points,
                segs: pathSegs
            };
        },
        getSelectedPathIndex: function() {
            return this._ins.getSelectedPathIndex();
        },
        _isPathSegSelected: function(pathSeg) {
            return pathSeg.idx === this.getSelectedPathIndex();
        },
        _pickClosestPathSeg: function(pathSegs, p, minDist) {
            for (var results = [], i = 0, len = pathSegs.length; i < len; i++) {
                var lineWidth = pathSegs[i].pathLineWidth;
                if (!(lineWidth <= 0)) {
                    var sqDist = pathSegs[i].getMinSqDistanceToPoint(p), verticalDist = Math.sqrt(sqDist), touchDist = verticalDist - lineWidth / 2;
                    touchDist < minDist && results.push(pathSegs[i]);
                }
            }
            if (!results.length) return null;
            results.length > 1 && results.sort(this._opts.comparePathSeg);
            return results[0];
        },
        _getPathSegByPointIdx: function(idx) {
            for (var pathSegs = this._currentPathSegs, i = 0, len = pathSegs.length; i < len; i++) {
                var pathData = pathSegs[i].pathData, startIdx = pathData.startIdx, endIdx = startIdx + pathData.length - 1;
                if (idx >= startIdx && idx <= endIdx) return pathSegs[i];
            }
            console.error("Can not find pathSeg: ", idx, pathSegs);
            return null;
        },
        _getPathSegByPathIndex: function(idx) {
            for (var pathSegs = this._currentPathSegs, i = 0, len = pathSegs.length; i < len; i++) if (pathSegs[i].idx === idx) return pathSegs[i];
            return null;
        },
        _handleMouseEvent: function(e) {
            var targets = this._getTargetsUndermouse(e), targetPoints = targets.points, targetsPathSegs = targets.segs;
            if (targetPoints.length) {
                var pointItem = targetPoints[0];
                this._triggerSelfAndInsEvent("point" + utils.ucfirst(e.type), e, this._packDataItem(pointItem));
            } else if (targetsPathSegs.length) {
                var pathItem = targetsPathSegs[0];
                this._triggerSelfAndInsEvent("path" + utils.ucfirst(e.type), e, this._packDataItem(pathItem));
            }
        },
        _handleMousemove: function(e) {
            var pos = e.pixel;
            if ("mousemove" === e.type) {
                if (this._lastMousePos.x === pos.x && this._lastMousePos.y === pos.y) return;
                this._lastMousePos.x = pos.x;
                this._lastMousePos.y = pos.y;
            }
            var targets = this._getTargetsUndermouse(e), targetPoints = targets.points, targetsPathSegs = targets.segs;
            targetPoints.length ? this.setHoverDataItem(targetPoints[0], e) : targetsPathSegs.length ? this.setHoverDataItem(targetsPathSegs[0], e) : this.setHoverDataItem(null, e);
        },
        setHoverDataItem: function(dataItem, e) {
            var oldHoverItem = this._HoverDataItem;
            if (dataItem !== oldHoverItem) {
                oldHoverItem && this._triggerSelfAndInsEvent(this._getDataItemType(oldHoverItem) + "Mouseout", e, this._packDataItem(oldHoverItem));
                dataItem && this._triggerSelfAndInsEvent(this._getDataItemType(dataItem) + "Mouseover", e, this._packDataItem(dataItem), dataItem);
                this._HoverDataItem = dataItem;
                this.triggerWithOriginalEvent("hoverDataItemChanged", e, dataItem, oldHoverItem);
            }
        },
        _getDataItemType: function(item) {
            if (item instanceof PathSegsForRender) return "path";
            if (item instanceof PointForRender) return "point";
            throw new Error("Unkown type: ", item);
        },
        _packDataItem: function(item) {
            if (!item) return null;
            switch (this._getDataItemType(item)) {
              case "path":
                return this._ins._packPathItem(item.idx);

              case "point":
                return this._ins._packPointItem(item.idx);
            }
            return null;
        },
        _triggerSelfAndInsEvent: function() {
            this.triggerWithOriginalEvent.apply(this, arguments);
            this._ins.triggerWithOriginalEvent.apply(this._ins, arguments);
        },
        refreshViewState: function() {
            var simpIns = this._ins;
            if (!simpIns._data) return !1;
            var map = this._ins.getMap(), mapViewBounds = map.getBounds(), viewSize = map.getSize(), currZoom = map.getZoom(), maxZoom = simpIns.getMaxZoom(), scaleFactor = Math.pow(2, maxZoom - currZoom), topLeft = simpIns.getPixelOfMaxZoom(mapViewBounds.getNorthWest()), bounds = new BoundsItem(topLeft[0], topLeft[1], viewSize.width * scaleFactor, viewSize.height * scaleFactor);
            this._currentZoom = currZoom;
            this._currentScaleFactor = scaleFactor;
            this._currentViewBounds = bounds;
            this._currentPixelRatio = this.getPixelRatio();
        },
        renderViewport: function() {
            this._currentViewBounds || this.refreshViewState();
            if (!this._currentViewBounds) return !1;
            var simpIns = this._ins;
            if (!simpIns._data) return !1;
            this._pathSearcher.setRelData(simpIns._data);
            var pathSegs = this._pathSearcher.search(this._currentViewBounds);
            this._currentPathSegs = pathSegs;
            this._buildPathSegs(pathSegs, this._currentViewBounds, this._currentScaleFactor);
            this.trigger("willRenderViewport", pathSegs);
            this.renderPathSegments(pathSegs, this._currentViewBounds, this._currentScaleFactor);
            this.trigger("didRenderViewport", pathSegs);
            this._buildEleIndex();
        },
        _buildEleIndex: function() {
            for (var pathSegs = this._currentPathSegs, i = 0, len = pathSegs.length; i < len; i++) {
                var points = pathSegs[i].getPointsForIndex(), radius = pathSegs[i].pointRadius;
                if (!(radius <= 0)) for (var j = 0, jlen = points.length; j < jlen; j++) {
                    var point = points[j];
                    this._rTreeForEleIndex.insert(new RBushItem(point, point.x - radius, point.y - radius, point.x + radius, point.y + radius));
                }
            }
        },
        _buildPathSegs: function(pathSegs, viewBounds, scaleFactor) {
            var i, pointsNum = 0, len = pathSegs.length;
            for (i = 0; i < len; i++) pointsNum += pathSegs[i].getPointsNum();
            this._currentPointsNum = pointsNum;
            var keepAllPoints = this._currentPointsNum < this._opts.renderAllPointsIfNumberBelow;
            for (i = 0; i < len; i++) {
                pathSegs[i].buildSegs(viewBounds, scaleFactor, keepAllPoints, this._opts);
                pathSegs[i].pointRadius = this.getPointRadius(pathSegs[i]);
                pathSegs[i].pathLineWidth = this.getPathLineWidth(pathSegs[i]);
            }
        },
        renderPathSegments: function() {
            throw new Error("renderPathSegments has not been implemented!");
        },
        getPointRadius: function() {
            throw new Error("getPointRadius has not been implemented!");
        },
        getPathLineWidth: function() {
            throw new Error("getPathLineWidth has not been implemented!");
        },
        renderNavigatorPoints: function() {
            throw new Error("renderNavigatorPoints has not been implemented!");
        },
        refreshPathNavigators: function() {
            var navigs = [], viewBounds = this._currentViewBounds, scaleFactor = this._currentScaleFactor;
            if (viewBounds) for (var allNavigs = this._ins.getPathNavigators() || [], i = 0, len = allNavigs.length; i < len; i++) allNavigs[i].isIncomplete() || navigs.push(allNavigs[i]);
            this.renderPathNavigators(navigs, viewBounds, scaleFactor);
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
            this._rTreeForEleIndex.clear();
            if (this._currentPathSegs) {
                for (var pathSegs = this._currentPathSegs, i = 0, len = pathSegs.length; i < len; i++) pathSegs[i].destroy();
                pathSegs.length = 0;
            }
            this.renderViewport();
            this.refreshPathNavigators();
            this._isRendering = !1;
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

AMapUI.weakDefine("ui/misc/PathSimplifier/lib/PathCursor", [ "lib/utils", "lib/event", "./PointItem" ], function(utils, EventCls, PointItem) {
    function PathCursor(path) {
        PathCursor.__super__.constructor.apply(this, arguments);
        this.id = baseId++;
        this._movedDistance = 0;
        this.setPath(path);
    }
    function CursorDot(idx, tail) {
        this.idx = idx;
        this.tail = tail || 0;
    }
    var baseId = 1;
    utils.extend(CursorDot.prototype, {
        clone: function() {
            return new CursorDot(this.idx, this.tail);
        },
        compareTo: function(d) {
            return this.idx + this.tail - d.idx - d.tail;
        }
    });
    utils.inherit(PathCursor, EventCls);
    utils.extend(PathCursor.prototype, {
        isIncomplete: function() {
            return !this.path || !this.path.length || !this.cursor;
        },
        destroy: function() {
            PathCursor.__super__.destroy.apply(this, arguments);
            this.path = null;
            this.idxRange = [ -1, -1 ];
            this.resetCursor();
        },
        resetCursor: function() {
            this.setCursor(this.idxRange[0], 0);
        },
        resetMovedDistance: function(d) {
            this._movedDistance = d || 0;
        },
        setPath: function(path) {
            path = path || [];
            this.path = path;
            this.setRange(0, path.length - 1);
            this.resetCursor();
        },
        setRange: function(start, end) {
            start = Math.max(0, start);
            end = Math.min(this.path.length - 1, end);
            this.idxRange = [ start, end ];
        },
        getMovedDistance: function() {
            return this._movedDistance;
        },
        getPathStartIdx: function() {
            return this.idxRange[0];
        },
        getPathEndIdx: function() {
            return this.idxRange[1];
        },
        isPathEnd: function(idx) {
            return this.path && idx >= this.idxRange[1];
        },
        isPathStart: function(idx) {
            return this.path && idx <= this.idxRange[0];
        },
        isCursorAtPathEnd: function() {
            return this.cursor && this.isPathEnd(this.cursor.idx);
        },
        isCursorAtPathStart: function() {
            return this.cursor && this.isPathStart(this.cursor.idx);
        },
        getCursor: function() {
            return this.cursor;
        },
        setCursor: function(idx, tail) {
            idx < 0 && (idx = this.idxRange[1] + 1 + idx);
            idx = Math.min(this.idxRange[1], Math.max(this.idxRange[0], idx));
            tail = tail ? Math.min(1, Math.max(0, tail)) : 0;
            if (this.cursor) {
                this.cursor.idx = idx;
                this.cursor.tail = tail;
            } else this.cursor = new CursorDot(idx, tail);
        },
        stepCursorByDistance: function(dist) {
            var cursor = this.cursor;
            if (!cursor || this.isCursorAtPathEnd()) return !1;
            if (dist > 0) {
                var nextPos = this.findNextByDistance(cursor.idx, cursor.tail, dist);
                this.setCursor(nextPos.idx, nextPos.tail);
                this._movedDistance += nextPos.distance;
                return !0;
            }
            return !1;
        },
        moveCursorTo: function(idx, tail) {
            var startCursor = this.cursor.clone();
            this.setCursor(idx, tail);
            this._movedDistance += this.getDistanceOfDots(startCursor, this.cursor);
            return !0;
        },
        getDistanceOfSegment: function(i) {
            var path = this.path, currPoint = path[i], nextPoint = path[i + 1];
            return nextPoint.distance(currPoint);
        },
        getDistanceOfRange: function(range) {
            range || (range = this.idxRange);
            for (var dist = 0, i = range[0]; i < range[1]; i++) dist += this.getDistanceOfSegment(i);
            return dist;
        },
        getDistanceOfDots: function(d1, d2) {
            if (d1.compareTo(d2) > 0) {
                var tmp = d1;
                d1 = d2;
                d2 = tmp;
            }
            for (var startIdx = d1.idx, endIdx = d2.idx, dist = 0, i = startIdx; i < endIdx; i++) dist += this.getDistanceOfSegment(i);
            d1.tail && (dist -= this.getDistanceOfSegment(startIdx) * d1.tail);
            d2.tail && (dist += this.getDistanceOfSegment(endIdx) * d2.tail);
            return dist;
        },
        findNextByDistance: function(idx, tail, distance) {
            var stepDist, i, nextTail = 0, leftDist = distance, path = this.path, currPoint = path[idx], nextPoint = idx < this.idxRange[1] ? path[idx + 1] : null;
            nextPoint && tail && (leftDist += this.getDistanceOfSegment(idx) * tail);
            for (i = idx; i < this.idxRange[1] && !(leftDist <= 0); i++) {
                currPoint = path[i];
                nextPoint = path[i + 1];
                stepDist = this.getDistanceOfSegment(i);
                if (!(leftDist >= stepDist)) {
                    nextTail = 1 - (stepDist - leftDist) / stepDist;
                    leftDist = 0;
                    break;
                }
                leftDist -= stepDist;
            }
            return {
                idx: i,
                tail: nextTail,
                distance: distance - leftDist
            };
        },
        getPointItemAtCursorDot: function() {
            return this.cursor ? this.getPointItemAt(this.cursor.idx, this.cursor.tail) : null;
        },
        getPointItemAt: function(idx, tail) {
            var path = this.path, currPoint = path[idx];
            if (!tail || tail <= 0 || idx >= this.idxRange[1]) return currPoint;
            var nextPoint = path[idx + 1], x = currPoint.x, y = currPoint.y;
            x += (nextPoint.x - currPoint.x) * tail;
            y += (nextPoint.y - currPoint.y) * tail;
            return new PointItem(x, y, currPoint.idx);
        },
        getCursorAngleDegree: function(dist) {
            return this.getCursorAngleRadians(dist) / Math.PI * 180;
        },
        getAngleRadiansAt: function(idx, tail, dist) {
            if (this.isPathEnd(idx)) {
                var prevPoint = this.getPointItemAt(idx - 1, 0);
                return prevPoint ? prevPoint.getAngleRadians(this.getPointItemAt(idx, 0)) : 0;
            }
            var nextPos, currPos = this.getPointItemAt(idx, tail);
            if (dist > 0) {
                var nextPosInfo = this.findNextByDistance(idx, tail, dist);
                nextPos = this.getPointItemAt(nextPosInfo.idx, nextPosInfo.tail);
            } else nextPos = this.getPointItemAt(idx + 1, 0);
            return currPos.getAngleRadians(nextPos);
        },
        getCursorAngleRadians: function(dist) {
            return this.getAngleRadiansAt(this.cursor.idx, this.cursor.tail, dist);
        }
    });
    return PathCursor;
});

AMapUI.weakDefine("ui/misc/PathSimplifier/render/canvas", [ "lib/utils", "lib/dom.utils", "./base", "../lib/PointItem", "../lib/lineHelper", "../lib/PathCursor", "../lib/PointForRender" ], function(utils, domUtils, BaseRender, PointItem, lineHelper, PathCursor, PointForRender) {
    function CanvasRender(simpIns, opts) {
        this._opts = utils.extend({
            styleKeysForCanvas: [ "globalAlpha", "fillStyle", "strokeStyle", "lineJoin", "lineCap", "lineDashOffset", "lineWidth", "miterLimit", "shadowBlur", "shadowColor", "shadowOffsetX", "shadowOffsetY" ]
        }, opts);
        this._opts = utils.nestExtendObjs({}, [ defaultNestedOpts, this._opts ]);
        for (var k in defaultNestedOpts) defaultNestedOpts.hasOwnProperty(k) && utils.isObject(this._opts[k]) && utils.isObject(defaultNestedOpts[k]) && (this._opts[k] = utils.extend({}, defaultNestedOpts[k], this._opts[k]));
        CanvasRender.__super__.constructor.call(this, simpIns, this._opts);
        this._isVisible = !0;
        this.on("hoverDataItemChanged", this._handleHoverDataItemChanged);
        this._pathSegStyleCache = {};
        this._canvasTags = [];
        this._initContainter();
        this._pathCursor = new PathCursor();
        this._loadDeps(this._setupCustomLayer);
    }
    var lineMethodMap = {
        defaultArrow: function(ctx, x, y, width, height) {
            ctx.moveTo(x, y + height);
            ctx.lineTo(x + width / 2, y + height / 2);
            ctx.lineTo(x + width, y + height);
        },
        defaultPathNavigator: function(ctx, x, y, width, height) {
            var halfW = width / 2, topCenter = [ x + halfW, y ], leftBottom = [ x, y + height ], rightBottom = [ x + width, y + height ], arrowBottom = [ x + halfW, y + .75 * height ];
            ctx.moveTo(arrowBottom[0], arrowBottom[1]);
            ctx.lineTo(rightBottom[0], rightBottom[1]);
            ctx.lineTo(topCenter[0], topCenter[1]);
            ctx.lineTo(leftBottom[0], leftBottom[1]);
            ctx.lineTo(arrowBottom[0], arrowBottom[1]);
            ctx.lineTo(topCenter[0], topCenter[1]);
        },
        circle: function(ctx, x, y, width, height) {
            var radius = (width < height ? width : height) / 2, center = [ x + width / 2, y + height / 2 ];
            ctx.moveTo(center[0] + radius, center[1]);
            ctx.arc(center[0], center[1], radius, 0, 2 * Math.PI);
        },
        none: function() {}
    }, defaultNestedOpts = {
        pathLineStyle: {
            lineJoin: "round",
            lineCap: "round",
            fillStyle: null,
            lineWidth: 3,
            strokeStyle: "#F7B538",
            borderWidth: 1,
            borderStyle: "#eeeeee"
        },
        pathLineHoverStyle: {
            inheritFrom: "pathLineStyle",
            disableIfSelected: !0,
            fillStyle: null,
            strokeStyle: "rgba(204, 63, 88,1)",
            borderWidth: 1,
            borderStyle: "#cccccc"
        },
        pathLineSelectedStyle: {
            inheritFrom: "pathLineStyle",
            fillStyle: null,
            lineWidth: 6,
            strokeStyle: "#C11534",
            borderWidth: 1,
            borderStyle: "#cccccc",
            dirArrowStyle: {
                strokeStyle: "#ffffff"
            }
        },
        keyPointStyle: {
            radius: 3,
            fillStyle: "rgba(8, 126, 196, 1)",
            lineWidth: 1,
            strokeStyle: "rgba(238, 238, 238, 1)"
        },
        keyPointHoverStyle: {
            inheritFrom: "keyPointStyle",
            radius: 5,
            fillStyle: "rgba(8, 126, 196, 0.5)",
            lineWidth: 2,
            strokeStyle: "#ffa500"
        },
        keyPointOnSelectedPathLineStyle: {
            radius: 4,
            inheritFrom: "keyPointStyle",
            fillStyle: "rgba(8, 126, 196, 1)",
            lineWidth: 2,
            strokeStyle: "#eeeeee"
        },
        startPointStyle: {
            radius: 4,
            inheritFrom: "keyPointStyle",
            fillStyle: "#109618",
            strokeStyle: "#eeeeee"
        },
        endPointStyle: {
            radius: 4,
            inheritFrom: "keyPointStyle",
            fillStyle: "#dc3912",
            strokeStyle: "#eeeeee"
        },
        dirArrowStyle: {
            lineJoin: "miter",
            lineCap: "round",
            content: "defaultArrow",
            strokeStyle: "#ffffff",
            lineWidth: 2
        },
        pathNavigatorStyle: {
            initRotateDegree: 0,
            autoRotate: !0,
            width: 16,
            height: 16,
            lineJoin: "round",
            content: "defaultPathNavigator",
            fillStyle: "#087EC4",
            strokeStyle: "#116394",
            lineWidth: 1,
            pathLinePassedStyle: {
                lineWidth: 2,
                strokeStyle: "rgba(8, 126, 196, 1)"
            }
        },
        hoverTitleStyle: {
            offset: [ 0, 0 ],
            classNames: "",
            position: "left"
        }
    }, degree2Radian = Math.PI / 180;
    utils.inherit(CanvasRender, BaseRender);
    utils.extend(CanvasRender, {
        getImageContent: function(src, onload, onerror) {
            var image, isLoaded = !1;
            if (utils.isString(src)) {
                image = document.createElement("img");
                image.crossOrigin = "Anonymous";
                image.addEventListener("load", function() {
                    isLoaded = !0;
                    onload && onload.call(this);
                }, !1);
                image.addEventListener("error", function(e) {
                    onerror && onerror.call(this, e);
                }, !1);
                image.src = src;
            } else if (utils.isHTMLElement(src)) {
                image = src;
                isLoaded = !0;
            }
            return function(ctx, x, y, width, height) {
                isLoaded && ctx.drawImage(image, x, y, width, height);
            };
        }
    });
    utils.extend(CanvasRender.prototype, {
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
        _initContainter: function() {
            var container = document.createElement("div");
            this._container = container;
            this._createCanvas("base", container);
            this._createCanvas("naviLine", container);
            var overlayContainter = document.createElement("div");
            overlayContainter.className = "overlay-container amap-ui-hide";
            this._overlayContainter = overlayContainter;
            this._createCanvas("overlay", overlayContainter);
            if (this._opts.hoverTitleStyle) {
                this._overlayTitle = document.createElement("div");
                this._overlayTitle.className = "overlay-title " + this._opts.hoverTitleStyle.position + " " + (this._opts.hoverTitleStyle.classNames || "");
                overlayContainter.appendChild(this._overlayTitle);
            }
            container.appendChild(overlayContainter);
            this._createCanvas("naviPoint", container);
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
            domUtils.addClass(this._container, "amap-ui-pathsimplifier-container");
            var self = this;
            this.layer.render = function() {
                self.refreshViewState();
                self.render();
            };
        },
        _handleHoverDataItemChanged: function(e, hoverItem) {
            if (hoverItem) {
                this._drawHoverItem(hoverItem);
                this._updateOverlayTitle(hoverItem, e.originalEvent.pixel);
                this._showOverlayContainer();
            } else this._hideOverlayContainer();
        },
        _updateOverlayTitle: function(hoverItem, pos) {
            var ele = this._overlayTitle, gotContent = !1;
            if (ele && this._ins._opts.getHoverTitle) {
                var dataItemPack = this._packDataItem(hoverItem), title = this._ins._opts.getHoverTitle.call(this._ins, dataItemPack.pathData, dataItemPack.pathIndex, dataItemPack.pointIndex), posItem = hoverItem instanceof PointItem ? hoverItem : pos;
                if (title) {
                    ele.innerHTML = title;
                    gotContent = !0;
                    var offset = this._opts.hoverTitleStyle.offset;
                    ele.style.left = Math.round(posItem.x + offset[0]) + "px";
                    ele.style.top = Math.round(posItem.y + offset[1]) + "px";
                }
            }
            domUtils.toggleClass(ele, "amap-ui-hide", !gotContent);
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
        getLineMethodByContent: function(content) {
            return content ? utils.isFunction(content) ? content : lineMethodMap[content] || lineMethodMap["none"] : lineMethodMap["none"];
        },
        _drawHoverItem: function(hoverItem) {
            var canvas = this._getCanvas("overlay"), ctx = this._getCanvasCxt("overlay"), gotContent = !1;
            if (canvas) {
                this._resetCanvas(canvas);
                switch (this._getDataItemType(hoverItem)) {
                  case "path":
                    this._drawHoverPathSeg(ctx, hoverItem);
                    break;

                  case "point":
                    this._drawHoverPoint(ctx, hoverItem);
                }
                gotContent = !0;
            }
            domUtils.toggleClass(canvas, "amap-ui-hide", !gotContent);
        },
        _drawHoverPathSeg: function(ctx, pathSeg) {
            var isSelected = this._isPathSegSelected(pathSeg), styleOptions = this._getPathSegStyle("pathLineHoverStyle", pathSeg);
            if (!(!styleOptions || isSelected && styleOptions.disableIfSelected)) {
                this._renderSegLines(pathSeg, ctx, styleOptions);
                styleOptions = this._getPathSegStyle(isSelected ? "keyPointOnSelectedPathLineStyle" : "keyPointStyle", pathSeg);
                styleOptions && this._renderSegKeyPoints(pathSeg, ctx, styleOptions);
            }
        },
        _drawHoverPoint: function(ctx, pointItem) {
            var pathSeg = this._getPathSegByPointIdx(pointItem.idx);
            this._drawHoverPathSeg(ctx, pathSeg);
            var styleOptions = this._getPathSegStyle("keyPointHoverStyle", pathSeg);
            this.drawKeyPoints(ctx, [ pointItem ], styleOptions);
        },
        _hideOverlayContainer: function() {
            domUtils.addClass(this._overlayContainter, "amap-ui-hide");
        },
        _showOverlayContainer: function() {
            domUtils.removeClass(this._overlayContainter, "amap-ui-hide");
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
            this._pathSegStyleCache = {};
            this._setCanvasSizeByTag(null, size.width, size.height);
            this.setHoverDataItem(null);
            this._hideOverlayContainer();
            CanvasRender.__super__.render.apply(this, arguments);
        },
        _getPathSegStyle: function(key, pathSeg, noCache) {
            var pathStyleOpts = this._opts;
            if (utils.isFunction(this._opts.getPathStyle)) {
                var cacheKey = pathSeg.idx + "_" + this._currentZoom;
                if (!noCache && this._pathSegStyleCache[cacheKey]) pathStyleOpts = this._pathSegStyleCache[cacheKey]; else {
                    var tmpOpts = this._opts.getPathStyle.call(this, this._packDataItem(pathSeg), this._currentZoom);
                    if (utils.isObject(tmpOpts)) {
                        pathStyleOpts = utils.nestExtendObjs({}, [ this._opts, tmpOpts ]);
                        noCache || (this._pathSegStyleCache[cacheKey] = pathStyleOpts);
                    }
                }
            }
            if (!pathStyleOpts) return null;
            var styleOptions = pathStyleOpts[key];
            if (!styleOptions) return null;
            styleOptions.inheritFrom && key !== styleOptions.inheritFrom && (styleOptions = utils.nestExtendObjs({}, [ pathStyleOpts[styleOptions.inheritFrom], styleOptions ]));
            return styleOptions;
        },
        getPointRadius: function(pathSeg) {
            var keyPointStyle = this._getPathSegStyle("keyPointStyle", pathSeg);
            return keyPointStyle ? keyPointStyle.radius : 0;
        },
        getPathLineWidth: function(pathSeg) {
            var pathLineStyle = this._getPathSegStyle(this._isPathSegSelected(pathSeg) ? "pathLineSelectedStyle" : "pathLineStyle", pathSeg);
            return pathLineStyle ? pathLineStyle.lineWidth + (pathLineStyle.borderWidth ? 2 * pathLineStyle.borderWidth : 0) : 0;
        },
        renderPathSegments: function(pathSegs, viewBounds, scaleFactor) {
            var styleOptions, i, lineCtx = this._getCanvasCxt("base"), pointCtx = lineCtx, selectedPathIndex = this.getSelectedPathIndex(), isSelected = !1, len = pathSegs.length;
            pathSegs.sort(this._opts.comparePathSeg);
            for (i = len - 1; i >= 0; i--) {
                isSelected = selectedPathIndex === pathSegs[i].idx;
                styleOptions = this._getPathSegStyle(isSelected ? "pathLineSelectedStyle" : "pathLineStyle", pathSegs[i]);
                styleOptions && this._renderSegLines(pathSegs[i], lineCtx, styleOptions);
                styleOptions = this._getPathSegStyle(isSelected ? "keyPointOnSelectedPathLineStyle" : "keyPointStyle", pathSegs[i]);
                styleOptions && this._renderSegKeyPoints(pathSegs[i], pointCtx, styleOptions);
            }
        },
        _renderSegLines: function(pathSeg, ctx, styleOptions) {
            this._drawSegLines(ctx, pathSeg.segs, styleOptions);
        },
        _renderSegKeyPoints: function(pathSeg, ctx, styleOptions) {
            this._drawSegKeyPoints(ctx, pathSeg.segs, styleOptions);
            this._drawSegStartEndPoints(ctx, pathSeg.segs, this._getPathSegStyle("startPointStyle", pathSeg), this._getPathSegStyle("endPointStyle", pathSeg));
        },
        _linePath: function(ctx, points, styleOptions, pixelRatio) {
            if (!(points.length < 2)) {
                ctx.moveTo(points[0].x * pixelRatio, points[0].y * pixelRatio);
                for (var i = 1, len = points.length; i < len; i++) ctx.lineTo(points[i].x * pixelRatio, points[i].y * pixelRatio);
            }
        },
        _drawSegLines: function(ctx, segs, styleOptions) {
            for (var pathList = [], i = 0, len = segs.length; i < len; i++) pathList.push(segs[i].pathPoints);
            this.drawPathLines(ctx, pathList, styleOptions);
        },
        _fillAndStroke: function(ctx, styleOptions) {
            if (styleOptions) {
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
            }
        },
        _drawLineArrows: function(ctx, pathList, styleOptions) {
            if (styleOptions) {
                ctx.save();
                ctx.beginPath();
                for (var lineMethod = this.getLineMethodByContent(styleOptions.content), i = 0, len = pathList.length; i < len; i++) this._lineArrowheads(ctx, styleOptions, pathList[i], lineMethod, this._currentPixelRatio);
                this._fillAndStroke(ctx, styleOptions);
                ctx.restore();
            }
        },
        _lineArrowheads: function(ctx, styleOptions, points, lineMethod, pixelRatio) {
            var pathCursor = this._pathCursor;
            pathCursor.setPath(points);
            var count = 0, stepSpace = styleOptions.stepSpace;
            stepSpace || (stepSpace = 6 * styleOptions.width);
            stepSpace = Math.max(1, stepSpace);
            if (!isNaN(stepSpace)) {
                stepSpace = Math.round(stepSpace);
                for (;pathCursor.stepCursorByDistance(stepSpace) && !pathCursor.isCursorAtPathEnd(); ) {
                    count++;
                    if (count > 5e3) {
                        console.error("PathCursor of lineArrow step with " + stepSpace + ", too many dirArrows?");
                        break;
                    }
                    var pos = pathCursor.getPointItemAtCursorDot();
                    pos && this._lineRotate(ctx, pos, pathCursor.getCursorAngleRadians(), styleOptions, pixelRatio, lineMethod);
                }
            }
        },
        _lineRotate: function(ctx, point, radians, styleOptions, pixelRatio, lineMethod) {
            var x = point.x * pixelRatio, y = point.y * pixelRatio;
            ctx.translate(x, y);
            ctx.rotate(radians);
            var lineWidth = styleOptions.lineWidth || 2, w = styleOptions.width * pixelRatio - lineWidth * pixelRatio, h = (styleOptions.height || styleOptions.width) * pixelRatio - lineWidth * pixelRatio;
            lineMethod.call(this, ctx, -w / 2, -h / 2, w, h);
            ctx.rotate(-radians);
            ctx.translate(-x, -y);
        },
        _linePoints: function(ctx, list, styleOptions, pixelRatio) {
            if (styleOptions) for (var radius = styleOptions.radius, i = 0, len = list.length; i < len; i++) {
                var x = list[i].x, y = list[i].y;
                ctx.moveTo(x * pixelRatio + radius * pixelRatio, y * pixelRatio);
                ctx.arc(x * pixelRatio, y * pixelRatio, radius * pixelRatio, 0, 2 * Math.PI);
            }
        },
        _drawSegKeyPoints: function(ctx, segs, styleOptions) {
            for (var points = [], i = 0, len = segs.length; i < len; i++) points.push.apply(points, segs[i].keyPoints);
            this.drawKeyPoints(ctx, points, styleOptions);
        },
        _drawSegStartEndPoints: function(ctx, segs, startPointStyleOptions, endPointStyleOptions) {
            for (var startPoint = null, endPoint = null, i = 0, len = segs.length; i < len; i++) {
                segs[i].pathStartPoint && (startPoint = segs[i].pathStartPoint);
                segs[i].pathEndPoint && (endPoint = segs[i].pathEndPoint);
            }
            startPoint && startPointStyleOptions && this.drawKeyPoints(ctx, [ startPoint ], startPointStyleOptions);
            endPoint && endPointStyleOptions && this.drawKeyPoints(ctx, [ endPoint ], endPointStyleOptions);
        },
        _renderPassedSegs: function(ctx, pathSeg, range, styleOptions) {
            if (range) {
                var segs = pathSeg.getPathSegsByPointIdxRange(range.minIdx, range.maxIdx);
                if (!segs.length) {
                    var segItem = pathSeg.getEmptySegItemForRender();
                    segItem.pathPoints = [];
                    segs = [ segItem ];
                }
                range.startPoint && segs[0].pathPoints.unshift(range.startPoint);
                range.endPoint && segs[segs.length - 1].pathPoints.push(range.endPoint);
                this._drawSegLines(ctx, segs, styleOptions);
            }
        },
        renderPathNavigators: function(pathNavigators, viewBounds, scaleFactor) {
            if (this.isHidden() !== !0) {
                this._resetCanvas(this._getCanvas("naviLine"));
                this._resetCanvas(this._getCanvas("naviPoint"));
                for (var pointCtx = this._getCanvasCxt("naviPoint"), lineCtx = this._getCanvasCxt("naviLine"), i = 0, len = pathNavigators.length; i < len; i++) {
                    var navigr = pathNavigators[i], pathSeg = this._getPathSegByPathIndex(navigr.getPathIndex());
                    if (pathSeg) {
                        var styleOptions = utils.nestExtendObjs({}, [ this._getPathSegStyle("pathNavigatorStyle", pathSeg), navigr.getStyleOptions() ]);
                        if (styleOptions.pathLinePassedStyle) {
                            var range = navigr.getPassedPathRange();
                            if (range) {
                                range.startPoint = PointForRender.translate(range.startPoint, viewBounds, scaleFactor);
                                range.endPoint = PointForRender.translate(range.endPoint, viewBounds, scaleFactor);
                                this._renderPassedSegs(lineCtx, pathSeg, range, utils.extendObjs({}, [ this._getPathSegStyle(this._isPathSegSelected(pathSeg) ? "pathLineSelectedStyle" : "pathLineStyle", pathSeg), styleOptions.pathLinePassedStyle ]));
                            }
                        }
                        var point = navigr.getPointItemAtCursorDot();
                        if (point && viewBounds.containPoint(point)) {
                            point = PointForRender.translate(point, viewBounds, scaleFactor);
                            this.drawNavigator(pointCtx, point, styleOptions.initRotateDegree * degree2Radian + (styleOptions.autoRotate ? navigr.getCursorAngleRadians() : 0), styleOptions);
                        }
                    }
                }
            }
        },
        drawPathLines: function(ctx, pathList, styleOptions) {
            ctx.save();
            ctx.beginPath();
            for (var i = 0, len = pathList.length; i < len; i++) this._linePath(ctx, pathList[i], styleOptions, this._currentPixelRatio);
            this._fillAndStroke(ctx, styleOptions);
            ctx.restore();
            if (styleOptions.dirArrowStyle) {
                var dirArrowStyle = utils.extendObjs({}, [ this._opts.dirArrowStyle, styleOptions.dirArrowStyle ]);
                dirArrowStyle.width || (dirArrowStyle.width = styleOptions.lineWidth);
                dirArrowStyle.width >= 4 && this._drawLineArrows(ctx, pathList, dirArrowStyle);
            }
        },
        drawKeyPoints: function(ctx, points, styleOptions) {
            if (points.length) {
                ctx.save();
                ctx.beginPath();
                this._linePoints(ctx, points, styleOptions, this._currentPixelRatio);
                this._fillAndStroke(ctx, styleOptions);
                ctx.restore();
            }
        },
        drawNavigator: function(ctx, point, radians, styleOptions) {
            ctx.save();
            var lineMethod = this.getLineMethodByContent(styleOptions.content);
            ctx.beginPath();
            this._lineRotate(ctx, point, radians, styleOptions, this._currentPixelRatio, lineMethod);
            this._fillAndStroke(ctx, styleOptions);
            ctx.restore();
        },
        setOption: function(k, v) {
            utils.isObject(defaultNestedOpts[k]) && utils.isObject(v) && (v = utils.nestExtendObjs({}, [ defaultNestedOpts[k], v ]));
            CanvasRender.__super__.setOption.call(this, k, v);
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
                this.setHoverDataItem(null);
                this._hideOverlayContainer();
                return !0;
            }
        }
    });
    return CanvasRender;
});

AMapUI.weakDefine("ui/misc/PathSimplifier/lib/reqAnim", [], function() {
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

AMapUI.weakDefine("ui/misc/PathSimplifier/lib/AnimMgr", [ "lib/utils", "lib/event", "./reqAnim" ], function(utils, EventCls, reqAnim) {
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
                for (var args = Array.prototype.slice.call(arguments, 0), list = [].concat(animList); i < len; i++) list[i].callback.apply(null, args) !== !1 && animCount++;
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
        clear: function() {
            this.animList.length = 0;
            if (this.animReqId) {
                cancelAnimationFrame(this.animReqId);
                this.animReqId = null;
            }
        },
        addToAnimList: function(callback, priority) {
            var item = {
                id: this.baseId++,
                priority: priority ? priority : 0,
                callback: callback
            }, animList = this.animList;
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

AMapUI.weakDefine("ui/misc/PathSimplifier/lib/PathNavigator", [ "lib/utils", "./PathCursor" ], function(utils, PathCursor) {
    function PathNavigator(pathRecord, animMgr, opts, owner) {
        this.pathRecord = pathRecord;
        PathNavigator.__super__.constructor.call(this, pathRecord.points);
        this._animMgr = animMgr;
        this._opts = utils.extend({
            loop: !1,
            animInterval: 16,
            speed: 1e3,
            dirToPosInMillsecs: 200,
            priority: 10
        }, opts);
        this._opts.range && this.setRange.apply(this, this._opts.range);
        this._owner = owner;
        this._naviStatus = "stop";
        this._accumedTimespan = 0;
        this._lastAnimTime = 0;
        this._animStep = utils.bind(this._animStep, this);
    }
    utils.inherit(PathNavigator, PathCursor);
    utils.extend(PathNavigator.prototype, {
        _animStep: function(time) {
            if (this._lastAnimTime) {
                var timespan = time - this._lastAnimTime;
                this._lastAnimTime = time;
                this._accumedTimespan += timespan;
                if (this._accumedTimespan < this._opts.animInterval) return !1;
            } else this._lastAnimTime = time;
            this._clearAccumTimespan();
            return !0;
        },
        getNaviStatus: function() {
            return this._naviStatus;
        },
        getPathIndex: function() {
            return this.pathRecord.pathIndex;
        },
        getStyleOptions: function() {
            return this._opts.pathNavigatorStyle;
        },
        getOption: function(k) {
            return this._opts[k];
        },
        setOption: function(k, v) {
            this._opts[k] = v;
        },
        setOptions: function(opts) {
            for (var k in opts) opts.hasOwnProperty(k) && this.setOption(k, opts[k]);
        },
        getPosition: function() {
            var pos = this.getPointItemAtCursorDot();
            return pos ? this._opts.pixelToLngLat(pos.x, pos.y) : null;
        },
        destroy: function() {
            this.stop();
            PathNavigator.__super__.destroy.apply(this, arguments);
        },
        getSpeed: function() {
            return this._opts.speed;
        },
        _triggerStatAction: function(stat) {
            this.trigger(stat, this.getDataItemAtCursor());
        },
        start: function(idx, speed) {
            idx = idx || this.idxRange[0];
            var roundIdx = Math.floor(idx), tail = Math.abs(idx - roundIdx);
            idx = roundIdx;
            this.resetMovedDistance();
            this.setCursor(idx, tail);
            this._startPosDot = this.cursor.clone();
            speed > 0 && this.setSpeed(speed);
            this._startAnim();
            this._naviStatus = "moving";
            this._triggerStatAction("start");
        },
        stop: function() {
            this._stopAnim();
            this._startPosDot = this.cursor.clone();
            this._naviStatus = "stop";
            this._triggerStatAction("stop");
            this.resetMovedDistance();
        },
        pause: function() {
            this._stopAnim();
            this._naviStatus = "pause";
            this._triggerStatAction("pause");
        },
        resume: function() {
            this._startAnim();
            this._naviStatus = "moving";
            this._triggerStatAction("resume");
        },
        getPassedPathRange: function() {
            if (!this._startPosDot || !this.cursor) return null;
            var startIdx = this._startPosDot.idx, startTail = this._startPosDot.tail, currIdx = this.cursor.idx, currTail = this.cursor.tail, start = null, range = null, end = null;
            if (startTail > 0) {
                start = this.getPointItemAt(startIdx, startTail);
                startIdx++;
            }
            range = [ this.getPointItemAt(startIdx), this.getPointItemAt(currIdx) ];
            currTail > 0 && (end = this.getPointItemAt(currIdx, currTail));
            return {
                startPoint: start,
                minIdx: range[0].idx,
                maxIdx: range[1].idx,
                endPoint: end
            };
        },
        setSpeed: function(speed) {
            this._opts.speed = speed;
        },
        _calcDistanceOfTimespan: function(timeSpan) {
            return this._opts.speed * timeSpan / 3600;
        },
        getCursorAngleRadians: function() {
            return PathNavigator.__super__.getCursorAngleRadians.call(this, this._calcDistanceOfTimespan(this._opts.dirToPosInMillsecs));
        },
        getDistanceOfSegment: function(i) {
            return this.pathRecord.getDistanceOfLngLatSegment(i);
        },
        _clearAccumTimespan: function() {
            if (!this._accumedTimespan) return !1;
            var timespan = this._accumedTimespan;
            this._accumedTimespan = 0;
            var result = this._stepByTimespan(timespan);
            return result;
        },
        _stepByTimespan: function(timeSpan) {
            var result = this.moveByDistance(this._calcDistanceOfTimespan(timeSpan));
            this.isCursorAtPathEnd() && (this._opts.loop ? this.start() : this.pause());
            return result;
        },
        getDataItemAtCursor: function() {
            var idx = this.cursor.idx, tail = this.cursor.tail;
            return {
                dataItem: this._owner._packPointItem(idx),
                nextDataItem: idx < this.getPathEndIdx() ? this._owner._packPointItem(idx + 1) : null,
                tail: tail
            };
        },
        moveByDistance: function(distance) {
            var result = this.stepCursorByDistance(distance);
            result && this.listenerLength("move") && this._triggerStatAction("move");
            return result;
        },
        moveToPoint: function(idx, tail) {
            var result = this.moveCursorTo(idx, tail);
            result && this.listenerLength("move") && this._triggerStatAction("move");
            return result;
        },
        isMoving: function() {
            return !(!this.cursor || !this._animId);
        },
        _stopAnim: function() {
            if (this._animId) {
                this._animMgr.removeFromAnimList(this._animId);
                this._animId = null;
                this._clearAccumTimespan();
                this._lastAnimTime = 0;
            }
            this._animMgr.triggerAnimActionLater(50);
        },
        _startAnim: function() {
            !this._animId && this.path && (this._animId = this._animMgr.addToAnimList(this._animStep, this._opts.priority));
        }
    });
    return PathNavigator;
});

AMapUI.weakDefine("ui/misc/PathSimplifier/lib/PathDataRecord", [ "lib/utils", "./BoundsItem", "./PointItem", "lib/SphericalMercator" ], function(utils, BoundsItem, PointItem, SphericalMercator) {
    function PathDataRecord(pathIndex, startIdx) {
        this.pathIndex = pathIndex;
        this.startIdx = startIdx;
        this.zIndex = 100;
        this.lngLatDists = [];
    }
    utils.extend(PathDataRecord.prototype, {
        setZIndex: function(z) {
            this.zIndex = z;
        },
        getDistanceOfLngLatSegment: function(i) {
            var distCache = this.lngLatDists;
            if (distCache[i] >= 0) return distCache[i];
            var l1 = this.lnglats[i], l2 = this.lnglats[i + 1];
            if (!l1 || !l2) return 0;
            l1.getLng && (l1 = [ l1.getLng(), l1.getLat() ]);
            l2.getLng && (l2 = [ l2.getLng(), l2.getLat() ]);
            distCache[i] = SphericalMercator.haversineDistance(l1, l2);
            return distCache[i];
        },
        buildPath: function(path, lngLatToPixel, opts) {
            for (var points = [], bounds = BoundsItem.getBoundsItemToExpand(), i = 0, len = path.length; i < len; i++) {
                var lnglat = path[i], px = lngLatToPixel(lnglat), item = new PointItem(px[0], px[1], i + this.startIdx);
                points[i] = item;
                bounds.expandByPoint(px[0], px[1]);
            }
            this.length = points.length;
            this.points = points;
            this.lnglats = path;
            this.bounds = bounds;
            this.boundsGroup = this._buildBoundsGroup(points, bounds, opts);
        },
        _buildBoundsGroup: function(points, wholeBounds, opts) {
            var totalLen = points.length, maxSize = opts.maxLengthOfBoundsGroup, minPointsNum = opts.minPointsNumOfBoundsGroup;
            if (wholeBounds.width < maxSize && wholeBounds.height < maxSize) return [ [ 0, totalLen - 1, wholeBounds ] ];
            for (var groups = [], startIdx = 0, tmpBounds = BoundsItem.getBoundsItemToExpand(), i = 0; i < totalLen; i++) {
                tmpBounds.expandByPoint(points[i].x, points[i].y);
                if (i - startIdx + 1 >= minPointsNum && (tmpBounds.width > maxSize || tmpBounds.height > maxSize)) {
                    for (;i < totalLen - 1 && BoundsItem.boundsContainPoint(tmpBounds, points[i + 1]); ) i++;
                    groups.push([ startIdx, i, tmpBounds ]);
                    startIdx = i;
                    tmpBounds = BoundsItem.getBoundsItemToExpand();
                    tmpBounds.expandByPoint(points[i].x, points[i].y);
                }
            }
            startIdx < totalLen - 1 && groups.push([ startIdx, totalLen - 1, tmpBounds ]);
            return groups;
        }
    });
    return PathDataRecord;
});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/misc/PathSimplifier/assets/canvas", [], function() {});

AMapUI.weakDefine("ui/misc/PathSimplifier/main", [ "lib/utils", "lib/dom.utils", "lib/event", "lib/SphericalMercator", "./lib/kdbush/kdbush", "./lib/BoundsItem", "./lib/PointItem", "./render/base", "./render/canvas", "./lib/AnimMgr", "./lib/PathNavigator", "./lib/PathDataRecord", "css!./assets/canvas" ], function(utils, domUtils, EventCls, SphericalMercator, KDBush, BoundsItem, PointItem, BaseRender, CanvasRender, AnimMgr, PathNavigator, PathDataRecord) {
    function PathSimplifier(opts) {
        this._opts = utils.extend({
            zIndex: 200,
            zooms: [ 3, 20 ],
            getPath: function(pathData, idx) {
                throw new Error("getPath has not been implemented!");
            },
            getZIndex: function(pathData, idx) {
                return 100;
            },
            getHoverTitle: function(pathData, idx, pointIndex) {
                return pointIndex >= 0 ? "Path: " + idx + ", Point:" + pointIndex : "Path: " + idx;
            },
            clickToSelectPath: !0,
            onTopWhenSelected: !0,
            autoSetFitView: !0,
            maxLengthOfBoundsGroup: 16384,
            minPointsNumOfBoundsGroup: 100,
            renderConstructor: CanvasRender,
            renderOptions: null
        }, opts);
        PathSimplifier.__super__.constructor.call(this, this._opts);
        this._maxZoom = this.getMaxZoom();
        this._selectedPathIndex = -1;
        this._animMgr = new AnimMgr();
        this._pathNavgators = [];
        this._opts.clickToSelectPath && this.on("pathClick pointClick", this._handleClickToSelect);
        var RenderConstructor = this._opts.renderConstructor;
        this.renderEngine = new RenderConstructor(this, this._opts.renderOptions);
        var self = this;
        this._animMgr.on("didAnim", function(count) {
            count > 0 && self.renderEngine.refreshPathNavigators();
        });
        this._pixelToLngLat = function(x, y) {
            var lngLat = SphericalMercator.pointToLngLat([ x, y ], self._maxZoom);
            return new AMap.LngLat(lngLat[0], lngLat[1]);
        };
        this._lngLatToPixel = utils.bind(this.getPixelOfMaxZoom, this);
        this._opts.data && this.setData(this._opts.data);
    }
    utils.inherit(PathSimplifier, EventCls);
    utils.extend(PathSimplifier, {
        supportCanvas: domUtils.isCanvasSupported(),
        Render: {
            Base: BaseRender,
            Canvas: CanvasRender
        },
        getGeodesicPoints: function(start, end, pointsNum) {
            2 === start.length && (start = new AMap.LngLat(start[0], start[1]));
            2 === end.length && (end = new AMap.LngLat(end[0], end[1]));
            pointsNum = pointsNum || 30;
            var segments = pointsNum + 1 || Math.round(Math.abs(start.lng - end.lng));
            if (!segments || Math.abs(start.lng - end.lng) < .001) return [];
            var n, f, A, B, x, y, z, lat, lon, itpLngLats = [], PI = Math.PI, d2r = PI / 180, r2d = 180 / PI, asin = Math.asin, sqrt = Math.sqrt, sin = Math.sin, pow = Math.pow, cos = Math.cos, atan2 = Math.atan2, lat1 = start.lat * d2r, lon1 = start.lng * d2r, lat2 = end.lat * d2r, lon2 = end.lng * d2r, d = 2 * asin(sqrt(pow(sin((lat1 - lat2) / 2), 2) + cos(lat1) * cos(lat2) * pow(sin((lon1 - lon2) / 2), 2)));
            for (n = 1; n < segments; n += 1) {
                f = 1 / segments * n;
                A = sin((1 - f) * d) / sin(d);
                B = sin(f * d) / sin(d);
                x = A * cos(lat1) * cos(lon1) + B * cos(lat2) * cos(lon2);
                y = A * cos(lat1) * sin(lon1) + B * cos(lat2) * sin(lon2);
                z = A * sin(lat1) + B * sin(lat2);
                lat = atan2(z, sqrt(pow(x, 2) + pow(y, 2)));
                lon = atan2(y, x);
                itpLngLats.push(new AMap.LngLat(lon * r2d, lat * r2d));
            }
            return itpLngLats;
        },
        getGeodesicPath: function(start, end, pointsNum) {
            2 === start.length && (start = new AMap.LngLat(start[0], start[1]));
            2 === end.length && (end = new AMap.LngLat(end[0], end[1]));
            var points = [ start ];
            points.push.apply(points, PathSimplifier.getGeodesicPoints(start, end, pointsNum));
            points.push(end);
            return points;
        }
    });
    utils.extend(PathSimplifier.prototype, {
        getRender: function() {
            return this.renderEngine;
        },
        getRenderOption: function(k) {
            return this.renderEngine.getOption(k);
        },
        getRenderOptions: function() {
            return this.renderEngine.getOptions();
        },
        _packPointItem: function(idx) {
            for (var list = this._data.list, i = 0, len = list.length; i < len; i++) if (idx >= list[i].startIdx && idx < list[i].startIdx + list[i].length) {
                var pointIndex = idx - list[i].startIdx;
                return {
                    type: "point",
                    pointIndex: pointIndex,
                    pathIndex: list[i].pathIndex,
                    pathData: this._data.source[list[i].pathIndex]
                };
            }
            return null;
        },
        _packPathItem: function(idx) {
            return {
                type: "path",
                pathIndex: idx,
                pathData: this._data.source[idx]
            };
        },
        _handleClickToSelect: function(e, data) {
            var pathIndex = data.pathIndex;
            this.setSelectedPathIndex(pathIndex);
        },
        getMaxZIndex: function() {
            for (var list = this._data.list, maxZIndex = 0, i = 0, len = list.length; i < len; i++) list[i].zIndex > maxZIndex && (maxZIndex = list[i].zIndex);
            return maxZIndex;
        },
        toggleTopOfPath: function(pathIndex, isTop) {
            var zIndex;
            if (isTop) zIndex = this.getMaxZIndex() + 1; else {
                var zIndexGetter = this._opts.getZIndex;
                zIndex = zIndexGetter.call(this, this.getPathData(pathIndex), pathIndex);
            }
            this.setZIndexOfPath(pathIndex, zIndex);
        },
        getZIndexOfPath: function(pathIndex) {
            var pathInfo = this._getPathRecordByIndex(pathIndex);
            return pathInfo.zIndex;
        },
        setZIndexOfPath: function(pathIndex, zIndex) {
            var pathInfo = this._getPathRecordByIndex(pathIndex);
            pathInfo.setZIndex(zIndex);
            this.renderLater();
        },
        setSelectedPathIndex: function(pathIndex) {
            pathIndex = parseInt(pathIndex, 0);
            pathIndex < 0 && (pathIndex = -1);
            if (this._selectedPathIndex !== pathIndex) {
                var oldPathIndex = this._selectedPathIndex;
                this._selectedPathIndex = pathIndex;
                if (this._opts.onTopWhenSelected) {
                    oldPathIndex >= 0 && this.toggleTopOfPath(oldPathIndex, !1);
                    pathIndex >= 0 && this.toggleTopOfPath(pathIndex, !0);
                }
                this.renderLater();
                this.trigger("selectedPathIndexChanged", {
                    oldIndex: oldPathIndex,
                    newIndex: pathIndex
                });
            }
        },
        getSelectedPathIndex: function() {
            return this._selectedPathIndex;
        },
        isSelectedPathIndex: function(pathIndex) {
            return pathIndex >= 0 && pathIndex === this.getSelectedPathIndex();
        },
        getSelectedPathData: function() {
            var idx = this._selectedPathIndex;
            return idx < 0 ? null : this.getPathData(idx);
        },
        getPathData: function(idx) {
            var item = this._packPathItem(idx);
            return item ? item.pathData : null;
        },
        renderLater: function() {
            this.renderEngine.renderLater.apply(this.renderEngine, arguments);
        },
        render: function() {
            this.renderEngine.render.apply(this.renderEngine, arguments);
        },
        getPixelOfMaxZoom: function(lngLat) {
            lngLat.getLng && (lngLat = [ lngLat.getLng(), lngLat.getLat() ]);
            var maxZoom = this.getMaxZoom(), pMx = SphericalMercator.lngLatToPoint(lngLat, maxZoom);
            return [ Math.round(pMx[0]), Math.round(pMx[1]) ];
        },
        _buildPath: function(path, pathIndex, startPointIdx) {
            var record = new PathDataRecord(pathIndex, startPointIdx);
            record.buildPath(path, this._lngLatToPixel, this._opts);
            return record;
        },
        _buildDataItems: function(data) {
            for (var opts = this._opts, pathGetter = opts.getPath, zIndexGetter = opts.getZIndex, list = this._data.list, bounds = this._data.bounds, startPointIdx = 0, idx = 0, len = data.length; idx < len; idx++) {
                var pathData = data[idx], path = pathGetter.call(this, pathData, idx);
                if (path && path.length) {
                    var pathInfo = this._buildPath(path, idx, startPointIdx);
                    pathInfo.setZIndex(zIndexGetter.call(this, pathData, idx));
                    startPointIdx += pathInfo.length;
                    list[idx] = pathInfo;
                    var pathBounds = pathInfo.bounds;
                    bounds.expandByBounds(pathBounds);
                }
            }
        },
        _buildData: function(data) {
            this._clearData();
            this.trigger("willBuildData", data);
            var dataStore = this._data;
            dataStore.source = data;
            this._buildDataItems(data);
            this._buildKDTree();
            dataStore.kdTree = this._kdTree;
            dataStore.pathNum = dataStore.list.length;
            var lastPath = dataStore.list[dataStore.list.length - 1];
            dataStore.pointNum = lastPath ? lastPath.startIdx + lastPath.length : 0;
            this.trigger("didBuildData", data);
        },
        _getPathRecordByIndex: function(pathIndex) {
            pathIndex = parseInt(pathIndex, 0);
            var dataList = this._data.list;
            if (pathIndex < 0 || pathIndex > dataList.length - 1) throw new Error("pathIndex " + pathIndex + " out of range, it should between 0 and " + (dataList.length - 1));
            return dataList[pathIndex];
        },
        getMaxPathIndex: function() {
            return this._data.list.length - 1;
        },
        createPathNavigator: function(pathIndex, navgOpts) {
            var pathRecord = this._getPathRecordByIndex(pathIndex);
            if (!pathRecord) return null;
            var pathNavigator = new PathNavigator(pathRecord, this._animMgr, utils.extend({}, navgOpts, {
                pixelToLngLat: this._pixelToLngLat
            }), this);
            this._pathNavgators.push(pathNavigator);
            var self = this;
            pathNavigator.onDestroy(function() {
                self._removePathNavigator(this);
            });
            return pathNavigator;
        },
        _removePathNavigator: function(navg) {
            utils.removeFromArray(this._pathNavgators, navg);
        },
        clearPathNavigators: function() {
            for (var navigs = [].concat(this._pathNavgators), i = 0, len = navigs.length; i < len; i++) navigs[i].destroy();
            0 !== this._pathNavgators.length && console.warn("clearPathNavigators failed!!!");
            this._pathNavgators.length = 0;
        },
        getPathNavigators: function() {
            return this._pathNavgators;
        },
        _clearData: function() {
            this.trigger("willClearData");
            this._data ? this._data.list.length = 0 : this._data = {
                list: []
            };
            this._data.source = null;
            this._data.bounds = BoundsItem.getBoundsItemToExpand();
            this._data.kdTree = null;
            this._animMgr.clear();
            this.clearPathNavigators();
            this.trigger("didClearData");
        },
        _buildKDTree: function() {
            if (this._kdTree) {
                this._kdTree.destroy();
                this._kdTree = null;
            }
            this.trigger("willBuildKDTree");
            for (var pathItems = this._data.list, points = [], i = 0, len = pathItems.length; i < len; i++) points.push.apply(points, pathItems[i].points);
            var KDTree = new KDBush(points);
            this._kdTree = KDTree;
            this.trigger("didBuildKDTree", KDTree);
        },
        setData: function(data) {
            data || (data = []);
            this._buildData(data);
            this.renderLater(10);
            data.length && this._opts.autoSetFitView && this.setFitView(-1);
        },
        _setMapBounds: function(nodeBounds) {
            if (nodeBounds && !nodeBounds.isEmpty()) {
                var map = this.getMap(), mapBounds = new AMap.Bounds(this._pixelToLngLat(nodeBounds.x, nodeBounds.y + nodeBounds.height), this._pixelToLngLat(nodeBounds.x + nodeBounds.width, nodeBounds.y));
                map.setBounds(mapBounds, null, null, !0);
            }
        },
        setFitView: function(idx) {
            idx = parseInt(idx, 0);
            var bounds;
            isNaN(idx) || idx < 0 ? bounds = this._setMapBounds(this._data.bounds) : this._data.list && this._data.list[idx] && (bounds = this._data.list[idx].bounds);
            this._setMapBounds(bounds);
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
    return PathSimplifier;
});

AMapUI.weakDefine("ui/misc/PathSimplifier", [ "ui/misc/PathSimplifier/main" ], function(m) {
    return m;
});

!function(c) {
    var d = document, a = "appendChild", i = "styleSheet", s = d.createElement("style");
    s.type = "text/css";
    d.getElementsByTagName("head")[0][a](s);
    s[i] ? s[i].cssText = c : s[a](d.createTextNode(c));
}(".amap-ui-pathsimplifier-container{cursor:default;-webkit-backface-visibility:hidden;-webkit-transform:translateZ(0) scale(1,1)}.amap-ui-pathsimplifier-container canvas{position:absolute}.amap-ui-pathsimplifier-container .amap-ui-hide{display:none!important}.amap-ui-pathsimplifier-container .overlay-title{color:#555;background-color:#fffeef;border:1px solid #7e7e7e;padding:2px 6px;font-size:12px;white-space:nowrap;display:inline-block;position:absolute;border-radius:2px;z-index:99999}.amap-ui-pathsimplifier-container .overlay-title:after,.amap-ui-pathsimplifier-container .overlay-title:before{content:'';display:block;position:absolute;margin:auto;width:0;height:0;border:solid transparent;border-width:5px}.amap-ui-pathsimplifier-container .overlay-title.left{transform:translate(10px,-50%)}.amap-ui-pathsimplifier-container .overlay-title.left:before{top:5px}.amap-ui-pathsimplifier-container .overlay-title.left:after{left:-9px;top:5px;border-right-color:#fffeef}.amap-ui-pathsimplifier-container .overlay-title.left:before{left:-10px;border-right-color:#7e7e7e}.amap-ui-pathsimplifier-container .overlay-title.top{transform:translate(-50%,-130%)}.amap-ui-pathsimplifier-container .overlay-title.top:before{left:0;right:0}.amap-ui-pathsimplifier-container .overlay-title.top:after{bottom:-9px;left:0;right:0;border-top-color:#fffeef}.amap-ui-pathsimplifier-container .overlay-title.top:before{bottom:-10px;border-top-color:#7e7e7e}");