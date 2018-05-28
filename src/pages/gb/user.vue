<template>
  <div class="manage-user-wrap">
    <layout>
      <mu-breadcrumb slot="bread" separator=">">
        <mu-breadcrumb-item href="#/">首页</mu-breadcrumb-item>
        <mu-breadcrumb-item href="#/manage">后台管理</mu-breadcrumb-item>
        <mu-breadcrumb-item>用户管理</mu-breadcrumb-item>
      </mu-breadcrumb>
      <mu-card>
        <div class="content-user-list">
          <div class="list-title">
            <input type="text" class="search-input" v-model="searchValue" placeholder="警号/姓名/电话">
            <mu-raised-button label="搜索" class="user-search-button" primary @click="searchUser"/>
            <mu-raised-button label="添加用户" class="operator-btn add-button" primary @click="openAddUser($event)"/>
          </div>
        </div>
        <div class="list-content">
          <table class="user-table" v-show="pageData.list.length !== 0">
            <thead>
            <tr>
              <th width="10%">序号</th>
              <th width="15%">警号</th>
              <th width="15%">姓名</th>
              <th width="15%">电话</th>
              <th width="20%">角色</th>
              <th width="25%">操作</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="item,index in pageData.list">
              <td>{{ (formData.pn - 1) * formData.pageSize + index + 1 }}</td>
              <td :title="item.police_number">{{ item.police_number }}</td>
              <td>{{ item.user_name }}</td>
              <td>{{ item.tel }}</td>
              <td v-if="item.group_id === 2">普通用户</td>
              <td v-else-if="item.group_id === 3">点位管理员用户</td>
              <td v-else>管理员</td>
              <td class="operator">
                <span @click="openAddUser($event, item.uid)">修改</span>
                <span @click="deleteUser(item.uid)">删除</span>
              </td>
            </tr>
            </tbody>
          </table>
          <mu-pagination v-show="pageData.list.length !== 0" :pageSize="formData.pageSize" :total="pageData.totalUser" :current="formData.pn" @pageChange="handleClick"></mu-pagination>
          <no-data v-show="pageData.list.length === 0" text="无数据"></no-data>
          <mu-dialog :open="dialogAdd" dialogClass="user-add-dialog" @close="closeAddUser">
            <div class="dialog-title">
              {{ dialogTitle }}
              <i class="material-icons close-icon" @click="closeAddUser">highlight_off</i>
            </div>
            <div class="dialog-content">
              <table class="add-table">
                <tbody>
                <tr>
                  <td class="sub">用户名</td>
                  <td><input type="text" v-model="addData.account" class="form-control" :disabled="uid !== ''"></td>
                  <td class="sub">密码</td>
                  <td><input type="password" v-model="addData.userPassword" :placeholder="passwordHolder" class="form-control">
                  </td>
                </tr>
                <tr>
                  <td class="sub">姓名</td>
                  <td><input type="text" v-model="addData.userName" class="form-control"></td>
                  <td class="sub">身份证号</td>
                  <td><input type="text" v-model="addData.idCardNumber" class="form-control">
                  </td>
                </tr>
                <tr>
                  <td class="sub">手机号</td>
                  <td><input type="text" v-model="addData.tel" class="form-control"></td>
                  <td class="sub">角色</td>
                  <td>
                    <select class="form-control" v-model="addData.role">
                      <option value="2">普通用户</option>
                      <option value="1">系统管理员</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td class="sub">警号</td>
                  <td><input type="text" v-model="addData.policeNumber" class="form-control"></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td colspan="4" class="text-center">
                    <mu-raised-button label="保存" class="operator-btn add-button" primary @click="changeUser"/>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
            <mu-popup position="top" :overlay="false" popupClass="demo-popup-top" :open="topPopup">
              {{ popText }}
            </mu-popup>
          </mu-dialog>
          <mu-popup position="top" :overlay="false" popupClass="demo-popup-top" :open="topPopup2">
            {{ popText }}
          </mu-popup>
        </div>
      </mu-card>
    </layout>
  </div>
