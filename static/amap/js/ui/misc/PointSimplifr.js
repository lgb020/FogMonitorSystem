AMapUI.weakDefine("ui/misc/PointSimplifr/lib/quickSelect", [], function() {
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

AMapUI.weakDefine("ui/misc/PointSimplifr/lib/BoundsItem", [ "lib/utils" ], function(utils) {
    function BoundsItem(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    utils.extend(BoundsItem, {
        boundsContain: function(b1, b2) {
            return b1.x <= b2.x && b1.x + b1.width >= b2.x + b2.width && b1.y <= b2.y && b1.y + b1.height >= b2.y + b2.height;
        },
        boundsIntersect: function(b1, b2) {
            return b1.x <= b2.x + b2.width && b2.x <= b1.x + b1.width && b1.y <= b2.y + b2.height && b2.y <= b1.y + b1.height;
        }
    });
    return BoundsItem;
});

AMapUI.weakDefine("ui/misc/PointSimplifr/lib/PointItem", [], function() {
    function PointItem(x, y, idx) {
        this.x = x;
        this.y = y;
        this.idx = idx;
    }
    return PointItem;
});

AMapUI.weakDefine("ui/misc/PointSimplifr/lib/QuadTree", [ "./quickSelect", "./BoundsItem", "./PointItem" ], function(quickselect, BoundsItem, PointItem) {
    function QuadTree(bounds, pointQuad, maxDepth, maxChildren) {
        var node;
        node = new Node(bounds, 0, maxDepth, maxChildren);
        this.root = node;
    }
    function Node(bounds, depth, maxDepth, maxChildren) {
        this._bounds = bounds;
        this.children = [];
        this.nodes = [];
        maxChildren && this._maxChildren !== maxChildren && (this._maxChildren = maxChildren);
        maxDepth && this._maxDepth !== maxDepth && (this._maxDepth = maxDepth);
        depth && (this._depth = depth);
    }
    var boundsContain = BoundsItem.boundsContain, boundsIntersect = BoundsItem.boundsIntersect;
    QuadTree.prototype.root = null;
    QuadTree.prototype.insert = function(item) {
        if (item instanceof Array) {
            var i, len = item.length;
            for (i = 0; i < len; i++) this.root.insert(item[i]);
        } else this.root.insert(item);
    };
    QuadTree.prototype.clear = function() {
        this.root.clear();
    };
    QuadTree.prototype.findContainerNode = function(item) {
        return this.root.findContainerNode(item);
    };
    QuadTree.prototype.retrieve = function(item) {
        var out = this.root.retrieve(item).slice(0);
        return out;
    };
    Node.prototype.nodes = null;
    Node.prototype._classConstructor = Node;
    Node.prototype.children = null;
    Node.prototype._bounds = null;
    Node.prototype._depth = 0;
    Node.prototype._maxChildren = 4;
    Node.prototype._maxDepth = 4;
    Node.TOP_LEFT = 0;
    Node.TOP_RIGHT = 1;
    Node.BOTTOM_LEFT = 2;
    Node.BOTTOM_RIGHT = 3;
    Node.prototype.getSubNodes = function() {
        return this.nodes;
    };
    Node.prototype.getChildren = function() {
        return this.children;
    };
    Node.prototype.isEmpty = function() {
        return 0 === this.nodes.length && 0 === this.children.length;
    };
    Node.prototype.getTopDescendants = function(n, compare) {
        var subNodes, i, len, node, descendants = [], stack = [ this ];
        do {
            node = stack.pop();
            subNodes = node.getSubNodes();
            if (subNodes.length) for (i = 0, len = subNodes.length; i < len; i++) stack.push(subNodes[i]); else {
                descendants.push.apply(descendants, node.getChildren());
                len = descendants.length;
                if (len > n) {
                    quickselect(descendants, n, 0, len - 1, compare);
                    descendants.length = n;
                }
            }
        } while (stack.length);
        return descendants;
    };
    Node.prototype.getDescendants = function() {
        var subNodes, i, len, node, descendants = [], stack = [ this ];
        do {
            node = stack.pop();
            subNodes = node.getSubNodes();
            if (subNodes.length) for (i = 0, len = subNodes.length; i < len; i++) stack.push(subNodes[i]); else descendants.push.apply(descendants, node.getChildren());
        } while (stack.length);
        return descendants;
    };
    Node.prototype.getDescendantsNum = function(noCache) {
        var count = this._dsdtNum;
        if (!noCache && count) return count;
        count = 0;
        var subNodes = this.getSubNodes();
        if (subNodes.length) for (var i = 0, len = subNodes.length; i < len; i++) count += subNodes[i].getDescendantsNum(noCache); else count = this.getChildren().length;
        this._dsdtNum = count;
        return count;
    };
    Node.prototype.getBounds = function() {
        return this._bounds;
    };
    Node.prototype.insert = function(item) {
        if (this.nodes.length) {
            var index = this._findIndex(item);
            this.nodes[index].insert(item);
        } else {
            this.children.push(item);
            var len = this.children.length;
            if (this._depth < this._maxDepth && len > this._maxChildren) {
                this.subdivide();
                var i;
                for (i = 0; i < len; i++) this.insert(this.children[i]);
                this.children.length = 0;
            }
        }
    };
    Node.prototype.retrieve = function(item) {
        if (this.nodes.length) {
            var index = this._findIndex(item);
            return this.nodes[index].retrieve(item);
        }
        return this.children;
    };
    Node.prototype._findIndex = function(item) {
        var b = this._bounds, left = !(item.x > b.x + b.width / 2), top = !(item.y > b.y + b.height / 2), index = Node.TOP_LEFT;
        left ? top || (index = Node.BOTTOM_LEFT) : index = top ? Node.TOP_RIGHT : Node.BOTTOM_RIGHT;
        return index;
    };
    Node.prototype.findContainerNode = function(item) {
        var b = this._bounds, sureContain = !1;
        if (this.nodes.length) {
            var halfW = b.width / 2, halfH = b.height / 2, next = -1;
            if (boundsContain(b, item)) {
                sureContain = !0;
                boundsContain({
                    x: b.x,
                    y: b.y,
                    width: halfW,
                    height: halfH
                }, item) ? next = Node.TOP_LEFT : boundsContain({
                    x: b.x + halfW,
                    y: b.y,
                    width: halfW,
                    height: halfH
                }, item) ? next = Node.TOP_RIGHT : boundsContain({
                    x: b.x,
                    y: b.y + halfH,
                    width: halfW,
                    height: halfH
                }, item) ? next = Node.BOTTOM_LEFT : boundsContain({
                    x: b.x + halfW,
                    y: b.y + halfH,
                    width: halfW,
                    height: halfH
                }, item) && (next = Node.BOTTOM_RIGHT);
            }
            if (next >= 0) return this.nodes[next].findContainerNode(item);
        }
        return sureContain || boundsIntersect(b, item) ? this : null;
    };
    Node.prototype.subdivide = function() {
        var depth = this._depth + 1, bx = this._bounds.x, by = this._bounds.y, b_w_h = this._bounds.width / 2, b_h_h = this._bounds.height / 2, bx_b_w_h = bx + b_w_h, by_b_h_h = by + b_h_h;
        this.nodes[Node.TOP_LEFT] = new this._classConstructor(new BoundsItem(bx, by, b_w_h, b_h_h), depth, this._maxDepth, this._maxChildren);
        this.nodes[Node.TOP_RIGHT] = new this._classConstructor(new BoundsItem(bx_b_w_h, by, b_w_h, b_h_h), depth, this._maxDepth, this._maxChildren);
        this.nodes[Node.BOTTOM_LEFT] = new this._classConstructor(new BoundsItem(bx, by_b_h_h, b_w_h, b_h_h), depth, this._maxDepth, this._maxChildren);
        this.nodes[Node.BOTTOM_RIGHT] = new this._classConstructor(new BoundsItem(bx_b_w_h, by_b_h_h, b_w_h, b_h_h), depth, this._maxDepth, this._maxChildren);
    };
    Node.prototype.clear = function() {
        this.children.length = 0;
        var i, len = this.nodes.length;
        for (i = 0; i < len; i++) this.nodes[i].clear();
        this.nodes.length = 0;
    };
    QuadTree.Node = Node;
    QuadTree.setMaxChildrenAndDepth = function(maxChildren, maxDepth) {
        Node.prototype._maxChildren = maxChildren;
        Node.prototype._maxDepth = maxDepth;
    };
    return QuadTree;
});

AMapUI.weakDefine("ui/misc/PointSimplifr/lib/AreaForRender", [], function() {
    function AreaForRender(bounds, descendantsNum, selectedNum) {
        this.bounds = bounds;
        this.descendantsNum = descendantsNum;
        this.selectedNum = selectedNum;
    }
    return AreaForRender;
});

AMapUI.weakDefine("ui/misc/PointSimplifr/lib/PointForRender", [ "lib/utils", "./PointItem" ], function(utils, PointItem) {
    function PointForRender() {
        PointForRender.__super__.constructor.apply(this, arguments);
    }
    utils.inherit(PointForRender, PointItem);
    return PointForRender;
});

AMapUI.weakDefine("ui/misc/PointSimplifr/lib/RBush", [ "./quickSelect" ], function(quickselect) {
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

AMapUI.weakDefine("ui/misc/PointSimplifr/lib/RBushItem", [], function() {
    function RBushItem(d, x1, y1, x2, y2) {
        this.d = d;
        this.minX = x1;
        this.minY = y1;
        this.maxX = x2;
        this.maxY = y2;
    }
    return RBushItem;
});

AMapUI.weakDefine("ui/misc/PointSimplifr/render/base", [ "lib/utils", "lib/event", "../lib/QuadTree", "../lib/BoundsItem", "../lib/PointItem", "../lib/AreaForRender", "../lib/PointForRender", "../lib/RBush", "../lib/RBushItem" ], function(utils, EventCls, QuadTree, BoundsItem, PointItem, AreaForRender, PointForRender, RBush, RBushItem) {
    function BaseRender(simpIns, opts) {
        this._opts = utils.extend({
            drawQuadTree: !1,
            eventSupport: !0,
            mouseEventNames: [ "click" ],
            mousemoveDebounceWait: 10,
            disableHardcoreWhenPointsNumBelow: -1,
            getAreaSizeForTopSelect: function(zoom, pointSize) {
                return Math.min(100, pointSize.width * pointSize.height * 1.5);
            },
            getNumForTopSelect: function(zoom, bounds, descendantsNum, pointSize) {
                var idealNum = bounds.width * bounds.height / (pointSize.width * pointSize.height);
                return Math.max(3, Math.ceil(1.5 * idealNum));
            }
        }, opts);
        BaseRender.__super__.constructor.call(this, this._opts);
        this._debouncedHandleMousemove = this._opts.mousemoveDebounceWait > 1 ? utils.debounce(this._handleMousemove, this._opts.mousemoveDebounceWait) : this._handleMousemove;
        this._rTreeForColliDetection = new RBush();
        this._rTreeForEleIndex = new RBush();
        this._itemCompare = function(a, b) {
            return a === b ? 0 : simpIns._compareWithDataIndex(a.idx, b.idx);
        };
        this._ins = simpIns;
        this._lastMousePos = {};
        this._isRendering = !1;
        this._opts.eventSupport && this._bindEvents(!0);
    }
    var boundsIntersect = BoundsItem.boundsIntersect, boundsContain = BoundsItem.boundsContain;
    utils.inherit(BaseRender, EventCls);
    utils.extend(BaseRender.prototype, {
        getPointSimplifrInstance: function() {
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
            var radius = 1, pos = e.pixel, items = this._rTreeForEleIndex.search(new RBushItem(null, pos.x - radius, pos.y - radius, pos.x + radius, pos.y + radius));
            items.length > 1 && items.sort(this._itemCompare);
            return items;
        },
        _handleMouseEvent: function(e) {
            var targets = this._getTargetsUndermouse(e);
            if (targets.length) {
                var pointItem = targets[0].d;
                this._triggerSelfAndInsEvent("point" + utils.ucfirst(e.type), e, this._ins._packDataItem(pointItem.idx));
            }
        },
        _handleMousemove: function(e) {
            var pos = e.pixel;
            if ("mousemove" === e.type) {
                if (this._lastMousePos.x === pos.x && this._lastMousePos.y === pos.y) return;
                this._lastMousePos.x = pos.x;
                this._lastMousePos.y = pos.y;
            }
            var targets = this._getTargetsUndermouse(e);
            if (targets.length) {
                var pointItem = targets[0].d;
                this.setHoverPointItem(pointItem, e);
            } else this.setHoverPointItem(null, e);
        },
        setHoverPointItem: function(pointItem, e) {
            var oldHoverItem = this._hoverPointItem;
            if (pointItem !== oldHoverItem) {
                oldHoverItem && this._triggerSelfAndInsEvent("pointMouseout", e, this._ins._packDataItem(oldHoverItem.idx));
                pointItem && this._triggerSelfAndInsEvent("pointMouseover", e, this._ins._packDataItem(pointItem.idx), pointItem);
                this._hoverPointItem = pointItem;
                this.triggerWithOriginalEvent("hoverPointItemChanged", e, pointItem, oldHoverItem);
            }
        },
        _triggerSelfAndInsEvent: function() {
            this.triggerWithOriginalEvent.apply(this, arguments);
            this._ins.triggerWithOriginalEvent.apply(this._ins, arguments);
        },
        getPointSize: function() {
            var pointStyleOptions = this._opts.pointStyle || {
                width: 8,
                height: 8
            }, pointSize = {
                width: pointStyleOptions.width,
                height: pointStyleOptions.height,
                areaSize: pointStyleOptions.width * pointStyleOptions.height
            };
            return pointSize;
        },
        getPointHardcoreSize: function() {
            var pointStyleOptions = utils.extend({}, this._opts.pointStyle, this._opts.pointHardcoreStyle), pointSize = {
                width: pointStyleOptions.width,
                height: pointStyleOptions.height,
                areaSize: pointStyleOptions.width * pointStyleOptions.height
            };
            return pointSize;
        },
        parseOffset: function(val, ref) {
            if (isNaN(val) && "%" === val[val.length - 1]) {
                val = parseFloat(val.substr(0, val.length - 1));
                isNaN(val) || (val = val / 100 * ref);
            }
            if (isNaN(val)) throw new Error("Parse offset failed: " + val);
            return parseFloat(val);
        },
        getOffset: function(styleOptions, pSize) {
            var offset = styleOptions ? styleOptions.offset : null;
            offset || (offset = [ "-50%", "-50%" ]);
            if (!pSize) {
                pSize = styleOptions;
                if (!pSize) return [ 0, 0 ];
            }
            return [ this.parseOffset(offset[0], pSize.width), this.parseOffset(offset[1], pSize.height) ];
        },
        getPointOffset: function(pSize) {
            return this.getOffset(this._opts.pointStyle, pSize);
        },
        getHardcoreOffset: function(pSize) {
            return this.getOffset(utils.extend({}, this._opts.pointStyle, this._opts.pointHardcoreStyle), pSize);
        },
        renderViewport: function() {
            var simpIns = this._ins;
            if (!simpIns._quadTree) return !1;
            var map = this._ins.getMap(), mapViewBounds = map.getBounds(), viewSize = map.getSize(), currZoom = map.getZoom(), maxZoom = simpIns.getMaxZoom(), scaleFactor = Math.pow(2, maxZoom - currZoom), topLeft = simpIns.getPixelOfMaxZoom(mapViewBounds.getNorthWest());
            this._currentZoom = currZoom;
            var bounds = new BoundsItem(topLeft[0], topLeft[1], viewSize.width * scaleFactor, viewSize.height * scaleFactor), conNode = simpIns._quadTree.findContainerNode(bounds);
            if (!conNode) return !1;
            this.trigger("willRenderViewport", conNode);
            this.renderQuadNode(conNode, bounds, !1, scaleFactor);
            this.trigger("didRenderViewport", conNode);
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
            this._currentPixelRatio = this.getPixelRatio();
            this._rTreeForColliDetection.clear();
            this._rTreeForEleIndex.clear();
            this.renderViewport();
            this._rTreeForColliDetection.clear();
            this._isRendering = !1;
        },
        _tryOccupyArea: function(data, eleArea, hardcoreArea) {
            var item;
            if (hardcoreArea && hardcoreArea[2] * hardcoreArea[3] > 0) {
                item = new RBushItem(data, hardcoreArea[0], hardcoreArea[1], hardcoreArea[0] + hardcoreArea[2], hardcoreArea[1] + hardcoreArea[3]);
                var items = this._rTreeForColliDetection.search(item);
                if (items.length) return !1;
                this._rTreeForColliDetection.insert(item);
            }
            if (this._opts.eventSupport) {
                item = new RBushItem(data, eleArea[0], eleArea[1], eleArea[0] + eleArea[2], eleArea[1] + eleArea[3]);
                this._rTreeForEleIndex.insert(item);
            }
            return !0;
        },
        getAreaBounds: function(nodeBounds, viewBounds, scaleFactor) {
            return new BoundsItem((nodeBounds.x - viewBounds.x) / scaleFactor, (nodeBounds.y - viewBounds.y) / scaleFactor, nodeBounds.width / scaleFactor, nodeBounds.height / scaleFactor);
        },
        renderQuadNode: function(rootNode, viewBounds, rootNodeSureInView, scaleFactor) {
            if (rootNode) {
                this._opts.drawQuadTree && this.drawQuadNode(rootNode, viewBounds, scaleFactor);
                var array, args, node, sureInView, i, len, nodeBounds, areaBounds, subNodes, topNodes, selectedNum, descendantsNum, isSmallArea, numForTopSelect, topNAreas = [ [], [] ], normalPoints = [ [], [] ], stack = [ [ rootNode, rootNodeSureInView ] ], pointSize = this.getPointSize(), minAreaSize = this._opts.getAreaSizeForTopSelect(this._currentZoom, pointSize), getNumForTopSelect = this._opts.getNumForTopSelect;
                do {
                    args = stack.pop();
                    node = args[0];
                    if (!node.isEmpty()) {
                        sureInView = args[1];
                        nodeBounds = node.getBounds();
                        if (!sureInView) {
                            if (!boundsIntersect(viewBounds, nodeBounds)) continue;
                            sureInView = boundsContain(viewBounds, nodeBounds);
                        }
                        areaBounds = this.getAreaBounds(nodeBounds, viewBounds, scaleFactor);
                        subNodes = node.getSubNodes();
                        descendantsNum = node.getDescendantsNum();
                        isSmallArea = areaBounds.width * areaBounds.height <= minAreaSize;
                        if (subNodes.length > 0 && !isSmallArea) for (i = 0, len = subNodes.length; i < len; i++) stack.push([ subNodes[i], sureInView ]); else {
                            numForTopSelect = isSmallArea ? getNumForTopSelect.call(null, this._currentZoom, areaBounds, descendantsNum, pointSize, {
                                node: node
                            }) : descendantsNum;
                            if (numForTopSelect > 0) {
                                numForTopSelect = Math.round(numForTopSelect);
                                topNodes = numForTopSelect >= descendantsNum ? node.getDescendants() : node.getTopDescendants(numForTopSelect, this._itemCompare);
                                selectedNum = topNodes.length;
                                array = normalPoints[sureInView ? 1 : 0];
                                array.push.apply(array, topNodes);
                                topNodes.length = 0;
                            } else selectedNum = 0;
                            if (selectedNum < descendantsNum) {
                                array = topNAreas[sureInView ? 1 : 0];
                                array.push(new AreaForRender(areaBounds, descendantsNum, selectedNum));
                            }
                        }
                    }
                } while (stack.length > 0);
                var handlers = [ {
                    list: topNAreas,
                    render: this._callTopNAreasRender
                }, {
                    list: normalPoints,
                    render: this._callNormalPointsRender
                } ];
                for (i = 0, len = handlers.length; i < len; i++) {
                    var item = handlers[i], render = item.render, list = item.list;
                    render.call(this, list[1], list[0], viewBounds, scaleFactor);
                    list[0].length = 0;
                    list[1].length = 0;
                    list.length = 0;
                }
            }
        },
        _callTopNAreasRender: function() {
            var args = Array.prototype.slice.call(arguments, 0);
            args.unshift("TopNAreas");
            this._renderAreas.apply(this, args);
        },
        _renderAreas: function(tag, sureInViewAreas, notSureInViewAreas) {
            var areas = sureInViewAreas;
            areas.push.apply(areas, notSureInViewAreas);
            notSureInViewAreas.length = 0;
            if (areas.length) {
                var renderFunc = this["render" + tag];
                this.trigger("willRender" + tag, areas);
                renderFunc.call(this, this._currentZoom, areas);
                this.trigger("didRender" + tag, areas);
                areas.length = 0;
            }
        },
        _callNormalPointsRender: function() {
            var args = Array.prototype.slice.call(arguments, 0);
            args.unshift("NormalPoints");
            this._renderPoints.apply(this, args);
        },
        _filterPointsForRender: function(list) {
            var pointSize = this.getPointSize(), width = pointSize.width, height = pointSize.height, pointOffset = this.getPointOffset(pointSize), pointHardcoreSize = this.getPointHardcoreSize(), hardcoreWidth = pointHardcoreSize.width, hardcoreHeight = pointHardcoreSize.height, pointHardcoreOffset = this.getHardcoreOffset(pointHardcoreSize), leftPoints = [], discardPoints = [];
            list.length < this._opts.disableHardcoreWhenPointsNumBelow && (hardcoreWidth = hardcoreHeight = 0);
            for (var i = 0, len = list.length; i < len; i++) {
                var x = list[i].x, y = list[i].y;
                this._tryOccupyArea(list[i], [ x + pointOffset[0], y + pointOffset[1], width, height ], [ x + pointHardcoreOffset[0], y + pointHardcoreOffset[1], hardcoreWidth, hardcoreHeight ]) === !0 ? leftPoints.push(list[i]) : discardPoints.push(list[i]);
            }
            this.trigger("discardPointsByHardcoreFilter", discardPoints);
            return {
                leftPoints: leftPoints,
                discardPoints: discardPoints
            };
        },
        _renderPoints: function(tag, sureInViewPoints, notSureInViewPoints, viewBounds, scaleFactor) {
            var i, len, p, pSize = this.getPointSize(), pWidth = pSize.width, pHeight = pSize.height, pHalfWidth = pWidth / 2, pHalfHeight = pHeight / 2, points = sureInViewPoints;
            for (i = 0, len = notSureInViewPoints.length; i < len; i++) {
                p = notSureInViewPoints[i];
                boundsIntersect(viewBounds, {
                    x: p.x - pHalfWidth,
                    y: p.y - pHalfHeight,
                    width: pWidth,
                    height: pHeight
                }) && points.push(p);
            }
            notSureInViewPoints.length = 0;
            if (points.length) {
                var renderFunc = this["render" + tag], itemsForRenderList = [];
                points.sort(this._itemCompare);
                for (i = 0, len = points.length; i < len; i++) {
                    p = points[i];
                    itemsForRenderList.push(new PointForRender((p.x - viewBounds.x) / scaleFactor, (p.y - viewBounds.y) / scaleFactor, p.idx));
                }
                points.length = 0;
                this.trigger("pointsNumBeforeHardcoreFilter", itemsForRenderList.length);
                var filterResult = this._filterPointsForRender(itemsForRenderList);
                itemsForRenderList.length = 0;
                var leftPoints = filterResult.leftPoints, discardPoints = filterResult.discardPoints;
                this.trigger("pointsNumAftlerHardcoreFilter", leftPoints.length);
                this.trigger("willRender" + tag, leftPoints, discardPoints);
                renderFunc.call(this, this._currentZoom, leftPoints, discardPoints);
                this.trigger("didRender" + tag, leftPoints, discardPoints);
                leftPoints.length = 0;
                discardPoints.length = 0;
            }
        },
        drawQuadNode: function() {
            throw new Error("drawQuadNode has not been implemented!");
        },
        renderTopNAreas: function() {
            throw new Error("renderTopNAreas has not been implemented!");
        },
        renderNormalPoints: function() {
            throw new Error("renderNormalPoints has not been implemented!");
        },
        getOption: function(k) {
            return this._opts[k];
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

AMapUI.weakDefine("ui/misc/PointSimplifr/lib/canvas.utils", [ "lib/utils" ], function(utils) {
    var canvasUtils = {
        lineBoundsAsCircle: function(ctx, x, y, width, height) {
            var radius = (width < height ? width : height) / 2, center = [ x + width / 2, y + height / 2 ];
            ctx.moveTo(center[0] + radius, center[1]);
            ctx.arc(center[0], center[1], radius, 0, 2 * Math.PI);
        },
        lineBoundsAsRect: function(ctx, x, y, width, height) {
            ctx.moveTo(x, y);
            ctx.lineTo(x + width, y);
            ctx.lineTo(x + width, y + height);
            ctx.lineTo(x, y + height);
            ctx.lineTo(x, y);
        },
        lineBoundsBottomRightAsRect: function(ctx, x, y, width, height) {
            ctx.moveTo(x + width, y);
            ctx.lineTo(x + width, y + height);
            ctx.lineTo(x, y + height);
        },
        lineBoundsTopLeftAsRect: function(ctx, x, y, width, height) {
            ctx.moveTo(x, y + height);
            ctx.lineTo(x, y);
            ctx.lineTo(x + width, y);
        }
    };
    return canvasUtils;
});

AMapUI.weakDefine("ui/misc/PointSimplifr/render/canvas", [ "lib/utils", "lib/dom.utils", "./base", "../lib/canvas.utils" ], function(utils, domUtils, BaseRender, canvasUtils) {
    function CanvasRender(simpIns, opts) {
        this._opts = utils.extend({
            drawPositionPoint: !1,
            drawShadowPoint: !1,
            styleKeysForCanvas: [ "globalAlpha", "lineWidth", "fillStyle", "strokeStyle", "lineJoin", "lineCap" ],
            getAreaScore: function(minScore, maxScore, bounds, descendantsNum, pointSize) {
                var ratio = descendantsNum * pointSize.areaSize / bounds.width / bounds.height;
                return Math.round(Math.log(ratio) / Log2Num);
            }
        }, defaultNestedOpts, opts);
        for (var k in defaultNestedOpts) defaultNestedOpts.hasOwnProperty(k) && this._opts[k] && (this._opts[k] = utils.extend({}, defaultNestedOpts[k], this._opts[k]));
        CanvasRender.__super__.constructor.call(this, simpIns, this._opts);
        var pointSize = this.getPointSize();
        this._opts.pointHardcoreStyle = utils.extend({
            width: pointSize.width - 1,
            height: pointSize.width - 1
        }, this._opts.pointHardcoreStyle);
        this.on("hoverPointItemChanged", this._handleHoverPointItemChanged);
        this._initContainter();
        this._loadDeps(this._setupCustomLayer);
    }
    var Log2Num = Math.log(2), lineMethodMap = {
        rect: canvasUtils.lineBoundsAsRect,
        circle: canvasUtils.lineBoundsAsCircle,
        none: function() {}
    }, defaultNestedOpts = {
        quadTreeStyle: {
            lineJoin: "miter",
            lineCap: "round",
            lineWidth: 1,
            fillStyle: "rgba(23, 145, 252, 0.1)",
            strokeStyle: "#FF33FF"
        },
        topNAreaStyle: {
            lineJoin: "miter",
            lineCap: "round",
            autoGlobalAlphaAlpha: [ .1, 1 ],
            content: "rect",
            fillStyle: "#e25c5d",
            lineWidth: 1,
            strokeStyle: null
        },
        pointStyle: {
            content: "circle",
            offset: [ "-50%", "-50%" ],
            lineJoin: "miter",
            lineCap: "round",
            width: 8,
            height: 8,
            fillStyle: "#1f77b4",
            lineWidth: 1,
            strokeStyle: null
        },
        pointHardcoreStyle: {
            lineJoin: "miter",
            lineCap: "round",
            fillStyle: null,
            strokeStyle: null
        },
        pointPositionStyle: {
            content: "circle",
            offset: [ "-50%", "-50%" ],
            lineJoin: "miter",
            lineCap: "round",
            width: 2,
            height: 2,
            lineWidth: 1,
            strokeStyle: null,
            fillStyle: "#cc0000"
        },
        pointHoverStyle: {
            content: "circle",
            offset: [ "-50%", "-50%" ],
            lineJoin: "miter",
            lineCap: "round",
            fillStyle: null,
            lineWidth: 2,
            strokeStyle: "#ffa500"
        },
        shadowPointStyle: {
            content: "circle",
            offset: [ "-50%", "-50%" ],
            fillStyle: "rgba(0,0,0,0.2)",
            lineWidth: 1,
            strokeStyle: null
        },
        hoverTitleStyle: {
            offset: [ 0, 0 ],
            position: "left"
        }
    };
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
    utils.inherit(CanvasRender, BaseRender);
    utils.extend(CanvasRender.prototype, {
        _initContainter: function() {
            var containter = document.createElement("div");
            this._containter = containter;
            this._baseCanvas = document.createElement("canvas");
            this._baseCanvas.className = "base-canvas";
            containter.appendChild(this._baseCanvas);
            var overlayContainter = document.createElement("div");
            overlayContainter.className = "overlay-container amap-ui-hide";
            this._overlayContainter = overlayContainter;
            this._overlayCanvas = document.createElement("canvas");
            this._overlayCanvas.className = "overlay-canvas";
            overlayContainter.appendChild(this._overlayCanvas);
            if (this._opts.hoverTitleStyle) {
                this._overlayTitle = document.createElement("div");
                this._overlayTitle.className = "overlay-title " + this._opts.hoverTitleStyle.position + " " + (this._opts.hoverTitleStyle.classNames || "");
                overlayContainter.appendChild(this._overlayTitle);
            }
            containter.appendChild(overlayContainter);
            this._baseCanvasCxt = this._baseCanvas.getContext("2d");
            this._overlayCanvasCxt = this._overlayCanvas.getContext("2d");
        },
        _setupCustomLayer: function() {
            var map = this._ins.getMap();
            map.setDefaultCursor("default");
            this.layer = new AMap.CustomLayer(this._containter, {
                zIndex: this._ins.getOption("zIndex"),
                zooms: [ 1, 20 ],
                map: map
            });
            domUtils.addClass(this._containter, "amap-ui-pointsimplifr-container");
            var self = this;
            this.layer.render = function() {
                self.render.call(self);
            };
        },
        _handleHoverPointItemChanged: function(e, pointItem) {
            if (pointItem) {
                this._drawHoverPoint(pointItem);
                this._updateOverlayTitle(pointItem);
                this._showOverlayContainer();
            } else this._hideOverlayContainer();
        },
        _updateOverlayTitle: function(pointItem) {
            var ele = this._overlayTitle, gotContent = !1;
            if (ele && this._ins._opts.getHoverTitle) {
                var title = this._ins._opts.getHoverTitle.call(this._ins, this._ins.getDataItemByIndex(pointItem.idx), pointItem.idx);
                if (title) {
                    ele.innerHTML = title;
                    gotContent = !0;
                    var offset = this.getOffset(this._opts.hoverTitleStyle, this.getPointSize());
                    ele.style.left = Math.round(pointItem.x + offset[0]) + "px";
                    ele.style.top = Math.round(pointItem.y + offset[1]) + "px";
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
        _drawHoverPoint: function(pointItem) {
            var canvas = this._overlayCanvas, gotContent = !1;
            if (canvas && this._opts.pointHoverStyle) {
                var pointSize = this.getPointSize(), styleOptions = utils.extend({}, this._opts.pointStyle, {
                    width: pointSize.width + 4,
                    height: pointSize.height + 4
                }, this._opts.pointHoverStyle), margin = 20, canvasWidth = styleOptions.width + margin, canvasHeight = styleOptions.height + margin, offset = this.getOffset(styleOptions, styleOptions), canvasLeft = Math.round(pointItem.x + offset[0]) - margin / 2, canvasTop = Math.round(pointItem.y + offset[1]) - margin / 2, ctx = this._overlayCanvasCxt;
                this._setCanvasSize(canvas, canvasWidth, canvasHeight);
                canvas.style.left = canvasLeft + "px";
                canvas.style.top = canvasTop + "px";
                var pixelRatio = this._currentPixelRatio;
                ctx.save();
                ctx.translate(-canvasLeft * pixelRatio, -canvasTop * pixelRatio);
                this._drawPoints(ctx, [ pointItem ], styleOptions);
                ctx.restore();
                gotContent = !0;
            }
            domUtils.toggleClass(canvas, "amap-ui-hide", !gotContent);
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
        onReady: function(fn) {
            var self = this;
            this._isReady ? setTimeout(function() {
                fn.call(self);
            }, 0) : this.once("ready", fn);
        },
        render: function() {
            if (!this._isReady) return !1;
            var map = this._ins.getMap(), size = map.getSize(), canvas = this._baseCanvas;
            this._setCanvasSize(canvas, size.width, size.height);
            this.setHoverPointItem(null);
            this._hideOverlayContainer();
            CanvasRender.__super__.render.apply(this, arguments);
        },
        drawQuadNode: function(node, viewBounds, scaleFactor) {
            var ctx = this._baseCanvasCxt;
            ctx.save();
            ctx.beginPath();
            var bounds = node.getBounds(), pixelRatio = this._currentPixelRatio;
            scaleFactor /= pixelRatio;
            canvasUtils.lineBoundsTopLeftAsRect(this._baseCanvasCxt, (bounds.x - viewBounds.x) / scaleFactor, (bounds.y - viewBounds.y) / scaleFactor, bounds.width / scaleFactor, bounds.height / scaleFactor);
            this._lineQuadNode(node, viewBounds, scaleFactor);
            var styleOptions = this._opts.quadTreeStyle;
            utils.extend(ctx, styleOptions);
            styleOptions.strokeStyle && ctx.stroke();
            if (styleOptions.fillStyle) {
                canvasUtils.lineBoundsAsRect(this._baseCanvasCxt, (bounds.x - viewBounds.x) / scaleFactor, (bounds.y - viewBounds.y) / scaleFactor, bounds.width / scaleFactor, bounds.height / scaleFactor);
                ctx.fill();
            }
            ctx.restore();
        },
        _lineQuadNode: function(node, viewBounds, scaleFactor) {
            var subNodes = node.getSubNodes();
            if (subNodes.length) for (var i = 0, len = subNodes.length; i < len; i++) this._lineQuadNode(subNodes[i], viewBounds, scaleFactor); else {
                var bounds = node.getBounds();
                canvasUtils.lineBoundsBottomRightAsRect(this._baseCanvasCxt, (bounds.x - viewBounds.x) / scaleFactor, (bounds.y - viewBounds.y) / scaleFactor, bounds.width / scaleFactor, bounds.height / scaleFactor);
            }
        },
        renderTopNAreas: function(zoom, list) {
            var ctx = this._baseCanvasCxt;
            ctx.save();
            if (this._opts.topNAreaStyle) {
                var i, len, groups = [], maxScore = 10, minScore = 1, pointSize = this.getPointSize();
                for (i = 0, len = list.length; i < len; i++) {
                    var item = list[i], score = this._opts.getAreaScore(minScore, maxScore, item.bounds, item.descendantsNum, pointSize);
                    score < minScore && (score = minScore);
                    score > maxScore && (score = maxScore);
                    groups[score] || (groups[score] = []);
                    groups[score].push(list[i]);
                }
                for (i = 0, len = groups.length; i < len; i++) if (groups[i]) {
                    var styleOptions = this._getTopNAreaStyleOptionsOfScore(i, maxScore);
                    this._drawAreas(ctx, groups[i], styleOptions);
                }
            }
            ctx.restore();
        },
        _getTopNAreaStyleOptionsOfScore: function(score, maxScore) {
            var styleOptions = this._opts.topNAreaStyle;
            if (utils.isArray(styleOptions)) {
                var idx = maxScore - score;
                idx >= styleOptions.length && (idx = styleOptions.length - 1);
                return styleOptions[idx];
            }
            var autoGlobalAlphaAlpha = styleOptions.autoGlobalAlphaAlpha;
            if (styleOptions.autoGlobalAlphaAlpha) {
                autoGlobalAlphaAlpha === !0 && (autoGlobalAlphaAlpha = [ .1, 1 ]);
                var min = autoGlobalAlphaAlpha[0], max = autoGlobalAlphaAlpha[1];
                styleOptions.globalAlpha = min + (max - min) * (score / maxScore);
            }
            return styleOptions;
        },
        getLineMethodByContent: function(content) {
            return utils.isFunction(content) ? content : lineMethodMap[content] || lineMethodMap["rect"];
        },
        _drawPoints: function(ctx, list, styleOptions) {
            ctx.beginPath();
            this.linePoints(ctx, list, styleOptions, this._currentPixelRatio);
            utils.extend(ctx, utils.subset(this._opts.styleKeysForCanvas, styleOptions));
            styleOptions.strokeStyle && ctx.stroke();
            styleOptions.fillStyle && ctx.fill();
        },
        _drawAreas: function(ctx, list, styleOptions) {
            ctx.beginPath();
            this.lineAreas(ctx, list, styleOptions, this._currentPixelRatio);
            utils.extend(ctx, utils.subset(this._opts.styleKeysForCanvas, styleOptions));
            styleOptions.strokeStyle && ctx.stroke();
            styleOptions.fillStyle && ctx.fill();
        },
        lineAreas: function(ctx, list, styleOptions, pixelRatio) {
            var lineMethod = this.getLineMethodByContent(styleOptions.content);
            if (lineMethod) for (var len = list.length, i = len - 1; i >= 0; i--) {
                var bounds = list[i].bounds;
                lineMethod.call(this, ctx, bounds.x * pixelRatio, bounds.y * pixelRatio, bounds.width * pixelRatio, bounds.height * pixelRatio);
            }
        },
        linePoints: function(ctx, list, styleOptions, pixelRatio) {
            var lineMethod = this.getLineMethodByContent(styleOptions.content);
            if (lineMethod) {
                for (var width = styleOptions.width, height = styleOptions.height, offset = this.getOffset(styleOptions), count = 0, len = list.length, i = len - 1; i >= 0; i--) {
                    var x = list[i].x, y = list[i].y;
                    lineMethod.call(this, ctx, (x + offset[0]) * pixelRatio, (y + offset[1]) * pixelRatio, width * pixelRatio, height * pixelRatio);
                    count++;
                }
                return count;
            }
        },
        _groupNormalPoints: function(zoom, activePoints, shadowPoints) {
            return [ [ shadowPoints, this._opts.drawShadowPoint && this._opts.shadowPointStyle ? utils.extend({}, this._opts.pointStyle, this._opts.shadowPointStyle) : null ], [ activePoints, this._opts.pointStyle ], [ activePoints, this._opts.pointHardcoreStyle ? utils.extend({}, this._opts.pointStyle, this._opts.pointHardcoreStyle) : null ], [ activePoints, this._opts.drawPositionPoint && this._opts.pointPositionStyle ? utils.extend({}, this._opts.pointStyle, this._opts.pointPositionStyle, {
                offset: [ "-50%", "-50%" ]
            }) : null ] ];
        },
        drawPointsWithStyleOptions: function(points, styleOptions) {
            if (points && points.length && styleOptions && (styleOptions.fillStyle || styleOptions.strokeStyle) && styleOptions.width * styleOptions.height > 0) {
                var ctx = this._baseCanvasCxt;
                ctx.save();
                this._drawPoints(ctx, points, styleOptions);
                ctx.restore();
            }
        },
        renderNormalPoints: function(zoom, activePoints, shadowPoints) {
            for (var taskList = this._groupNormalPoints(zoom, activePoints, shadowPoints), i = 0, len = taskList.length; i < len; i++) this.drawPointsWithStyleOptions(taskList[i][0], taskList[i][1]);
        }
    });
    return CanvasRender;
});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/misc/PointSimplifr/assets/canvas", [], function() {});

AMapUI.weakDefine("ui/misc/PointSimplifr/main", [ "lib/utils", "lib/dom.utils", "lib/event", "./lib/QuadTree", "./lib/BoundsItem", "./lib/PointItem", "./render/base", "./render/canvas", "css!./assets/canvas" ], function(utils, domUtils, EventCls, QuadTree, BoundsItem, PointItem, BaseRender, CanvasRender) {
    function PointSimplifr(opts) {
        this._opts = utils.extend({
            zIndex: 200,
            zooms: [ 3, 20 ],
            getHoverTitle: function(dataItem, idx) {
                return "idx: " + idx;
            },
            getPosition: function(dataItem, idx) {
                throw new Error("getPosition has not been implemented!");
            },
            compareDataItem: function(a, b, aIndex, bIndex) {
                return aIndex > bIndex ? -1 : 1;
            },
            autoSetFitView: !0,
            badBoundsAspectRatio: .6,
            maxChildrenOfQuadNode: 100,
            maxDepthOfQuadTree: 16,
            renderConstructor: CanvasRender,
            renderOptions: null
        }, opts);
        PointSimplifr.__super__.constructor.call(this, this._opts);
        var RenderConstructor = this._opts.renderConstructor;
        this.renderEngine = new RenderConstructor(this, this._opts.renderOptions);
        this._opts.data && this.setData(this._opts.data);
    }
    utils.inherit(PointSimplifr, EventCls);
    var Consts = {
        LEFT: 0,
        TOP: 1,
        RIGHT: 2,
        BOTTOM: 3
    };
    PointSimplifr.Consts = Consts;
    utils.extend(PointSimplifr, {
        Consts: Consts,
        Render: {
            Base: BaseRender,
            Canvas: CanvasRender
        },
        supportCanvas: domUtils.isCanvasSupported()
    });
    utils.extend(PointSimplifr.prototype, {
        renderLater: function() {
            this.renderEngine.renderLater.apply(this.renderEngine, arguments);
        },
        render: function() {
            this.renderEngine.render.apply(this.renderEngine, arguments);
        },
        _packDataItem: function(idx) {
            return {
                index: idx,
                data: this._data.source[idx]
            };
        },
        _compareWithDataIndex: function(idxA, idxB) {
            return idxA === idxB ? 0 : this._opts.compareDataItem(this.getDataItemByIndex(idxA), this.getDataItemByIndex(idxB), idxA, idxB);
        },
        getDataItemByIndex: function(idx) {
            return this._data.source[idx];
        },
        getPixelOfMaxZoom: function(lngLat) {
            var map = this.getMap(), maxZoom = this.getMaxZoom(), pMx = map.lnglatToPixel(lngLat, maxZoom);
            return [ Math.round(pMx.getX()), Math.round(pMx.getY()) ];
        },
        _buildDataItems: function(data) {
            for (var opts = this._opts, posGetter = opts.getPosition, list = this._data.list, bounds = this._data.bounds, idx = 0, len = data.length; idx < len; idx++) {
                var point = data[idx], pos = posGetter.call(this, point, idx);
                if (pos) {
                    2 === pos.length && pos[1] && (pos = new AMap.LngLat(pos[0], pos[1]));
                    var px = this.getPixelOfMaxZoom(pos), item = new PointItem(px[0], px[1], idx);
                    list[idx] = item;
                    px[0] < bounds[Consts.LEFT] ? bounds[Consts.LEFT] = px[0] : px[0] > bounds[Consts.RIGHT] && (bounds[Consts.RIGHT] = px[0]);
                    px[1] < bounds[Consts.TOP] ? bounds[Consts.TOP] = px[1] : px[1] > bounds[Consts.BOTTOM] && (bounds[Consts.BOTTOM] = px[1]);
                }
            }
        },
        _buildData: function(data) {
            this._clearData();
            this.trigger("willBuildData", data);
            this._data.source = data;
            this._buildDataItems(data);
            this._buildQuadTree();
            this.trigger("didBuildData", data);
        },
        _clearData: function() {
            this.trigger("willClearData");
            this._data ? this._data.list.length = 0 : this._data = {
                list: [],
                bounds: []
            };
            this._data.source = null;
            var bounds = this._data.bounds;
            bounds[Consts.TOP] = bounds[Consts.LEFT] = Number.MAX_VALUE;
            bounds[Consts.BOTTOM] = bounds[Consts.RIGHT] = Number.MIN_VALUE;
            this.trigger("didClearData");
        },
        _adjustRootBounds: function(bounds) {
            var width = bounds.width, height = bounds.height, aspectRatio = width / height, badAspectRatio = this._opts.badBoundsAspectRatio;
            if (badAspectRatio) {
                badAspectRatio > 1 && (badAspectRatio = 1 / badAspectRatio);
                if (aspectRatio > 1 / badAspectRatio) {
                    var newHeight = Math.ceil(width * badAspectRatio);
                    bounds.y -= Math.floor((newHeight - bounds.height) / 2);
                    bounds.height = newHeight;
                } else if (aspectRatio < badAspectRatio / 1) {
                    var newWidth = Math.ceil(height * badAspectRatio);
                    bounds.x -= Math.floor((newWidth - bounds.width) / 2);
                    bounds.width = newWidth;
                }
            }
            var x = bounds.x, y = bounds.y, w = bounds.width, h = bounds.height, r = x + w, b = y + h, factor = 256;
            bounds.x = Math.floor(x / factor) * factor;
            bounds.y = Math.floor(y / factor) * factor;
            bounds.width = Math.ceil(r / factor) * factor - bounds.x;
            bounds.height = Math.ceil(b / factor) * factor - bounds.y;
            return bounds;
        },
        _buildQuadTree: function() {
            if (this._quadTree) {
                this._quadTree.clear();
                this._quadTree = null;
            }
            this.trigger("willBuildQuadTree");
            var bounds = this._data.bounds, opts = this._opts, items = this._data.list, quadBounds = this._adjustRootBounds(new BoundsItem(bounds[Consts.LEFT], bounds[Consts.TOP], bounds[Consts.RIGHT] - bounds[Consts.LEFT], bounds[Consts.BOTTOM] - bounds[Consts.TOP]));
            QuadTree.setMaxChildrenAndDepth(opts.maxChildrenOfQuadNode, opts.maxDepthOfQuadTree);
            for (var quadTree = new QuadTree(quadBounds, (!0), opts.maxDepthOfQuadTree, opts.maxChildrenOfQuadNode), root = quadTree.root, i = 0, len = items.length; i < len; i++) root.insert(items[i]);
            this._quadTree = quadTree;
            this.trigger("didBuildQuadTree", quadTree);
        },
        setData: function(data) {
            if (!data || !data.length) return !1;
            this._buildData(data);
            this.renderLater(10);
            this._opts.autoSetFitView && this._setMapBoundsToQuadTreeRoot();
        },
        _setMapBoundsToQuadTreeRoot: function() {
            this._quadTree && this._setMapBounds(this._quadTree.root.getBounds());
        },
        _setMapBounds: function(nodeBounds) {
            var map = this.getMap(), maxZoom = this.getMaxZoom(), mapBounds = new AMap.Bounds(map.pixelToLngLat(new AMap.Pixel(nodeBounds.x, nodeBounds.y + nodeBounds.height), maxZoom), map.pixelToLngLat(new AMap.Pixel(nodeBounds.x + nodeBounds.width, nodeBounds.y), maxZoom));
            map.setBounds(mapBounds, null, null, !0);
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
        }
    });
    return PointSimplifr;
});

AMapUI.weakDefine("ui/misc/PointSimplifr", [ "ui/misc/PointSimplifr/main" ], function(m) {
    return m;
});

!function(c) {
    var d = document, a = "appendChild", i = "styleSheet", s = d.createElement("style");
    s.type = "text/css";
    d.getElementsByTagName("head")[0][a](s);
    s[i] ? s[i].cssText = c : s[a](d.createTextNode(c));
}(".amap-ui-pointsimplifr-container{cursor:default;-webkit-backface-visibility:hidden;-webkit-transform:translateZ(0) scale(1,1)}.amap-ui-pointsimplifr-container canvas{position:absolute}.amap-ui-pointsimplifr-container .amap-ui-hide{display:none!important}.amap-ui-pointsimplifr-container .overlay-title{color:#555;background-color:#fffeef;border:1px solid #7e7e7e;padding:2px 6px;font-size:12px;white-space:nowrap;display:inline-block;position:absolute;border-radius:2px;z-index:99999}.amap-ui-pointsimplifr-container .overlay-title:after,.amap-ui-pointsimplifr-container .overlay-title:before{content:'';display:block;position:absolute;margin:auto;width:0;height:0;border:solid transparent;border-width:5px}.amap-ui-pointsimplifr-container .overlay-title.left{transform:translate(10px,-50%)}.amap-ui-pointsimplifr-container .overlay-title.left:before{top:5px}.amap-ui-pointsimplifr-container .overlay-title.left:after{left:-9px;top:5px;border-right-color:#fffeef}.amap-ui-pointsimplifr-container .overlay-title.left:before{left:-10px;border-right-color:#7e7e7e}.amap-ui-pointsimplifr-container .overlay-title.top{transform:translate(-50%,-130%)}.amap-ui-pointsimplifr-container .overlay-title.top:before{left:0;right:0}.amap-ui-pointsimplifr-container .overlay-title.top:after{bottom:-9px;left:0;right:0;border-top-color:#fffeef}.amap-ui-pointsimplifr-container .overlay-title.top:before{bottom:-10px;border-top-color:#7e7e7e}");