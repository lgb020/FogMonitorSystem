AMapUI.weakDefine("polyfill/require/require-text/text!ui/misc/PoiPicker/tpl/suggest.html", [], function() {
    return '<div class="amap-ui-poi-picker-sugg">\n    <% if(suggs && suggs.length) { var emtpyStr=""; %>\n    <ul class="amap-ui-poi-picker-sugg-list">\n    \t<% for(var i=0,len=suggs.length; i<len; i++) { %>\n        <% var extraClass = suggs[i].id ? "":"sugg-no-id" %>\n        <li class="sugg-item <%= extraClass %>" data-poi-idx="<%= i + emtpyStr %>" data-poi-id="<%- suggs[i].id %>">\n            <span class="sugg-name"><%- suggs[i].name %></span>\n            <span class="sugg-district"><%- suggs[i].district %></span>\n            <span class="sugg-address"><%- suggs[i].address %></span>\n        </li>\n     \t<% } %>\n    </ul>\n    <% } else { %>\n    <p class="amap-ui-poi-picker-no-sugg"></p>\n    <% } %>\n</div>\n';
});

AMapUI.weakDefine("polyfill/require/require-css/css!ui/misc/PoiPicker/themes/base", [], function() {});

AMapUI.weakDefine("ui/misc/PoiPicker/main", [ "lib/utils", "lib/$", "lib/underscore-tpl", "lib/event", "text!./tpl/suggest.html", "css!./themes/base" ], function(utils, $, template, EventCls, suggestTpl) {
    function PoiPicker(opts) {
        var self = this;
        this.opts = utils.extend({
            city: "auto",
            autocompleteOptions: {},
            citySearchOptions: {},
            placeSearchOptions: {
                pageSize: 5
            },
            searchResultsContainer: null,
            suggestContainer: null
        }, opts);
        PoiPicker.__super__.constructor.call(this, this.opts);
        this.opts.input = this._getDomElement(this.opts.input);
        this.opts.suggestContainer = this._getDomElement(this.opts.suggestContainer) || this._createSuggestContainer();
        this.opts.searchResultsContainer = this._getDomElement(this.opts.searchResultsContainer) || this._createSearchResultsContainer();
        this._eventHandlers = this._getEventHandlers();
        AMap.plugin([ "AMap.Autocomplete", "AMap.CitySearch", "AMap.PlaceSearch" ], function() {
            self.autoComp = new AMap.Autocomplete(self.opts.autocompleteOptions);
            self.citysearch = new AMap.CitySearch(self.opts.citySearchOptions);
            self.placeSearch = new AMap.PlaceSearch(utils.extend(self.opts.placeSearchOptions, {
                panel: self.opts.searchResultsContainer
            }));
            AMap.event.addListener(self.placeSearch, "renderComplete", function() {
                self.showSearchResults();
                self.emit("afterUpdateSearchResultsContainerHtml");
            });
            AMap.event.addListener(self.placeSearch, "selectChanged", function(results) {
                self.emit("searchResultItemPicked", results.selected.data);
            });
            self.opts.city && ("auto" === self.opts.city ? self.citysearch.getLocalCity(function(status, result) {
                "complete" === status && "OK" === result.info && result && result.adcode && self.setCity(result.adcode);
            }) : utils.nextTick(function() {
                self.setCity(self.opts.city);
            }));
            self._initDom();
            self.on("suggestItemPicked", self._handleSuggestItemPicked);
            self.on("searchResultItemPicked", self._handleSearchResultItemPicked);
        });
    }
    utils.inherit(PoiPicker, EventCls);
    utils.extend(PoiPicker.prototype, {
        setCity: function(city) {
            this.autoComp.setCity(city);
            this.placeSearch.setCity(city);
            this._cityReady = city;
            this.emit("citySet", city);
        },
        onCityReady: function(cb) {
            if (this._cityReady) {
                var self = this;
                utils.nextTick(function() {
                    cb.call(self);
                });
            } else this.once("citySet", cb);
        },
        _createSearchResultsContainer: function() {
            var resultsContainer = $('<div class="amap-ui-poi-picker-search-results-container hidden"></div>');
            resultsContainer.insertAfter(this.opts.input);
            var self = this, adjustContainer = function() {
                self.isSearchResultsShown() && self._dockTargetBox(resultsContainer, self.opts.input);
            };
            this.on("afterUpdateSearchResultsContainerHtml", adjustContainer);
            this.on("beforeSearchByKeyword searchResultItemPicked searchResultsContainerBlur", this.hideSearchResults);
            $(window).on("resize", adjustContainer);
            this.on("beforeDestroy", function() {
                $(window).off("resize", adjustContainer);
            });
            return resultsContainer.get(0);
        },
        _createSuggestContainer: function() {
            var suggestContainer = $('<div class="amap-ui-poi-picker-sugg-container no-sugg hidden"></div>');
            suggestContainer.insertAfter(this.opts.input);
            var self = this, adjustContainer = function() {
                self.isSuggestShown() && self._dockTargetBox(suggestContainer, self.opts.input);
            };
            this.on("afterUpdateSuggestContainerHtml", adjustContainer);
            this.on("suggestItemPicked beforeSearchByKeyword suggestContainerBlur", this.hideSuggest);
            $(window).on("resize", adjustContainer);
            this.on("beforeDestroy", function() {
                $(window).off("resize", adjustContainer);
            });
            return suggestContainer.get(0);
        },
        searchByKeyword: function(keyword) {
            this.emit("beforeSearchByKeyword", keyword);
            keyword = keyword ? $.trim(keyword) : "";
            this.opts.input.value = keyword;
            keyword && this.placeSearch.search(keyword);
        },
        _handleSuggestItemPicked: function(suggItem) {
            suggItem.id ? this.emit("poiPicked", {
                item: suggItem,
                source: "suggest"
            }) : this.searchByKeyword(suggItem.name);
        },
        _handleSearchResultItemPicked: function(searchResultItem) {
            this.emit("poiPicked", {
                item: searchResultItem,
                source: "search"
            });
        },
        _initDom: function() {
            this.domNodes = {};
            this.domNodes.searchInput = $(this.opts.input);
            this.domNodes.suggestContainer = $(this.opts.suggestContainer);
            this.domNodes.searchResultsContainer = $(this.opts.searchResultsContainer);
            this._bindEvents(!0);
            this._debuncedSuggest = utils.debounce(this.suggest, 200);
        },
        _getDomElement: function(ele) {
            if (!ele) return null;
            "string" == typeof ele && (ele = document.getElementById(ele));
            if (!this._isHTMLElement(ele)) throw new Error(ele + " is not a HTMLElement");
            return ele;
        },
        _getEventHandlers: function() {
            var self = this;
            return {
                inputChange: function() {
                    self._debuncedSuggest(this.value);
                    self.clearSearchResults();
                    self.hideSearchResults();
                },
                inputFocus: function() {
                    var suggData = self.domNodes.suggestContainer.data("sugg");
                    suggData && $.trim(this.value) === suggData.keyword && self.showSuggest();
                },
                inputKeyUp: function(e) {
                    switch (e.which) {
                      case 38:
                        self.isSuggestShown() ? self._highlightPrevSuggItem() : self.isSearchResultsShown() && self._highlightPrevSearchResultItem();
                        break;

                      case 40:
                        self.isSuggestShown() ? self._highlightNextSuggItem() : self.isSearchResultsShown() && self._highlightNextSearchResultItem();
                        break;

                      case 13:
                        var selectedItem;
                        self.isSuggestShown() ? selectedItem = self._highlightedSuggItem() : self.isSearchResultsShown() && (selectedItem = self._highlightedSearchResultItem());
                        selectedItem && selectedItem.length ? selectedItem.trigger("click") : self.searchByKeyword(this.value);
                    }
                },
                documentClick: function(e) {
                    if (e.target !== self.opts.input) {
                        $.contains(self.domNodes.suggestContainer.get(0), e.target) || self.emit("suggestContainerBlur");
                        $.contains(self.domNodes.searchResultsContainer.get(0), e.target) || self.emit("searchResultsContainerBlur");
                    }
                },
                showSuggest: function() {
                    self.showSuggest();
                },
                suggItemClick: function() {
                    var suggData = self.domNodes.suggestContainer.data("sugg");
                    if (!suggData || !suggData.results) return !1;
                    var idx = parseInt($(this).attr("data-poi-idx"), 10), suggItem = suggData.results[idx];
                    self.emit("suggestItemPicked", suggItem);
                }
            };
        },
        _bindEvents: function(on) {
            var action = on ? "on" : "off";
            this.domNodes.searchInput[action](AMap.UA.ielt9 ? "keyup" : "input", this._eventHandlers.inputChange);
            this.domNodes.searchInput[action]("focus", this._eventHandlers.inputFocus);
            this.domNodes.searchInput[action]("keyup", this._eventHandlers.inputKeyUp);
            this.domNodes.suggestContainer[action]("click", ".sugg-item", this._eventHandlers.suggItemClick);
            $(document).on("click", this._eventHandlers.documentClick);
        },
        destory: function() {
            this.emit("beforeDestroy");
            this.hideSuggest();
            this.hideSearchResults();
            this.clearSuggest();
            this.clearSearchResults();
            this._bindEvents(!1);
            this.offAll();
            this.emit("afterDestroy");
        },
        suggest: function(val) {
            val = $.trim(val);
            var self = this;
            this._getSuggest(val, function(err, results) {
                err ? self.clearSuggest() : self._renderSuggest(val, results);
            });
        },
        _selectNextListItem: function(listItems, selectedCls) {
            var selectedItem = listItems.filter("." + selectedCls), newSelectedItem = null;
            if (selectedItem.length) {
                newSelectedItem = selectedItem.next();
                newSelectedItem.length || (newSelectedItem = listItems.first());
            } else newSelectedItem = listItems.first();
            selectedItem.removeClass(selectedCls);
            newSelectedItem.addClass(selectedCls);
        },
        _selectPrevListItem: function(listItems, selectedCls) {
            var selectedItem = listItems.filter("." + selectedCls), newSelectedItem = null;
            if (selectedItem.length) {
                newSelectedItem = selectedItem.prev();
                newSelectedItem.length || (newSelectedItem = listItems.last());
            } else newSelectedItem = listItems.last();
            selectedItem.removeClass(selectedCls);
            newSelectedItem.addClass(selectedCls);
        },
        _highlightNextSuggItem: function() {
            this._selectNextListItem(this.domNodes.suggestContainer.find("li.sugg-item"), "highlight");
        },
        _highlightedSuggItem: function() {
            return this.domNodes.suggestContainer.find("li.sugg-item.highlight");
        },
        _highlightPrevSuggItem: function() {
            this._selectPrevListItem(this.domNodes.suggestContainer.find("li.sugg-item"), "highlight");
        },
        _highlightPrevSearchResultItem: function() {
            this._selectPrevListItem(this.domNodes.searchResultsContainer.find("li.poibox"), "highlight");
        },
        _highlightNextSearchResultItem: function() {
            this._selectNextListItem(this.domNodes.searchResultsContainer.find("li.poibox"), "highlight");
        },
        _highlightedSearchResultItem: function() {
            return this.domNodes.searchResultsContainer.find("li.poibox.highlight");
        },
        _getOuterHeight: function(ele) {
            return ele.outerHeight ? ele.outerHeight() : ele.height();
        },
        _getOuterWidth: function(ele) {
            return ele.outerWidth ? ele.outerWidth() : ele.width();
        },
        _dockTargetBox: function(targetBox, dockEle) {
            targetBox = $(targetBox);
            dockEle = $(dockEle);
            var doc = $(document), inputPos = dockEle.position(), inputHeight = this._getOuterHeight(dockEle), inputOffset = dockEle.offset(), viewportOffsetTop = inputOffset.top - doc.scrollTop(), viewportBottomLeft = $(window).height() - viewportOffsetTop - inputHeight;
            if (viewportBottomLeft < 100 && viewportOffsetTop > viewportBottomLeft) {
                targetBox.css({
                    maxHeight: viewportOffsetTop - 3,
                    minWidth: this._getOuterWidth(dockEle)
                });
                targetBox.addClass("dock-top").css({
                    marginTop: -this._getOuterHeight(targetBox),
                    top: inputPos.top,
                    left: inputPos.left
                });
            } else {
                targetBox.css({
                    maxHeight: viewportBottomLeft - 3,
                    minWidth: this._getOuterWidth(dockEle)
                });
                targetBox.addClass("dock-bottom").css({
                    top: inputPos.top + inputHeight,
                    left: inputPos.left
                });
            }
        },
        clearSuggest: function() {
            this.domNodes.suggestContainer.removeData("sugg");
            this._updateSuggestContainerHtml("");
            this.hideSuggest();
        },
        hideSuggest: function() {
            this.domNodes.suggestContainer.addClass("hidden");
        },
        showSuggest: function() {
            this.domNodes.suggestContainer.removeClass("hidden");
        },
        clearSearchResults: function() {
            this.placeSearch && this.placeSearch.clear();
        },
        hideSearchResults: function() {
            this.domNodes.searchResultsContainer.addClass("hidden");
        },
        showSearchResults: function() {
            this.domNodes.searchResultsContainer.removeClass("hidden");
        },
        isSearchResultsShown: function() {
            return !this.domNodes.searchResultsContainer.hasClass("hidden");
        },
        isSuggestShown: function() {
            return !this.domNodes.suggestContainer.hasClass("hidden");
        },
        _renderSuggest: function(keyword, results) {
            for (var kwFind = !1, i = 0, len = results.length; i < len; i++) if (!results[i].id && results[i].name === keyword) {
                kwFind = !0;
                break;
            }
            kwFind || results.unshift({
                name: keyword
            });
            this.domNodes.suggestContainer.data("sugg", {
                keyword: keyword,
                results: results
            });
            var html = template(suggestTpl, {
                suggs: results
            });
            this.showSuggest();
            this._updateSuggestContainerHtml(html);
        },
        _updateSuggestContainerHtml: function(html) {
            this.emit("beforeUpdateSuggestContainerHtml", html);
            this.domNodes.suggestContainer.toggleClass("no-sugg", !html);
            this.domNodes.suggestContainer.html(html);
            this.emit("afterUpdateSuggestContainerHtml", html);
        },
        _getSuggest: function(val, cb) {
            this.autoComp.search(val, function(stat, results) {
                switch (stat) {
                  case "complete":
                    results && results.tips ? cb(null, results.tips) : cb("Wrong results", results);
                    break;

                  default:
                    cb(stat, results);
                }
            });
        },
        _isHTMLElement: function(n) {
            return n instanceof (window["HTMLElement"] || window["Element"]);
        }
    });
    return PoiPicker;
});

