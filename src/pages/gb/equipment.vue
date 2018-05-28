<template>
  <div class="manage-equipment-wrap">
    <layout>
      <mu-breadcrumb slot="bread" separator=">">
        <mu-breadcrumb-item href="#/">首页</mu-breadcrumb-item>
        <mu-breadcrumb-item href="#/manage">后台管理</mu-breadcrumb-item>
        <mu-breadcrumb-item>设备管理</mu-breadcrumb-item>
      </mu-breadcrumb>
      <mu-card>
        <div class="content-equipment-list">
          <div class="list-title">
            <input type="text" class="search-input" v-model="searchValue" placeholder="请输入卡口名称">
            <mu-raised-button label="搜索" class="user-search-button" primary @click="searchLocation"/>
            <mu-raised-button label="单个点位添加" class="operator-btn add-button" primary @click="openAddLocation($event)"/>
          </div>
        </div>
        <div class="list-content">
          <table class="location-table">
            <thead>
            <tr>
              <th width="10%">序号</th>
              <th width="20%">以萨卡口编号(共 <span>{{ pageData.totalLocation }}</span> 个点位)</th>
              <th width="20%">厂商卡口编号</th>
              <th width="35%">卡口名称</th>
              <th width="15%">操作</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="item,index in pageData.list">
              <td>{{ (formData.pn - 1) * formData.pageSize + index + 1 }}</td>
              <td>{{ item.location_id }}</td>
              <td>{{ item.loc_id }}</td>
              <td :title="item.text">{{ item.text }}</td>
              <td class="operator">
                <span @click="openAddLocation($event, item.id)">修改</span>
                <span @click="deleteLocation(item.id)">删除</span>
              </td>
            </tr>
            </tbody>
          </table>
          <mu-pagination v-show="pageData.list.length !== 0" :pageSize="formData.pageSize" :total="pageData.totalLocation" :current="formData.pn" @pageChange="handleClick"></mu-pagination>
          <no-data v-show="pageData.list.length === 0" text="无数据"></no-data>
          <mu-dialog :open="dialogAdd" dialogClass="location-add-dialog" @close="closeAddLocation" @show="initMap">
            <div class="dialog-title">
              {{ dialogTitle }}
              <i class="material-icons close-icon" @click="closeAddLocation">highlight_off</i>
            </div>
            <div class="dialog-content">
              <div class="clearfix">
                <div class="left-form">
                  <div class="form-group">
                    <label class="control-label">厂商卡口编号</label>
                    <input type="text" class="form-control" v-model="addData.loc_id" placeholder="请输入卡口编号" autocomplete="off" @blur="getMenuId">
                  </div>
                  <div class="form-group">
                    <label class="control-label">以萨卡口编号</label>
                    <input type="text" class="form-control" v-model="addData.location_id" disabled autocomplete="off">
                  </div>
                  <div class="form-group">
                    <label class="control-label">卡口名称</label>
                    <input type="text" class="form-control" v-model="addData.text" placeholder="请输入卡口名称" autocomplete="off">
                  </div>
                  <div class="form-group">
                    <label class="control-label">连接地址</label>
                    <input type="text" class="form-control" v-model="addData.rtmp" placeholder="请输入RTMP或RTSP地址" autocomplete="off">
                  </div>
                  <div class="form-group">
                    <label class="control-label">经纬度</label>
                    <input type="text" class="form-control half" v-model="addData.lng" placeholder="请输入经度" autocomplete="off" style="margin-right: 30px">
                    <input type="text" class="form-control half" v-model="addData.lat" placeholder="请输入纬度" autocomplete="off">
                  </div>
                </div>
                <div class="right-map">
                  <div class="map-parent">
                    <div id="map"></div>
                  </div>
                  <div>按住左键拖动地图上红色标注到相应位置，即可完成修改</div>
                </div>
              </div>
              <div class="action-btn">
                <mu-raised-button label="保存" class="operator-btn add-button" primary @click="changeLocation"/>
              </div>
            </div>
            <mu-popup position="top" :overlay="false" popupClass="demo-popup-top" :open="topPopup">
              {{ popText }}
            </mu-popup>
          </mu-dialog>
          <mu-popup position="top" :overlay="false" popupClass="demo-popup-top" :open="topPopup2">
            {{ popText }}
          </mu-popup>
        </div>
      </mu-card>
    </layout>
  </div>
</template>

