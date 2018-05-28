<template>
  <div class="nodata-wrap-img">
    <img src="/static/images/no_data.png">
    <span>{{ text }}</span>
  </div>
</template>

<script>
  export default{
    props: {
      text: {
        type: String,
        default: '未找到符合条件的数据'
      }
    }
  }
</script>

<style lang="scss" type="text/scss">
  .nodata-wrap-img {
    padding: 30px 0;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    img {
      display: block;
      width: 128px;
    }
    span {
      display: block;
      color: #DCDCDC;
      margin-top: 10px;
    }
  }
</style>
