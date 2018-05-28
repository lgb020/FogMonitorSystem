<template>
  <div class="manage-menu-wrap">
    <layout>
      <mu-breadcrumb slot="bread" separator=">">
        <mu-breadcrumb-item href="#/">首页</mu-breadcrumb-item>
        <mu-breadcrumb-item>后台管理</mu-breadcrumb-item>
      </mu-breadcrumb>
      <div class="menu">
        <mu-flexbox justify="flex-start" wrap="wrap" class="menu-box">
          <mu-flexbox-item grow="0" shrink="0" basis="20%" v-for="item,index in manageMenu" :key="item.id" class="box-item">
            <router-link class="item" :to="item.path" :class="'btn-' + color[index % 5]">
              <span>{{ item.name }}</span>
            </router-link>
          </mu-flexbox-item>
        </mu-flexbox>
      </div>
    </layout>
  </div>
</template>

<script>
  import Layout from '@/components/layout/result'

  export default {
    components: {
      Layout
    },
    data () {
      return {
        manageMenu: [
          {name: '用户管理', path: '/manage/user'},
          {name: '设备管理', path: '/manage/equipment'}
        ],
        color: ['red', 'orange', 'blue', 'green', 'purple']
      }
    }
  }
</script>

<style lang="scss" type="text/scss">
  .manage-menu-wrap {
    .menu-box {
      width: 80%;
      margin: 40px auto 0 auto;
      .box-item {
        width: 20%;
        margin-left: 5% !important;
        margin-bottom: 20px;
        box-shadow: 8px 8px 15px 2px #999;
        border-radius: 10px;
        .item {
          display: block;
          width: 100%;
          height: 80px;
          line-height: 80px;
          text-align: center;
          font-size: 20px;
          color: #fff;
          border-radius: 10px;
        }
        .btn-red {
          background: #CD1D47;
          background-image: linear-gradient(to bottom, #e3214f 0%, #be1a41 100%);
          background-repeat: repeat-x;
          &:hover {
            background: #CD1D47
          }
        }
        .btn-orange {
          background: #E66732;
          background-image: linear-gradient(to bottom, #f58546 0%, #df5828 100%);
          background-repeat: repeat-x;
          &:hover {
            background: #E66732
          }
        }
        .btn-blue {
          background: #1088DB;
          background-image: linear-gradient(to bottom, #2098ee 0%, #0077c7 100%);
          background-repeat: repeat-x;
          &:hover {
             background: #1088DB
           }
        }
        .btn-green {
          background: #0EA110;
          background-image: linear-gradient(to bottom, #1FBA21 0%, #049306 100%);
          background-repeat: repeat-x;
          &:hover {
             background: #0EA110
           }
        }
        .btn-purple {
          background: #824DDA;
          background-image: linear-gradient(to bottom, #9a58f0 0%, #6f44c7 100%);
          background-repeat: repeat-x;
          &:hover {
             background: #824DDA
           }
        }
      }
    }
  }
</style>