</template>

<script>
  import Layout from '@/components/layout/result'
  import noData from '@/components/result/no-data'
  import axios from '@/axios.conf.js'

  export default {
    components: {
      Layout,
      noData
    },
    data () {
      return {
        searchValue: '',
        pageData: {
          totalUser: 0,
          list: []
        },
        formData: {
          pn: 1,
          pageSize: 10,
          uName: '' // 搜索条件
        },
        addData: {
          account: '',
          userPassword: '',
          userName: '',
          idCardNumber: '',
          tel: '',
          role: '2',
          policeNumber: ''
        },
        dialogAdd: false,
        dialogTitle: '',
        uid: '',
        topPopup: false,
        topPopup2: false,
        popText: '',
        passwordHolder: ''
      }
    },
    methods: {
      loadList () {
        let _this = this
        axios.post('/api/user_list', this.formData).then(
          (res) => {
            _this.pageData.totalUser = res.data.totalUser
            _this.pageData.list = res.data.list
          },
          (error) => {
            console.log(error)
          }
        )
      },
      handleClick (pno) {
        this.formData.pn = pno
        this.loadList()
      },
      searchUser () {
        this.formData.uName = this.searchValue
        this.formData.pn = 1
        this.loadList()
      },
      openAddUser (e, uid) {
        if (uid) {
          this.dialogTitle = '修改用户'
          this.uid = uid
          this.passwordHolder = '点击输入新密码'
          // 请求接口 带入信息
          axios.post('/api/user_info', {id: uid}).then(
            (res) => {
              let data = res.data
              this.uid = res.data.uid
              this.addData.account = data.account
              this.addData.userPassword = ''
              this.addData.userName = data.userName
              this.addData.idCardNumber = data.idCardNumber
              this.addData.tel = data.tel
              this.addData.role = data.role
              this.addData.policeNumber = data.policeNumber
              this.dialogAdd = true
            },
            (error) => {
              console.log(error)
            }
          )
        } else {
          this.dialogTitle = '添加用户'
          this.uid = ''
          this.passwordHolder = ''
          this.addData.account = ''
          this.addData.userPassword = ''
          this.addData.userName = ''
          this.addData.idCardNumber = ''
          this.addData.tel = ''
          this.addData.role = '2'
          this.addData.policeNumber = ''
          this.dialogAdd = true
        }
      },
      closeAddUser () {
        this.dialogAdd = false
      },
      changeUser () {
        let _this = this
        if (this.uid) {
          // 修改用户
          if (_this.formCheck()) {
            _this.editUser()
          }
        } else {
          // 添加用户
          axios.post('/api/compare_account', {account: this.addData.account}).then(
            (res) => {
              let flag = res.data.check
              if (flag) {
                if (_this.formCheck()) {
                  _this.addUser()
                }
              } else {
                this.popText = '用户名已存在'
                this.topPopup = true
              }
            },
            (error) => {
              console.log(error)
            }
          )
        }
      },
      addUser () {
        axios.post('/api/add_user', this.addData).then(
          (res) => {
            console.log(res)
            if (!res.data.status) {
              this.popText = res.data.message
              this.topPopup2 = true
              this.dialogAdd = false
              this.loadList()
            } else {
              this.popText = res.data.message
              this.topPopup2 = true
            }
          },
          (error) => {
            this.popText = error
            this.topPopup2 = true
          }
        )
      },
      editUser () {
        let postData = Object.assign({}, this.addData, {uid: this.uid})
        axios.post('/api/edit_user', postData).then(
          (res) => {
            if (!res.data.status) {
              this.popText = res.data.message
              this.topPopup2 = true
              this.dialogAdd = false
              this.loadList()
            } else {
              this.popText = res.data.message
              this.topPopup2 = true
            }
          },
          (error) => {
            this.popText = error
            this.topPopup2 = true
          }
        )
      },
      formCheck () {
        if (!this.addData.account) {
          this.popText = '用户名未填写'
          this.topPopup = true
          return false
        }
        if (!this.uid && !this.addData.userPassword) {
          this.popText = '密码未填写'
          this.topPopup = true
          return false
        }
        if (!this.addData.userName) {
          this.popText = '请输入姓名'
          this.topPopup = true
          return false
        }
        if (!this.addData.policeNumber) {
          this.popText = '请输入警号'
          this.topPopup = true
          return false
        }
        if (!this.idCardCheck(this.addData.idCardNumber)) {
          this.popText = '请输入正确的身份证号'
          this.topPopup = true
          return false
        }
        if (!this.phoneCheck(this.addData.tel)) {
          this.popText = '请输入正确的手机号'
          this.topPopup = true
          return false
        }
        return true
      },
      idCardCheck (idCard) {
        if (!(/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCard))) {
          return false
        }
        return true
      },
      phoneCheck (phone) {
        if (!(/^((15[^4])|(1[3,7,8][0-9]))\d{8}$/.test(phone))) {
          return false
        }
        return true
      },
      deleteUser (id) {
        if (confirm('确认删除该条数据？')) {
          axios.post('/api/del_user', {id: id}).then(
            (res) => {
              if (!res.data.status) {
                this.popText = res.data.message
                this.topPopup2 = true
                this.loadList()
              } else {
                this.popText = res.data.message
                this.topPopup2 = true
              }
            },
            (error) => {
              this.popText = error
              this.topPopup2 = true
            }
          )
        } else {
          return false
        }
      }
    },
    mounted () {
      this.loadList()
    },
    watch: {
      topPopup (val) {
        if (val) {
          setTimeout(() => {
            this.topPopup = false
          }, 2000)
        }
      },
      topPopup2 (val) {
        if (val) {
          setTimeout(() => {
            this.topPopup2 = false
          }, 1000)
        }
      }
    }
  }
