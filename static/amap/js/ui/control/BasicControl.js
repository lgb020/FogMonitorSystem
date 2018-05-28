AMapUI.weakDefine("ui/control/BasicControl/ctrls/base", [ "lib/utils", "lib/event" ], function(utils, EventCls) {
    function BaseCtrl(opts) {
        this.opts = utils.extend({
            position: "lt"
        }, opts);
        BaseCtrl.__super__.constructor.call(this, this.opts);
        this._initContainer();
        this.setPosition(this.opts.position);
        this.setTheme();
        this.opts.map && this.addToMap(this.opts.map);
    }
    utils.inherit(BaseCtrl, EventCls);
    utils.extend(BaseCtrl.prototype, {
        _initContainer: function() {
            this.domNodes = {};
            this.domNodes.container = $('<div class="amap-ui-control-container"></div>');
            this.domNodes.container.toggleClass("amap-ui-mobile", AMap.UA.mobile);
            this.domNodes.container.toggleClass("amap-ui-retina", window.devicePixelRatio > 1);
            this.setupControl(this.domNodes.container);
        },
        setTheme: function(theme) {
            this._setClsOpt("theme", "amap-ui-control-theme-", theme);
            return this;
        },
        setPosition: function(newPos) {
            if (utils.isObject(newPos)) {
                this.domNodes.container.css(newPos);
                newPos = !1;
            }
            this._setClsOpt("position", "amap-ui-control-position-", newPos);
            return this;
        },
        _setClsOpt: function(optName, clsPre, val) {
            var oldVal;
            if (void 0 === val) {
                oldVal = "";
                val = this.opts[optName];
            } else oldVal = this.opts[optName];
            oldVal && this.domNodes.container.removeClass(clsPre + (oldVal + "").toLowerCase());
            val && this.domNodes.container.addClass(clsPre + (val + "").toLowerCase());
            this.opts[optName] = val;
        },
        setupControl: function() {
            throw new Error("Not implement!");
        },
        getContainerElement: function() {
            return this.domNodes.container.get(0);
        },
        getMap: function() {
            return this.apiMap;
        },
        addTo: function(map) {
            this.apiMap = map;
            var ele = this.getContainerElement();
            if (ele) {
                this.emit("willAddToMap", map);
                map.getContainer().appendChild(ele);
                this.emit("addToMap", map);
            }
        },
        removeFrom: function(map) {
            var ele = this.getContainerElement();
            if (ele && ele.parentNode === map.getContainer()) {
                this.emit("willRemoveFromMap", map);
                this.apiMap = null;
                ele.parentNode.removeChild(ele);
                this.emit("removeFromMap", map);
            }
        }
    });
    return BaseCtrl;
});

AMapUI.weakDefine("polyfill/require/require-text/text!ui/control/BasicControl/tpl/layer-switcher/container.html", [], function() {
    return '<div class="amap-ui-control-layer">\n    <a class="amap-ui-control-layer-toggle"><i class="iconfont icon-layer-switcher"></i></a>\n    <form class="amap-ui-control-layer-list">\n        <div class="amap-ui-control-layer-base">\n            <% for(var i=0,len=baseLayers.length; i<len; i++) { var layer = baseLayers[i]; %>\n            <div class="amap-ui-control-layer-base-item amap-ui-control-layer-base-item-<%- layer.id %>">\n               <label>\n                    <input data-layer-id="<%- layer.id %>" type="radio" \n                    class="amap-ui-control-layer-selector" \n                    name="amap-ui-base-layers-<%- instanceId %>" <% if(layer.enable) { %>checked="checked"<%}%> ><span><%= layer.name %></span></label>\n            </div>\n            <% } %>\n        </div>\n        <div class="amap-ui-control-layer-separator"></div>\n        <div class="amap-ui-control-layer-overlays">\n            <% for(var i=0,len=overlayLayers.length; i<len; i++) { var layer = overlayLayers[i];  %>\n            <div class="amap-ui-control-layer-overlay-item amap-ui-control-layer-overlay-item-<%- layer.id %>">\n               <label>\n                    <input data-layer-id="<%- layer.id %>" type="checkbox" \n                    class="amap-ui-control-layer-selector" \n                    <% if(layer.enable){ %>checked="checked"<%}%> ><span><%= layer.name %></span></label>\n            </div>\n            <% } %>\n        </div>\n    </form>\n</div>\n';
});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/control/BasicControl/assets/iconfont/iconfont", [], function() {});

