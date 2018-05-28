// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import 'es6-promise/auto'
import App from './App'
import router from './router'
import store from './store/store'
import MuseUI from 'muse-ui'
import './assets/sass/common.scss'
import './assets/sass/dialog.scss'
import './assets/sass/font.scss'

Vue.use(MuseUI)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: {App}
})
