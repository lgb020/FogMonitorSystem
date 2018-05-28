<template>
  <div class="footer">
    <mu-row gutter>
      <mu-col desktop="20"><img src="./logo_06.png" alt=""></mu-col>
      <mu-col desktop="60"><span>Copyright &copy; 2013-{{ new Date().getFullYear()
        }} 北京以萨技术股份有限公司. All Right Reserved. 推荐使用谷歌浏览器 1366*768分辨率以上 <a href="/download/谷歌浏览器及插件.zip">下载</a> </span>
      </mu-col>
      <mu-col desktop="20"><img src="./logo_04.png" alt=""></mu-col>
    </mu-row>
  </div>
</template>

<script>

</script>

<style lang="scss" type="text/scss">
  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 27px;
    line-height: 27px;
    background-color: #0C2647;
    color: #fff;
    text-align: center;
    
    a {
      color: #f30
    }

    img {
      margin-top: 5px;
    }
  }
</style>
