<template>
  <li>
    <div>
      <i v-if='isFolder' class="material-icons" @click='toggle'>{{ open ? 'remove' : 'add' }}</i>
      <i v-if='!isFolder'></i>
      <span class="chk" :class="chkStatus" @click="changeChecked"></span>{{model.text}}
    </div>
    <ul v-show="open" v-if='isFolder'>
      <items v-for='cel in model.nodes' :model='cel' :key="cel.id" @hint="changeHint" :limit="limit"
             :flag="flag"></items>
    </ul>
  </li>
</template>

<script>
  import * as types from '@/store/types.js'
  export default {
    name: 'items',
    props: ['model', 'limit', 'flag'],
    components: {},
    data () {
      return {
        open: false
      }
    },
    computed: {
      isFolder: function () {
        return this.model.nodes && this.model.nodes.length
      },
      chkStatus () {
        let status = {
          'checkbox_true_full': true,
          'checkbox_true_part': false
        }
        if (this.isFolder) {
          status.checkbox_true_part = this.model.halfChecked
          status.checkbox_true_full = this.model.checked && !this.model.halfChecked
        } else {
          status.checkbox_true_full = this.model.checked
          status.checkbox_true_part = false
        }
        return status
      }
    },
    methods: {
      toggle () {
        if (this.isFolder) {
          this.open = !this.open
        }
      },
      changeHint () {
        this.$emit('hint', this.$store.state.locationCount[this.flag])
      },
      changeChecked () {
        this.changeChildren(this.model.key)
        if (this.model.key.slice(3)) {
          let parentKey = this.model.key.slice(0, this.model.key.lastIndexOf('_'))
          this.changeParent(parentKey)
        }
        this.$emit('hint', this.$store.state.locationCount[this.flag])
      },
      changeParent (modelKey) {
        let parent = this.$store.state.treemap[this.flag].get(modelKey)
        let status = this.getSilibingChecked(parent.nodes)
        let half = false
        let check = false
        if (status.t === status.c) {
          half = false
          check = true
        } else if (status.f === status.c && !status.h) {
          half = false
          check = false
        } else {
          half = true
          check = false
        }
        this.$set(parent, 'halfChecked', half)
        this.$set(parent, 'checked', check)
        if (modelKey.slice(3)) {
          let parentKey = modelKey.slice(0, modelKey.lastIndexOf('_'))
          this.changeParent(parentKey)
        }
      },
      changeChildren (modelKey) {
        let model = this.$store.state.treemap[this.flag].get(modelKey)
        let children = model.nodes
        if (children && children.length) {
          if (model.halfChecked) {
            model.checked = false
            model.halfChecked = false
            this.changeChildrenChecked(children, 1)
          } else {
            if (!model.checked && (children.length + this.$store.state.locationCount[this.flag]) > this.limit) {
              alert(`最多只能选择${this.limit}个位置`)
              return
            }
            model.checked = !model.checked
            this.changeChildrenChecked(children)
          }
        } else {
          let num = this.$store.state.locationCount[this.flag]
          if (model.checked) {
            model.checked = false
            if (model.scale === undefined) {
              num--
            }
          } else {
            if (num >= this.limit) {
              alert(`最多只能选择${this.limit}个位置`)
              return
            }
            model.checked = true
            if (model.scale === undefined) {
              num++
            }
          }
          this.$store.state.locationCount[this.flag] = num
        }
      },
      changeChildrenChecked (nodes, half) {
        if (half) {
          nodes.forEach((v, i) => {
            if (v.nodes && v.nodes.length) {
              this.changeChildrenChecked(v.nodes, half)
            } else {
              if (v.scale === undefined) { // 此处更新未使用commit，commit提交效率有问题
                this.$store.state.locationCount[this.flag] = v.checked
                  ? this.$store.state.locationCount[this.flag] - 1
                  : this.$store.state.locationCount[this.flag]
              }
            }
            v.checked = false
            v.halfChecked = false
          })
        } else {
          nodes.forEach((v, i) => {
            v.checked = !v.checked
            if (v.nodes && v.nodes.length) {
              this.changeChildrenChecked(v.nodes)
            } else {
              // v.checked ? this.$store.commit(types.LOCATIONCOUNT, 1) : this.$store.commit(types.LOCATIONCOUNT, -1)
              if (v.scale === undefined) {
                this.$store.state.locationCount[this.flag] = v.checked
                  ? this.$store.state.locationCount[this.flag] + 1
                  : this.$store.state.locationCount[this.flag] - 1
              }
            }
          })
        }
      },
      getSilibingChecked (nodes) {
        let status = {t: 0, f: 0, h: 0, c: nodes.length}
        for (let i = 0; i < status.c; i++) {
          if (nodes[i].halfChecked) status.h++
          if (nodes[i].checked) {
            status.t++
          } else {
            status.f++
          }
        }
        return status
      }
    },
    mounted () {
      if (this.model.checked) {
        if (this.model.key.slice(3)) {
          let parentKey = this.model.key.slice(0, this.model.key.lastIndexOf('_'))
          this.changeParent(parentKey)
          let num = this.$store.state.locationCount[this.flag]
          if (num >= this.limit) {
            alert(`最多只能选择${this.limit}个位置`)
            return
          }
          if (this.model.scale === undefined) {
            num++
          }
          this.$store.state.locationCount[this.flag] = num
        }
        this.$emit('hint', this.$store.state.locationCount[this.flag])
      }
    }
  }
