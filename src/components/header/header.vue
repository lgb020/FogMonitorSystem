<template>
  <div class="header">
    <a href="#/" class="logo" title="返回首页">
      <span>{{ sysName }}</span>
    </a>
    <div class="menu">
      <a href="#/" class="material-icons" title="返回首页">home</a>
      <a href="#/manage" class="material-icons" title="进入后台管理">settings</a>
      <!--<a href="##" class="material-icons" @click.prevent="logout">account_circle</a>-->
      <!--<a href="##" class="material-icons" ref="user" @click.prevent="toggleUser">account_circle</a>-->
      <div class="user-group" v-hover="{set: setUserData}">
        <a href="##" class="material-icons" ref="user" @click.prevent="doNothing">account_circle</a>
        <mu-paper class="user-paper" v-show="showUserPaper">
          <div class="user-panel">
            <div class="user-info">
              <div class="avatar"><img src="./welcome.png" alt=""></div>
              <div class="avatar-text">
                <div>用户名：{{ userName }}</div>
                <div>手机号：{{ cellPhone }}</div>
              </div>
            </div>
            <div class="login-info">
              <div>上次登录时间：{{ lastTime }}</div>
              <div>上次登录IP：{{ lastIP }}</div>
            </div>
            <div class="pwd-operate">
              <mu-flat-button label="退出" class="left-btn" primary @click="logout"/>
              <mu-flat-button label="修改密码" class="right-btn" primary @click="changePwd"/>
            </div>
          </div>
        </mu-paper>
      </div>
    </div>
    <mu-dialog :open="pwdDialog" title="修改密码" @close="closePwdDialog" dialogClass="change-pwd-dialog">
      <div>
        <mu-text-field label="旧密码" hintText="请输入旧密码" :errorText="oldErrorText" v-model="oldPwd" type="password" labelFloat/><br/>
        <mu-text-field label="新密码" hintText="请输入新密码" :errorText="newErrorText" v-model="newPwd" type="password" labelFloat/><br/>
        <mu-text-field label="确认密码" hintText="请再次输入新密码" :errorText="newErrorText2" v-model="newPwd2" type="password" labelFloat/>
      </div>
      <div slot="actions">
        <mu-flat-button @click="closePwdDialog" primary label="取消"/>
        <mu-flat-button @click="affirmPwdDialog" primary label="确定"/>
      </div>
    </mu-dialog>
    <mu-popup position="top" :overlay="false" popupClass="header-popup" :open="headerPopup">
      {{ headerPopupText }}
    </mu-popup>
  </div>
</template>

