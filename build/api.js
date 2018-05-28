var express = require('express')
var login = require('../api/login')
var logout = require('../api/logout')
var location = require('../api/get_location')
var editPwd = require('../api/edit_pwd')
var analogSso = require('../api/analog_sso')
var getArea = require('../api/get_area')
var getFogLocation = require('../api/fog_location')
var getFogHistoryList = require('../api/fog_history_list')
var userList = require('../api/user_list')
var userInfo = require('../api/user_info')
var compareAccount = require('../api/compare_account')
var addUser = require('../api/add_user')
var editUser = require('../api/edit_user')
var delUser = require('../api/del_user')
var locationList = require('../api/location_list')
var locationInfo = require('../api/location_info')
var getMenuId = require('../api/get_menu_id')
var addLocation = require('../api/add_location')
var editLocation = require('../api/edit_location')
var delLocation = require('../api/del_location')

var router = express.Router()

router.post('/login', function (req, res) {
  res.json(login)
})
router.post('/logout', function (req, res) {
  res.json(logout)
})
router.post('/get_location', (req, res) => {
  res.json(location)
})
router.post('/edit_pwd', (req, res) => {
  res.json(editPwd)
})
router.post('/analog_sso', (req, res) => {
  res.json(analogSso)
})
router.post('/get_area', (req, res) => {
  res.json(getArea)
})
router.post('/fog_location',(req, res) => {
  res.json(getFogLocation)
})
router.post('/fog_history_list', (req, res) => {
  res.json(getFogHistoryList)
})
router.post('/user_list', (req, res) => {
  res.json(userList)
})
router.post('/user_info', (req, res) => {
  res.json(userInfo)
})
router.post('/compare_account', (req, res) => {
  res.json(compareAccount)
})
router.post('/add_user', (req, res) => {
  res.json(addUser)
})
router.post('/edit_user', (req, res) => {
  res.json(editUser)
})
router.post('/del_user', (req, res) => {
  res.json(delUser)
})
router.post('/location_list', (req, res) => {
  res.json(locationList)
})
router.post('/location_info', (req, res) => {
  res.json(locationInfo)
})
router.post('/get_menu_id', (req, res) => {
  res.json(getMenuId)
})
router.post('/add_location', (req, res) => {
  res.json(addLocation)
})
router.post('/edit_location', (req, res) => {
  res.json(editLocation)
})
router.post('/del_location', (req, res) => {
  res.json(delLocation)
})

module.exports = router
