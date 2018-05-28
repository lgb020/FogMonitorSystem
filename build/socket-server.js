var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)

var fogDetetion = require('../api/fog_detetion_list')

// 雾气监测
var fog = io.of('/fog')
fog.on('connect', function (socket) {
  console.log('fog detetion connect')
  socket.emit('status', '200')
  socket.emit('get_fog_detection_list', fogDetetion)
  // let flag = 0
  // let timer = setInterval(function () {
  //   flag++
  //   fogDetetion[0].fogDegree = (fogDetetion[0].fogDegree + flag) % 4
  //   fogDetetion[1].fogDegree = (fogDetetion[1].fogDegree + flag) % 4
  //   fogDetetion[2].fogDegree = (fogDetetion[2].fogDegree + flag) % 4
  //   fogDetetion[3].fogDegree = (fogDetetion[3].fogDegree + flag) % 4
  //   socket.emit('get_fog_detection_list', fogDetetion)
  // }, 5000)
  socket.on('disconnect', function (e) {
    // clearTimeout(timer)
    console.log('fog detetion socket stop!!!')
  })
})

http.listen(8088, function () {
  console.log('socket port:8088')
})