<script>
  import axios from '@/axios.conf.js'
  export default {
    name: 'hello',
    data () {
      return {
        sysName: YISACONF.sysName,
        showUserPaper: false,
        userName: '',
        cellPhone: '',
        lastTime: '',
        lastIP: '',
        pwdUrl: '/api/edit_pwd',
        pwdDialog: false,
        oldErrorText: '',
        newErrorText: '',
        newErrorText2: '',
        oldPwd: '',
        newPwd: '',
        newPwd2: '',
        headerPopup: false,
        headerPopupText: ''
      }
    },
    directives: {
      hover: {
        bind (el, binding, vnode) {
          el.addEventListener('mouseenter', function () {
            binding.value.set(true)
          })
          el.addEventListener('mouseleave', function () {
            binding.value.set(false)
          })
        }
      }
    },
    methods: {
      doNothing () {},
      setUserData (f) {
        this.showUserPaper = f
      },
      getUserInfo () {
        let userStr = sessionStorage.getItem('user')
        let user = JSON.parse(userStr)
        this.userName = user.realName
        this.lastTime = user.lastTime
        this.cellPhone = user.cellPhone
        this.lastIP = user.lastIP
      },
      logout () {
        localStorage.setItem('removeSession', 'bbb')
        localStorage.removeItem('removeSession')
        sessionStorage.clear()
        this.$router.push({
          path: '/login'
        })
      },
      changePwd () {
        this.pwdDialog = true
      },
      closePwdDialog () {
        this.pwdDialog = false
        this.oldErrorText = ''
        this.newErrorText = ''
        this.newErrorText2 = ''
      },
      affirmPwdDialog () {
        let _this = this
        let flag = true
        if (this.oldPwd === '') {
          this.oldErrorText = '请输入旧密码'
          flag = false
        }
        if (this.newPwd === '') {
          this.newErrorText = '请输入新密码'
          flag = false
        }
        if (this.newPwd2 === '') {
          this.newErrorText2 = '请再次输入新密码'
          flag = false
        }
        if (!flag) {
          return false
        }
        let _user = sessionStorage.getItem('user')
        let _account = JSON.parse(_user).account
        axios.post(this.pwdUrl, {
          account: _account,
          old: this.oldPwd,
          newPwd: this.newPwd,
          newPwd2: this.newPwd2
        }).then((res) => {
          if (!res.data.status) {
            this.pwdDialog = false
            this.headerPopup = true
            this.headerPopupText = res.data.message
            sessionStorage.clear()
            setTimeout(function () {
              _this.$router.push({
                path: '/login'
              })
            }, 1000)
          } else {
            this.headerPopupText = res.data.message
            this.headerPopup = true
          }
        }).catch((err) => {
          this.headerPopupText = err
          this.headerPopup = true
        })
      }
    },
    created () {
      this.getUserInfo()
    },
    watch: {
      oldPwd (val) {
        if (val !== '') {
          this.oldErrorText = ''
        }
      },
      newPwd (val) {
        if (val !== '') {
          this.newErrorText = ''
        }
      },
      newPwd2 (val) {
        if (val !== '') {
          this.newErrorText2 = ''
        }
      },
      headerPopup (val) {
        if (val) {
          setTimeout(() => {
            this.headerPopup = false
          }, 500)
        }
      }
    }
  }
</script>

<style lang="scss" type="text/scss">
  .header {
    height: 60px;
    background-color: #0077E5;
    background-image: linear-gradient(8deg, #005DD4, #00A2FF);

    .logo {
      float: left;
      height: 60px;
      line-height: 60px;
      padding-left: 60px;
      margin-left: 30px;
      background: url(./logo.png) left center no-repeat;
      font-size: 22px;
      color: #fff;
    }

    .menu {
      float: right;
      height: 60px;
      font-size: 0;

      a {
        padding: 12px 20px;
        margin: 0;
        font-size: 35px;
        color: #fff;
        background: url(./line.png) left center no-repeat;
        opacity: .9;

        &:hover {
          opacity: 1;
        }

        &:first-child {
          background-image: none;
        }
      }
      .user-group a{
        background: url(./line.png) left center no-repeat;
      }
    }
  }
  .user-group{
    display: inline-block;
    position: relative;
    .user-paper {
      position: absolute;
      top: 59px;
      right: 0;
      font-size: 14px;
      z-index: 1200;
    }
  }
  .user-panel{
    padding: 12px;
    width: 280px;
    .user-info{
      overflow: hidden;
      .avatar{
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background-color: #99CAF0;
        padding: 5px;
        float: left;
        > img {
          width: 100%;
          height: 100%;
        }
      }
      .avatar-text{
        padding: 20px 0 20px 90px;
        > div {
          height: 20px;
          line-height: 20px;
        }
      }
    }
    .login-info{
      padding: 6px 0;
      > div {
        height: 20px;
        line-height: 20px;
      }
    }
    .pwd-operate{
      overflow: hidden;
      .mu-flat-button{
        height: 26px;
        line-height: 26px;
      }
      .left-btn{
        float: left;
      }
      .right-btn{
        float: right;
      }
    }
  }
  .change-pwd-dialog{
    width: auto;
  }
  .header-popup {
    width: 100%;
    opacity: .8;
    height: 48px;
    line-height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: 375px;
  }
</style>