AMapUI.weakDefine("ui/control/BasicControl/iconfont", [ "css!./assets/iconfont/iconfont.css" ], function() {});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/control/BasicControl/themes/layer-switcher/base", [], function() {});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/control/BasicControl/themes/layer-switcher/light", [], function() {});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/control/BasicControl/themes/layer-switcher/dark", [], function() {});

AMapUI.weakDefine("ui/control/BasicControl/ctrls/layer-switcher", [ "lib/utils", "./base", "lib/underscore-tpl", "lib/$", "text!../tpl/layer-switcher/container.html", "../iconfont", "css!../themes/layer-switcher/base", "css!../themes/layer-switcher/light", "css!../themes/layer-switcher/dark" ], function(utils, BaseCtrl, template, $, containerTpl) {
    function LayerSwitcher(opts) {
        this.opts = utils.extend({
            theme: "light",
            position: "rt",
            instanceId: baseId++
        }, opts);
        this.opts.baseLayers || (this.opts.baseLayers = this.getDefaultBaseLayers());
        this.opts.overlayLayers || (this.opts.overlayLayers = this.getDefaultOverlayLayers());
        LayerSwitcher.__super__.constructor.call(this, this.opts);
        this.on("willAddToMap", function(map) {
            map.on("click", this._eventHandlers.mapClick);
            this.syncPropsToUI();
            this._refreshMapLayers();
            this._bindEvents(!0);
        });
        this.on("willRemoveFromMap", function(map) {
            map.off("click", this._eventHandlers.mapClick);
            this._bindEvents(!1);
        });
    }
    var baseId = 1;
    utils.inherit(LayerSwitcher, BaseCtrl);
    utils.extend(LayerSwitcher.prototype, {
        getDefaultBaseLayers: function() {
            return [ {
                enable: !0,
                id: "tile",
                name: '<i class="iconfont icon-tilelayer"></i>标准图',
                layer: new AMap.TileLayer()
            }, {
                id: "satellite",
                name: '<i class="iconfont icon-tilelayer-satellite"></i>卫星图',
                layer: new AMap.TileLayer.Satellite()
            } ];
        },
        getDefaultOverlayLayers: function() {
            return [ {
                id: "traffic",
                name: '<i class="iconfont icon-tilelayer-traffic"></i>路况图',
                layer: new AMap.TileLayer.Traffic()
            }, {
                id: "roadNet",
                name: '<i class="iconfont icon-tilelayer-roadnet"></i>路网图',
                layer: new AMap.TileLayer.RoadNet()
            } ];
        },
        setupControl: function(container) {
            container.html(template(containerTpl, this.opts));
            this.domNodes.layerCtrl = container.find("div.amap-ui-control-layer");
            this._eventHandlers = this._getEventHandlers();
        },
        refreshUIAndLayers: function() {
            var containerEle = this.getContainerElement();
            containerEle && $(containerEle).html(template(containerTpl, this.opts));
            this.refreshLayers();
        },
        refreshLayers: function() {
            this._refreshMapLayers();
        },
        enableLayerById: function(id) {
            this.toggleLayerById(id, !0);
        },
        disableLayerById: function(id) {
            this.toggleLayerById(id, !1);
        },
        toggleLayerById: function(id, enable) {
            var layerInfo = this.getLayerInfoById(id);
            enable = !!enable;
            if (layerInfo) {
                layerInfo.enable = !!layerInfo.enable;
                if (layerInfo.enable !== enable) {
                    layerInfo.enable = enable;
                    this.refreshLayers();
                }
            }
        },
        destory: function() {},
        _getEventHandlers: function() {
            var self = this;
            return {
                layerInputClick: function(e) {
                    e.stopPropagation();
                    var target = this;
                    if ("INPUT" === target.tagName) {
                        self.syncPropsFromUI();
                        self._refreshMapLayers();
                    }
                },
                toggleBtnClick: function(e) {
                    e.stopPropagation();
                    self.showLayersPanel();
                },
                documentClick: function(e) {
                    $.contains(self.domNodes.container.get(0), e.target) || self.hideLayersPanel();
                },
                mapClick: function() {
                    self.hideLayersPanel();
                },
                containerMouseover: function() {
                    self.showLayersPanel();
                },
                containerMouseout: function() {
                    self.hideLayersPanel();
                }
            };
        },
        _bindEvents: function(on) {
            var container = this.domNodes.container, action = on ? "on" : "off";
            container[action]("click", "input", this._eventHandlers.layerInputClick);
            if (AMap.UA.mobile) {
                container[action]("click", ".amap-ui-control-layer-toggle", this._eventHandlers.toggleBtnClick);
                $(document)[action]("click", this._eventHandlers.documentClick);
            } else {
                container[action]("mouseover", ".amap-ui-control-layer", this._eventHandlers.containerMouseover);
                container[action]("mouseout", ".amap-ui-control-layer", this._eventHandlers.containerMouseout);
            }
        },
        getEnabledLayers: function() {
            for (var layers = this.opts.baseLayers.concat(this.opts.overlayLayers), enabledLayers = [], i = 0, len = layers.length; i < len; i++) layers[i].enable && enabledLayers.push(layers[i].layer);
            return enabledLayers;
        },
        getLayerInfoById: function(id) {
            for (var layers = this.opts.baseLayers.concat(this.opts.overlayLayers), i = 0, len = layers.length; i < len; i++) if (layers[i].id === id) return layers[i];
            return null;
        },
        _getLayerSwitcherElems: function() {
            for (var container = this.domNodes.container, formEles = container.find("input").get(), layerCtrlEles = {}, i = 0, len = formEles.length; i < len; i++) {
                var ele = formEles[i], layerId = ele.getAttribute("data-layer-id");
                layerId && (layerCtrlEles[layerId] = ele);
            }
            return layerCtrlEles;
        },
        syncPropsFromUI: function() {
            for (var layers = this.opts.baseLayers.concat(this.opts.overlayLayers), layerCtrlEles = this._getLayerSwitcherElems(), i = 0, len = layers.length; i < len; i++) {
                var ctrlEle = layerCtrlEles[layers[i].id];
                if (ctrlEle) {
                    var enableStat = !!ctrlEle.checked, layerEnableStat = !!layers[i].enable;
                    if (layerEnableStat !== enableStat) {
                        layers[i].enable = enableStat;
                        this._triggerLayerPropChanged(layers[i], {
                            enable: enableStat
                        });
                    }
                }
            }
        },
        syncPropsToUI: function() {
            for (var layers = this.opts.baseLayers.concat(this.opts.overlayLayers), layerCtrlEles = this._getLayerSwitcherElems(), i = 0, len = layers.length; i < len; i++) {
                var ctrlEle = layerCtrlEles[layers[i].id];
                ctrlEle && (ctrlEle.checked = layers[i].enable);
            }
        },
        toggleLayersPanel: function(state) {
            return this.domNodes.layerCtrl.toggleClass("amap-ui-control-layer-expanded", state);
        },
        showLayersPanel: function() {
            return this.toggleLayersPanel(!0);
        },
        hideLayersPanel: function() {
            return this.toggleLayersPanel(!1);
        },
        _triggerLayerPropChanged: function(layer, props) {
            this.emit("layerPropChanged", {
                layer: layer,
                props: props
            });
        },
        _refreshMapLayers: function() {
            if (this.apiMap) for (var layers = this.opts.baseLayers.concat(this.opts.overlayLayers), i = 0, len = layers.length; i < len; i++) layers[i].layer.setMap(layers[i].enable ? this.apiMap : null);
        }
    });
    return LayerSwitcher;
});