<script>
  import Layout from '@/components/layout/result'
  import noData from '@/components/result/no-data'
  import axios from '@/axios.conf.js'

  const mapConfig = YISACONF.map

  export default {
    components: {
      Layout,
      noData
    },
    data () {
      return {
        searchValue: '',
        pageData: {
          totalLocation: 0,
          list: []
        },
        formData: {
          pn: 1,
          pageSize: 10,
          uName: '' // 搜索条件
        },
        addData: {
          location_id: '', // 以萨卡口编号
          loc_id: '', // 厂商卡口编号
          text: '', // 点位名称
          lng: '', // 经度
          lat: '', // 纬度
          rtmp: '' // rtmp地址或rtsp地址
        },
        dialogAdd: false,
        dialogTitle: '',
        id: '',
        topPopup: false,
        topPopup2: false,
        popText: '',
        map: null,
        options: {
          center: new AMap.LngLat(mapConfig.center[0], mapConfig.center[1]),
          zoom: mapConfig.zoom,
          zooms: mapConfig.zooms,
          resizeEnable: true
        },
        iconUrl: '/static/images/map/',
        size: new AMap.Size(17, 23),
        offset: new AMap.Pixel(-8, -23)
      }
    },
    methods: {
      loadList () {
        let _this = this
        axios.post('/api/location_list', this.formData).then(
          (res) => {
            _this.pageData.totalLocation = res.data.totalLocation
            _this.pageData.list = res.data.list
          },
          (error) => {
            console.log(error)
          }
        )
      },
      handleClick (pno) {
        this.formData.pn = pno
        this.loadList()
      },
      searchLocation () {
        this.formData.uName = this.searchValue
        this.formData.pn = 1
        this.loadList()
      },
      openAddLocation (e, uid) {
        if (uid) {
          this.dialogTitle = '点位修改'
          this.id = uid
          // 请求接口 带入信息
          axios.post('/api/location_info', {id: uid}).then(
            (res) => {
              let data = res.data
              this.id = res.data.id
              this.addData.location_id = data.location_id
              this.addData.loc_id = data.loc_id
              this.addData.text = data.text
              this.addData.lng = data.lng
              this.addData.lat = data.lat
              this.addData.rtmp = data.rtmp
              this.dialogAdd = true
            },
            (error) => {
              console.log(error)
            }
          )
        } else {
          this.dialogTitle = '点位添加'
          this.id = ''
          this.addData.location_id = ''
          this.addData.loc_id = ''
          this.addData.text = ''
          this.addData.lng = ''
          this.addData.lat = ''
          this.addData.rtmp = ''
          this.dialogAdd = true
        }
      },
      closeAddLocation () {
        this.dialogAdd = false
      },
      changeLocation () {
        let _this = this
        if (this.id) {
          // 修改点位
          if (_this.formCheck()) {
            _this.editLocation()
          }
        } else {
          // 添加点位
          if (_this.formCheck()) {
            _this.addLocation()
          }
        }
      },
      getMenuId () {
        this.addData.location_id = ''
        axios.post('/api/get_menu_id', {id: this.addData.loc_id}).then(
          (res) => {
            if (res.data.id) {
              this.addData.location_id = res.data.id
              if (res.data.rtmp) {
                this.addData.rtmp = res.data.rtmp
              }
            } else {
              alert('请填写已存在的厂商卡口编号')
            }
          },
          (error) => {
            console.log(error)
          }
        )
      },
      formCheck () {
        if (!this.addData.loc_id) {
          this.popText = '请填写厂商卡口编号'
          this.topPopup = true
          return false
        }
        if (!this.addData.location_id) {
          this.popText = '请填写已存在的厂商卡口编号'
          this.topPopup = true
          return false
        }
        if (!this.addData.text) {
          this.popText = '请填写卡口名称'
          this.topPopup = true
          return false
        }
        if (!this.lnglatCheck(this.addData.lng, this.addData.lat)) {
          this.popText = '请正确填写经纬度'
          this.topPopup = true
          return false
        }
        return true
      },
      lnglatCheck (lng, lat) {
        if ((/^(((\d|[1-9]\d|1[1-7]\d|0)\.\d{0,6})|(\d|[1-9]\d|1[1-7]\d|0{1,3})|180\.0{0,6}|180)$/.test(lng)) && (/^([0-8]?\d{1}\.\d{0,6}|90\.0{0,6}|[0-8]?\d{1}|90)$/.test(lat))) {
          return true
        }
        return false
      },
      editLocation () {
        let postData = Object.assign({}, this.addData, {id: this.id})
        axios.post('/api/edit_location', postData).then(
          (res) => {
            if (!res.data.status) {
              this.popText = res.data.message
              this.topPopup2 = true
              this.dialogAdd = false
              this.loadList()
            } else {
              this.popText = res.data.message
              this.topPopup2 = true
            }
          },
          (error) => {
            this.popText = error
            this.topPopup2 = true
          }
        )
      },
      addLocation () {
        axios.post('/api/add_location', this.addData).then(
          (res) => {
            if (!res.data.status) {
              this.popText = res.data.message
              this.topPopup2 = true
              this.dialogAdd = false
              this.loadList()
            } else {
              this.popText = res.data.message
              this.topPopup2 = true
            }
          },
          (error) => {
            this.popText = error
            this.topPopup2 = true
          }
        )
      },
      deleteLocation (id) {
        if (confirm('确认删除该条数据？')) {
          axios.post('/api/del_location', {id: id}).then(
            (res) => {
              if (!res.data.status) {
                this.popText = res.data.message
                this.topPopup2 = true
                this.loadList()
              } else {
                this.popText = res.data.message
                this.topPopup2 = true
              }
            },
            (error) => {
              this.popText = error
              this.topPopup2 = true
            }
          )
        } else {
          return false
        }
      },
      initMap () {
        let _this = this
        let marker = null
        _this.map = new AMap.Map('map', _this.options)
        AMap.plugin(['AMap.ToolBar', 'AMap.Scale'], function () {
          _this.map.addControl(new AMap.ToolBar())
          _this.map.addControl(new AMap.Scale())
        })
        if (_this.addData.lng && _this.addData.lat) {
          let lnglat = new AMap.LngLat(parseFloat(_this.addData.lng), parseFloat(_this.addData.lat))
          _this.map.setCenter(lnglat)
          marker = _this.addMarkerOne(parseFloat(_this.addData.lng), parseFloat(_this.addData.lat))
        } else {
          marker = _this.addMarkerOne(parseFloat(mapConfig.center[0]), parseFloat(mapConfig.center[1]))
        }
        marker.on('dragend', function (e) {
          _this.addData.lng = e.lnglat.lng
          _this.addData.lat = e.lnglat.lat
        })
      },
      addMarkerOne (lng, lat) {
        let marker = null
        if (this.map) {
          let lnglat = new AMap.LngLat(parseFloat(lng), parseFloat(lat))
          if (lnglat) {
            let opts = {
              map: this.map,
              position: lnglat,
              icon: new AMap.Icon({
                image: this.iconUrl + 'stop-markerh.png',
                size: this.size
              }),
              offset: this.offset,
              draggable: true
            }
            marker = new AMap.Marker(opts)
          }
        }
        return marker
      }
    },
    mounted () {
      this.loadList()
    },
    watch: {
      topPopup (val) {
        if (val) {
          setTimeout(() => {
            this.topPopup = false
          }, 2000)
        }
      },
      topPopup2 (val) {
        if (val) {
          setTimeout(() => {
            this.topPopup2 = false
          }, 1000)
        }
      }
    }
  }
