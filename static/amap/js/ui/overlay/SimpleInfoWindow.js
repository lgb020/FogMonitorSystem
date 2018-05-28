AMapUI.weakDefine("polyfill/require/require-text/text!ui/overlay/SimpleInfoWindow/tpl/container.html", [], function() {
    return '<div class="amap-ui-smp-ifwn-container">\n    <a class="amap-ui-infowindow-close amap-ui-smp-ifwn-def-tr-close">&#10006;</a>\n    <div class="amap-ui-smp-ifwn-content-body">\n        <h3 class="amap-ui-infowindow-title amap-ui-smp-ifwn-info-title"><%= infoTitle %></h3>\n        <div class="amap-ui-infowindow-body amap-ui-smp-ifwn-info-content"><%= infoBody %></div>\n    </div>\n    <div class="amap-ui-smp-ifwn-combo-sharp"></div>\n</div>\n';
});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/overlay/SimpleInfoWindow/themes/base", [], function() {});

AMapUI.weakDefine("ui/overlay/SimpleInfoWindow/main", [ "lib/utils", "lib/underscore-tpl", "lib/$", "text!./tpl/container.html", "css!./themes/base" ], function(utils, template, $, containerTpl) {
    function SimpleInfoWindow(opts) {
        this.opts = utils.extend({
            isCustom: !0
        }, opts);
        this._initContainer();
        this.opts.content = this.domNodes.container.get(0);
        SimpleInfoWindow.__super__.constructor.call(this, this.opts);
    }
    utils.inherit(SimpleInfoWindow, AMap.InfoWindow);
    utils.extend(SimpleInfoWindow.prototype, {
        _initContainer: function() {
            this.domNodes = {};
            this.domNodes.container = $(this._getContainerHtml());
            var container = this.domNodes.container;
            this.domNodes.infoTitle = container.find(".amap-ui-infowindow-title");
            this.domNodes.infoBody = container.find(".amap-ui-infowindow-body");
            this._eventHandlers = this._getEventHandlers();
            this._bindEvents(!0);
        },
        get$Container: function() {
            return this.domNodes.container;
        },
        get$InfoTitle: function() {
            return this.domNodes.infoTitle;
        },
        get$InfoBody: function() {
            return this.domNodes.infoBody;
        },
        _getContainerHtml: function() {
            var dataOpts = utils.extend({}, this.opts, {
                infoTitle: this._getHtmlStr("infoTitle"),
                infoBody: this._getHtmlStr("infoBody")
            });
            return template(containerTpl, dataOpts);
        },
        setInfoTitle: function(title) {
            this.opts.infoTitle = title;
            this.domNodes.infoTitle.html(this._getHtmlStr("infoTitle"));
        },
        setInfoBody: function(body) {
            this.opts.infoBody = body;
            this.domNodes.infoBody.html(this._getHtmlStr("infoBody"));
        },
        setInfoTplData: function(infoTplData) {
            this.opts.infoTplData = infoTplData;
            this.setInfoTitle(this.opts.infoTitle);
            this.setInfoBody(this.opts.infoBody);
        },
        _getHtmlStr: function(k) {
            return this.opts.infoTplData ? template(this.opts[k], this.opts.infoTplData) : this.opts[k];
        },
        _getEventHandlers: function() {
            var self = this, handlers = {
                closeInfoWin: function() {
                    self.close();
                }
            };
            return handlers;
        },
        _bindEvents: function(on) {
            var container = this.domNodes.container, action = on ? "on" : "off";
            container[action]("click", ".amap-ui-infowindow-close", this._eventHandlers.closeInfoWin);
        }
    });
    return SimpleInfoWindow;
});

AMapUI.weakDefine("ui/overlay/SimpleInfoWindow", [ "ui/overlay/SimpleInfoWindow/main" ], function(m) {
    return m;
});

!function(c) {
    var d = document, a = "appendChild", i = "styleSheet", s = d.createElement("style");
    s.type = "text/css";
    d.getElementsByTagName("head")[0][a](s);
    s[i] ? s[i].cssText = c : s[a](d.createTextNode(c));
}(".amap-ui-smp-ifwn-container{position:relative}.amap-ui-smp-ifwn-def-tr-close{float:right;width:22px;height:22px;text-align:center;line-height:22px;margin:3px 3px 0;border-radius:2px;color:#666;cursor:pointer}.amap-ui-smp-ifwn-def-tr-close:hover{color:#333;background:#eee}.amap-ui-smp-ifwn-def-tr-close:active{color:#333;background:#ccc}.amap-ui-smp-ifwn-content-body{box-shadow:0 0 .5px rgba(0,0,100,.6);background:0 0 #fff;border-radius:2px;text-align:left;border:silver solid 1px;padding:3px}.amap-ui-smp-ifwn-combo-sharp{margin:-1px auto 0;background:url(" + AMapUI.getBaseUrl() + "ui/overlay/SimpleInfoWindow/assets/sharp.png) no-repeat -5px -16px;width:18px;height:9px}.amap-ui-smp-ifwn-info-title{font-size:110%;font-weight:400;text-overflow:ellipsis;white-space:nowrap;padding:2px 25px 2px 2px;border-bottom:1px solid #ccc;margin:0;line-height:150%}.amap-ui-smp-ifwn-info-content{padding:4px;color:#666;min-width:120px}");