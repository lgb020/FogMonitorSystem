<template>
  <div class="date-time-wrap">
    <mu-flexbox :orient="orient">
      <mu-flexbox>
        <mu-flexbox-item class="flex-demo" grow="3">
          <mu-date-picker container="inline" v-model="formData.beginDate" label="开始时间" autoOk hintText="选择日期"
                          :errorText="errorText.dateTimeError" @change="changeValue" fullWidth/>
        </mu-flexbox-item>
        <mu-flexbox-item class="flex-demo" grow="1">
          <mu-text-field label=" " v-model="formData.bh" name="time" @blur="changeValue('bh')"
                         @focus="showTime('bh',formData.bh,$event)" :errorText="errorText.timeError"
                         hintText="时" fullWidth/>
        </mu-flexbox-item>
        <mu-flexbox-item class="flex-demo" grow="1">
          <mu-text-field label=" " v-model="formData.bm" name="time" @blur="changeValue('bm')"
                         @focus="showTime('bm',formData.bm,$event)" :errorText="errorText.timeError"
                         hintText="分" fullWidth/>
        </mu-flexbox-item>
        <mu-flexbox-item class="flex-demo" grow="1">
          <mu-text-field label=" " v-model="formData.bs" name="time" @blur="changeValue('bs')"
                         @focus="showTime('bs',formData.bs,$event)" :errorText="errorText.timeError"
                         hintText="秒" fullWidth/>
        </mu-flexbox-item>
      </mu-flexbox>
      <mu-flexbox>
        <mu-flexbox-item class="flex-demo" grow="3">
          <mu-date-picker container="inline" v-model="formData.endDate" @change="changeValue" label="结束时间" autoOk
                          :errorText="errorText.dateTimeError" hintText="选择日期" fullWidth/>
        </mu-flexbox-item>
        <mu-flexbox-item class="flex-demo" grow="1">
          <mu-text-field label=" " v-model="formData.eh" name="time" @blur="changeValue('eh')"
                         @focus="showTime('eh',formData.eh,$event)" :errorText="errorText.timeError"
                         hintText="时" fullWidth/>
        </mu-flexbox-item>
        <mu-flexbox-item class="flex-demo" grow="1">
          <mu-text-field label=" " v-model="formData.em" name="time" @blur="changeValue('em')"
                         @focus="showTime('em',formData.em,$event)" :errorText="errorText.timeError"
                         hintText="分" fullWidth/>
        </mu-flexbox-item>
        <mu-flexbox-item class="flex-demo" grow="1">
          <mu-text-field label=" " v-model="formData.es" name="time" @blur="changeValue('es')"
                         @focus="showTime('es',formData.es,$event)" :errorText="errorText.timeError"
                         hintText="秒" fullWidth/>
        </mu-flexbox-item>
      </mu-flexbox>
    </mu-flexbox>
    <div class="time-wrap" :id="id" v-show="timeShow">
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
  import * as types from '@/store/types.js'
  export default{
    props: ['id', 'orient'],
    computed: {
      timeShow () {
        return this.show && this.$store.state.formElShow.datetimeShow === this.id
      }
    },
    data () {
      // 解决input加载多次问题
      let b = null
      let e = null
      if (this.$route.query.start_time !== undefined) {
        let _b = this.$route.query.start_time
        let _e = this.$route.query.end_time
        b = new Date(_b)
        e = new Date(_e)
      } else {
        b = new Date()
        e = new Date()
      }
      const _beginDate = b.getFullYear() + '-' + this.formatDate(b.getMonth() + 1) + '-' + this.formatDate(b.getDate())
      const _endDate = e.getFullYear() + '-' + this.formatDate(e.getMonth() + 1) + '-' + this.formatDate(e.getDate())
      let _bh = '00'
      let _bm = '00'
      let _bs = '00'
      if (this.$route.query.start_time !== undefined) {
        _bh = this.formatDate(b.getHours())
        _bm = this.formatDate(b.getMinutes())
        _bs = this.formatDate(b.getSeconds())
      }
      const _eh = this.formatDate(e.getHours())
      const _em = this.formatDate(e.getMinutes())
      const _es = this.formatDate(e.getSeconds())
      return {
        timeWrap: new Date().getTime(),
        isHover: false,
        show: false,
        i: null,
        cur: null,
        type: '',
        times: [],
        hours: [],
        minutes: [],
        seconds: [],
        formData: {
          beginDate: _beginDate,
          endDate: _endDate,
          bh: _bh,
          bm: _bm,
          bs: _bs,
          eh: _eh,
          em: _em,
          es: _es
        },
        errorText: {
          dateTimeError: '',
          timeError: ''
        }
      }
    },
    methods: {
      formatDate (num) {
        if (num < 10) num = '0' + num
        return num
      },
      defaultDatetime () {
        const d = new Date()
        const today = d.getFullYear() + '-' + this.formatDate(d.getMonth() + 1) + '-' + this.formatDate(d.getDate())
        this.formData.beginDate = today
        this.formData.endDate = today
        this.formData.eh = this.formatDate(d.getHours())
        this.formData.em = this.formatDate(d.getMinutes())
        this.formData.es = this.formatDate(d.getSeconds())
      },
      // 向父组件传值
      changeValue (el) {
//        console.log(JSON.stringify(this.formData))
        this.$emit('change', 'dateTime', this.formData)
        // 防止用户输入的数值太大
        if (!el) return
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
        // 输入的数值小于10时，格式化：‘01’
        if (!isNaN(this.formData[el])) {
          this.formData[el] = this.formatDate(parseInt(this.formData[el]))
        } else {
          this.formData[el] = '00'
        }
      },
      showHover (index) {
        this.i = index
      },
      hideHover (index) {
        this.i = null
      },
      // 将选择的时分秒显示到对应的位置
      showTime (type, num, e) {
        // 页面上引用多个组件时，防止显示位置错位
        this.$store.commit(types.DATETIMESHOW, this.id)
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
      // 时分秒选择事件
      selectTime (index, t, item, e) {
        e.stopPropagation()
        this.cur = index
        this.formData[t] = item
        // console.log(item)
        this.show = false
      },
      // 小时列表
      getHoursList () {
        const hoursCount = 24
        for (let i = 0; i < hoursCount; i++) {
          this.hours.push(this.formatDate(i))
        }
      },
      // 分秒列表
      getMinutesList () {
        const minutesCount = 60
        for (let i = 0; i < minutesCount; i++) {
          if (i % 5 === 0) {
            this.minutes.push(this.formatDate(i))
            this.seconds.push(this.formatDate(i))
          }
        }
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
      formCheckEvent (long) {
        let beginDate = this.formData.beginDate + ' ' + this.formData.bh + ':' + this.formData.bm + ':' + this.formData.bs
        let endDate = this.formData.endDate + ' ' + this.formData.eh + ':' + this.formData.em + ':' + this.formData.es

        beginDate = beginDate.replace(/-/g, '/')
        const sdate = new Date(beginDate)
        const stime = sdate.getTime() / 1000 // s
        endDate = endDate.replace(/-/g, '/')
        const edate = new Date(endDate)
        const etime = edate.getTime() / 1000 // e
        if (etime <= stime) {
          this.errorText.dateTimeError = '结束时间不能等于或早于开始时间！'
          this.errorText.timeError = ' '
          return false
        } else if (etime >= stime + long * 24 * 60 * 60) {
          this.errorText.dateTimeError = `时间间隔不能超过${long}天！`
          this.errorText.timeError = ' '
          return false
        } else {
          this.errorText.dateTimeError = ''
          this.errorText.timeError = ''
          return true
        }
      }
    },
    mounted () {
      this.changeValue()
      // this.defaultDatetime()
      this.getHoursList()
      this.getMinutesList()
      const _this = this
      document.addEventListener('click', function (e) {
        if (e.target.name !== 'time') {
          _this.show = false
        }
      })
    }
  }
</script>

<style lang="scss" type="text/scss">
  .date-time-wrap {
    position: relative;
  }

  .mu-text-field-help {
    min-width: 200px;
  }

  .clearfix:after {
    content: " ";
    display: block;
    clear: both;
    height: 0;
  }

  .clearfix {
    zoom: 1;
  }

  .mu-date-display {
    display: none !important;
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
