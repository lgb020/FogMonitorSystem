AMapUI.weakDefine("ui/overlay/SimpleMarker/conf", [], function() {
    return {
        "default": {
            cssFile: "./themes/def.css",
            classPrefix: "def",
            exOptions: {
                offset: new AMap.Pixel((-17.5), (-43))
            },
            styleList: [ "beige", "black", "blue", "cadetblue", "darkblue", "darkgreen", "darkred", "gray", "green", "lightblue", "lightgray", "lightgreen", "lightpink", "orange", "orchid", "pink", "purple", "red", "salmon", "white" ]
        },
        "fresh": {
            cssFile: "./themes/fresh.css",
            classPrefix: "fresh",
            exOptions: {
                offset: new AMap.Pixel((-18), (-42))
            },
            styleList: [ "beige", "black", "blue", "darkblue", "darkgreen", "darkyellow", "gray", "green", "lightblue", "lightgray", "lightgreen", "lightpink", "lightyellow", "orange", "orchid", "pink", "purple", "red", "salmon", "yellow" ]
        },
        "numv1": {
            cssFile: "./themes/numv1.css",
            classPrefix: "numv1",
            exOptions: {
                offset: new AMap.Pixel((-18), (-32))
            },
            styleList: [ "blue", "blue-1", "blue-2", "blue-3", "blue-4", "blue-5", "blue-6", "blue-7", "blue-8", "blue-9", "blue-10", "blue-11", "blue-12", "blue-13", "blue-14", "blue-15", "blue-16", "blue-17", "blue-18", "blue-19", "blue-20", "end", "pass", "red", "red-1", "red-2", "red-3", "red-4", "red-5", "red-6", "red-7", "red-8", "red-9", "red-10", "red-11", "red-12", "red-13", "red-14", "red-15", "red-16", "red-17", "red-18", "red-19", "red-20", "start" ]
        },
        "numv2": {
            cssFile: "./themes/numv2.css",
            classPrefix: "numv2",
            exOptions: {
                offset: new AMap.Pixel((-18), (-32))
            },
            styleList: [ "blue", "blue-1", "blue-2", "blue-3", "blue-4", "blue-5", "blue-6", "blue-7", "blue-8", "blue-9", "blue-10", "blue-11", "blue-12", "blue-13", "blue-14", "blue-15", "blue-16", "blue-17", "blue-18", "blue-19", "blue-20", "lightblue", "red", "red-1", "red-2", "red-3", "red-4", "red-5", "red-6", "red-7", "red-8", "red-9", "red-10", "red-11", "red-12", "red-13", "red-14", "red-15", "red-16", "red-17", "red-18", "red-19", "red-20" ]
        }
    };
});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/overlay/SimpleMarker/themes/base", [], function() {});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/overlay/SimpleMarker/themes/def", [], function() {});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/overlay/SimpleMarker/themes/fresh", [], function() {});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/overlay/SimpleMarker/themes/numv1", [], function() {});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/overlay/SimpleMarker/themes/numv2", [], function() {});