AMapUI.weakDefine("polyfill/require/require-text/text!ui/control/BasicControl/tpl/zoom/container.html", [], function() {
    return '<div class="amap-ui-control-zoom">\n    <a class="amap-ui-control-zoom-in zoom-btn disabled" title="放大" role="button">+</a>\n    <div class="amap-ui-control-zoom-num hidden"></div>\n    <a class="amap-ui-control-zoom-out zoom-btn" title="缩小" role="button">−</a>\n</div>';
});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/control/BasicControl/themes/zoom/base", [], function() {});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/control/BasicControl/themes/zoom/light", [], function() {});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/control/BasicControl/themes/zoom/dark", [], function() {});

AMapUI.weakDefine("ui/control/BasicControl/ctrls/zoom", [ "lib/utils", "./base", "lib/underscore-tpl", "lib/$", "text!../tpl/zoom/container.html", "css!../themes/zoom/base", "css!../themes/zoom/light", "css!../themes/zoom/dark" ], function(utils, BaseCtrl, template, $, containerTpl) {
    function Zoom(opts) {
        this.opts = utils.extend({
            theme: "light",
            position: "rt",
            showZoomNum: !1
        }, opts);
        Zoom.__super__.constructor.call(this, this.opts);
        this.on("willAddToMap", function(map) {
            map.on("zooms", this._eventHandlers.zoomsChanged);
            map.on("zoomchange", this._eventHandlers.zoomChanged);
            this._refreshUI();
            this._bindEvents(!0);
        });
        this.on("willRemoveFromMap", function(map) {
            map.off("zooms", this._eventHandlers.zoomsChanged);
            map.off("zoomchange", this._eventHandlers.zoomChanged);
            this._bindEvents(!1);
        });
    }
    utils.inherit(Zoom, BaseCtrl);
    utils.extend(Zoom.prototype, {
        setupControl: function(container) {
            container.html(template(containerTpl, this.opts));
            utils.extend(this.domNodes, {
                layerCtrl: container.find("div.amap-ui-control-zoom"),
                zoomNum: container.find(".amap-ui-control-zoom-num"),
                zoomIn: container.find(".amap-ui-control-zoom-in"),
                zoomOut: container.find(".amap-ui-control-zoom-out")
            });
            this._eventHandlers = this._getEventHandlers();
        },
        destory: function() {},
        _getEventHandlers: function() {
            var self = this, handlers = {
                zoomOut: function() {
                    self.zoomOut();
                },
                zoomIn: function() {
                    self.zoomIn();
                },
                zoomsChanged: function() {
                    self.zoomsChanged();
                },
                zoomChanged: function() {
                    self._refreshUI();
                },
                mousewheel: function(e) {
                    e.stopPropagation();
                    var event = e.originalEvent || e, delta = 0;
                    event.wheelDelta ? delta = event.wheelDelta : event.detail && (delta = -event.detail);
                    delta > 0 ? self.zoomIn() : delta < 0 && self.zoomOut();
                }
            };
            handlers.mousewheel = utils.throttle(handlers.mousewheel, 200);
            return handlers;
        },
        zoomsChanged: function() {
            this._refreshUI();
        },
        zoomOut: function() {
            var map = this.getMap();
            if (map) {
                map.zoomOut();
                this._refreshUI();
            }
        },
        zoomIn: function() {
            var map = this.getMap();
            if (map) {
                map.zoomIn();
                this._refreshUI();
            }
        },
        toggleZoomNum: function(state) {
            this.opts.showZoomNum = void 0 === state ? !this.opts.showZoomNum : state;
            this._refreshUI();
        },
        showZoomNum: function() {
            return this.toggleZoomNum(!0);
        },
        hideZoomNum: function() {
            return this.toggleZoomNum(!1);
        },
        _refreshUI: function() {
            var map = this.getMap();
            if (map) {
                var zooms = map.get("zooms"), zoom = map.getZoom();
                this.domNodes.zoomNum.toggleClass("hidden", !this.opts.showZoomNum).html(zoom);
                this.domNodes.zoomIn.toggleClass("disabled", zoom >= zooms[1]);
                this.domNodes.zoomOut.toggleClass("disabled", zoom <= zooms[0]);
            }
        },
        _bindEvents: function(on) {
            var container = this.domNodes.container, action = on ? "on" : "off";
            container[action]("click", ".amap-ui-control-zoom-out", this._eventHandlers.zoomOut);
            container[action]("click", ".amap-ui-control-zoom-in", this._eventHandlers.zoomIn);
            AMap.UA.mobile || container[action]("mousewheel DOMMouseScroll", this._eventHandlers.mousewheel);
        }
    });
    return Zoom;
});

