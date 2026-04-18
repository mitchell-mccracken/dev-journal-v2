<template>
  <v-app class="ios-safe-area">
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
// App entry component
</script>

<style>
.ios-safe-area {
  padding-top: env(safe-area-inset-top) !important;
  padding-bottom: env(safe-area-inset-bottom) !important;
  padding-left: env(safe-area-inset-left) !important;
  padding-right: env(safe-area-inset-right) !important;
}
</style>
