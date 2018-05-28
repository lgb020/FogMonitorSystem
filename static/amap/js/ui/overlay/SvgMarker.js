AMapUI.weakDefine("ui/overlay/SvgMarker/shapes/base", [ "lib/utils", "lib/underscore-tpl" ], function(utils, template) {
    function BaseShape(opts) {
        this.opts = utils.extend({
            width: 26,
            height: 26,
            fillColor: "#000",
            strokeWidth: 0
        }, opts);
        this.attrNameMap = {
            stroke: "strokeColor",
            fill: "fillColor",
            d: "path",
            r: "radius"
        };
    }
    utils.extend(BaseShape.prototype, {
        buildAttrStr: function(params, keys) {
            keys || (keys = utils.keys(params));
            for (var attrNameMap = this.attrNameMap, parts = [], i = 0, len = keys.length; i < len; i++) {
                var keyParts = keys[i].split(":"), attrKey = keyParts[0], paramKey = attrKey;
                keyParts.length > 1 ? paramKey = keyParts[1] : paramKey in params || (paramKey = attrNameMap[paramKey] in params ? attrNameMap[paramKey] : this.getCamelName(paramKey));
                (params[paramKey] || 0 === params[paramKey]) && parts.push(attrKey + '="' + params[paramKey] + '"');
            }
            return parts.join(" ");
        },
        getCamelName: function(name) {
            var nameParts = name.split("-");
            return nameParts[0] + utils.map(nameParts.slice(1), utils.ucfirst);
        },
        doesSupportDataURI: function() {
            return this.opts.doesSupportDataURI;
        },
        getOuterHTML: function() {
            var opts = this.opts, params = utils.extend({}, opts);
            return template('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" ' + this.buildAttrStr(params, [ "width", "height", "viewBox", "preserveAspectRatio" ]) + " >" + this.getInnerHTML(params) + "</svg>", params);
        },
        getInnerHTML: function() {
            throw new Error("Not implement!");
        },
        getAttr: function(name, defaultVal) {
            var attrVal, camelName = this.getCamelName(name), getter = this["get" + utils.ucfirst(camelName)];
            if (utils.isFunction(getter)) attrVal = getter.call(this); else {
                attrVal = this.opts[name];
                void 0 === attrVal && name !== camelName && (attrVal = this.opts[camelName]);
            }
            return void 0 !== attrVal ? attrVal : defaultVal;
        },
        scale: function(sx, sy) {
            sy = sy || 0 === sy ? sy : sx;
            this.opts.width *= sx;
            this.opts.height *= sy;
            return this;
        },
        getWidth: function() {
            return this.opts.width;
        },
        getStrokeWidth: function() {
            return this.opts.strokeWidth || 0;
        },
        getHeight: function() {
            return this.opts.height;
        },
        getOffset: function() {
            var offset = this.opts.offset;
            if (!offset) {
                offset = this.getCenter();
                offset[0] *= -1;
                offset[1] *= -1;
            }
            return offset;
        },
        getCenter: function() {
            return [ this.getWidth() / 2, this.getHeight() / 2 ];
        },
        setAttr: function(key, val) {
            this.opts[key] = val;
        }
    });
    return BaseShape;
});

