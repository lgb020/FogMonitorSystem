<template>
  <div class="exception">
    <div class="tip">
      <p>抱歉，您没有权限访问该页面，请联系管理员处理。</p>
      <br><br>
      <dl>
        <dt>{{countdown}} 秒后页面自动跳转至首页</dt>
        <dd><a href="/">返回首页</a></dd>        
      </dl>
    </div>
  </div>
</template>

<script>
  export default {
    data () {
      return {
        countdown: 5
      }
    },
    mounted () {
      let i = setInterval(() => {
        this.countdown--
        if (this.countdown === 0) {
          clearInterval(i)
          location.href = '/'
        }
      }, 1000)
    }
  }
</script>

<style lang="scss" type="text/scss" scoped>
  .exception {
      height: 320px;
      width: 850px;
      position: absolute;
      top: 50%;
      left: 50%;
      margin-left: -425px;
      margin-top: -160px;
      background: url(./403.png) no-repeat left center;
    }
    .tip {
      width: 415px;
      margin-top: 70px;
      float: right;
    }
    p {
      font-size: 18px;
      font-weight: bold;
    }
    dt,dd {
      font-size: 16px;
      text-align: center;
    }
    dd {
      height: 40px;
      margin: 10px 0 0 27px;
    }
    a {
      display: inline-block;
      width: 195px;
      height: 31px;
      line-height: 30px;
      text-align: center;
      background-image: url(/static/images/ie8-btn.png);
      color: #fff;
      text-decoration: none;
    }
</style>
