<template>
  <div class="fog-history-wrap">
    <layout>
      <mu-breadcrumb slot="bread" separator=">">
        <mu-breadcrumb-item href="#/">首页</mu-breadcrumb-item>
        <mu-breadcrumb-item>雾气监测历史</mu-breadcrumb-item>
      </mu-breadcrumb>
      <mu-card>
        <div class="form-wrap">
          <div class="location-part" @click.stop="doNothing">
            <y-location ref="fogHistoryLoc" label="监控点位" :limit="10" id="fogHistoryLoc" :nodes="nodes">
            </y-location>
          </div>
          <y-time :timeData="timeData" @change="listenTime"></y-time>
          <div class="state">
            <span class="title">雾气等级</span>
            <mu-select-field v-model="status">
              <mu-menu-item value="4" title="全部"/>
              <mu-menu-item value="0" title="无雾"/>
              <mu-menu-item value="1" title="轻雾"/>
              <mu-menu-item value="2" title="中雾"/>
              <mu-menu-item value="3" title="大雾"/>
            </mu-select-field>
          </div>
          <div class="actions">
            <mu-raised-button label="查询" primary @click="inquiryData"/>
          </div>
        </div>
      </mu-card>
      <div class="history-list clearfix">
        <mu-card class="card left" v-show="dataLeft.length">
          <table class="history-table">
            <thead>
              <tr>
                <th width="9%">序号</th>
                <th width="34%">监控点位</th>
                <th width="27%">时间</th>
                <th width="9%">状态</th>
                <th>图片</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in dataLeft">
                <td>{{ indexLeft(index + 1) }}</td>
                <td :title="item.locationName">{{ item.locationName }}</td>
                <td>{{ item.time }}</td>
                <td>{{ icon[item.status] }}</td>
                <td><span @click="showPic(index)">查看图片</span></td>
              </tr>
            </tbody>
          </table>
        </mu-card>
        <mu-card class="card right" v-show="dataRight.length">
          <table class="history-table">
            <thead>
              <tr>
                <th width="9%">序号</th>
                <th width="34%">监控点位</th>
                <th width="27%">时间</th>
                <th width="9%">状态</th>
                <th>图片</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in dataRight">
                <td>{{ indexRight(index + 1) }}</td>
                <td :title="item.locationName">{{ item.locationName }}</td>
                <td>{{ item.time }}</td>
                <td>{{ icon[item.status] }}</td>
                <td><span @click="showPic(index + 8)">查看图片</span></td>
              </tr>
            </tbody>
          </table>
        </mu-card>
      </div>
      <mu-pagination v-show="dataLeft.length !== 0" :pageSize="formData.length" :total="dataList.totalRecords" :current="formData.pn" @pageChange="handleClick"></mu-pagination>
      <no-data v-show="dataLeft.length === 0"></no-data>
      <mu-dialog :open="dialogFlag" dialogClass="zebra-crossing-dialog">
        请到"<a href="#/manage/equipment">设备管理</a>"完成点位设置
      </mu-dialog>
      <mu-dialog :open="dialogShow" dialogClass="fog-detection-dialog" @close="closePic">
        <div class="dialog-title">
          序号{{ nowItem.index }}，{{ nowItem.locationName }}，{{ nowItem.time }}，{{ icon[nowItem.status] }}
          <i class="material-icons close-icon" @click="closePic">highlight_off</i>
        </div>
        <div class="dialog-content">
          <div id="pic-wrap" class="pic">
            <img :src="nowItem.picUrl" ref="bigPic">
          </div>
        </div>
        <div class="btn prev" v-if="prevShow" @click="showPic(prevPage)">
          <i class="material-icons">navigate_before</i>
        </div>
        <div class="btn next" v-if="nextShow" @click="showPic(nextPage)">
          <i class="material-icons">navigate_next</i>
        </div>
      </mu-dialog>
    </layout>
  </div>
</template>