AMapUI.weakDefine("ui/overlay/SvgMarker/svg-path-helper", [], function() {
    function formatFloat(f) {
        return isNaN(f) ? f : Math.round(1e3 * f) / 1e3;
    }
    function serialize(path) {
        return path.reduce(function(str, seg) {
            return str + seg[0] + seg.slice(1).map(formatFloat).join(",");
        }, "");
    }
    function scalePathSegments(segments, sx, sy) {
        sy = sy || 0 === sy ? sy : sx;
        return segments.map(function(segment) {
            var name = segment[0].toLowerCase();
            if ("v" === name) {
                segment[1] *= sy;
                return segment;
            }
            if ("a" === name) {
                segment[1] *= sx;
                segment[2] *= sy;
                segment[6] *= sx;
                segment[7] *= sy;
                return segment;
            }
            return segment.map(function(val, i) {
                return i ? val *= i % 2 ? sx : sy : val;
            });
        });
    }
    function scalePath(path, sx, sy) {
        return serialize(scalePathSegments(parsePath(path), sx, sy));
    }
    var parsePath = function() {
        function parseValues(args) {
            var numbers = args.match(number);
            return numbers ? numbers.map(Number) : [];
        }
        var length = {
            a: 7,
            c: 6,
            h: 1,
            l: 2,
            m: 2,
            q: 4,
            s: 4,
            t: 2,
            v: 1,
            z: 0
        }, number = /-?[0-9]*\.?[0-9]+(?:e[-+]?\d+)?/gi, segment = /([astvzqmhlc])([^astvzqmhlc]*)/gi;
        return function(path) {
            var data = [];
            path.replace(segment, function(_, command, args) {
                var type = command.toLowerCase();
                args = parseValues(args);
                if ("m" === type && args.length > 2) {
                    data.push([ command ].concat(args.splice(0, 2)));
                    type = "l";
                    command = "m" === command ? "l" : "L";
                }
                for (;;) {
                    if (args.length === length[type]) {
                        args.unshift(command);
                        return data.push(args);
                    }
                    if (args.length < length[type]) throw new Error("malformed path data");
                    data.push([ command ].concat(args.splice(0, length[type])));
                }
            });
            return data;
        };
    }();
    return {
        parsePath: parsePath,
        serialize: serialize,
        scalePath: scalePath
    };
});

AMapUI.weakDefine("ui/overlay/SvgMarker/shapes/path", [ "lib/utils", "./base", "lib/underscore-tpl", "../svg-path-helper" ], function(utils, BaseShape, template, svgPathHelper) {
    function PathShape(opts) {
        opts = utils.extend({
            doesSupportDataURI: !0,
            sourcePath: {
                path: "M0,0h10v10h-10z",
                width: 10,
                height: 10
            }
        }, opts);
        if (!opts.sourcePath) throw new Error("sourcePath missing!");
        var sourcePath = opts.sourcePath;
        sourcePath.aspectRadio = sourcePath.width / sourcePath.height;
        if (opts.width && !opts.height) opts.height = opts.width / sourcePath.aspectRadio; else if (opts.height && !opts.width) opts.width = opts.height * sourcePath.aspectRadio; else if (!opts.width && !opts.height) {
            opts.width = sourcePath.width;
            opts.height = sourcePath.height;
        }
        PathShape.__super__.constructor.call(this, opts);
    }
    utils.inherit(PathShape, BaseShape);
    utils.extend(PathShape.prototype, {
        getInnerHTML: function(params) {
            params = utils.extend({}, params);
            var strokeWidth = params.strokeWidth || 0;
            strokeWidth && (params.transform = "translate(" + strokeWidth / 2 + "," + strokeWidth / 2 + ")");
            var pathWidth = params.width - strokeWidth, pathHeight = params.height - strokeWidth, precision = 1e3, sourcePath = params.sourcePath;
            params.d = svgPathHelper.scalePath(sourcePath.path, Math.round(pathWidth * precision / sourcePath.width) / precision, Math.round(pathHeight * precision / sourcePath.height) / precision);
            return "<g " + this.buildAttrStr(params, [ "transform" ]) + "><path " + this.buildAttrStr(params, [ "stroke", "stroke-width", "fill", "d" ]) + " /></g>";
        }
    });
    return PathShape;
});

AMapUI.weakDefine("ui/overlay/SvgMarker/shapes/water-drop", [ "lib/utils", "./path" ], function(utils, PathShape) {
    function WaterDrop(opts) {
        opts = utils.extend({
            sourcePath: {
                path: "M18,0C8.034,0,0,7.8,0,17.4C0,32.9,18,48,18,48s18-15.4,18-30.6C36,7.8,27.966,0,18,0z",
                width: 36,
                height: 48
            }
        }, opts);
        WaterDrop.__super__.constructor.call(this, opts);
    }
    utils.inherit(WaterDrop, PathShape);
    utils.extend(WaterDrop.prototype, {
        getOffset: function() {
            return [ -this.getWidth() / 2, -this.getHeight() ];
        },
        getCenter: function() {
            return [ this.getWidth() / 2, this.getHeight() / 3 ];
        }
    });
    return WaterDrop;
});

