<template>
  <div @click.stop="doNothing" class="location" :id="id">
    <i title="地图选取点" class="material-icons m-icon" @click="showMapLayer">map</i>
    <mu-text-field label="检索位置" :hintText="hintText" :errorText="errorLocationText" @focus="showTree"
                   @input="filterTree" fullWidth/>
    <mu-paper class="tree-paper" :zDepth="2" v-show="wTreeShow" :style="paperW">
      <ul class="ytree" v-show="!filterShow">
        <items :model='model' :limit="limit" :flag="id" v-for='model in nodes' :key="model.key"
               @hint="changeHint"></items>
      </ul>
      <ul class="ytree-filter" v-show="filterShow">
        <items :model="model" :limit="limit" :flag="id" v-for="model in filterNodes" :key="model.key"
               @hint="changeHint"></items>
      </ul>
    </mu-paper>
    <amap :mapFlag="mapFlag" :from="from" :selectPoints="locationId" @mapReturn="getLocation" @close="closeMapLayer"></amap>
  </div>
</template>

<script>
  import axios from '@/axios.conf.js'
  import { TREEMAP, LOCATIONSHOW } from '@/store/types.js'
  import items from '@/components/tree/tree'
  import amap from '@/components/map/amap'

  let timeout = null

  function generateTreeData (treeData = [], parentKey) {
    treeData = treeData.map((item, i) => {
      item.key = parentKey + '_' + i.toString()
      item.checked = item.hasOwnProperty('checked') && item.checked
      if (item.hasOwnProperty('nodes') && item.nodes.length > 0) {
        generateTreeData(item.nodes, item.key)
      }
      return item
    })
    return treeData
  }

  export default {
    props: {
      errorLocationText: {
        type: String,
        default: ''
      },
      limit: {
        type: Number,
        default: 500
      },
      id: {
        type: [Number, String],
        default: 'location1'
      },
      from: { // 加载点位 默认实时点位  history 历史点位
        type: String,
        default: 'realtime'
      }
    },
    data () {
      return {
        treeShow: false,
        filterShow: false,
        filterNodes: [],
        nodes: [],
        hintText: '不限',
        paperW: 'width: 220px',
        mapFlag: false,
        locationId: []
      }
    },
    computed: {
      wTreeShow () {
        return this.treeShow && this.$store.state.formElShow.locationShow === this.id
      }
    },
    components: {
      items,
      amap
    },
    mounted () {
      window.addEventListener('click', this.closeTree)
      this.locationId = this.$route.query.location ? this.$route.query.location.split(',') : []
      this.$store.state.locationCount[this.id] = 0
      this.paperW = 'width:' + document.querySelector('.location .mu-text-field').getBoundingClientRect().width + 'px'
      let treeData = localStorage.getItem('treeData_' + this.from + '_' + YISACONF.staticDataCache)
      let datas = new Map()
      const _traverseNodes = (root) => {
        for (let item of root) {
          datas.set(item.key, item)
          if (item.nodes && item.nodes.length > 0) {
            _traverseNodes(item.nodes)
          }
          item.checked = this.inArray([], item.id)
        }
      }
      if (treeData) {
        this.nodes = JSON.parse(treeData)
        _traverseNodes(this.nodes)
        this.$store.commit(TREEMAP, {k: this.id, v: datas})
      } else {
        axios.post('/api/get_location', {
          type: this.from
        }).then((res) => {
          if (!res.data) return
          this.nodes = generateTreeData(res.data, 0)
          _traverseNodes(this.nodes)
          this.$store.commit(TREEMAP, {k: this.id, v: datas})
//          localStorage.clear()
          localStorage.setItem('treeData_' + this.from + '_' + YISACONF.staticDataCache, JSON.stringify(this.nodes))
        })
      }
    },
    destroyed () {
      window.removeEventListener('click', this.closeTree)
    },
    methods: {
      showMapLayer () {
        this.mapFlag = true
        this.treeShow = false
      },
      closeMapLayer (val) {
        this.mapFlag = val
      },
      showTree () {
        this.treeShow = true
        this.hintText = !this.$store.state.locationCount[this.id]
          ? '可输入位置名称筛选'
          : `已选择${this.$store.state.locationCount[this.id]}个位置`
      },
      closeTree () {
        this.treeShow = false
      },
      doNothing () {
        this.$store.commit(LOCATIONSHOW, this.id)
      },
      changeHint (t) {
        this.locationId = this.getTreeChecked()
        this.$store.state.locationCount[this.id] = this.locationId.length
        t = this.$store.state.locationCount[this.id]
        this.hintText = !t ? '可输入位置名称筛选' : `已选择${t}个位置`
      },
      filterTree (v) {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          let result = []
          this.filterShow = !!v
          for (let [, node] of this.$store.state.treemap[this.id]) {
            if (node.scale === undefined && node.text.indexOf(v) > -1) {
              result.push(node)
            }
          }
          this.filterNodes = result
        }, 500)
      },
      getTreeChecked () {
        if (!this.$store.state.treemap[this.id]) return
        let checked = []
        for (let [, node] of this.$store.state.treemap[this.id]) {
          if (node.checked && node.scale === undefined) {
            checked.push(node.id)
          }
        }
        return checked
      },
      getDefaultChecked () {
        let _location = this.$route.query.location ? this.$route.query.location.split(',') : undefined
        let res = []
        if (!_location) { return false }
        this.filterShow = true
        for (let [, node] of this.$store.state.treemap[this.id]) {
          if (node.scale === undefined && _location.indexOf(node.id) > -1) {
            res.push(node)
          }
        }
        this.filterNodes = res
      },
      inArray (arr = [], id) {
        let _location = this.$route.query.location ? this.$route.query.location.split(',') : undefined
        if (!_location) { return false }
        if (!arr.length) {
          arr = _location
        }
        // 不知道为什么，vue里不能用es6数组的.values()方法
        let elem = arr.find(e => {
          return e === id
        })
        if (elem !== undefined) {
          return true
        }
        return false
      },
      getLocation (val) {
        this.locationId = val
        let len = this.locationId.length
        this.hintText = !len ? '可输入位置名称筛选' : `已选择${len}个位置`
        this.$store.state.locationCount[this.id] = len
        let treeData = localStorage.getItem('treeData_' + this.from + '_' + YISACONF.staticDataCache)
        let datas = new Map()
        const _traverseNodes = (root) => {
          for (let item of root) {
            datas.set(item.key, item)
            if (item.nodes && item.nodes.length > 0) _traverseNodes(item.nodes)
          }
        }
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          if (treeData) {
            this.nodes = this.setDefaultChecked(treeData)
            _traverseNodes(this.nodes)
            this.$store.commit(TREEMAP, {k: this.id, v: datas})
          } else {
            axios.post('/api/get_location', {
              type: this.from
            }).then((res) => {
              if (!res.data) return
              treeData = generateTreeData(res.data, 0, val)
              this.nodes = this.setDefaultChecked(JSON.stringify(treeData))
              _traverseNodes(this.nodes)
              this.$store.commit(TREEMAP, {k: this.id, v: datas})
//              localStorage.clear()
              localStorage.setItem('treeData_' + this.from + '_' + YISACONF.staticDataCache, JSON.stringify(this.nodes))
            })
          }
        }, 200)
      },
      setDefaultChecked (treeData) {
        treeData = JSON.parse(treeData)
        if (this.locationId.length) {
          treeData = treeData.map((item, i) => {
            if (item.nodes) {
              let len = item.nodes.length
              let flag = 0
              item.nodes.forEach((v) => {
                for (let i of this.locationId) {
                  if (i === v.id) {
                    v.checked = true
                    flag++
                  }
                }
              })
              if (flag !== 0) {
                if (flag === len) {
                  item.checked = true
                } else {
                  item.halfChecked = true
                }
              }
            }
            return item
          })
        }
        return treeData
      }
    }
  }
</script>

<style lang="scss" type="text/scss" scoped>
  .location {
    position: relative;
    .m-icon {
      position: absolute;
      top: 27px;
      right: 0;
      font-size: 25px;
      color: #0084df;
      cursor: pointer;
      z-index: 8;
    }
  }

  .tree-paper {
    position: absolute;
    margin-top: -10px;
    z-index: 10;
    max-height: 250px;
    overflow: scroll;
    background-color: #fff;
  }
</style>
