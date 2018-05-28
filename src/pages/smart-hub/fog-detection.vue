<template>
  <div class="fog-detection-wrap">
    <layout>
      <div class="map-parent">
        <div id="map"></div>
        <div class="map-layer">
          <div class="map-legend">
            <ul>
              <li>
                <img src="../../../static/images/map/big-fog.png">
                <span>大雾</span>
              </li>
              <li>
                <img src="../../../static/images/map/mid-fog.png">
                <span>中雾</span>
              </li>
              <li>
                <img src="../../../static/images/map/small-fog.png">
                <span>轻雾</span>
              </li>
            </ul>
          </div>
          <div class="map-link">
            <router-link class="location-link" :to="{path:'/manage/equipment'}">监测设备设置
            </router-link>
            <router-link class="history-link" :to="{path:'/fog-history'}">历史记录查询</router-link>
          </div>
        </div>
      </div>
      <div class="right-parent">
        <div class="fog-title">
          <span>雾气变化提醒</span>
          <mu-select-field v-model="targetType" label="" class="target-field" :underlineShow="true" @change="changeFilter">
            <mu-menu-item value="4" title="全部"/>
            <mu-menu-item value="3" title="大雾"/>
            <mu-menu-item value="2" title="中雾"/>
            <mu-menu-item value="1" title="轻雾"/>
          </mu-select-field>
        </div>
        <div v-show="hasFogData" class="fog-content">
          <div v-for="(item,index) in listData" :key="item.id" class="fog-item" v-show="showContent(item)" :data-id="item.id" @click="listItemClick(item, index)">
            <img :src="'../../../static/images/map/' + icon[item.fogDegree] + '-list.png'">
            <div class="fog-content-right">
              <div class="location">
                <span class="tit">监控点位</span>
                <span class="con" :title="item.locationName">{{ item.locationName }}</span>
              </div>
              <div class="time">
                <span class="tit">更新时间</span>
                <span class="con">{{ item.time }}</span>
              </div>
            </div>
          </div>
        </div>
        <no-data-img v-show="!hasFogData" text="暂无数据"></no-data-img>
      </div>
      <mu-dialog :open="dialogFlag" dialogClass="fog-detection-dialog" @close="closeDialog">
        <div class="dialog-title">
          {{ nowItem.locationName }}，{{ nowItem.time }}
          <i class="material-icons close-icon" @click="closeDialog">highlight_off</i>
        </div>
        <div class="dialog-content">
          <div v-if="nowItem.bigPic !== ''" id="pic-wrap" class="pic">
            <img :src="nowItem.bigPic" ref="bigPic">
          </div>
          <no-data v-else></no-data>
        </div>
      </mu-dialog>
    </layout>
  </div>
</template>

