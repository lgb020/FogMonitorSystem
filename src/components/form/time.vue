<template>
  <div class="time-part">
    <mu-flexbox :orient="orient">
      <mu-flexbox>
        <mu-flexbox-item grow="0" class="item-text" :style="{width: beginText.length * 15 + 'px'}">
          {{ beginText }}
        </mu-flexbox-item>
        <mu-flexbox-item grow="3" v-if="timeType === 'date-time'">
          <mu-date-picker container="inline" autoOk hintText="选择日期" v-model="beginDate"
                          @change="changeValue('begin-date', $event)" fullWidth/>
        </mu-flexbox-item>
        <mu-flexbox-item grow="1">
          <mu-text-field v-model="formData.bh" name="time" @input="changeValue('bh')"
                         @focus="showTime('bh',formData.bh,$event)"
                         hintText="时" fullWidth/>
        </mu-flexbox-item>
        <mu-flexbox-item grow="1">
          <mu-text-field v-model="formData.bm" name="time" @input="changeValue('bm')"
                         @focus="showTime('bm',formData.bm,$event)"
                         hintText="分" fullWidth/>
        </mu-flexbox-item>
        <mu-flexbox-item grow="1">
          <mu-text-field v-model="formData.bs" name="time" @input="changeValue('bs')"
                         @focus="showTime('bs',formData.bs,$event)"
                         hintText="秒" fullWidth/>
        </mu-flexbox-item>
        <mu-flexbox-item grow="0" class="item-text" :style="{width: endText.length * 15 + 'px'}">
          {{ endText }}
        </mu-flexbox-item>
        <mu-flexbox-item grow="3" v-if="timeType === 'date-time'">
          <mu-date-picker container="inline" autoOk hintText="选择日期" v-model="endDate"
                          @change="changeValue('end-date', $event)" fullWidth/>
        </mu-flexbox-item>
        <mu-flexbox-item grow="1">
          <mu-text-field v-model="formData.eh" name="time" @input="changeValue('eh')"
                         @focus="showTime('eh',formData.eh,$event)"
                         hintText="时" fullWidth/>
        </mu-flexbox-item>
        <mu-flexbox-item grow="1">
          <mu-text-field v-model="formData.em" name="time" @input="changeValue('em')"
                         @focus="showTime('em',formData.em,$event)"
                         hintText="分" fullWidth/>
        </mu-flexbox-item>
        <mu-flexbox-item grow="1">
          <mu-text-field v-model="formData.es" name="time" @input="changeValue('es')"
                         @focus="showTime('es',formData.es,$event)"
                         hintText="秒" fullWidth/>
        </mu-flexbox-item>
      </mu-flexbox>
    </mu-flexbox>
    <div class="time-wrap" v-show="show">
      <ul class="clearfix">
        <li v-for="(item,index) in times" @mouseover="showHover(index)" @mouseout="hideHover()"
            :class="[{hover:i==index,current:cur==index}]" @click="selectTime(index,type,item,$event)">
          <span class="time-bg"></span>
          <span class="time-txt">{{item}}</span></li>
      </ul>
    </div>
  </div>
</template>

