AMapUI.weakDefine("ui/misc/MarkerList/recycleList", [ "lib/utils" ], function(utils) {
    function RecycleList(opts) {
        opts === !0 ? opts = {
            maxLength: -1
        } : opts === !1 ? opts = {
            maxLength: 0
        } : isNaN(opts) || (opts = {
            maxLength: parseInt(opts, 10)
        });
        this._opts = utils.extend({
            maxLength: -1
        }, opts);
        this._list = [];
    }
    utils.extend(RecycleList.prototype, {
        getList: function() {
            return this._list;
        },
        size: function() {
            return this._list.length;
        },
        push: function(el) {
            if (this._opts.maxLength) {
                this._list.push(el);
                this._opts.maxLength > 0 && this._list.length > this._opts.maxLength && this.shift();
            }
        },
        prepend: function(el) {
            if (this._opts.maxLength) {
                this._list.unshift(el);
                this._opts.maxLength > 0 && this._list.length > this._opts.maxLength && this.pop();
            }
        },
        shift: function() {
            return this._list.shift();
        },
        pop: function() {
            return this._list.pop();
        },
        clear: function() {
            this._list.length = 0;
        }
    });
    return RecycleList;
});

AMapUI.weakDefine("ui/misc/MarkerList/main", [ "lib/utils", "lib/$", "lib/underscore-tpl", "lib/event", "./recycleList" ], function(utils, $, template, EventCls, RecycleList) {
    function MarkerList(opts) {
        opts = utils.extend({
            map: null,
            listContainer: null,
            getPosition: function(dataItem) {
                return dataItem["location"];
            },
            getDataId: function(dataItem, index) {
                return dataItem.id || index;
            },
            getMarker: function(dataItem, context, recycledMarker) {
                var content = "Marker: " + (context.index + 1), label = {
                    offset: new AMap.Pixel(16, 18),
                    content: content
                };
                if (recycledMarker) {
                    recycledMarker.setLabel(label);
                    return recycledMarker;
                }
                return new AMap.Marker({
                    label: label
                });
            },
            getInfoWindow: function(dataItem, context, recycledInfoWindow) {
                var content = "Id: " + context.id;
                if (recycledInfoWindow) {
                    recycledInfoWindow.setContent(content);
                    return recycledInfoWindow;
                }
                return new AMap.InfoWindow({
                    offset: new AMap.Pixel(0, (-23)),
                    content: content
                });
            },
            getListElement: function(dataItem, context, recycledListElement) {
                var tpl = "<p>Id: <%- id %></p>", content = MarkerList.utils.template(tpl, {
                    dataItem: dataItem,
                    index: context.index,
                    id: context.id
                });
                if (recycledListElement) {
                    recycledListElement.innerHTML = content;
                    return recycledListElement;
                }
                return "<div>" + content + "</div>";
            },
            selectedClassNames: "selected",
            listElementClassNames: "amap-ui-markerlist-list-ele",
            makeSelectedEvents: [ "markerClick", "listElementClick" ],
            listElementEvents: [ "click" ],
            markerEvents: [ "click" ],
            infoWindowEvents: [ "click" ],
            recycleMarker: !0,
            recycleListElement: !0,
            recycleInfoWindow: !0,
            autoSetFitView: !0,
            onSelected: function(event, selectedInfo) {
                var selected = selectedInfo.selected;
                if (selected) {
                    var marker = selected.marker;
                    if (marker && marker.get("map")) {
                        marker["setTop"](!0);
                        marker.get("map")["setCenter"](marker["getPosition"]());
                    }
                    this.openInfoWindowOnRecord(selected);
                }
                var unSelected = selectedInfo.unSelected;
                if (unSelected) {
                    var infoWindow = this.getInfoWindow();
                    infoWindow && unSelected.id === this.getDataIdOfInfoWindow(infoWindow) && infoWindow.close();
                }
            }
        }, opts);
        var listContainer = opts["listContainer"];
        if (listContainer) {
            "string" == typeof listContainer && (opts["listContainer"] = listContainer = document.getElementById(listContainer));
            if (!this._isHTMLElement(listContainer)) throw new Error("listContainer is not a HTMLElement");
        }
        this._opts = opts;
        MarkerList.__super__.constructor.call(this, this._opts);
        this._selectedRecordId = null;
        this._recycle = {
            markers: new RecycleList(this._opts["recycleMarker"]),
            listElements: new RecycleList(this._opts["recycleListElement"]),
            infoWindows: new RecycleList(this._opts["recycleInfoWindow"])
        };
        this._eventHandlers = this._getEventHandlers();
        this._setupListContainer();
        this._opts["makeSelectedEvents"] && this.on(this._opts["makeSelectedEvents"], this._eventHandlers.recordSelected);
        this._opts["onSelected"] && this.on("selectedChanged", this._opts["onSelected"]);
    }
    utils.inherit(MarkerList, EventCls);
    utils.extend(MarkerList, {
        refIdKey: "_amap_mk_ref_id",
        utils: {
            $: $,
            template: template
        }
    });
    utils.extend(MarkerList.prototype, {
        utils: MarkerList.utils,
        _setRefId: function(obj, id) {
            obj[MarkerList.refIdKey] = id;
        },
        _getRefId: function(obj) {
            return obj ? obj[MarkerList.refIdKey] : null;
        },
        _clearRefId: function(obj) {
            this._setRefId(obj, null);
        },
        clearRecycle: function() {
            this._recycle.markers.clear();
            this._recycle.listElements.clear();
            this._recycle.infoWindows.clear();
        },
        getRecycleInfo: function() {
            var info = {};
            this._forIn(this._recycle, function(recycleList, k) {
                info[k] = {
                    size: recycleList.size(),
                    list: recycleList.getList()
                };
            });
            return info;
        },
        selectByDataItem: function(dateItem) {
            return this._selectDataRecord(this.getRecordByDataItem(dateItem));
        },
        selectByDataIndex: function(index) {
            return this._selectDataRecord(this.getRecordByDataIndex(index));
        },
        selectByDataReverseIndex: function(index) {
            return this._selectDataRecord(this.getRecordByDataIndex(this._data.length - 1 - index));
        },
        selectByDataId: function(id) {
            return this._selectDataRecord(this.getRecordByDataId(id));
        },
        selectByRecord: function(record, originalEvent) {
            return this._selectDataRecord(record, originalEvent);
        },
        getRecordByDataIndex: function(index) {
            return this._getRecordByFilter(function(item) {
                return item.index === index;
            });
        },
        getRecordByDataId: function(id) {
            return this._packRecord(id);
        },
        getRecordByMarker: function(marker) {
            return this.getRecordByDataId(this.getDataIdOfMarker(marker));
        },
        getRecordByListElement: function(listElement) {
            return this.getRecordByDataId(this.getDataIdOfListElement(listElement));
        },
        getRecordByDataItem: function(data) {
            return this._getRecordByFilter(function(item) {
                return item.data === data;
            });
        },
        getAllRecords: function() {
            var records = [];
            this._forIn(this._store, function(item) {
                records.push(this.getRecordByDataId(item.id));
            });
            return records;
        },
        _findInStore: function(filter) {
            for (var id in this._store) if (this._store.hasOwnProperty(id)) {
                var record = this._getStoreRecord(id);
                if (filter.call(this, record)) return record;
            }
            return !1;
        },
        _getRecordByFilter: function(f) {
            var data = this._findInStore(f);
            return !!data && this._packRecord(data.id);
        },
        _selectDataRecord: function(record, sourceEvent) {
            if (!record && !this._selectedRecordId) return record;
            var unSelected = null, selectAgain = !1;
            if (record && this._selectedRecordId && this._selectedRecordId === record.id) selectAgain = !0; else {
                unSelected = this._getStoreRecord(this._selectedRecordId);
                var selClassNames = this._opts["selectedClassNames"];
                if (selClassNames) {
                    this._toggleSelected(unSelected, !1, selClassNames);
                    this._toggleSelected(record, !0, selClassNames);
                }
                this._selectedRecordId = record ? record.id : null;
            }
            var changeInfo = {
                selectAgain: selectAgain,
                selected: record,
                unSelected: unSelected,
                sourceEventInfo: {
                    sourceEvent: sourceEvent,
                    isMarkerEvent: !1,
                    isListElementEvent: !1
                }
            };
            sourceEvent && sourceEvent.type && utils.extend(changeInfo.sourceEventInfo, {
                isMarkerEvent: 0 === sourceEvent.type.indexOf("marker"),
                isListElementEvent: 0 === sourceEvent.type.indexOf("listElement")
            });
            this.trigger("selectedChanged", changeInfo);
            return record;
        },
        clearSelected: function() {
            this._selectDataRecord(null);
        },
        _toggleSelected: function(record, isSelected, className) {
            if (record) {
                var eles = [];
                if (record["marker"]) {
                    var domNode = record["marker"]["getContentDom"]();
                    if (domNode) {
                        var $node = $(domNode);
                        if (!$node.hasClass("amap-marker")) {
                            $node = $node.closest(".amap-marker");
                            $node.length && (domNode = $node.get(0));
                        }
                        eles.push(domNode);
                    }
                }
                record["listElement"] && eles.push(record["listElement"]);
                this._forEach(eles, function(ele) {
                    ele && $(ele).toggleClass(className, isSelected);
                });
            }
        },
        setOption: function(k, v) {
            this._opts[k] = v;
        },
        setOptions: function(opts) {
            for (var k in opts) opts.hasOwnProperty(k) && this["setOption"](k, opts[k]);
        },
        getOption: function(k) {
            return this._opts[k];
        },
        _setupListContainer: function() {
            this._toggleDomEvents(this._opts["listContainer"], this._opts["listElementEvents"], this._eventHandlers.listElementHandler, !0, this._getSelectorOfClassNames(this._opts["listElementClassNames"]));
        },
        _teardownListContainer: function() {
            this._toggleDomEvents(this._opts["listContainer"], this._opts["listElementEvents"], this._eventHandlers.listElementHandler, !1, this._getSelectorOfClassNames(this._opts["listElementClassNames"]));
        },
        _getSelectorOfClassNames: function(classNames) {
            return "." + classNames.split(/\s+/).join(".");
        },
        _toggleDomEvents: function(el, events, fn, on, selector) {
            if (events && events.length) {
                var ele = $(el), args = [ events.join(" ") ];
                selector && args.push(selector);
                args.push(fn);
                ele[on ? "on" : "off"].apply(ele, args);
            }
        },
        _toggleInsEvents: function(el, events, fn, on) {
            if (events && events.length) {
                var eventBinder = on ? el.on : el.off;
                this._forEach(events, function(ev) {
                    eventBinder.call(el, ev, fn);
                });
            }
        },
        _getEventHandlers: function() {
            var self = this;
            return {
                recordSelected: function(e, record) {
                    self._selectDataRecord(record, e);
                },
                listElementHandler: function(e) {
                    var listElement = this, record = self._packRecord(self._getRefId(listElement));
                    self.triggerWithListElementEvent(e, record);
                },
                infoWindowHandler: function(e) {
                    var infoWin = this, record = self._packRecord(self._getRefId(infoWin));
                    self.triggerWithInfoWindowEvent(e, record);
                },
                markerHandler: function(e) {
                    var marker = this, record = self._packRecord(self._getRefId(marker));
                    self.triggerWithMarkerEvent(e, record);
                }
            };
        },
        triggerWithMarkerEvent: function(originalEvent, record) {
            this._triggerWithMLEvent("marker", originalEvent, record);
        },
        triggerWithListElementEvent: function(originalEvent, record) {
            this._triggerWithMLEvent("listElement", originalEvent, record);
        },
        triggerWithInfoWindowEvent: function(originalEvent, record) {
            this._triggerWithMLEvent("infoWindow", originalEvent, record);
        },
        _triggerWithMLEvent: function(ns, originalEvent, record) {
            var type = ns + utils.ucfirst(originalEvent["type"]);
            originalEvent.MarkerListEventType = type;
            this.triggerWithOriginalEvent(type, originalEvent, record);
        },
        setData: function(data) {
            if (!utils.isArray(data)) throw new Error('"data" is supposed to be an array');
            this._data = [].concat(data);
            this._rebuildData();
            return this;
        },
        getData: function() {
            return this._data;
        },
        clearData: function() {
            this.setData([]);
        },
        _rebuildData: function() {
            this._clearStore();
            this._store = {};
            this._forEach(this._data, function(item, idx) {
                var dIdx = this._getDataId(item, idx);
                if (this._store[dIdx]) throw new Error("Duplicate Id found: " + dIdx);
                this._store[dIdx] = {
                    id: dIdx,
                    position: this._getDataPosition(item, idx),
                    index: idx,
                    data: item
                };
            });
        },
        _packRecord: function(id) {
            var item = this._getStoreRecord(id);
            if (!item) return null;
            var infoWin = this.getInfoWindow(), infoWinId = this._getRefId(infoWin);
            return utils.extend({}, item, {
                infoWindow: infoWinId === id ? infoWin : void 0
            });
        },
        _getStoreRecord: function(id) {
            return id ? this._store[id] : null;
        },
        render: function(d, callback) {
            d ? this.setData(d) : this._rebuildData();
            var map = this._opts["map"], listContainer = this._opts["listContainer"], extraOpts = {
                "map": null,
                "listContainer": null
            }, markers = [], listElements = [];
            this.trigger("willRender", this._data);
            this._forEach(this._data, function(item, idx) {
                this.trigger("beforeRenderDataItem", {
                    "data": item,
                    "index": idx
                });
                var args = [ item, idx, extraOpts ];
                if (map) {
                    var marker = this._renderMarker.apply(this, args);
                    marker && markers.push(marker);
                }
                if (listContainer) {
                    var listEle = this._renderListElement.apply(this, args);
                    listEle && listElements.push(listEle);
                }
            });
            map && markers.length && this._forEach(markers, function(m, idx) {
                this._addMarkerToMap(m, map);
            });
            listContainer && listElements.length && this._forEach(listElements, function(item, idx) {
                this._addListElementToContainter(item, listContainer);
            });
            this._opts["autoSetFitView"] && map && markers.length && map["setFitView"](markers, !0);
            var records = this.getAllRecords(), self = this;
            utils.nextTick(function() {
                self.trigger("renderComplete", records);
                callback && callback(null, records);
            });
            return this;
        },
        destroy: function() {
            this.clear();
            this._teardownListContainer();
            this.clearRecycle();
            this._data.length = 0;
            this._store = {};
            this.offAll();
        },
        getAllMarkers: function() {
            var markers = [];
            this._forIn(this._store, function(item) {
                markers.push(item.marker);
            });
            return markers;
        },
        getAllListElements: function() {
            var listEles = [];
            this._forIn(this._store, function(item) {
                listEles.push(item.listElement);
            });
            return listEles;
        },
        getInfoWindow: function() {
            return this._singleInfoWindow;
        },
        closeInfoWindow: function() {
            this._singleInfoWindow && this._singleInfoWindow.close();
        },
        getDataIdOfInfoWindow: function(infoWin) {
            return this._getRefId(infoWin || this.getInfoWindow());
        },
        getDataIdOfMarker: function(marker) {
            return this._getRefId(marker);
        },
        getDataIdOfListElement: function(listElement) {
            return this._getRefId(listElement);
        },
        getSelectedDataId: function() {
            return this._selectedRecordId;
        },
        getSelectedRecord: function() {
            return this.getRecordByDataId(this.getSelectedDataId());
        },
        isSelectedDataId: function(id) {
            return id === this.getSelectedDataId();
        },
        _clearStore: function() {
            this.trigger("storeWillClear");
            this.clearSelected();
            this._forIn(this._store, function(record) {
                this._clearMarker(record.marker);
                this._clearListElement(record.listElement);
                record.marker = null;
                record.listElement = null;
            });
            this._clearInfoWindow(this._singleInfoWindow);
            this._singleInfoWindow = null;
            this.trigger("storeClear");
        },
        _clearMarker: function(m) {
            if (m) {
                var dataRecord = this._packRecord(this._getRefId(m));
                this.trigger("markerWillRemoveFromMap", dataRecord);
                this._toggleInsEvents(m, this._opts["markerEvents"], this._eventHandlers.markerHandler, !1);
                m["setMap"](null);
                this._clearRefId(m);
                this.trigger("markerRemoveFromMap", dataRecord);
                this._recycle.markers.push(m);
            }
        },
        _clearListElement: function(node) {
            if (node) {
                var dataRecord = this._packRecord(this._getRefId(node));
                this.trigger("listElementWillRemoveFromContainter", dataRecord);
                node.parentNode && node.parentNode.removeChild(node);
                this._clearRefId(node);
                this.trigger("listElementRemoveFromContainter", dataRecord);
                this._recycle.listElements.push(node);
            }
        },
        _clearInfoWindow: function(infoWin) {
            if (infoWin) {
                var dataRecord = this._packRecord(this._getRefId(infoWin));
                infoWin["close"]();
                this.trigger("infoWindowWillRemoveFromMap", dataRecord);
                var contentDom = infoWin["getContentDom"]();
                if (contentDom) {
                    this._toggleDomEvents(contentDom, this._opts["infoWindowEvents"], this._eventHandlers.infoWindowHandler, !1);
                    this._clearRefId(contentDom);
                } else infoWin._clearWaitForContentDom && infoWin._clearWaitForContentDom();
                infoWin["setMap"](null);
                this._clearRefId(infoWin);
                this.trigger("infoWindowRemoveFromMap", dataRecord);
                this._recycle.infoWindows.push(infoWin);
            }
        },
        _setupInfoWindow: function(infoWin) {
            function setupContentDom(domNode) {
                self._setRefId(domNode, self._getRefId(infoWin));
                self._toggleDomEvents(domNode, self._opts["infoWindowEvents"], self._eventHandlers.infoWindowHandler, !0);
            }
            if (infoWin) {
                var contentDom = infoWin["getContentDom"](), self = this;
                if (contentDom) setupContentDom(contentDom); else if (!infoWin._waitForContentDom) {
                    infoWin._waitForContentDom = !0;
                    var onAdd = function() {
                        infoWin._waitForContentDom = !1;
                        infoWin._clearWaitForContentDom();
                        var domNode = infoWin["getContentDom"]();
                        domNode ? setupContentDom(domNode) : console.error("getContentDom failed on InfoWindow");
                    };
                    infoWin._clearWaitForContentDom = function() {
                        infoWin.off("onAdd", onAdd);
                        infoWin._clearWaitForContentDom = null;
                    };
                    infoWin.on("onAdd", onAdd);
                }
            }
        },
        _isHTMLElement: function(obj) {
            return utils.isHTMLElement(obj);
        },
        _addMarkerToMap: function(marker, map) {
            if (marker) {
                var dId = this._getRefId(marker), storeItem = this._getStoreRecord(dId);
                if (!storeItem) throw new Error("id not found: " + dId);
                if (storeItem.marker && storeItem.marker !== marker) {
                    console.warn("Clear marker!!");
                    this._clearMarker(storeItem.marker);
                }
                storeItem.marker = marker;
                if (marker) {
                    var dataRecord = this._packRecord(dId);
                    this.trigger("markerWillAddToMap", dataRecord);
                    marker["setMap"](map);
                    this._toggleInsEvents(marker, this._opts["markerEvents"], this._eventHandlers.markerHandler, !0);
                    this.trigger("markerAddToMap", dataRecord);
                }
            }
        },
        _addListElementToContainter: function(item, container) {
            if (item) {
                var dId = this._getRefId(item), storeItem = this._getStoreRecord(dId);
                if (!storeItem) throw new Error("id not found: " + dId);
                if (storeItem.listElement && storeItem.listElement !== item) {
                    console.warn("Clear listElement!!");
                    this._clearListElement(storeItem.listElement);
                }
                storeItem.listElement = item;
                if (item) {
                    var dataRecord = this._packRecord(dId);
                    this.trigger("listElementWillAddToContainter", dataRecord);
                    container.appendChild(item);
                    this.trigger("listElementAddToContainter", dataRecord);
                }
            }
        },
        _wrapHtml: function(html) {
            this._tmpNode || (this._tmpNode = document.createElement("div"));
            var tmpNode = this._tmpNode;
            tmpNode.innerHTML = html;
            for (var children = tmpNode.childNodes, nodes = [], i = 0, len = children.length; i < len; i++) switch (children[i].nodeType) {
              case 1:
              case 3:
                nodes.push(children[i]);
            }
            var itemNode = null;
            if (nodes.length) if (nodes.length > 1 || 1 !== nodes[0].nodeType) {
                for (var wrapperNode = document.createElement("div"), k = 0, klen = nodes.length; k < klen; k++) wrapperNode.appendChild(nodes[k]);
                itemNode = wrapperNode;
            } else {
                itemNode = nodes[0];
                itemNode.parentNode.removeChild(itemNode);
            }
            tmpNode.innerHTML = "";
            return itemNode;
        },
        openInfoWindowOnRecord: function(record) {
            if (this._opts["map"] && this._opts["getInfoWindow"]) if (record || !this._singleInfoWindow) {
                if (this._singleInfoWindow) {
                    if (record.id === this._getRefId(this._singleInfoWindow)) {
                        this._singleInfoWindow.getIsOpen() || this._singleInfoWindow.open(this._opts["map"], this._singleInfoWindow["getPosition"]());
                        return;
                    }
                    this._clearInfoWindow(this._singleInfoWindow);
                    this._singleInfoWindow = null;
                }
                var newInfoWin, recycleInfoWin = this._recycle.infoWindows.shift(), getInfoWin = this._opts["getInfoWindow"];
                if (!getInfoWin) return !1;
                newInfoWin = getInfoWin.call(this, record["data"], record, recycleInfoWin);
                if (!newInfoWin) return !1;
                if (!(newInfoWin instanceof AMap.InfoWindow)) throw new Error("getInfoWindow should return an AMap.InfoWindow instance!");
                newInfoWin !== recycleInfoWin && this.trigger("infoWindowThrowaway", recycleInfoWin);
                this._singleInfoWindow = newInfoWin;
                this._setRefId(newInfoWin, record.id);
                record.position && newInfoWin["setPosition"](record.position);
                if (!newInfoWin["getPosition"]()) throw new Error("No position set in infoWindow");
                this._opts["map"] && this._addInfoWindowToMap(newInfoWin, this._opts["map"], newInfoWin["getPosition"]());
            } else this._singleInfoWindow.close();
        },
        _addInfoWindowToMap: function(infoWin, map, position) {
            if (infoWin) {
                var dId = this._getRefId(infoWin), storeItem = this._getStoreRecord(dId);
                if (!storeItem) throw new Error("id not found: " + dId);
                var dataRecord = this._packRecord(dId);
                this.trigger("infoWindowWillAddToMap", dataRecord);
                this._setupInfoWindow(infoWin);
                infoWin["open"](map, position);
                this.trigger("infoWindowAddToMap", dataRecord);
            }
        },
        _renderMarker: function(data, idx, opts) {
            if (!this._opts["getMarker"]) return !1;
            opts = utils.extend({
                "map": this._opts["map"]
            }, opts);
            var dataId = this._getDataId(data, idx), recycledMarker = this._recycle.markers.shift();
            this.trigger("beforeRenderMarker", {
                "data": data,
                "index": idx
            });
            var context = this._packRecord(dataId), marker = this._opts["getMarker"].call(this, data, context, recycledMarker);
            void 0 === marker && recycledMarker && (marker = recycledMarker);
            if (!marker) return !1;
            if (!(marker instanceof AMap.Marker)) throw new Error("getMarker should return an AMap.Marker instance!");
            recycledMarker && marker !== recycledMarker && this.trigger("markerThrowaway", recycledMarker);
            context.position && marker["setPosition"](context.position);
            if (!marker["getPosition"]()) throw new Error("No position set in marker");
            this._setRefId(marker, dataId);
            opts["map"] && this._addMarkerToMap(marker, opts["map"]);
            return marker;
        },
        _renderListElement: function(data, idx, opts) {
            if (!this._opts["getListElement"]) return !1;
            opts = utils.extend({
                "listContainer": this._opts["listContainer"]
            }, opts);
            var dataId = this._getDataId(data, idx), recycledListElement = this._recycle.listElements.shift();
            this.trigger("beforeRenderListElement", {
                "data": data,
                "index": idx
            });
            var context = this._packRecord(dataId), listElement = this._opts["getListElement"].call(this, data, context, recycledListElement);
            void 0 === listElement && recycledListElement && (listElement = recycledListElement);
            if (!listElement) return !1;
            recycledListElement && listElement !== recycledListElement && this.trigger("markerThrowaway", recycledListElement);
            if ("string" == typeof listElement) {
                var wrapNode = this._wrapHtml(listElement);
                if (!wrapNode) throw new Error("Can not create an HTMLElement with: " + listElement);
                listElement = wrapNode;
            }
            if (!this._isHTMLElement(listElement)) throw new Error("getListElement should return an HTMLElement!");
            $(listElement).addClass(this._opts["listElementClassNames"]);
            this._setRefId(listElement, dataId);
            opts["listContainer"] && this._addListElementToContainter(listElement, opts["listContainer"]);
            return listElement;
        },
        _getDataId: function(data, idx) {
            var id = this._opts["getDataId"].call(this, data, idx);
            void 0 === id && (id = idx);
            return "" + id;
        },
        _getDataPosition: function(data) {
            var pos = this._opts["getPosition"](data);
            utils.isArray(pos) && (pos = new AMap.LngLat(pos[0], pos[1]));
            if (!(pos instanceof AMap.LngLat)) throw new Error("getPosition is supposed to return a LngLat instance!");
            return pos;
        },
        _forEach: function(array, fn) {
            for (var results = [], i = 0, len = array.length; i < len; i++) results.push(fn.call(this, array[i], i));
            return results;
        },
        _forIn: function(obj, fn) {
            var results = {};
            for (var k in obj) obj.hasOwnProperty(k) && (results[k] = fn.call(this, obj[k], k));
            return results;
        }
    });
    return MarkerList;
});

AMapUI.weakDefine("ui/misc/MarkerList", [ "ui/misc/MarkerList/main" ], function(m) {
    return m;
});