</script>

<style lang="scss" type="text/scss">
  .ytree, .ytree-filter {
    padding-left: 10px;

    ul {
      padding-left: 17px;
    }

    li {
      div {
        line-height: 20px;
        height: 20px;
      }

      span.chk {
        display: inline-block;
        vertical-align: middle;
        border: 0 none;
        outline: none;
        background-color: transparent;
        background-repeat: no-repeat;
        background-attachment: scroll;
        background-image: url("zTreeStandard.png");
        width: 13px;
        height: 13px;
        margin: 0 3px 0 0;
        cursor: auto
      }
      span.chk.checkbox_false_full {
        background-position: 0 0
      }
      span.chk.checkbox_false_full_focus {
        background-position: 0 -14px
      }
      span.chk.checkbox_false_part {
        background-position: 0 -28px
      }
      span.chk.checkbox_false_part_focus {
        background-position: 0 -42px
      }
      span.chk.checkbox_false_disable {
        background-position: 0 -56px
      }
      span.chk.checkbox_true_full {
        background-position: -14px 0
      }
      span.chk.checkbox_true_full_focus {
        background-position: -14px -14px
      }
      span.chk.checkbox_true_part {
        background-position: -14px -28px
      }
      span.chk.checkbox_true_part_focus {
        background-position: -14px -42px
      }
      span.chk.checkbox_true_disable {
        background-position: -14px -56px
      }
      span.chk.radio_false_full {
        background-position: -28px 0
      }
      span.chk.radio_false_full_focus {
        background-position: -28px -14px
      }
      span.chk.radio_false_part {
        background-position: -28px -28px
      }
      span.chk.radio_false_part_focus {
        background-position: -28px -42px
      }
      span.chk.radio_false_disable {
        background-position: -28px -56px
      }
      span.chk.radio_true_full {
        background-position: -42px 0
      }
      span.chk.radio_true_full_focus {
        background-position: -42px -14px
      }
      span.chk.radio_true_part {
        background-position: -42px -28px
      }
      span.chk.radio_true_part_focus {
        background-position: -42px -42px
      }
      span.chk.radio_true_disable {
        background-position: -42px -56px
      }
    }

    i {
      vertical-align: middle;
      font-size: 16px;
      cursor: pointer;
      display: inline-block;
      width: 16px;
      height: 16px;
    }
  }

  .ytree-filter {
    padding-left: 0;
  }

  ul {
    list-style: none;
  }

  li > div {
    white-space: nowrap;
  }


</style>