AMapUI.weakDefine("ui/overlay/SimpleMarker/main", [ "require", "lib/utils", "./conf", "css!./themes/base", "css!./themes/def", "css!./themes/fresh", "css!./themes/numv1", "css!./themes/numv2" ], function(require, utils, themeConfMap) {
    function SimpleMarker(opts) {
        this.opts = utils.extend({
            iconTheme: "default",
            iconStyle: "//webapi.amap.com/theme/v1.3/markers/n/mark_b.png",
            offset: new AMap.Pixel((-9), (-31)),
            iconLabel: ""
        }, opts);
        this._initContentDom();
        this.setIconThemeAndStyle(this.opts.iconTheme, this.opts.iconStyle);
        this.setIconLabel(this.opts.iconLabel);
        if (this._themeConf) {
            this.isBuiltInIconStyle(this.opts.iconStyle) && utils.extend(this.opts, this._themeConf.exOptions);
            this._themeConf.cssFile && require([ "css!" + this._themeConf.cssFile ]);
        }
        SimpleMarker.__super__.constructor.call(this, utils.extend({}, this.opts, {
            content: this.domNodes.container
        }));
        this.opts.showPositionPoint && this.showPositionPoint(this.opts.showPositionPoint);
    }
    utils.inherit(SimpleMarker, AMap.Marker);
    utils.extend(SimpleMarker, {
        getBuiltInIconStyles: function(theme) {
            var themeConf = themeConfMap[theme || "default"];
            return themeConf ? themeConf.styleList : [];
        },
        getBuiltInIconThemes: function() {
            var keys = [];
            for (var k in themeConfMap) themeConfMap.hasOwnProperty(k) && keys.push(k);
            keys.sort();
            return keys;
        }
    });
    utils.extend(SimpleMarker.prototype, {
        getBuiltInIconStyles: function() {
            return SimpleMarker.getBuiltInIconStyles(this.opts.iconTheme);
        },
        setIconThemeAndStyle: function(theme, iconStyle) {
            this._setIconTheme(theme);
            this.setIconStyle(iconStyle);
        },
        _setIconTheme: function(theme) {
            this.opts.iconTheme = theme;
            this._themeConf = themeConfMap[theme];
        },
        showPositionPoint: function(opts) {
            var point = this._getPositionPoint(!0, opts);
            this._updatePositionPoint();
            point.style.display = "block";
        },
        hidePositionPoint: function() {
            var point = this._getPositionPoint();
            point && (point.style.display = "none");
        },
        _updatePositionPoint: function() {
            var point = this._getPositionPoint();
            if (point) {
                var offset = this.getOffset();
                utils.extend(point.style, {
                    left: -offset.getX() + "px",
                    top: -offset.getY() + "px"
                });
            }
        },
        _getPositionPoint: function(autoCreate, opts) {
            if (!this.domNodes.posPoint) {
                if (!autoCreate) return !1;
                this.domNodes.posPoint = document.createElement("div");
                this.domNodes.posPoint.className = "amap-simple-marker-position-point";
                this.domNodes.container.appendChild(this.domNodes.posPoint);
                this.on("offset", this._updatePositionPoint, this);
                opts = utils.extend({
                    radius: 2,
                    color: "red"
                }, opts);
            }
            if (opts) {
                var size = 2 * opts.radius;
                utils.extend(this.domNodes.posPoint.style, {
                    backgroundColor: opts.color,
                    width: size + "px",
                    height: size + "px",
                    display: "none",
                    marginTop: -opts.radius + "px",
                    marginLeft: -opts.radius + "px",
                    borderRadius: opts.radius + "px"
                });
            }
            return this.domNodes.posPoint;
        },
        _initContentDom: function() {
            this.domNodes = {};
            this.domNodes.container = document.createElement("div");
            this.domNodes.container.className = this._getContainerClassNames();
            this.domNodes.icon = document.createElement("div");
            this.domNodes.icon.className = "amap-simple-marker-icon";
            this.domNodes.container.appendChild(this.domNodes.icon);
        },
        _getContainerClassNames: function() {
            var extraClassNames = this.opts.containerClassNames;
            utils.isArray(extraClassNames) && (extraClassNames = extraClassNames.join(" "));
            return "amap-simple-marker" + (extraClassNames ? " " + extraClassNames : "");
        },
        setContainerClassNames: function(newClassNames) {
            this._replaceClassNames(this.domNodes.container, this.opts.containerClassNames, newClassNames);
            this.opts.containerClassNames = newClassNames;
        },
        _replaceClassNames: function(node, oldClassNames, newClassNames) {
            if (node) {
                var currentClassNames = node.className.split(/\s+/);
                if (oldClassNames) {
                    utils.isArray(oldClassNames) || (oldClassNames = oldClassNames.split(/\s+/));
                    for (var i = 0, len = oldClassNames.length; i < len; i++) utils.removeFromArray(currentClassNames, oldClassNames[i]);
                }
                utils.isArray(newClassNames) && (newClassNames = newClassNames.join(" "));
                node.className = currentClassNames.join(" ") + " " + newClassNames;
            }
        },
        isBuiltInIconStyle: function(iconStyle, iconTheme) {
            var themeConf = iconTheme ? themeConfMap[iconTheme] : this._themeConf;
            if (!themeConf) return null;
            var styleList = themeConf.styleList;
            return utils.isString(iconStyle) && utils.arrayIndexOf(styleList, iconStyle) >= 0;
        },
        setIconStyle: function(iconStyle) {
            this.opts.iconStyle = iconStyle;
            var exClassNames = "";
            if (this.isBuiltInIconStyle(iconStyle)) {
                this._setIconImage(null);
                exClassNames = this.getIconClassNames(iconStyle);
            } else this._setIconImage(iconStyle);
            this._replaceClassNames(this.domNodes.container, this._iconStyleClassNames, exClassNames);
            this._iconStyleClassNames = exClassNames;
        },
        getIconClassNames: function(iconStyle) {
            return "amap-simple-marker-" + this._themeConf.classPrefix + "-style amap-simple-marker-style-" + iconStyle;
        },
        _setIconImage: function(imgSrc) {
            if (imgSrc) {
                if (utils.isString(imgSrc) && "<" === imgSrc[0] && ">" === imgSrc[imgSrc.length - 1]) {
                    var tmpDiv = this._tempDiv;
                    tmpDiv || (tmpDiv = this._tempDiv = document.createElement("div"));
                    tmpDiv.innerHTML = imgSrc;
                    imgSrc = tmpDiv.firstChild;
                    tmpDiv.removeChild(tmpDiv.firstChild);
                }
                if (utils.isHTMLElement(imgSrc) || utils.isSVGElement(imgSrc)) {
                    this._removeIconImage();
                    this.domNodes.iconImg = imgSrc;
                    this.domNodes.icon.appendChild(this.domNodes.iconImg);
                } else {
                    this._removeIconImage();
                    if (!this.domNodes.iconImg) {
                        this.domNodes.iconImg = document.createElement("img");
                        this.domNodes.iconImg.className = "amap-simple-marker-icon-img";
                        this.domNodes.icon.appendChild(this.domNodes.iconImg);
                    }
                    var iconImg = this.domNodes.iconImg;
                    switch (typeof imgSrc) {
                      case "string":
                        iconImg.src = imgSrc;
                        break;

                      case "object":
                        this._setDomAttrs(iconImg, imgSrc);
                        break;

                      default:
                        throw new Error("illegal Icon Image Src: " + imgSrc);
                    }
                }
            } else this._removeIconImage();
        },
        _removeIconImage: function() {
            if (this.domNodes.iconImg) {
                this.domNodes.iconImg.parentNode.removeChild(this.domNodes.iconImg);
                this.domNodes.iconImg = null;
            }
        },
        setIconLabel: function(label) {
            this.opts.iconLabel = label;
            if (!this.domNodes.label) {
                if (!label) return;
                this.domNodes.label = document.createElement("div");
                this.domNodes.label.className = "amap-simple-marker-label";
                this.domNodes.container.appendChild(this.domNodes.label);
            }
            var labelEle = this.domNodes.label;
            switch (typeof label) {
              case "object":
                this._setDomAttrs(labelEle, label);
                break;

              default:
                labelEle.innerHTML = "" + label;
            }
        },
        _setDomAttrs: function(node, attrs) {
            for (var k in attrs) attrs.hasOwnProperty(k) && (utils.isObject(attrs[k]) ? utils.extend(node[k], attrs[k]) : node[k] = attrs[k]);
        }
    });
    return SimpleMarker;
});