<script>
  import Layout from '@/components/layout/result'
  import noData from '@/components/result/no-data'
  import Time from '@/components/form/time'
  import Locations from '@/components/form/location-s'
  import axios from '@/axios.conf.js'

  function generateTreeData (treeData = [], parentKey) {
    treeData = treeData.map((item, i) => {
      item.key = parentKey + '_' + i.toString()
      item.checked = item.hasOwnProperty('checked') && item.checked
      item.canSelect = true
      if (item.hasOwnProperty('nodes') && item.nodes.length > 0) {
        item.canSelect = false
        generateTreeData(item.nodes, item.key)
      }
      return item
    })
    return treeData
  }

  export default {
    components: {
      Layout,
      noData,
      'y-time': Time,
      'y-location': Locations
    },
    data () {
      return {
        icon: ['无雾', '轻雾', '中雾', '大雾'], // 0:无雾 1:轻雾 2:中雾 3：大雾
        type: 'fog',
        status: '4',
        timeData: {
          beginDate: '',
          bh: '',
          bm: '',
          bs: '',
          endDate: '',
          eh: '',
          em: '',
          es: ''
        },
        formData: {
          pn: 1,
          length: 16,
          state: 4
        },
        formDataNew: {},
        dataList: {}, // 返回数据
        dataLeft: [],
        dataRight: [],
        dialogFlag: false,
        nodes: [],
        dialogShow: false,
        nowItem: {},
        prevShow: false,
        nextShow: false,
        num: 0
      }
    },
    computed: {
      prevPage () {
        if (this.num !== 0) {
          return this.num - 1
        } else {
          return this.dataList.data.length - 1
        }
      },
      nextPage () {
        if (this.num !== this.dataList.data.length - 1) {
          return this.num + 1
        } else {
          return 0
        }
      }
    },
    methods: {
      doNothing () {},
      indexLeft (index) {
        let num = this.formData.length * (this.formData.pn - 1) + parseInt(index)
        return parseInt(num) < 10 ? '0' + num : '' + num
      },
      indexRight (index) {
        let num = this.formData.length * (this.formData.pn - 1) + parseInt(index) + 8
        return parseInt(num) < 10 ? '0' + num : '' + num
      },
      getData (formData) {
        let _this = this
        _this.dataLeft = []
        _this.dataRight = []
        axios.post('/api/fog_history_list', formData)
          .then(
            (res) => {
              _this.dataList = res.data
              let len = _this.dataList.data.length
              if (len <= 8 && len > 0) {
                _this.dataLeft = _this.dataList.data
              } else {
                _this.dataLeft = _this.dataList.data.slice(0, 8)
                _this.dataRight = _this.dataList.data.slice(8)
              }
            },
            (error) => {
              console.log(error)
            }
          )
      },
      handleClick (pno) {
        this.formData.pn = pno
        this.formDataNew.pn = pno
        this.getData(this.formDataNew)
      },
      listenTime (data) {
        this.timeData.beginDate = data.beginDate
        this.timeData.bh = data.bh
        this.timeData.bm = data.bm
        this.timeData.bs = data.bs
        this.timeData.endDate = data.endDate
        this.timeData.eh = data.eh
        this.timeData.em = data.em
        this.timeData.es = data.es
      },
      inquiryData () {
        this.formData.pn = 1
        this.dataList = []
        this.formData.state = parseInt(this.status)
        let formDataNew = {}
        if (!this.$refs.fogHistoryLoc.idMap.size) {
          formDataNew = Object.assign({}, this.formData, this.timeData, {location: ''})
        } else {
          let loc = []
          for (let key of this.$refs.fogHistoryLoc.idMap.keys()) {
            loc.push(key)
          }
          formDataNew = Object.assign({}, this.formData, this.timeData, {location: loc.join(',')})
        }
        this.formDataNew = formDataNew
        this.getData(formDataNew)
      },
      showPic (i) {
        let _this = this
        this.num = i
        this.changeShow(i)
        this.nowItem = this.dataList.data[i]
        this.nowItem.index = i + 1 + this.formData.length * (this.formData.pn - 1)
        this.nowItem.picUrl = this.nowItem.pic + '?' + i
        this.dialogShow = true
        let timer = null
        timer = setInterval(function () {
          if (_this.$refs.bigPic) {
            clearInterval(timer)
            _this.$refs.bigPic.removeAttribute('style')
            _this.showOpen()
          }
        }, 50)
      },
      closePic () {
        this.dialogShow = false
      },
      changeShow (i) {
        if (i === 0) {
          this.prevShow = false
          this.nextShow = true
        } else if (i === this.dataList.data.length - 1) {
          this.nextShow = false
          this.prevShow = true
        } else {
          this.nextShow = true
          this.prevShow = true
        }
      },
      showOpen () {
        let _this = this
        let _w, _h
        if (typeof _this.$refs.bigPic.naturalWidth === 'undefined') {
          // IE 6/7/8
          let i = new Image()
          i.src = _this.$refs.bigPic.src
          _w = _this.$refs.bigPic.width
          _h = _this.$refs.bigPic.height
        } else {
          // HTML5 browsers
          _w = _this.$refs.bigPic.naturalWidth
          _h = _this.$refs.bigPic.naturalHeight
        }
        const p = document.getElementById('pic-wrap')
        const _pw = p.offsetWidth
        const _ph = p.offsetHeight
        if (_w / _h > _pw / _ph) {
          _this.$refs.bigPic.style.width = _pw + 'px'
          _this.$refs.bigPic.style.height = 'auto'
        } else {
          _this.$refs.bigPic.style.width = 'auto'
          _this.$refs.bigPic.style.height = _ph + 'px'
        }
      }
    },
    created () {
      this.changeShow(this.num)
    },
    mounted () {
      let formDataNew = {}
      let formDataArea = {}
      formDataArea.type = this.type
      if (this.$route.query.id) {
        formDataArea.id = this.$route.query.id
        formDataNew = Object.assign({}, this.formData, this.timeData, {location: this.$route.query.id})
      } else {
        formDataNew = Object.assign({}, this.formData, this.timeData, {location: ''})
      }
      this.formDataNew = formDataNew
      this.getData(formDataNew)
      axios.post('/api/get_area', formDataArea).then((res) => {
        if (!res.data.length) {
          this.dialogFlag = true
        } else {
          this.dialogFlag = false
          this.nodes = generateTreeData(res.data, 0)
        }
      })
    }
  }
