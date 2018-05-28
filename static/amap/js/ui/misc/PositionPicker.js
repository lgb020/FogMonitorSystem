AMapUI.weakDefine("polyfill/require/require-css/css!ui/misc/PositionPicker/themes/pin", [], function() {});

AMapUI.weakDefine("ui/misc/PositionPicker/main", [ "require", "lib/utils", "lib/event", "css!./themes/pin.css" ], function(require, utils, EventCls) {
    function PositionPicker(opts) {
        var self = this;
        this.opts = utils.extend({
            iconStyle: {
                url: require.toUrl("./assets/position-picker.png"),
                size: [ 32, 32 ],
                ancher: [ 16, 32 ]
            },
            mode: "dragMap"
        }, opts);
        if (this.opts.map) {
            this.started = !1;
            PositionPicker.__super__.constructor.call(this, this.opts);
            this._eventHandlers = this._getEventHandlers();
            self._initDom();
        } else console.error && console.error("请为PositionPicker指定map属性");
    }
    utils.inherit(PositionPicker, EventCls);
    utils.extend(PositionPicker.prototype, {
        _initDom: function() {
            var that = this, offx = -this.opts.iconStyle.ancher[0], offy = -this.opts.iconStyle.ancher[1], width = this.opts.iconStyle.size[0] + "px", height = this.opts.iconStyle.size[1] + "px";
            this.marker = new AMap.Marker({
                content: "<img src='" + this.opts.iconStyle.url + "' style='width:" + width + ";height:" + height + "'/img>",
                offset: new AMap.Pixel(offx, offy),
                position: this.opts.map.getCenter(),
                zIndex: 9999,
                draggable: !0,
                cursor: "pointer"
            });
            this.controlDom = document.createElement("div");
            this.controlDom.className = "amap-ui-misc-positionpicker";
            var image = document.createElement("img");
            image.src = this.opts.iconStyle.url;
            image.className = "amap-ui-misc-positionpicker-pin";
            image.style.width = width;
            image.style.height = height;
            image.style.top = offy + "px";
            image.style.left = offx + "px";
            this.controlDom.appendChild(image);
            this.customControl = {
                dom: this.controlDom,
                addTo: function() {
                    that.opts.map.getContainer().appendChild(this.dom);
                },
                removeFrom: function() {
                    var mapContainer = that.opts.map.getContainer();
                    this.dom.parentNode === mapContainer && mapContainer.removeChild(this.dom);
                }
            };
        },
        reverseDirection: function(before) {
            switch (before) {
              case "东":
                return "西";

              case "南":
                return "北";

              case "西":
                return "东";

              case "北":
                return "南";

              case "东北":
                return "西南";

              case "东南":
                return "西北";

              case "西南":
                return "东北";

              case "西北":
                return "东南";

              default:
                return "";
            }
        },
        _getEventHandlers: function() {
            var self = this;
            return {
                onMapDragEnd: function() {
                    self.getPosition(self.opts.map.getCenter());
                },
                onMarkerDragEnd: function(e) {
                    self.getPosition(e.target.getPosition());
                },
                onAddressGot: function(status, result, position) {
                    if ("complete" === status) {
                        result["position"] = result["regeocode"][0];
                        result["address"] = result["regeocode"]["formattedAddress"];
                        result["nearestJunction"] = "";
                        if (result["regeocode"]["crosses"].length) {
                            var nearestCross = result["regeocode"]["crosses"][0];
                            result["nearestJunction"] = nearestCross["first_name"] + "与" + nearestCross["second_name"] + "交叉口" + nearestCross["direction"] + (2 === nearestCross["direction"].length ? "方向" : "侧") + nearestCross["distance"] + "米";
                        }
                        result["nearestRoad"] = "";
                        if (result["regeocode"]["roads"].length) {
                            var nearestRoad = result["regeocode"]["roads"][0];
                            result["nearestRoad"] = nearestRoad["name"];
                        }
                        result["nearestPOI"] = "";
                        if (result["regeocode"]["pois"].length) {
                            var nearestPOI = result["regeocode"]["pois"][0];
                            result["nearestPOI"] = nearestPOI["name"] + self.reverseDirection(nearestPOI["direction"]) + "面" + nearestPOI["distance"] + "米";
                        }
                        result["position"] = position;
                        self.emit("success", result);
                    } else self.emit("fail", result);
                }
            };
        },
        getPosition: function(lnglat) {
            var self = this;
            AMap.plugin([ "AMap.Geocoder" ], function() {
                self.geocoder || (self.geocoder = new AMap.Geocoder({
                    extensions: "all"
                }));
                self.geocoder.getAddress(lnglat, function(status, result) {
                    self._eventHandlers.onAddressGot(status, result, lnglat);
                });
            });
        },
        start: function(position) {
            this.started = !0;
            var mode = this.opts.mode;
            if ("dragMarker" === mode) {
                this.marker.setMap(this.opts.map);
                this.marker.setPosition(position || this.opts.map.getCenter());
                position && this.opts.map.setCenter(position);
                this.marker.on("dragend", this._eventHandlers.onMarkerDragEnd);
                this.getPosition(this.marker.getPosition());
            } else if ("dragMap" === mode) {
                position && this.opts.map.setCenter(position);
                this.opts.map.addControl(this.customControl);
                this.opts.map.on("moveend", this._eventHandlers.onMapDragEnd);
                this.getPosition(this.opts.map.getCenter());
            }
        },
        stop: function() {
            this.started = !1;
            var mode = this.opts.mode;
            if ("dragMarker" === mode) {
                this.marker.setMap();
                this.marker.off("dragend", this._eventHandlers.onMarkerDragEnd);
            } else if ("dragMap" === mode) {
                this.opts.map.removeControl(this.customControl);
                this.opts.map.off("moveend", this._eventHandlers.onMapDragEnd);
            }
        },
        setMode: function(mode) {
            if (this.started) {
                this.stop();
                this.opts.mode = mode;
                this.start();
            } else this.opts.mode = mode;
        }
    });
    return PositionPicker;
});

AMapUI.weakDefine("ui/misc/PositionPicker", [ "ui/misc/PositionPicker/main" ], function(m) {
    return m;
});

!function(c) {
    var d = document, a = "appendChild", i = "styleSheet", s = d.createElement("style");
    s.type = "text/css";
    d.getElementsByTagName("head")[0][a](s);
    s[i] ? s[i].cssText = c : s[a](d.createTextNode(c));
}(".amap-ui-misc-positionpicker{width:0;height:0;overflow:visible;position:absolute;top:50%;left:50%}.amap-ui-misc-positionpicker-pin{position:absolute}");