AMapUI.weakDefine("ui/overlay/SimpleMarker", [ "ui/overlay/SimpleMarker/main" ], function(m) {
    return m;
});

!function(c) {
    var d = document, a = "appendChild", i = "styleSheet", s = d.createElement("style");
    s.type = "text/css";
    d.getElementsByTagName("head")[0][a](s);
    s[i] ? s[i].cssText = c : s[a](d.createTextNode(c));
}(".amap-simple-marker-position-point{position:absolute}.amap-simple-marker{position:relative}.amap-simple-marker-label{position:absolute;text-align:center;top:0;left:0;right:0;bottom:0;margin:auto;font-size:1em}.amap-simple-marker-icon{font-size:0}.amap-simple-marker-def-style .amap-simple-marker-label{line-height:35px}.amap-simple-marker-def-style .amap-simple-marker-icon,.amap-simple-marker.amap-simple-marker-def-style{width:35px;height:44px;display:block;text-align:center}.amap-simple-marker-def-style .amap-simple-marker-icon{background:url(" + AMapUI.getBaseUrl() + "ui/overlay/SimpleMarker/assets/default/default-fs8.png) no-repeat;background-position:-10000px -10000px}@media (min--moz-device-pixel-ratio:1.5),(-o-min-device-pixel-ratio:3/2),(-webkit-min-device-pixel-ratio:1.5),(min-device-pixel-ratio:1.5),(min-resolution:1.5dppx){.amap-simple-marker-def-style .amap-simple-marker-icon{background-image:url(" + AMapUI.getBaseUrl() + "ui/overlay/SimpleMarker/assets/default/default_2x-fs8.png);background-size:720px 46px}}.amap-simple-marker-def-style.amap-simple-marker-style-red .amap-simple-marker-icon{background-position:0 0}.amap-simple-marker-def-style.amap-simple-marker-style-orange .amap-simple-marker-icon{background-position:-36px 0}.amap-simple-marker-def-style.amap-simple-marker-style-green .amap-simple-marker-icon{background-position:-72px 0}.amap-simple-marker-def-style.amap-simple-marker-style-blue .amap-simple-marker-icon{background-position:-108px 0}.amap-simple-marker-def-style.amap-simple-marker-style-orchid .amap-simple-marker-icon{background-position:-144px 0}.amap-simple-marker-def-style.amap-simple-marker-style-darkred .amap-simple-marker-icon{background-position:-180px 0}.amap-simple-marker-def-style.amap-simple-marker-style-darkblue .amap-simple-marker-icon{background-position:-216px 0}.amap-simple-marker-def-style.amap-simple-marker-style-darkgreen .amap-simple-marker-icon{background-position:-252px 0}.amap-simple-marker-def-style.amap-simple-marker-style-purple .amap-simple-marker-icon{background-position:-288px 0}.amap-simple-marker-def-style.amap-simple-marker-style-cadetblue .amap-simple-marker-icon{background-position:-324px 0}.amap-simple-marker-def-style.amap-simple-marker-style-salmon .amap-simple-marker-icon{background-position:-360px 0}.amap-simple-marker-def-style.amap-simple-marker-style-beige .amap-simple-marker-icon{background-position:-396px 0}.amap-simple-marker-def-style.amap-simple-marker-style-lightgreen .amap-simple-marker-icon{background-position:-432px 0}.amap-simple-marker-def-style.amap-simple-marker-style-lightblue .amap-simple-marker-icon{background-position:-468px 0}.amap-simple-marker-def-style.amap-simple-marker-style-pink .amap-simple-marker-icon{background-position:-504px 0}.amap-simple-marker-def-style.amap-simple-marker-style-lightpink .amap-simple-marker-icon{background-position:-540px 0}.amap-simple-marker-def-style.amap-simple-marker-style-white .amap-simple-marker-icon{background-position:-576px 0}.amap-simple-marker-def-style.amap-simple-marker-style-lightgray .amap-simple-marker-icon{background-position:-612px 0}.amap-simple-marker-def-style.amap-simple-marker-style-gray .amap-simple-marker-icon{background-position:-648px 0}.amap-simple-marker-def-style.amap-simple-marker-style-black .amap-simple-marker-icon{background-position:-682px 0}.amap-simple-marker-fresh-style .amap-simple-marker-label{line-height:35px}.amap-simple-marker-fresh-style .amap-simple-marker-icon,.amap-simple-marker.amap-simple-marker-fresh-style{width:36px;height:44px;display:block;text-align:center}.amap-simple-marker-fresh-style .amap-simple-marker-icon{background:url(" + AMapUI.getBaseUrl() + "ui/overlay/SimpleMarker/assets/fresh/fresh-fs8.png) no-repeat;background-position:-10000px -10000px}@media (min--moz-device-pixel-ratio:1.5),(-o-min-device-pixel-ratio:3/2),(-webkit-min-device-pixel-ratio:1.5),(min-device-pixel-ratio:1.5),(min-resolution:1.5dppx){.amap-simple-marker-fresh-style .amap-simple-marker-icon{background-image:url(" + AMapUI.getBaseUrl() + "ui/overlay/SimpleMarker/assets/fresh/fresh_2x-fs8.png);background-size:720px 44px}}.amap-simple-marker-fresh-style.amap-simple-marker-style-lightgreen .amap-simple-marker-icon{background-position:0 0}.amap-simple-marker-fresh-style.amap-simple-marker-style-beige .amap-simple-marker-icon{background-position:-36px 0}.amap-simple-marker-fresh-style.amap-simple-marker-style-blue .amap-simple-marker-icon{background-position:-72px 0}.amap-simple-marker-fresh-style.amap-simple-marker-style-darkblue .amap-simple-marker-icon{background-position:-108px 0}.amap-simple-marker-fresh-style.amap-simple-marker-style-darkgreen .amap-simple-marker-icon{background-position:-144px 0}.amap-simple-marker-fresh-style.amap-simple-marker-style-darkyellow .amap-simple-marker-icon{background-position:-180px 0}.amap-simple-marker-fresh-style.amap-simple-marker-style-gray .amap-simple-marker-icon{background-position:-216px 0}.amap-simple-marker-fresh-style.amap-simple-marker-style-green .amap-simple-marker-icon{background-position:-252px 0}.amap-simple-marker-fresh-style.amap-simple-marker-style-lightblue .amap-simple-marker-icon{background-position:-288px 0}.amap-simple-marker-fresh-style.amap-simple-marker-style-lightgray .amap-simple-marker-icon{background-position:-324px 0}.amap-simple-marker-fresh-style.amap-simple-marker-style-black .amap-simple-marker-icon{background-position:-360px 0}.amap-simple-marker-fresh-style.amap-simple-marker-style-lightpink .amap-simple-marker-icon{background-position:-396px 0}.amap-simple-marker-fresh-style.amap-simple-marker-style-lightyellow .amap-simple-marker-icon{background-position:-432px 0}.amap-simple-marker-fresh-style.amap-simple-marker-style-orange .amap-simple-marker-icon{background-position:-468px 0}.amap-simple-marker-fresh-style.amap-simple-marker-style-orchid .amap-simple-marker-icon{background-position:-504px 0}.amap-simple-marker-fresh-style.amap-simple-marker-style-pink .amap-simple-marker-icon{background-position:-540px 0}.amap-simple-marker-fresh-style.amap-simple-marker-style-purple .amap-simple-marker-icon{background-position:-576px 0}.amap-simple-marker-fresh-style.amap-simple-marker-style-red .amap-simple-marker-icon{background-position:-612px 0}.amap-simple-marker-fresh-style.amap-simple-marker-style-salmon .amap-simple-marker-icon{background-position:-648px 0}.amap-simple-marker-fresh-style.amap-simple-marker-style-yellow .amap-simple-marker-icon{background-position:-684px 0}.amap-simple-marker-numv1-style .amap-simple-marker-label{line-height:35px}.amap-simple-marker-numv1-style .amap-simple-marker-icon,.amap-simple-marker.amap-simple-marker-numv1-style{width:36px;height:36px;display:block;text-align:center}.amap-simple-marker-numv1-style .amap-simple-marker-icon{background:url(" + AMapUI.getBaseUrl() + "ui/overlay/SimpleMarker/assets/numv1/numv1-fs8.png) no-repeat;background-position:-10000px -10000px}@media (min--moz-device-pixel-ratio:1.5),(-o-min-device-pixel-ratio:3/2),(-webkit-min-device-pixel-ratio:1.5),(min-device-pixel-ratio:1.5),(min-resolution:1.5dppx){.amap-simple-marker-numv1-style .amap-simple-marker-icon{background-image:url(" + AMapUI.getBaseUrl() + "ui/overlay/SimpleMarker/assets/numv1/numv1_2x-fs8.png);background-size:1620px 36px}}.amap-simple-marker-numv1-style.amap-simple-marker-style-pass .amap-simple-marker-icon{background-position:0 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-blue-1 .amap-simple-marker-icon{background-position:-36px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-blue-3 .amap-simple-marker-icon{background-position:-72px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-blue-4 .amap-simple-marker-icon{background-position:-108px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-blue-5 .amap-simple-marker-icon{background-position:-144px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-blue-6 .amap-simple-marker-icon{background-position:-180px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-blue-7 .amap-simple-marker-icon{background-position:-216px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-blue-8 .amap-simple-marker-icon{background-position:-252px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-blue-9 .amap-simple-marker-icon{background-position:-288px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-blue-10 .amap-simple-marker-icon{background-position:-324px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-blue-11 .amap-simple-marker-icon{background-position:-360px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-blue-12 .amap-simple-marker-icon{background-position:-396px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-blue-13 .amap-simple-marker-icon{background-position:-432px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-blue-14 .amap-simple-marker-icon{background-position:-468px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-blue-15 .amap-simple-marker-icon{background-position:-504px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-blue-16 .amap-simple-marker-icon{background-position:-540px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-blue-17 .amap-simple-marker-icon{background-position:-576px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-blue-18 .amap-simple-marker-icon{background-position:-612px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-blue-19 .amap-simple-marker-icon{background-position:-648px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-blue-20 .amap-simple-marker-icon{background-position:-684px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-blue .amap-simple-marker-icon{background-position:-720px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-end .amap-simple-marker-icon{background-position:-756px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-blue-2 .amap-simple-marker-icon{background-position:-792px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-red-1 .amap-simple-marker-icon{background-position:-828px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-red-2 .amap-simple-marker-icon{background-position:-864px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-red-3 .amap-simple-marker-icon{background-position:-900px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-red-4 .amap-simple-marker-icon{background-position:-936px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-red-5 .amap-simple-marker-icon{background-position:-972px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-red-6 .amap-simple-marker-icon{background-position:-1008px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-red-7 .amap-simple-marker-icon{background-position:-1044px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-red-8 .amap-simple-marker-icon{background-position:-1080px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-red-9 .amap-simple-marker-icon{background-position:-1116px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-red-10 .amap-simple-marker-icon{background-position:-1152px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-red-11 .amap-simple-marker-icon{background-position:-1188px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-red-12 .amap-simple-marker-icon{background-position:-1224px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-red-13 .amap-simple-marker-icon{background-position:-1260px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-red-14 .amap-simple-marker-icon{background-position:-1296px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-red-15 .amap-simple-marker-icon{background-position:-1332px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-red-16 .amap-simple-marker-icon{background-position:-1368px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-red-17 .amap-simple-marker-icon{background-position:-1404px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-red-18 .amap-simple-marker-icon{background-position:-1440px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-red-19 .amap-simple-marker-icon{background-position:-1476px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-red-20 .amap-simple-marker-icon{background-position:-1512px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-red .amap-simple-marker-icon{background-position:-1548px 0}.amap-simple-marker-numv1-style.amap-simple-marker-style-start .amap-simple-marker-icon{background-position:-1584px 0}.amap-simple-marker-numv2-style .amap-simple-marker-label{line-height:35px}.amap-simple-marker-numv2-style .amap-simple-marker-icon,.amap-simple-marker.amap-simple-marker-numv2-style{width:36px;height:36px;display:block;text-align:center}.amap-simple-marker-numv2-style .amap-simple-marker-icon{background:url(" + AMapUI.getBaseUrl() + "ui/overlay/SimpleMarker/assets/numv2/numv2-fs8.png) no-repeat;background-position:-10000px -10000px}@media (min--moz-device-pixel-ratio:1.5),(-o-min-device-pixel-ratio:3/2),(-webkit-min-device-pixel-ratio:1.5),(min-device-pixel-ratio:1.5),(min-resolution:1.5dppx){.amap-simple-marker-numv2-style .amap-simple-marker-icon{background-image:url(" + AMapUI.getBaseUrl() + "ui/overlay/SimpleMarker/assets/numv2/numv2_2x-fs8.png);background-size:1548px 36px}}.amap-simple-marker-numv2-style.amap-simple-marker-style-lightblue .amap-simple-marker-icon{background-position:0 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-blue-1 .amap-simple-marker-icon{background-position:-36px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-blue-3 .amap-simple-marker-icon{background-position:-72px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-blue-4 .amap-simple-marker-icon{background-position:-108px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-blue-5 .amap-simple-marker-icon{background-position:-144px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-blue-6 .amap-simple-marker-icon{background-position:-180px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-blue-7 .amap-simple-marker-icon{background-position:-216px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-blue-8 .amap-simple-marker-icon{background-position:-252px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-blue-9 .amap-simple-marker-icon{background-position:-288px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-blue-10 .amap-simple-marker-icon{background-position:-324px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-blue-11 .amap-simple-marker-icon{background-position:-360px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-blue-12 .amap-simple-marker-icon{background-position:-396px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-blue-13 .amap-simple-marker-icon{background-position:-432px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-blue-14 .amap-simple-marker-icon{background-position:-468px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-blue-15 .amap-simple-marker-icon{background-position:-504px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-blue-16 .amap-simple-marker-icon{background-position:-540px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-blue-17 .amap-simple-marker-icon{background-position:-576px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-blue-18 .amap-simple-marker-icon{background-position:-612px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-blue-19 .amap-simple-marker-icon{background-position:-648px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-blue-20 .amap-simple-marker-icon{background-position:-684px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-blue .amap-simple-marker-icon{background-position:-720px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-blue-2 .amap-simple-marker-icon{background-position:-756px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-red-1 .amap-simple-marker-icon{background-position:-792px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-red-2 .amap-simple-marker-icon{background-position:-828px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-red-3 .amap-simple-marker-icon{background-position:-864px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-red-4 .amap-simple-marker-icon{background-position:-900px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-red-5 .amap-simple-marker-icon{background-position:-936px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-red-6 .amap-simple-marker-icon{background-position:-972px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-red-7 .amap-simple-marker-icon{background-position:-1008px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-red-8 .amap-simple-marker-icon{background-position:-1044px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-red-9 .amap-simple-marker-icon{background-position:-1080px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-red-10 .amap-simple-marker-icon{background-position:-1116px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-red-11 .amap-simple-marker-icon{background-position:-1152px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-red-12 .amap-simple-marker-icon{background-position:-1188px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-red-13 .amap-simple-marker-icon{background-position:-1224px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-red-14 .amap-simple-marker-icon{background-position:-1260px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-red-15 .amap-simple-marker-icon{background-position:-1296px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-red-16 .amap-simple-marker-icon{background-position:-1332px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-red-17 .amap-simple-marker-icon{background-position:-1368px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-red-18 .amap-simple-marker-icon{background-position:-1404px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-red-19 .amap-simple-marker-icon{background-position:-1440px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-red-20 .amap-simple-marker-icon{background-position:-1476px 0}.amap-simple-marker-numv2-style.amap-simple-marker-style-red .amap-simple-marker-icon{background-position:-1512px 0}");