'use strict'
export class PCCTree {
  /**
   * PCCTree构造函数
   * @param id  "#idstring"
   * @param options {}
   * 2017-11-13 新增一项options{area: true}，用于选择地区以后自动携带区号
   */
  constructor (id, options) {
    this.id = id
    this.elem = $(id)
    this.parentMenu = this.elem.parents('.tree-content')
    this.focusInput = this.elem.parents('.tree-content').prev('.location-area')
    this.default = { // PCCTree的默认参数选项
      top: this.focusInput.outerHeight() - 2, // tree容器距离父容器顶部高度
      left: 0, // tree容器距离父容器左边距离
      height: 250, // tree容器默认高度
      cInptName: 'region_id', // hidden input name 市
      style: 'radio'
    }
    this.options = $.extend({}, this.default, options)
    this.hiddenInpts = {} // 包含所有hidden input的对象
    this.treeObj = null
    this._init()
    this._initEvent()

    return this
  }

  // 初始化PCCTree
  _init () {
    let self = this
    let jsonData = this.options.data
    self.initZtree(jsonData)
    this.hiddenInpt = this._createHiddenInput()
  }

  // 初始化PCCTree显示隐藏的事件
  _initEvent () {
    let self = this
    this.focusInput.on('click', function () {
      self.showMenu()
    }).on('blur', function () {
      self.hideMenu()
    })
    this.elem.on('mousedown', function (e) {
      e.stopPropagation()
      e.preventDefault()
    })
  }

  /**设置选中或未选中id的节点
   * @param id nodeid
   * @param checked node checked status
   */
  check (id, checked) {
    console.log(id, checked)
    let node = this.treeObj.getNodeByParam('id', id, null)
    this.treeObj.checkNode(node, checked, true, false)

    let nodes = this.treeObj.getChangeCheckedNodes()
    for (let i = 0, l = nodes.length; i < l; i++) {
      nodes[i].checkedOld = nodes[i].checked
    }
  }

  /**
   * 初始化zTree结构
   * @param ztreeData 省市县数据
   */
  initZtree (ztreeData) {
    let self = this
    this.treeObj = $.fn.zTree.init(this.elem, {
      check: {
        enable: true,
        chkStyle: self.options.style,
        radioType: 'all'
      },
      view: {
        dblClickExpand: false
      },
      simpleData: {
        enable: true
      },
      data: {
        key: {
          children: 'nodes',
          name: 'text'
        }
      },
      callback: {
        onClick: function (e, treeId, treeNode) {
          self.onClick(e, treeId, treeNode)
        },
        onCheck: function (e, treeId, treeNode) {
          self.onCheck(e, treeId, treeNode)
        }
      }
    }, ztreeData)
  }

  // 创建hidden inputs
  _createHiddenInput () {
    let cInpt = $(`<input type="hidden" name="${ this.options.cInptName}" id="${this._utilInptNameToId(this.options.cInptName)}" value="">`)
    if (this.elem.parents('form').html()) {
      this.elem.parents('form').append(cInpt)
    } else {
      this.elem.parents('.tree-con').append(cInpt)
    }
    return cInpt
  }

  /**
   *  转换name to id
   * @param name 类似province_id
   * @returns {string} provinceId
   * @private
   */
  _utilInptNameToId (name) {
    return name.split('_')[0] + name.split('_')[1].slice(0, 1).toUpperCase() + name.split('_')[1].slice(1)
  }

  onClick (e, treeId, treeNode) {
    var zTree = $.fn.zTree.getZTreeObj(this.id.slice(1))
    zTree.checkNode(treeNode, !treeNode.checked, null, true)
    return false
  }

  onCheck (e, treeId, treeNode) {
    var self = this
    var zTree = $.fn.zTree.getZTreeObj(this.id.slice(1)),
      nodes = zTree.getCheckedNodes(true),
      v = '', id = '', area_id = '', areaObj = {}, location = '';
    var addFlag = true // 涉毒/涉恐地区设置，地区添加，当地区为省一级的时候不允许添加

    for (var i = 0, l = nodes.length; i < l; i++) {
      if (self.options.onlyLast && nodes[i].isParent) {
        return false
      }
      if (self.options.onlyLast) {
        v += nodes[i].text + ','
      } else {
        v += this._findParentNodeName(nodes[i]) + nodes[i].text + ','
      }
      if (self.options.style == 'checkbox') {
        if (nodes[i].scale === undefined && self.options.cInptName == 'region_id') {
          location += nodes[i].id + ','
        }
        else {
          let s = nodes[i].getCheckStatus()
          if (!s.half) {
            id += nodes[i].id + ','
          }
        }
        //id += nodes[i].id + ','
        if (self.options.area !== undefined && self.options.area) {
          area_id += nodes[i].id + ','
        }
      } else {
        id = nodes[i].id
        if (self.options.area !== undefined && self.options.area) {
          area_id = nodes[i].id
        }
        if (nodes[i].scale == 1) {
          addFlag = false
        } else {
          addFlag = true
        }
      }
    }
    if (v.length > 0) v = v.substring(0, v.length - 1)

    areaObj = this.focusInput

    // 已选省市县名称和id的hidden input赋值
    areaObj.val(v)
    if (self.options.onlyLast) {
      areaObj.attr('data-id', id)
    } else {
      if (id !== '') {
        this.hiddenInpt.val(id)
      } else {
        this.hiddenInpt.val(location)
      }
    }
    //console.log(this.hiddenInpt.val(), areaObj.val())
    if (self.options.area !== undefined && self.options.area) {
      $('#addArea').html(area_id)
    }
    if (addFlag) {
      $('#addArea').attr('data-addflag', 'true')
    } else {
      $('#addArea').attr('data-addflag', 'false')
    }
  }

  showMenu () {
    let self = this
    self.parentMenu.css({
      left: this.options.left + 'px',
      top: this.options.top + 'px',
      height: this.options.height + 'px'
    }).slideDown('fast')
    $('body').bind('mousedown', function () {
      self.onBodyDown()
    })
  }

  hideMenu () {
    let self = this
    self.parentMenu.fadeOut('fast')
    $('body').unbind('mousedown', function () {
      self.onBodyDown()
    })
  }

  onBodyDown () {
    this.hideMenu()
  }

  /**
   * 查找地区上级及上上级name and id
   * @param node 当前选中的（省、市、县）
   * @returns nodeName: string
   */
  _findParentNodeName (node) {
    let nodeName = ''
    if (node.getParentNode()) {
      nodeName = node.getParentNode().text + '-' + nodeName
      if (node.getParentNode().getParentNode()) {
        nodeName = node.getParentNode().getParentNode().text + '-' + nodeName
      }
    }
    // return {
    //     nodeId: nodeId,
    //     nodeName: nodeName
    // };
    return nodeName
  }
}