<script>
  import Layout from '@/components/layout/result'
  import noData from '@/components/result/no-data'
  import noDataImg from '@/components/result/no-data-img'
  import axios from '@/axios.conf.js'
  import io from 'socket.io-client'
  import '../../../static/jquery-plugin/jquery.nicescroll.min.js'

  let mapHeight = (winH = $(window).height()) => {
    $('.map-parent').css({
      'height': winH - 60 - 27,
      'width': $(window).width() - 340
    })
    $('.right-parent').css({
      'height': winH - 60 - 27
    })
    $('.fog-content').css({
      'height': $('.right-parent').height() - 40
    })
  }
  /* eslint-disable no-undef */
  const socketHost = YISACONF.fogSocketUrl
  const mapConfig = YISACONF.map
  const rank = ['无雾', '轻雾', '中雾', '大雾']
  export default {
    components: {
      Layout,
      noData,
      noDataImg
    },
    data () {
      return {
        map: null,
        icon: ['no-fog', 'small-fog', 'mid-fog', 'big-fog'], // 0:无雾 1:轻雾 2:中雾 3：大雾
        markers: new Map(), // 存储所有Marker点位的Map集合
        warningMarkerIds: [],
        infoWindow: null,
        options: {
          center: new AMap.LngLat(mapConfig.center[0], mapConfig.center[1]),
          zoom: mapConfig.zoom,
          zooms: mapConfig.zooms,
          animateEnable: true
        },
        iconUrl: '/static/images/map',
        fogSocket: null,
        listData: [],
        dialogFlag: false,
        nowItem: {},
        targetType: '4',
        hasFogData: true
      }
    },
    methods: {
      init () {
        let _this = this
        this.map = new AMap.Map('map', this.options)
        axios.post('/api/fog_location').then((res) => {
          _this.warningMarkerIds = []
          let list = []
          if (res.data.length) {
            let data = res.data
            list = data
            data.forEach(function (item) {
              _this.addMarker(item)
              if (item.fogDegree !== 0) {
                _this.warningMarkerIds.push(item.id)
              }
            })
            this.map.setFitView()
            _this.listData = list
          }
        }).then(() => {
          // 连接socket
          _this.fogSocket = io.connect(socketHost)
          let socket = _this.fogSocket
          socket.on('get_fog_detection_list', function (data) {
            let dataIdArr = []
            data.forEach(function (item) {
              dataIdArr.push(item.id)
              _this.changeIcon(item)
            })
            let newArr = _this.listData.filter(function (item) {
              return $.inArray(item.id, dataIdArr) === -1
            })
            _this.listData = [...data, ...newArr]
          })
          // infowindow 点击显示大图
          $('#map').on('click', '.small-img', function () {
            _this.openDialog()
            let timer = null
            timer = setInterval(function () {
              if (_this.$refs.bigPic) {
                clearInterval(timer)
                _this.$refs.bigPic.removeAttribute('style')
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
            }, 50)
          })
        })
      },
      addMarker (item) {
        if (item.lng && item.lat) {
          let _this = this
          let opts = {}
          opts.map = this.map
          if (item.fogDegree !== 0) {
            opts.icon = new AMap.Icon({
              image: this.iconUrl + '/' + this.icon[item.fogDegree] + '.png',
              size: new AMap.Size(30, 30)
            })
            opts.offset = new AMap.Pixel(-15, -15)
          } else {
            opts.icon = new AMap.Icon({
              image: this.iconUrl + '/' + this.icon[item.fogDegree] + '.png',
              size: new AMap.Size(19, 25)
            })
            opts.offset = new AMap.Pixel(-9, -25)
          }
          let lnglat = new AMap.LngLat(parseFloat(item.lng), parseFloat(item.lat))
          if (lnglat) {
            opts.position = lnglat
            opts.title = item.locationName
            let marker = new AMap.Marker(opts)
            marker.id = item.id
            marker.locationName = item.locationName
            marker.fogDegree = item.fogDegree
            this.markers.set(item.id, marker)
            marker.on('click', function (e) {
              let _marker = e.target
              $('.fog-item').each(function () {
                if ($(this).attr('data-id') === _marker.id) {
                  $(this).click()
                }
              })
            }, marker)
          }
        }
      },
      changeIcon (item) {
        let _this = this
        let marker = this.markers.get(item.id)
        if (marker && marker.fogDegree !== item.fogDegree) { // 如果地图上渲染点的雾气大小和当前请求不同，改变地图点的图标
          marker.setMap(null)
          this.addMarker(item)
        }
      },
      openInfoWindow (lng, lat, content) {
        let infowindowOpts = {}
        infowindowOpts.size = new AMap.Size(240, 290)
        infowindowOpts.position = new AMap.LngLat(parseFloat(lng), parseFloat(lat))
//        infowindowOpts.autoMove = true
        infowindowOpts.content = content
        this.infoWindow = new AMap.InfoWindow(infowindowOpts)
        this.infoWindow.open(this.map, new AMap.LngLat(parseFloat(lng), parseFloat(lat)))
        this.map.setCenter(new AMap.LngLat(lng, lat))
        this.map.panBy(0, 25)
      },
      closeInfoWindow () {
        if (this.infoWindow) {
          this.infoWindow.close()
          this.infoWindow = null
        }
      },
      listItemClick (item, index) {
        this.closeInfoWindow()
        this.nowItem = item
        $('.fog-item').eq(index).addClass('active').siblings().removeClass('active')
        let marker = this.markers.get(item.id)
        if (marker) {
          let conHtml = `
            <div class="map-item">
              <div class="location-name" title="${item.locationName}">${item.locationName}</div>
              <img class="small-img" src="${item.pic}" alt="${item.locationName}">
              <div class="line">雾气等级：${rank[item.fogDegree]}</div>
              <div class="line">图片采集时间：${item.time}</div>
              <div class="line">历史演变：${rank[item.oldFogDegree]}->${rank[item.fogDegree]}</div>
              <div class="line">演变开始时间：${item.oldTime}</div>
              <div class="line"><a href="#/fog-history?id=${item.id}">查看历史记录</a></div>
            </div>
          `
          this.openInfoWindow(marker.getPosition().getLng(), marker.getPosition().getLat(), conHtml)
        }
      },
      closeDialog: function () {
        this.dialogFlag = false
      },
      openDialog: function () {
        this.dialogFlag = true
      },
      changeFilter (value) {
        this.targetType = value
      },
      showContent (item) {
        if (this.targetType === '4') {
          return item.fogDegree === 1 || item.fogDegree === 2 || item.fogDegree === 3
        } else {
          return item.fogDegree === parseInt(this.targetType)
        }
      }
    },
    mounted () {
      mapHeight()
      $(window).resize(() => mapHeight())
      $('.fog-content').niceScroll({
        cursorcolor: '#3497db',
        autohidemode: true
      })
      setInterval(function () {
        $('.fog-content').getNiceScroll().resize()
      }, 500)
      this.init()
    },
    destroyed () {
      this.fogSocket.disconnect()
      $('.fog-content').getNiceScroll().resize()
    },
    watch: {
      listData: function (newVal, oldVal) {
        let _this = this
        let flag = false
        if (newVal.length > 0) {
          for (let i = 0; i < newVal.length; i++) {
            if (newVal[i].fogDegree === 0) {
              continue
            } else {
              flag = true
              break
            }
          }
        }
        this.hasFogData = flag
      }
    }
  }
</script>

<style lang="scss" type="text/scss">
  .fog-detection-wrap {
    .content {
      position: relative;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      .breadcrumb {
        margin: 0 !important;
      }
      .map-parent {
        position: relative;
        float: left;
        #map {
          width: 100%;
          height: 100%;
          .amap-info-content {
            border-top-left-radius: 5px;
            border-top-right-radius: 5px;
            font-size: 12px;
            .map-item {
              height: 100%;
              .location-name {
                font-size: 14px;
                font-weight: 900;
                overflow: hidden;
                text-overflow: ellipsis;
                word-break: break-all;
                white-space: nowrap;
              }
              .small-img {
                width: 207px;
                height: 130px;
                cursor: pointer;
                margin-top: 5px;
              }
              .line {
                margin-top: 5px;
                a {
                  font-size: 14px;
                  color: #3497db;
                }
              }
            }
          }
        }
        .map-layer {
          position: absolute;
          top: 10px;
          left: 15px;
          z-index: 500;
          .map-legend {
            float: left;
            background: #C8EBFF;
            border-radius: 9px;
            box-shadow: 3px 3px 3px #CAC9C7;
            ul {
              width: 115px;
              height: 70px;
              margin: 0;
              padding: 10px 0 10px 10px;
              li {
                list-style: none;
                float: left;
                margin-right: 3px;
                height: 100%;
                text-align: center;
                img {
                  width: 30px;
                }
                span {
                  display: block;
                  width: 100%;
                  font-size: 12px;
                  font-weight: 700;
                }
              }
            }
          }
          .map-link {
            float: left;
            width: 140px;
            margin-left: 10px;
            a {
              display: block;
              text-align: center;
              width: 100%;
              height: 30px;
              color: #fff;
              border-radius: 6px;
              padding-top: 4px;
              box-shadow: 3px 3px 3px #CAC9C7;
            }
            .location-link {
              background: #3497db;
            }
            .history-link {
              background: #E57D1C;
              margin-top: 10px;
            }
          }
        }
      }
      .right-parent {
        position: absolute;
        right: 0;
        top: 0;
        z-index: 1000;
        width: 340px;
        background: #fff;
        box-shadow: -5px 0 5px -5px #9e9e9e;
        .mu-select-field .mu-dropDown-menu {
          height: 20px !important;
        }
        .fog-title {
          height: 40px;
          line-height: 40px;
          background: #D4EEFF;
          color: #0386E1;
          font-size: 16px;
          font-weight: 700;
          padding-left: 10px;
          position: relative;
          .target-field {
            position: absolute;
            top: 5px;
            right: 5px;
            background: #D4EEFF;
            width: 80px !important;
            height: 24px;
            border-radius: 4px;
            font-size: 12px;
            min-height: 24px;
            .mu-dropDown-menu-icon {
              top: -4px;
            }
            .mu-dropDown-menu-text {
              height: 24px;
              line-height: 24px;
              margin-top: -4px;
              padding-left: 5px;
              color: #9F9F9F;
              font-weight: 500;
            }
          }
        }
        .fog-content {
          overflow: hidden;
          .fog-item {
            height: 90px;
            border-bottom: 1px dashed #DDDDDD;
            padding: 20px 10px 20px 20px;
            cursor: pointer;
            &:last-child {
              border-bottom: 0;
            }
            &.active {
              background: #DFDDDE;
            }
            img {
              float: left;
              width: 50px;
            }
            .fog-content-right {
              margin-left: 65px;
              .tit {
                font-size: 11px;
                color: #bbbbbb;
              }
              .con {
                margin-left: 5px;
              }
              .location {
                overflow: hidden;
                text-overflow: ellipsis;
                word-break: break-all;
                white-space: nowrap;
              }
              .time {
                margin-top: 7px;
              }
            }
          }
        }
      }
    }
    .imap-clickable.label-city {
      width: 62px;
      height: 62px;
      text-align: center;
      background-color: #4aab68;
      opacity: 0.8;
      border-radius: 50%;
      overflow: hidden;
      cursor: pointer;
      top: -28px;
      padding: 6px;
      .imap-label {
        top: 12px;
        width: 50px;
        border: none;
        background: transparent;
        b {
          display: block;
        }
      }
      &:hover {
        background-color: #e4393c;
      }
    }
    .label-marker-address {
      .imap-label {
        border: none;
        background-color: #fff;
        padding: 3px 5px;
        box-shadow: 2px 2px 2px 0 rgba(0, 0, 0, .4);
        .triangle-down {
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 6px solid #9a9894;
          position: absolute;
          bottom: -6px;
          left: 50%;
          i {
            width: 0;
            height: 0;
            border-left: 3px solid transparent;
            border-right: 3px solid transparent;
            border-top: 4px solid #fff;
            position: relative;
            top: -3px;
            left: -3px;
          }
        }
      }
    }
  }
</style>