AMapUI.weakDefine("ui/misc/PoiPicker", [ "ui/misc/PoiPicker/main" ], function(m) {
    return m;
});

!function(c) {
    var d = document, a = "appendChild", i = "styleSheet", s = d.createElement("style");
    s.type = "text/css";
    d.getElementsByTagName("head")[0][a](s);
    s[i] ? s[i].cssText = c : s[a](d.createTextNode(c));
}(".amap-ui-poi-picker-search-results-container,.amap-ui-poi-picker-sugg-container{position:absolute;-webkit-box-sizing:border-box;box-sizing:border-box;padding:0;overflow:auto;z-index:9999}.amap-ui-poi-picker-search-results-container p.amap_lib_placeSearch{margin:0;padding:3px 10px}.amap-ui-poi-picker-sugg-container{border:1px solid #ccc;background:#fff}.amap-ui-poi-picker-search-results-container.hidden,.amap-ui-poi-picker-sugg-container.hidden,.amap-ui-poi-picker-sugg-container.no-sugg{display:none}.amap-ui-poi-picker-sugg-list{margin:0;padding:0}.amap-ui-poi-picker-sugg-list .sugg-item{margin:0;border-bottom:1px solid #eee;font-size:1em;padding:7px 5px 7px 23px;background:url(" + AMapUI.getBaseUrl() + "ui/misc/PoiPicker/assets/poi.png) no-repeat 5px 50%;vertical-align:middle;cursor:pointer}.amap-ui-poi-picker-sugg-list .sugg-item.sugg-no-id{background:url(" + AMapUI.getBaseUrl() + "ui/misc/PoiPicker/assets/search.png) no-repeat 5px 50%}.amap-ui-poi-picker-sugg-list .sugg-item.highlight,.amap-ui-poi-picker-sugg-list .sugg-item:hover{background-color:#cae1ff}.amap-ui-poi-picker-sugg-list .sugg-item:last-child{border-bottom:none}.amap-ui-poi-picker-sugg-list .sugg-address{display:none}.amap-ui-poi-picker-sugg-list .sugg-district{font-size:90%;color:#999;margin-left:5px}");