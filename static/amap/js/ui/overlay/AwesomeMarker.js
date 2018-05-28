AMapUI.weakDefine("ui/overlay/AwesomeMarker/main", [ "lib/utils", "ui/overlay/SimpleMarker/main", "css!plug/ext/font-awesome/css/font-awesome", "css!./themes/base" ], function(utils, SimpleMarker) {
    function getClassnamesOfAwesomeIcon(icon) {
        return "fa fa-" + icon;
    }
    function AwesomeMarker(opts) {
        opts = utils.extend({
            awesomeIcon: "",
            getClassnamesOfAwesomeIcon: getClassnamesOfAwesomeIcon,
            iconStyle: "orange"
        }, opts);
        AwesomeMarker.__super__.constructor.call(this, opts);
        this.setAwesomeIcon(opts.awesomeIcon);
    }
    utils.inherit(AwesomeMarker, SimpleMarker);
    utils.extend(AwesomeMarker.prototype, {
        setAwesomeIcon: function(icon) {
            var iconLabel = this.opts.iconLabel;
            utils.isObject(iconLabel) || (iconLabel = {});
            utils.extend(iconLabel, {
                innerHTML: '<i class="' + this.opts.getClassnamesOfAwesomeIcon(icon) + '"></i>'
            });
            this.setIconLabel(iconLabel);
        }
    });
    return AwesomeMarker;
});

AMapUI.weakDefine("ui/overlay/AwesomeMarker", [ "ui/overlay/AwesomeMarker/main" ], function(m) {
    return m;
});