</script>

<style lang="scss">
  .fog-history-wrap {
    .form-wrap {
      padding: 10px 20px 0 20px;
      display: flex;
      flex-flow: row nowrap;
      .time-part {
        min-width: 560px;
        margin-right: 20px;
      }
      .location-part {
        min-width: 250px;
        margin-right: 20px;
        .item-text {
          width: 64px;
          padding-bottom: 10px;
        }
      }
      .state {
        margin-right: 20px;
        min-width: 120px;
        .title {
          display: inline-block;
          vertical-align: middle;
          padding: 0 8px 15px 0;
        }
        .mu-text-field {
          width: 80px !important;
        }
      }
      .actions {
        padding-top: 5px;
        .mu-raised-button {
          border-radius: 4px;
        }
      }
    }
    .history-list {
      margin-top: 20px;
      .card {
        width: 600px;
        height: 405px;
        overflow: hidden;
        &.left {
          float: left;
        }
        &.right {
          float: right;
        }
        .history-table {
          table-layout: fixed;
          width: 100%;
          border: 0;
          border-spacing: 0;
          border-collapse: collapse;
          word-break: break-all;
          word-wrap: break-word;
          th, td {
            height: 45px;
            text-align: center;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            span {
              padding-left: 16px;
              color: #0083DE;
              cursor: pointer;
            }
          }
          thead th {
            background: #D4EEFF;
            color: #0084E1;
            font-size: 16px;
            font-weight: bolder;
          }
          tr {
            &:nth-child(odd) {
             background: #fff;
            }
            &:nth-child(even) {
             background: #f6f6f6;
            }
          }
        }
      }
    }
    .mu-pagination {
      margin-top: 20px;
      -webkit-box-pack: center !important;
      -ms-flex-pack: center !important;
      justify-content: center !important
    }
    .content {
      padding-bottom: 0;
    }
  }
</style>
