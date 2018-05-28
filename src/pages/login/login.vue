<template>
  <div class="login">
    <mu-popup position="top" :overlay="false" popupClass="popup-top" :open="topPopup">
      {{ tip }}
    </mu-popup>
    <div class="avtar">
      <div><img src="./welcome.png" alt=""></div>
    </div>
    <ul>
      <li>
        <label for="uname" class="material-icons">person</label>
        <input id="uname" type="text" placeholder="请输入账号" v-model="account">
      </li>
      <li>
        <label for="upwd" class="material-icons">https</label>
        <input id="upwd" type="password" placeholder="请输入密码" v-model="password" @keyup="login">
      </li>
      <mu-raised-button label="立即登录" fullWidth @click="login"/>
    </ul>
  </div>
</template>

<script>
  import axios from '@/axios.conf.js'
  export default {
    data () {
      return {
        isLoging: false,
        account: '',
        password: '',
        topPopup: false,
        tip: '服务器连接失败'
      }
    },
    methods: {
      open (position) {
        this[position + 'Popup'] = true
      },
      login (e) {
        if (e.type === 'keyup') {
          if (e.keyCode !== 13) return
        }
        if (this.account !== '' && this.password !== '') {
          axios.post('/api/login', {
            account: this.account,
            password: this.password
          }).then((res) => {
            if (res.data.token) {
              sessionStorage.setItem('token', res.data.token)
              sessionStorage.setItem('user', JSON.stringify(res.data.user))
              sessionStorage.setItem('menu', JSON.stringify(res.data.menu))
              let redirect = decodeURIComponent(this.$route.query.redirect || '/')
              this.$router.push({
                path: redirect
              })
            } else {
              this.tip = '数据返回错误，登录失败'
              this.topPopup = true
            }
          }).catch((error) => {
            if (error.msg) this.tip = error.msg
            this.topPopup = true
          })
        } else {
          this.tip = '用户名和密码都不能为空'
          this.topPopup = true
        }
      }
    },
    watch: {
      topPopup (val) {
        if (val) {
          setTimeout(() => {
            this.topPopup = false
          }, 3000)
        }
      }
    }
  }
</script>

<style lang="scss" type="text/scss">
  .popup-top {
    width: 100%;
    opacity: .8;
    height: 48px;
    line-height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: 375px;
    font-size: 16px;
  }

  .login {
    width: 100%;
    height: 100%;
    padding-top: 12%;
    background-image: linear-gradient(to bottom right, #0087F0, #005A9F);

    ul {
      width: 290px;
      margin: 0 auto;
      padding-left: 0;

      li {
        height: 38px;
        list-style: none;
        background: rgba(255, 255, 255, .3);
        margin-bottom: 10px;
        border-radius: 2px;
      }

      label {
        height: 38px;
        line-height: 38px;
        margin-left: 5px;
        vertical-align: middle;
        color: #fff;
      }

      input {
        height: 38px;
        width: 240px;
        color: #fff;
        background: none;
        border: none;
        vertical-align: middle;
        font-size: 14px;
      }

      button {
        width: 100%;
        border: none;
        color: #1976D2;
        background-color: #E1E5E8;
        border-radius: 2px;
        font-size: 16px;
      }
    }
  }

  .avtar {
    left: 50%;
    margin: 0 auto 12% auto;
    border-radius: 50%;
    top: 12%;

    > div {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-color: #99CAF0;

      > img {
        width: 100%;
        height: 100%;
      }
    }
  }

  @mixin y-login-mixin($ratio) {
    .avtar {
      width: 140px * $ratio;
      height: 140px * $ratio;
      padding: 10px * $ratio;
      border: (1.5px * $ratio) solid #61B2F0;

      > div {
        padding: 5px * $ratio;
      }
    }
  }

  @include y-login-mixin(1)

  @media screen and (min-width: 501px) {
    @include y-login-mixin(2)
  }

  @media screen and (-webkit-device-pixel-ratio: 1), screen and (-moz-device-pixel-ratio: 1) {
    @include y-login-mixin(1)
  }

  @media screen and (orientation: landscape) {
    .login {
      padding-top: 5%;
    }

    .avtar {
      margin: 0 auto 5% auto;
    }
  }
</style>
