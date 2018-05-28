<template>
  <div class="layout">
    <y-header></y-header>
    <div class="content">
      <div class="breadcrumb">
        <slot name="bread"></slot>
      </div>
      <div class="content-body clearfix">
        <slot></slot>
      </div>
    </div>
    <y-footer></y-footer>
  </div>
</template>
<script>
  import Header from '@/components/header/header'
  import Footer from '@/components/footer/footer'
  export default {
    data () {
      return {
      }
    },
    methods: {
    },
    components: {
      'y-header': Header,
      'y-footer': Footer
    }
  }
</script>
<style lang="scss" type="text/scss">
  .content {
    margin: 0 auto 37px;
    width: 1220px;
    height: 100%;
    // overflow: hidden;
    padding-bottom: 15px;
    .breadcrumb {
      margin: 10px 0;

      .mu-breadcrumb-item-link {
        color: #2196F3
      }
    }
  }
</style>