</script>

<style lang="scss" type="text/scss">
  .manage-user-wrap{
    input:focus {
      border-color: #66afe9;
      box-shadow: inset 0 1px 1px rgba(0,0,0,.075), 0 0 8px rgba(102,175,233,.6);
      outline: 0;
    }
    .content-user-list {
      padding: 20px 15px;
    }
    .list-title {
      position: relative;
      .tree-con {
        display: inline-block;
      }
    }
    .search-input {
      width: 178px;
      height: 32px;
      padding: 6px 12px;
      font-size: 13px;
      line-height: 32px;
      color: #555;
      border: 1px solid #ccc;
      border-radius: 4px;
      transition: border-color ease-in-out .15s,box-shadow ease-in-out .15s;
    }
    .user-search-button {
      height: 32px;
      line-height: 32px;
    }
    .operator-btn {
      position: absolute;
      height: 32px;
      line-height: 32px;
      &.part-button {
        top: 0;
        right: 0;
      }
      &.add-button {
        top: 0;
        right: 0;
      }
    }
    .list-content {
      padding: 0 15px 20px 15px;
    }
    .user-table {
      table-layout: fixed;
      width: 100%;
      border: 0;
      border-spacing: 0;
      border-collapse: collapse;
      word-break: break-all;
      word-wrap: break-word;
      th, td {
        height: 45px;
        text-align: center;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        &.operator span {
          &:nth-child(1) {
             padding-right: 16px;
           }
          color: #0084df;
          cursor: pointer;
        }
      }
      thead th {
        background: #f8f8f8;
        color: #0084df;
        font-size: 16px;
        font-weight: bold;
      }
      tr {
        &:nth-child(odd) {
           background: #fff;
         }
        &:nth-child(even) {
           background: #f8f8f8;
         }
      }
    }
    .mu-pagination {
      margin-top: 20px;
      -webkit-box-pack: center !important;
      -ms-flex-pack: center !important;
      justify-content: center !important
    }
  }
</style>