AMapUI.weakDefine("ui/overlay/SvgMarker/shapes/shield-pin", [ "lib/utils", "./path" ], function(utils, PathShape) {
    function ShieldPin(opts) {
        opts = utils.extend({
            sourcePath: {
                path: "M40.857,16.2c0.304-3.4,1.314-6.6,3.135-9.5L36.913,0c-2.226,1.8-4.754,2.8-7.686,3c-2.63,0.2-5.158-0.2-7.484-1.4C19.417,2.7,16.889,3.2,14.26,3c-2.73-0.2-5.158-1.1-7.281-2.7L0,7c1.719,2.9,2.73,6,2.933,9.2c0.101,1.5-0.304,3.5-1.315,6.1c-0.506,1.5-0.91,2.7-1.213,3.8C0.202,27.1,0,28,0,28.6C0,31.4,0.809,33.9,2.427,36.1c1.315,1.601,3.54,3.4,6.473,5.4c3.337,1.6,5.865,2.6,7.686,3.1c0.506,0.2,1.011,0.4,1.517,0.7L19.62,45.9c1.112,0.6,1.921,1.3,2.326,2.1c0.505-0.8,1.314-1.5,2.427-2.1C25.08,45.6,25.788,45.3,26.294,45.1c0.506-0.199,0.911-0.399,1.113-0.5c0.404-0.199,0.909-0.399,1.517-0.6c0.606-0.2,1.416-0.5,2.225-0.8c1.72-0.601,3.034-1.101,3.844-1.601c2.932-2,5.057-3.8,6.472-5.3c1.72-2.2,2.63-4.8,2.528-7.6c-0.101-1.3-0.708-3.3-1.72-6.1C41.161,19.8,40.655,17.7,40.857,16.2z",
                width: 44,
                height: 48
            }
        }, opts);
        ShieldPin.__super__.constructor.call(this, opts);
    }
    utils.inherit(ShieldPin, PathShape);
    utils.extend(ShieldPin.prototype, {
        getOffset: function() {
            return [ -this.getWidth() / 2, -this.getHeight() ];
        }
    });
    return ShieldPin;
});

AMapUI.weakDefine("ui/overlay/SvgMarker/shapes/square-pin", [ "lib/utils", "./path" ], function(utils, PathShape) {
    function SquarePin(opts) {
        opts = utils.extend({
            sourcePath: {
                path: "M44-0h-44v43h16l6 5 6-5h16z",
                width: 44,
                height: 48
            }
        }, opts);
        SquarePin.__super__.constructor.call(this, opts);
    }
    utils.inherit(SquarePin, PathShape);
    utils.extend(SquarePin.prototype, {
        getOffset: function() {
            return [ -this.getWidth() / 2, -this.getHeight() ];
        },
        getCenter: function() {
            return [ this.getWidth() / 2, this.getHeight() / 2.1 ];
        }
    });
    return SquarePin;
});

AMapUI.weakDefine("ui/overlay/SvgMarker/shapes/triangle-flag-pin", [ "lib/utils", "./path" ], function(utils, PathShape) {
    function TriangleFlagPin(opts) {
        opts = utils.extend({
            sourcePath: {
                path: "M0,6.5V26h1V11.571L14,6L0,0V6.5L0,6.5z",
                width: 14,
                height: 22
            }
        }, opts, {
            strokeWidth2: 0
        });
        TriangleFlagPin.__super__.constructor.call(this, opts);
    }
    utils.inherit(TriangleFlagPin, PathShape);
    utils.extend(TriangleFlagPin.prototype, {
        getOffset: function() {
            return [ -Math.round(this.getWidth() / 30) - this.getStrokeWidth() / 2, -this.getHeight() ];
        },
        getCenter: function() {
            return [ this.getWidth() / 4, this.getHeight() / 4 ];
        }
    });
    return TriangleFlagPin;
});