AMapUI.weakDefine("polyfill/require/require-text/text!ui/control/BasicControl/tpl/traffic/button.html", [], function() {
    return '<div class="amap-ui-control-traffic">\n    <div class="amap-ui-control-traffic-lights closed"></div>\n    <div class="amap-ui-control-traffic-text">路况</div>\n</div>\n';
});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/control/BasicControl/themes/traffic/base", [], function() {});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/control/BasicControl/themes/traffic/dark", [], function() {});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/control/BasicControl/themes/traffic/normal", [], function() {});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/control/BasicControl/themes/traffic/dark-simple", [], function() {});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/control/BasicControl/themes/traffic/normal-simple", [], function() {});

AMapUI.weakDefine("ui/control/BasicControl/ctrls/traffic", [ "lib/utils", "./base", "lib/underscore-tpl", "lib/$", "text!../tpl/traffic/button.html", "css!../themes/traffic/base", "css!../themes/traffic/dark", "css!../themes/traffic/normal", "css!../themes/traffic/dark-simple", "css!../themes/traffic/normal-simple" ], function(utils, BaseCtrl, template, $, containerTpl) {
    function Traffic(opts) {
        this.opts = utils.extend({
            theme: "normal",
            open: !0,
            position: {
                right: "20px",
                top: "20px"
            },
            "autoRefresh": !0,
            "interval": 30,
            "showButton": !0
        }, opts);
        Traffic.__super__.constructor.call(this, this.opts);
        this.layer = new AMap.TileLayer.Traffic({
            "autoRefresh": this.opts.autoRefresh,
            "interval": this.opts.interval
        });
        this.on("willAddToMap", function(map) {
            this.layer.setMap(map);
            this._refreshUI();
        });
        this.on("willRemoveFromMap", function() {
            this.layer.setMap();
        });
    }
    utils.inherit(Traffic, BaseCtrl);
    utils.extend(Traffic.prototype, {
        setupControl: function(container) {
            container.html(template(containerTpl, this.opts));
            utils.extend(this.domNodes, {
                lights: container.find(".amap-ui-control-traffic-lights")
            });
            this._eventHandlers = this._getEventHandlers();
            this._bindEvents(!0);
        },
        destory: function() {
            this._bindEvents(!1);
        },
        _getEventHandlers: function() {
            var self = this, handlers = {
                _switch: function() {
                    self._switch();
                }
            };
            return handlers;
        },
        _switch: function(ifOpen) {
            "undefined" != typeof ifOpen ? this.opts.open = !!ifOpen : this.opts.open = !this.opts.open;
            this._refreshUI();
        },
        close: function() {
            this._switch(!1);
        },
        open: function() {
            this._switch(!0);
        },
        showButton: function() {
            this.opts.showButton = !0;
            this._refreshUI();
        },
        hideButton: function() {
            this.opts.showButton = !1;
            this._refreshUI();
        },
        _refreshUI: function() {
            var map = this.getMap();
            if (map) {
                this.opts.open ? this.layer.show() : this.layer.hide();
                this.domNodes.lights.toggleClass("closed", !this.opts.open);
                this.domNodes.container.toggleClass("hided", !this.opts.showButton);
            }
        },
        _bindEvents: function(on) {
            var container = this.domNodes.container, action = on ? "on" : "off";
            container[action]("click", "", this._eventHandlers._switch);
        }
    });
    return Traffic;
});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/control/BasicControl/themes/base", [], function() {});