<script>
  export default {
//    props: ['timeType', 'beginText', 'endText', 'timeData'],
    props: {
      timeType: {
        type: String,
        default: 'date-time'
      },
      beginText: {
        type: String,
        default: '开始时间'
      },
      endText: {
        type: String,
        default: '结束时间'
      },
      timeData: {
        type: Object
      }
    },
    data () {
      // 日期
      let date = new Date()
      let bDate = ''
      let eDate = ''
      if (this.timeData.beginDate !== undefined && this.timeData.beginDate !== '') {
        bDate = this.timeData.beginDate
        eDate = this.timeData.endDate
      } else {
        bDate = date.getFullYear() + '-' + this.formatDate(date.getMonth() + 1) + '-' + this.formatDate(date.getDate())
        eDate = date.getFullYear() + '-' + this.formatDate(date.getMonth() + 1) + '-' + this.formatDate(date.getDate())
      }
      // 时分秒
      let _formData = {}
      if (this.timeData.bh !== '') {
        _formData = this.timeData
      } else {
        if (this.timeType === 'date-time') {
          _formData = {
            bh: '00',
            bm: '00',
            bs: '00',
            eh: this.formatDate(date.getHours()),
            em: this.formatDate(date.getMinutes()),
            es: this.formatDate(date.getSeconds())
          }
        } else {
          _formData = {bh: '00', bm: '00', bs: '00', eh: '23', em: '59', es: '59'}
        }
      }
      let _hours = this.getHoursList()
      let _minutes = this.getMinutesList()
      return {
        orient: 'horizontal',
        hours: _hours,
        minutes: _minutes,
        seconds: _minutes,
        beginDate: bDate,
        endDate: eDate,
        formData: {
          bh: _formData.bh,
          bm: _formData.bm,
          bs: _formData.bs,
          eh: _formData.eh,
          em: _formData.em,
          es: _formData.es
        },
        times: [],
        type: '',
        show: false,
        i: null,
        cur: null,
        errorText: {
          timeError: ''
        }
      }
    },
    methods: {
      showHover (index) {
        this.i = index
      },
      hideHover (index) {
        this.i = null
      },
      // 将选择的时分秒显示到对应的位置
      showTime (type, num, e) {
        this.times = []
        this.type = type
        switch (type) {
          case 'bh':
          case 'eh':
            this.times = this.hours
            this.cur = parseInt(num)
            break
          case 'bm':
          case 'em' :
            this.times = this.minutes
            this.cur = parseInt(num) / 5
            break
          case 'bs':
          case 'es' :
            this.times = this.seconds
            this.cur = parseInt(num) / 5
            break
          default :
            break
        }
        this.setPosition(e)
        this.show = true
      },
      formatDate (num) {
        if (num < 10) {
          num = '0' + num
        } else {
          num = '' + num
        }
        return num
      },
      // 时分秒选择事件
      selectTime (index, t, item, e) {
        e.stopPropagation()
        this.cur = index
        this.formData[t] = item
        this.show = false
      },
      // 小时列表
      getHoursList () {
        const hoursCount = 24
        let arr = []
        for (let i = 0; i < hoursCount; i++) {
          arr.push(this.formatDate(i))
        }
        return arr
      },
      // 分秒列表
      getMinutesList () {
        const minutesCount = 60
        let arr = []
        for (let i = 0; i < minutesCount; i++) {
          if (i % 5 === 0) {
            arr.push(this.formatDate(i))
          }
        }
        return arr
      },
      setPosition (event) {
        // 设置位置
        const e = event.target.offsetParent
        let l = e.offsetLeft
        let t = e.offsetTop
        // console.log(this)
        const obj = this.$el.children[1]
        // const obj = document.getElementById('time-wrap')
        obj.style.position = 'absolute'
        obj.style.top = t + e.offsetHeight + 'px'
        obj.style.left = l + 'px'
      },
      // 向父组件传值
      changeValue (el, origin) {
        // 防止用户输入的数值太大
        if (el) {
          switch (el) {
            case 'bh':
            case 'eh':
              if (this.formData[el] > 23) {
                this.formData[el] = 23
              }
              break
            case 'bm':
            case 'em' :
            case 'bs':
            case 'es' :
              if (this.formData[el] > 59) {
                this.formData[el] = 59
              }
              break
            default :
              break
          }
          if (origin) {
            if (el === 'begin-date') {
              this.beginDate = origin
            } else if (el === 'end-date') {
              this.endDate = origin
            }
          }
          // 输入的数值小于10时，格式化：‘01’
          if (el.length === 2) {
            if (!isNaN(this.formData[el])) {
              this.formData[el] = this.formatDate(parseInt(this.formData[el]))
            } else {
              this.formData[el] = '00'
            }
          }
        }
        // 判断是否包含日期
        if (this.timeType === 'date-time') {
          this.$emit('change', Object.assign({}, this.formData, {beginDate: this.beginDate, endDate: this.endDate}))
        } else {
          this.$emit('change', this.formData)
        }
      }
    },
    mounted () {
      const _this = this
      if (this.timeType === 'date-time') {
        this.$emit('change', Object.assign({}, this.formData, {beginDate: this.beginDate, endDate: this.endDate}))
      } else {
        this.$emit('change', this.formData)
      }
      document.addEventListener('click', function (e) {
        if (e.target.name !== 'time') {
          _this.show = false
        }
      })
    }
  }
</script>

<style lang="scss" type="text/scss" scoped>
  .time-part {
    .item-text {
      padding-bottom: 10px;
    }
  }

  .time-wrap {
    padding: 10px;
    box-shadow: 0 1px 6px rgba(0, 0, 0, .117647), 0 1px 4px rgba(0, 0, 0, .117647);
    background: #fff;
    border-radius: 2px;
    width: 220px;
    z-index: 9;
    height: auto;
    ul {
      margin: 0;
      padding: 0;
    }
  }

  .time-wrap ul li {
    position: relative;
    list-style: none;
    float: left;
    cursor: pointer;
    font-weight: 400;
    text-align: center;
    margin: 0 3px;
    width: 34px;
    height: 34px;
    line-height: 34px;
    &.hover {
      span.time-bg {
        transform: scale(1);
        opacity: 0.6;
      }
      color: #fff;
    }
    &.current {
      span.time-bg {
        transform: scale(1);
        opacity: 1;
      }
      color: #fff;
    }
    span {
      display: inline-block;
      position: absolute;
      height: 34px;
      width: 34px;
      top: 0;
      left: 0;
      border-radius: 50%;
    }
    span.time-bg {
      background-color: #2196f3;
      opacity: 0;
      transform: scale(0);
      transition: all .45s cubic-bezier(.23, 1, .32, 1);
      z-index: 0;
    }
    span.time-txt {
      z-index: 1;
    }
  }
</style>