AMapUI.weakDefine("ui/overlay/SvgMarker/shapes/rectangle-flag-pin", [ "lib/utils", "./path" ], function(utils, PathShape) {
    function RectangleFlagPin(opts) {
        opts = utils.extend({
            sourcePath: {
                path: "M0,5.5V26h1V11h15V0H0V5.5L0,5.5z",
                width: 16,
                height: 24
            }
        }, opts, {
            strokeWidth2: 0
        });
        RectangleFlagPin.__super__.constructor.call(this, opts);
    }
    utils.inherit(RectangleFlagPin, PathShape);
    utils.extend(RectangleFlagPin.prototype, {
        getOffset: function() {
            return [ -Math.round(this.getWidth() / 30) - this.getStrokeWidth() / 2, -this.getHeight() ];
        },
        getCenter: function() {
            return [ this.getWidth() / 4, this.getHeight() / 4 ];
        }
    });
    return RectangleFlagPin;
});

AMapUI.weakDefine("ui/overlay/SvgMarker/shapes/circle", [ "lib/utils", "./base" ], function(utils, BaseShape) {
    function Circle(opts) {
        if (opts && !opts.radius) {
            var size = opts.width || opts.height;
            if (size) {
                this.opts = opts;
                this.setWidth(size);
            }
        }
        this.opts = utils.extend({
            doesSupportDataURI: !0,
            radius: 12
        }, opts);
        this.setRadius(this.opts.radius);
        Circle.__super__.constructor.call(this, this.opts);
        this.setRadius(opts.radius);
    }
    utils.inherit(Circle, BaseShape);
    utils.extend(Circle.prototype, {
        setRadius: function(r) {
            r < 0 && (r = 0);
            this.opts.radius = r;
            var width = 2 * (r + (this.opts.strokeWidth || 0));
            utils.extend(this.opts, {
                width: width,
                height: width
            });
        },
        setWidth: function(w) {
            this.setRadius(w / 2 - (this.opts.strokeWidth || 0));
        },
        setHeight: function(h) {
            return this.setWidth(h);
        },
        getInnerHTML: function(params) {
            var shapeStr = "", strokeWidth = params.strokeWidth || 0, cx = params.width / 2, cy = cx;
            if (strokeWidth) {
                var outerRadius = params.width / 2;
                shapeStr += "<circle " + this.buildAttrStr({
                    fill: params.strokeColor,
                    cx: cx,
                    cy: cy,
                    r: outerRadius
                }) + " />";
            }
            shapeStr += "<circle " + this.buildAttrStr({
                fill: params.fillColor,
                cx: cx,
                cy: cy,
                r: params.radius
            }) + " />";
            return "<g>" + shapeStr + "</g>";
        },
        scale: function(s) {
            this.setWidth(this.getWidth() * s);
        }
    });
    return Circle;
});

AMapUI.weakDefine("ui/overlay/SvgMarker/shapes/five-points-star", [ "lib/utils", "./path" ], function(utils, PathShape) {
    function FivePointsStar(opts) {
        opts = utils.extend({
            sourcePath: {
                path: "M24,9.265h-9.094L12.09,0L9.227,9.265H0l7.473,5.613L4.668,24l7.367-5.725l7.402,5.67l-2.805-9.109L24,9.265z",
                width: 24,
                height: 24
            }
        }, opts);
        FivePointsStar.__super__.constructor.call(this, opts);
    }
    utils.inherit(FivePointsStar, PathShape);
    utils.extend(FivePointsStar.prototype, {
        getOffset: function() {
            return [ -this.getWidth() / 2, -this.getHeight() / 2 ];
        }
    });
    return FivePointsStar;
});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/overlay/SvgMarker/themes/iconfont", [], function() {});

AMapUI.weakDefine("ui/overlay/SvgMarker/shapes/iconfont", [ "require", "lib/utils", "./base", "css!../themes/iconfont" ], function(require, utils, BaseShape) {
    function IconFont(opts) {
        if (opts && !opts.size) {
            var size = opts.width || opts.height;
            if (size) {
                this.opts = opts;
                this.setWidth(size);
            }
        }
        this.opts = utils.extend({
            symbolJs: "//at.alicdn.com/t/font_ffe84tuv15mkuik9.js",
            icon: "icon-marker1",
            size: 24
        }, opts);
        this.setSize(this.opts.size);
        this.opts.symbolJs && require([ AMapUI.getAbsoluteUrl(this.opts.symbolJs) ]);
        IconFont.__super__.constructor.call(this, this.opts);
    }
    utils.inherit(IconFont, BaseShape);
    utils.extend(IconFont.prototype, {
        doesSupportDataURI: function() {
            return !1;
        },
        getInnerHTML: function(params) {
            return '<g class="amap-ui-iconfont-icon"><use xlink:href="#' + params.icon + '" ' + this.buildAttrStr(params, [ "width", "height", "stroke", "stroke-width", "fill" ]) + "></use></g>";
        },
        setSize: function(r) {
            this.opts.size = r;
            var width = r;
            utils.extend(this.opts, {
                width: width,
                height: width
            });
        },
        setWidth: function(w) {
            this.setSize(w);
        },
        setHeight: function(h) {
            return this.setWidth(h);
        },
        getOffset: function() {
            return this.opts.offset || [ -this.getWidth() / 2, -this.getHeight() ];
        }
    });
    return IconFont;
});

