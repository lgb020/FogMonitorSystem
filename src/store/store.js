import Vue from 'vue'
import Vuex from 'vuex'
import * as types from './types'
import getters from './getters'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    treemap: {},
    locationCount: {},
    formElShow: {
      datetimeShow: '',
      locationShow: ''
    }
  },
  mutations: {
    [types.DATETIMESHOW]: (state, data) => {
      state.formElShow.datetimeShow = data
    },
    [types.LOCATIONSHOW]: (state, data) => {
      state.formElShow.locationShow = data
    },
    [types.TREEMAP]: (state, data) => {
      state.treemap[data.k] = data.v
      state.locationCount[data.k] = 0
    }
  },
  actions: {},
  getters,
  modules: {}
})

export default store