AMapUI.weakDefine("ui/control/BasicControl/main", [ "lib/utils", "./ctrls/layer-switcher", "./ctrls/zoom", "./ctrls/traffic", "css!./themes/base" ], function(utils, LayerSwitcher, Zoom, Traffic) {
    return {
        LayerSwitcher: LayerSwitcher,
        Zoom: Zoom,
        Traffic: Traffic
    };
});

AMapUI.weakDefine("ui/control/BasicControl", [ "ui/control/BasicControl/main" ], function(m) {
    return m;
});

!function(c) {
    var d = document, a = "appendChild", i = "styleSheet", s = d.createElement("style");
    s.type = "text/css";
    d.getElementsByTagName("head")[0][a](s);
    s[i] ? s[i].cssText = c : s[a](d.createTextNode(c));
}('@font-face{font-family:"iconfont";src:url(' + AMapUI.getBaseUrl() + "ui/control/BasicControl/assets/iconfont/iconfont.eot?t=1484100304708);src:url(" + AMapUI.getBaseUrl() + "ui/control/BasicControl/assets/iconfont/iconfont.eot?t=1484100304708#iefix) format('embedded-opentype'),url(" + AMapUI.getBaseUrl() + "ui/control/BasicControl/assets/iconfont/iconfont.woff?t=1484100304708) format('woff'),url(" + AMapUI.getBaseUrl() + "ui/control/BasicControl/assets/iconfont/iconfont.ttf?t=1484100304708) format('truetype'),url(" + AMapUI.getBaseUrl() + 'ui/control/BasicControl/assets/iconfont/iconfont.svg?t=1484100304708#iconfont) format(\'svg\')}.iconfont{font-family:"iconfont"!important;font-size:16px;font-style:normal;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.icon-tilelayer-roadnet:before{content:"\\e62f"}.icon-geolocation:before{content:"\\e630"}.icon-tilelayer:before{content:"\\e605"}.icon-tilelayer-traffic:before{content:"\\e63e"}.icon-tilelayer-satellite:before{content:"\\e653"}.icon-zoom-in:before{content:"\\e62c"}.icon-zoom-out:before{content:"\\e62d"}.icon-layer-switcher:before{content:"\\e6e0"}.amap-ui-control-layer-toggle{background-position:50% 50%;background-repeat:no-repeat;display:block}.amap-ui-control-layer{border-radius:3px}.amap-ui-control-layer .iconfont{font-size:inherit;margin-right:2px}.amap-ui-control-layer-toggle{width:34px;height:34px;line-height:34px;font-size:22px;text-align:center}.amap-ui-control-layer .amap-ui-control-layer-list,.amap-ui-control-layer-expanded .amap-ui-control-layer-toggle{display:none}.amap-ui-control-layer-expanded .amap-ui-control-layer-list{display:block;position:relative}.amap-ui-control-layer-expanded{padding:6px 10px 6px 6px}.amap-ui-control-layer-scrollbar{overflow-y:scroll;padding-right:5px}.amap-ui-control-layer-selector{margin-top:2px;position:relative;top:1px}.amap-ui-control-layer label{display:block;line-height:130%}.amap-ui-mobile .amap-ui-control-layer label{font-size:130%;line-height:150%}.amap-ui-mobile .amap-ui-control-layer-toggle{width:42px;height:42px;font-size:26px;line-height:42px}.amap-ui-control-layer-separator{height:0;border-top:1px solid #ddd;margin:5px -10px 5px -6px}.amap-ui-control-theme-light .amap-ui-control-layer{box-shadow:0 1px 5px rgba(0,0,0,.4);background:#fff}.amap-ui-control-theme-light .amap-ui-control-layer-expanded{color:#333;background:#fff}.amap-ui-control-theme-light .amap-ui-control-layer-toggle{color:#333}.amap-ui-control-theme-dark .amap-ui-control-layer{box-shadow:0 1px 5px rgba(0,0,0,.4);background:#000}.amap-ui-control-theme-dark .amap-ui-control-layer-expanded{color:#fff;background:#000}.amap-ui-control-theme-dark .amap-ui-control-layer-toggle{color:#ccc}.amap-ui-control-zoom{border:1px solid #ccc;background-clip:padding-box;border-radius:3px;width:32px;overflow:hidden;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.amap-ui-control-zoom a,.amap-ui-control-zoom-num{background-color:#fff;border-bottom:1px solid #ccc;width:32px;height:36px;line-height:36px;text-align:center;text-decoration:none;color:#333;display:block;cursor:pointer}.amap-ui-mobile .amap-ui-control-zoom{width:40px}.amap-ui-mobile .amap-ui-control-zoom a,.amap-ui-mobile .amap-ui-control-zoom-num{width:40px;line-height:44px;height:44px}.amap-ui-control-zoom a{font-size:26px;font-family:verdana}.amap-ui-control-zoom-num{font-size:16px}.amap-ui-control-zoom-num.hidden{display:none}.amap-ui-control-zoom .amap-ui-control-zoom-out{border-bottom:none}.amap-ui-control-zoom a.disabled{cursor:default;background-color:#f4f4f4;color:#bbb}.amap-ui-control-theme-light .amap-ui-control-zoom{border-color:#ccc}.amap-ui-control-theme-light .amap-ui-control-zoom a,.amap-ui-control-theme-light .amap-ui-control-zoom-num{background-color:#fff;border-bottom-color:#ccc;color:#333}.amap-ui-control-theme-light .amap-ui-control-zoom a:hover{background-color:#f4f4f4}.amap-ui-control-theme-light .amap-ui-control-zoom a:active{background-color:#ccc}.amap-ui-control-theme-light .amap-ui-control-zoom a.disabled{background-color:#f4f4f4;color:#bbb}.amap-ui-control-theme-dark .amap-ui-control-zoom{border-color:#ccc}.amap-ui-control-theme-dark .amap-ui-control-zoom a,.amap-ui-control-theme-dark .amap-ui-control-zoom-num{background-color:#333;border-bottom-color:#ccc;color:#fff}.amap-ui-control-theme-dark .amap-ui-control-zoom a:hover{background-color:#222}.amap-ui-control-theme-dark .amap-ui-control-zoom a:active{background-color:#000}.amap-ui-control-theme-dark .amap-ui-control-zoom a.disabled{background-color:#666;color:#bbb}.amap-ui-control-traffic{width:32px;height:32px;cursor:pointer}.amap-ui-control-traffic-lights{width:100%;height:100%;border-radius:4px;border:solid 1px silver;box-shadow:1px 1px 2px silver}.amap-ui-control-traffic-text{font-family:微软雅黑,Microsoft YaHei,Arial,sans-serif;height:45%;position:absolute;bottom:2px;text-align:center;font-size:12px;width:100%;user-select:none}.closed{filter:gray;-webkit-filter:grayscale(100%)}.hided{display:none}.amap-ui-control-theme-dark .amap-ui-control-traffic-lights{background:url(' + AMapUI.getBaseUrl() + "ui/control/BasicControl/assets/trafficlights2.png) no-repeat rgba(0,0,0,.4) 50% 20%;border:none}.amap-ui-control-theme-dark .amap-ui-control-traffic-text{color:#fff}.amap-ui-control-theme-normal .amap-ui-control-traffic-lights{background:url(" + AMapUI.getBaseUrl() + "ui/control/BasicControl/assets/trafficlights2.png) no-repeat #fff 50% 20%}.amap-ui-control-theme-normal .amap-ui-control-traffic-text{color:#000}.amap-ui-control-theme-dark-simple .amap-ui-control-traffic-lights{background:url(" + AMapUI.getBaseUrl() + "ui/control/BasicControl/assets/trafficlights2.png) no-repeat rgba(0,0,0,.4) 50% 50%;border:none}.amap-ui-control-theme-dark-simple .amap-ui-control-traffic-text{display:none}.amap-ui-control-theme-normal-simple .amap-ui-control-traffic-lights{background:url(" + AMapUI.getBaseUrl() + "ui/control/BasicControl/assets/trafficlights2.png) no-repeat #fff 50% 50%}.amap-ui-control-theme-normal-simple .amap-ui-control-traffic-text{display:none}.amap-ui-control-container{position:absolute}.amap-ui-control-position-rt,.amap-ui-control-position-tr{top:30px;right:30px}.amap-ui-control-position-lt,.amap-ui-control-position-tl{top:30px;left:30px}.amap-ui-control-position-bl,.amap-ui-control-position-lb{bottom:30px;left:30px}.amap-ui-control-position-br,.amap-ui-control-position-rb{bottom:30px;right:30px}.amap-ui-control-position-lm,.amap-ui-control-position-ml,.amap-ui-control-position-mr,.amap-ui-control-position-rm{top:50%;-webkit-transform:translateY(-50%);transform:translateY(-50%)}.amap-ui-control-position-mr,.amap-ui-control-position-rm{right:30px}.amap-ui-control-position-lm,.amap-ui-control-position-ml{left:30px}.amap-ui-control-position-bc,.amap-ui-control-position-cb,.amap-ui-control-position-ct,.amap-ui-control-position-tc{left:50%;-webkit-transform:translateX(-50%);transform:translateX(-50%)}.amap-ui-control-position-ct,.amap-ui-control-position-tc{top:30px}.amap-ui-control-position-bc,.amap-ui-control-position-cb{bottom:30px}");