AMapUI.weakDefine("ui/overlay/SvgMarker/shapes", [ "./shapes/base", "./shapes/path", "./shapes/water-drop", "./shapes/shield-pin", "./shapes/square-pin", "./shapes/triangle-flag-pin", "./shapes/rectangle-flag-pin", "./shapes/circle", "./shapes/five-points-star", "./shapes/iconfont" ], function(BaseShape, PathShape, WaterDrop, ShieldPin, SquarePin, TriangleFlagPin, RectangleFlagPin, Circle, FivePointsStar, IconFont) {
    return {
        BaseShape: BaseShape,
        PathShape: PathShape,
        Circle: Circle,
        TriangleFlagPin: TriangleFlagPin,
        RectangleFlagPin: RectangleFlagPin,
        ShieldPin: ShieldPin,
        SquarePin: SquarePin,
        WaterDrop: WaterDrop,
        FivePointsStar: FivePointsStar,
        IconFont: IconFont
    };
});

AMapUI.weakDefine("ui/overlay/SvgMarker/main", [ "lib/utils", "./shapes", "ui/overlay/SimpleMarker/main" ], function(utils, Shape, SimpleMarker) {
    function SvgMarker(shape, opts) {
        if (shape && supportSvg) {
            this.opts = utils.extend(opts, this.buildMarkerOptions(shape), {
                svgShape: shape
            });
            SvgMarker.__super__.constructor.call(this, this.opts);
        } else SvgMarker.__super__.constructor.call(this, opts);
    }
    var supportSvg = !(!document.createElementNS || !document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGRect), supportSvgImg = supportSvg && document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Image", "1.1");
    utils.extend(SvgMarker, {
        Shape: Shape,
        supportSvg: supportSvg,
        supportSvgImg: supportSvgImg
    });
    utils.inherit(SvgMarker, SimpleMarker);
    utils.extend(SvgMarker.prototype, {
        buildMarkerOptions: function(shape) {
            var offset = shape.getOffset(), svg = shape.getOuterHTML();
            utils.isArray(offset) && (offset = new AMap.Pixel(offset[0], offset[1]));
            return {
                offset: offset,
                iconStyle: supportSvgImg && shape.doesSupportDataURI() ? {
                    src: this.getImgDataSrc(svg),
                    style: {
                        width: shape.getWidth() + "px",
                        height: shape.getHeight() + "px"
                    }
                } : svg
            };
        },
        getImgDataSrc: function(svg) {
            return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
        },
        getSvgShape: function() {
            return this.opts.svgShape;
        },
        setSvgShape: function(shape) {
            if (shape) {
                this.opts.svgShape = shape;
                var markerOpts = this.buildMarkerOptions(shape);
                this.setIconStyle(markerOpts.iconStyle);
                this.setOffset(markerOpts.offset);
            } else this.setIconStyle(null);
        }
    });
    return SvgMarker;
});

AMapUI.weakDefine("ui/overlay/SvgMarker", [ "ui/overlay/SvgMarker/main" ], function(m) {
    return m;
});

!function(c) {
    var d = document, a = "appendChild", i = "styleSheet", s = d.createElement("style");
    s.type = "text/css";
    d.getElementsByTagName("head")[0][a](s);
    s[i] ? s[i].cssText = c : s[a](d.createTextNode(c));
}(".amap-ui-iconfont-icon{width:1em;height:1em;vertical-align:-.15em;fill:currentColor;overflow:hidden}");