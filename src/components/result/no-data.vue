<template>
  <div class="nodata-wrap">
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
  .nodata-wrap {
    padding: 30px 0;
    display: flex;
    justify-content: center;
    span {
      display: inline-block;
      padding: 10px 60px;
      background: #eee;
      border: 1px solid #dcdddd;
    }
  }
</style>
