import Vue from 'vue'
import Router from 'vue-router'
import Login from '@/pages/login/login'
import fogDetection from '@/pages/smart-hub/fog-detection'
import fogHistory from '@/pages/smart-hub/fog-history'
import E403 from '@/pages/exception/403'
import manageMenu from '@/pages/gb/menu'
import manageUser from '@/pages/gb/user'
import manageEquipment from '@/pages/gb/equipment'

Vue.use(Router)

let routes = [
  {
    path: '/login',
    name: 'login',
    component: Login
  },
  {
    path: '/403',
    name: '403',
    component: E403
  },
  {
    path: '/',
    name: 'home',
    component: fogDetection,
    meta: {requiresAuth: true, pageName: 'fog'}
  },
  {
    path: '/fog-history',
    name: 'fogHistory',
    component: fogHistory,
    meta: {requiresAuth: true, pageName: 'fog'}
  },
  {
    path: '/manage',
    name: 'manageMenu',
    component: manageMenu,
    meta: {requiresAuth: true, pageName: 'gb'}
  },
  {
    path: '/manage/user',
    name: 'manageUser',
    component: manageUser,
    meta: {requiresAuth: true, pageName: 'gb'}
  },
  {
    path: '/manage/equipment',
    name: 'manageEquipment',
    component: manageEquipment,
    meta: {requiresAuth: true, pageName: 'gb'}
  }
]

const router = new Router({
  routes: routes
})

import axios from '@/axios.conf'
router.beforeEach((to, from, next) => {
  // console.log(to)
  let token = sessionStorage.token
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (token && token !== 'undefined') {
      const menu = JSON.parse(sessionStorage.getItem('menu'))
      let curMenu = ''
      if (to.meta.pageName) {
        curMenu = to.meta.pageName
      } else if (to.params.type) {
        curMenu = to.params.type
      }
      if (curMenu === '' || $.inArray(curMenu, menu) >= 0) {
        next()
        return
      }
      next({
        path: '/403'
      })
    } else {
      let _token = to.query.token
      let _path = to.path
      if (_token) {
        axios.post('/api/analog_sso', {token: _token}).then((res) => {
          if (res.data.token) {
            sessionStorage.setItem('token', res.data.token)
            sessionStorage.setItem('user', JSON.stringify(res.data.user))
            sessionStorage.setItem('menu', JSON.stringify(res.data.menu))
            next({
              path: _path
            })
            return true
          } else {
            alert('数据返回错误，跳转失败')
          }
        }).catch((err) => {
          console.log(err)
        })
      } else {
        next({
          path: '/login',
          query: {redirect: to.fullPath}
        })
      }
    }
  } else {
    next() // 确保一定要调用 next()
  }
})

export default router
