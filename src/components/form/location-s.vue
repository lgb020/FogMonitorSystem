<template>
  <mu-flexbox orient="horizontal" class="location" :id="id">
    <mu-flexbox>
      <mu-flexbox-item grow="0" class="item-text">
        {{ label }}
      </mu-flexbox-item>
      <mu-flexbox-item grow="1" class="item-content">
        <mu-text-field :hintText="hintText" :errorText="locationError" @focus="showTree"
                       @input="filterTree" fullWidth />
        <mu-paper class="tree-paper" :zDepth="2" v-show="treeShow">
          <ul class="ytree" v-show="!filterShow">
            <items :model='model' :limit="limit" :flag="id" v-for='model in nodes' :key="model.key"
                   @cb="checkboxEvent"></items>
          </ul>
          <ul class="ytree-filter" v-show="filterShow" v-if="filterNodes.length > 0">
            <items :model="model" :limit="limit" :flag="id" v-for="model in filterNodes" :key="model.key"
                   @cb="checkboxEvent"></items>
          </ul>
          <div class="ytree-filter ytree-no-data" v-show="filterShow" v-else>
            未检索到相关点位
          </div>
        </mu-paper>
      </mu-flexbox-item>
    </mu-flexbox>
  </mu-flexbox>
</template>

<script>
  import { LOCATIONSHOW } from '@/store/types.js'

  let timeout = null

  function trNodes (items, v, result) {
    if (!items || items.length === 0) return
    if (!v) return
    for (let i in items) {
      if (items[i].canSelect === true && items[i].text.indexOf(v) > -1) {
        result.push(items[i])
      }
      if (items[i].hasOwnProperty('nodes')) {
        trNodes(items[i].nodes, v, result)
      }
    }
  }

  export default {
    props: {
      label: {
        type: String,
        default: '检索位置'
      },
      errorText: {
        type: String,
        default: ''
      },
      limit: {
        type: Number,
        default: 500
      },
      id: {
        type: [Number, String],
        default: 'location-s'
      },
      nodes: {
        type: Array,
        default: []
      }
    },
    data () {
      return {
        treeShow: false,
        filterShow: false,
        filterNodes: [],
        hintText: '请选择位置或区域',
        paperW: 'width: 220px',
        idMap: new Map(),
        locationError: ''
      }
    },
    components: {
      items: () => import('@/components/tree/tree-s')
    },
    watch: {
      errorText (val) {
        this.locationError = val
      }
    },
    mounted () {
      let _this = this
      window.addEventListener('click', this.closeTree)
      window.addEventListener('scroll', function () {
        let tp = $('.tree-paper').offset().top
        if (tp > 0 && tp < $(window).scrollTop()) {
          _this.closeTree()
        }
      }, false)
      this.$store.state.locationCount[this.id] = 0
      this.paperW = 'width:' + document.querySelector('.location .mu-text-field').getBoundingClientRect().width + 'px'
    },
    destroyed () {
      window.removeEventListener('click', this.closeTree)
    },
    methods: {
      showTree () {
        let t = this.idMap.size
        this.treeShow = true
        this.hintText = !t ? '可输入位置名称筛选' : `已选择${t}个位置或区域`
      },
      closeTree () {
        this.treeShow = false
      },
      checkboxEvent (e) {
        this.locationError = ''
        console.log(e)
        if (e.checked) {
          this.idMap.set(e.id, {text: e.text, time: e.time})
          this.$store.state.locationCount[this.id] += 1
        } else {
          this.idMap.delete(e.id)
          this.$store.state.locationCount[this.id] -= 1
        }
        let t = this.idMap.size
        this.hintText = !t ? '可限定检索位置' : `已选择${t}个位置或区域`
      },
      filterTree (v) {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          this.filterShow = !!v
          this.filterNodes = []
          trNodes(this.nodes, v, this.filterNodes)
        }, 500)
      }
    }
  }
</script>

<style lang="scss" type="text/scss" scoped>
  .location {
    position: relative;
  }

  .tree-paper {
    position: absolute;
    margin-top: -10px;
    z-index: 10;
    max-height: 250px;
    overflow: scroll;
    background-color: #fff;
  }
  .ytree-no-data {
    padding: 10px 24px;
    color: #9E9E9E;
  }
</style>
