<template>
  <div id="app" v-cloak>
    <router-view></router-view>
  </div>
</template>

<script>
  import 'muse-ui/dist/muse-ui.css'
  import 'muse-ui/dist/theme-light.css'
  export default {
    name: 'app'
  }
</script>

<style>
  [v-cloak] {
    display: none !important;
  }
</style>