</script>

<style lang="scss" type="text/scss">
  .manage-equipment-wrap {
    input:focus {
      border-color: #66afe9;
      box-shadow: inset 0 1px 1px rgba(0,0,0,.075), 0 0 8px rgba(102,175,233,.6);
      outline: 0;
    }
    .content-equipment-list {
      padding: 20px 15px;
    }
    .list-title {
      position: relative;
    }
    .search-input {
      width: 178px;
      height: 32px;
      padding: 6px 12px;
      font-size: 13px;
      line-height: 32px;
      color: #555;
      border: 1px solid #ccc;
      border-radius: 4px;
      transition: border-color ease-in-out .15s,box-shadow ease-in-out .15s;
    }
    .user-search-button {
      height: 32px;
      line-height: 32px;
    }
    .operator-btn {
      position: absolute;
      height: 32px;
      line-height: 32px;
      &.add-button {
         top: 0;
         right: 0;
      }
    }
    .list-content {
      padding: 0 15px 20px 15px;
    }
    .location-table {
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
      &.operator span {
        color: #0084df;
        cursor: pointer;
        &:nth-child(1) {
          padding-right: 16px;
        }
      }
    }
    thead th {
      background: #f8f8f8;
      color: #0084df;
      font-size: 16px;
      font-weight: bold;
    }
    tr {
      &:nth-child(odd) {
         background: #fff;
      }
      &:nth-child(even) {
         background: #f8f8f8;
      }
    }
    }
    .mu-pagination {
      margin-top: 20px;
      -webkit-box-pack: center !important;
      -ms-flex-pack: center !important;
      justify-content: center !important
    }
  }
</style>
