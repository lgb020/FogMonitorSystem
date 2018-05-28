var YISACONF = {
  sysName: '雾气监测系统',
  apiHost: 'http://localhost:3000/',
  fogSocketUrl: 'ws://localhost:8088/fog',
  homeNav: [
    {path: 'realtime', text: '实时目标分析'},
    {path: 'history', text: '历史视频分析'},
    {path: 'offline', text: '离线视频分析'},
    {path: 'smart-hub', text: '视频智能应用'}
  ],
  // 将标准路由替换成各地定制路由，格式—— 标准路由的name: '定制路由的name'
  routes: {
    // plate: 'person'
  },
  staticDataCache: '929392932',
  exportDataUrl: 'http://localhost:8080/#/result/person',
  map: {
    center: [121.393075, 37.543445],
    zoom: 11,
    zooms: [3, 18]
  }
}
var mapTileHost = '114.215.146.210:25003'
var mapApiHost = 'localhost/amap'
document.write('<script src="http://webapi.amap.com/maps?v=1.4.6&key=8d03b875f60373bba45093e964557f31" ><\/script>')
// UI组件库 1.0
document.write('<script src="http://webapi.amap.com/ui/1.0/main.js?v=1.0.11"><\/script>')

var sessionStorageTransfer = function (event) {
  if (!event) { event = window.event }
  if (!event.newValue) return
  if (event.key === 'getSessionStorage') {
    localStorage.setItem('sessionStorage', JSON.stringify(sessionStorage))
    localStorage.removeItem('sessionStorage')
  } else if (event.key === 'sessionStorage' && !sessionStorage.length) {
    var data = JSON.parse(event.newValue)
    for (var key in data) {
      sessionStorage.setItem(key, data[key])
    }
  }

  if (event.key === 'removeSession') {
    sessionStorage.clear()
    localStorage.setItem('logout', 'aaa')
    localStorage.removeItem('logout')
  } else if (event.key === 'logout') {
    sessionStorage.clear()
  }
}

if (window.addEventListener) {
  window.addEventListener('storage', sessionStorageTransfer, false)
} else {
  window.attachEvent('onstorage', sessionStorageTransfer)
}

if (!sessionStorage.length) {
  localStorage.setItem('getSessionStorage', 'foobar')
  localStorage.removeItem('getSessionStorage', 'foobar')
}
