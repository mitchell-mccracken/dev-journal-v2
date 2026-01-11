<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <v-app-bar-title>Film Journal</v-app-bar-title>
      
      <v-spacer />
      
      <v-btn icon @click="toggleTheme">
        <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
      
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-account-circle</v-icon>
          </v-btn>
        </template>
        
        <v-list>
          <v-list-item>
            <v-list-item-title>{{ authStore.user?.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ authStore.user?.email }}</v-list-item-subtitle>
          </v-list-item>
          <v-divider />
          <v-list-item @click="handleLogout">
            <template v-slot:prepend>
              <v-icon>mdi-logout</v-icon>
            </template>
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <v-container>
        <v-tabs v-model="activeTab" color="primary" class="mb-4">
          <v-tab value="chemical-batches">
            <v-icon start>mdi-flask</v-icon>
            Chemical Batches
          </v-tab>
          <v-tab value="film-rolls">
            <v-icon start>mdi-filmstrip</v-icon>
            Film Rolls
          </v-tab>
          <v-tab value="film-stocks">
            <v-icon start>mdi-filmstrip-box</v-icon>
            Film Stocks
          </v-tab>
          <v-tab value="cameras">
            <v-icon start>mdi-camera</v-icon>
            Cameras
          </v-tab>
        </v-tabs>

        <v-window v-model="activeTab">
          <!-- Chemical Batches Tab -->
          <v-window-item value="chemical-batches">
            <ChemicalBatchesTab ref="chemicalBatchesRef" />
          </v-window-item>

          <!-- Film Rolls Tab -->
          <v-window-item value="film-rolls">
            <FilmRollsTab ref="filmRollsRef" />
          </v-window-item>

          <!-- Film Stocks Tab -->
          <v-window-item value="film-stocks">
            <FilmStocksTab ref="filmStocksRef" />
          </v-window-item>

          <!-- Cameras Tab -->
          <v-window-item value="cameras">
            <CamerasTab ref="camerasRef" />
          </v-window-item>
        </v-window>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from 'vuetify';
import { useAuthStore } from '@/stores/auth';
import ChemicalBatchesTab from '@/components/tabs/ChemicalBatchesTab.vue';
import FilmRollsTab from '@/components/tabs/FilmRollsTab.vue';
import FilmStocksTab from '@/components/tabs/FilmStocksTab.vue';
import CamerasTab from '@/components/tabs/CamerasTab.vue';

const router = useRouter();
const authStore = useAuthStore();
const theme = useTheme();

const activeTab = ref('chemical-batches');
const isDark = ref(theme.global.current.value.dark);

// Tab refs for refreshing data
const chemicalBatchesRef = ref();
const filmRollsRef = ref();
const filmStocksRef = ref();
const camerasRef = ref();

// Refresh tab data when switching tabs
watch(activeTab, (newTab) => {
  switch (newTab) {
    case 'chemical-batches':
      chemicalBatchesRef.value?.refresh();
      break;
    case 'film-rolls':
      filmRollsRef.value?.refresh();
      break;
    case 'film-stocks':
      filmStocksRef.value?.refresh();
      break;
    case 'cameras':
      camerasRef.value?.refresh();
      break;
  }
});

const toggleTheme = () => {
  theme.global.name.value = isDark.value ? 'light' : 'dark';
  isDark.value = !isDark.value;
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>
