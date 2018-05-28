<template>
  <li>
    <div>
      <i v-if='isFolder' class="material-icons" @click='toggle'>{{ open ? 'remove' : 'add' }}</i>
      <i v-if='!isFolder'></i>
      <span class="chk" :class="chkStatus" @click="changeChecked" v-if="model.canSelect !== false"></span>{{model.text}}
    </div>
    <ul v-show="open" v-if='isFolder'>
      <items v-for='cel in model.nodes' :model='cel' :key="cel.id" @cb="checkboxEvent" :limit="limit"
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
      checkboxEvent (e) {
        this.$emit('cb', e)
      },
      changeChecked () {
        if (this.model.checked) {
          this.model.checked = false
        } else {
          let num = this.$store.state.locationCount[this.flag]
          if (num >= this.limit) {
            alert(`最多只能选择${this.limit}个位置`)
            return
          }
          this.model.checked = true
        }
        this.$emit('cb', this.model)
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
