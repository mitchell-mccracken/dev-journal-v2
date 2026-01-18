<template>
  <v-app>
    <v-app-bar color="primary" :prominent="!mobile">
      <v-app-bar-title>Film Journal</v-app-bar-title>
      
      <v-spacer />
      
      <v-btn icon @click="toggleTheme">
        <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
      
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        
        <v-list>
          <v-list-subheader>Navigation</v-list-subheader>
          <v-list-item @click="activeTab = 'film-rolls'">
            <template v-slot:prepend>
              <v-icon>mdi-filmstrip</v-icon>
            </template>
            <v-list-item-title>Film Rolls</v-list-item-title>
          </v-list-item>
          <v-list-item @click="activeTab = 'film-stocks'">
            <template v-slot:prepend>
              <v-icon>mdi-filmstrip-box</v-icon>
            </template>
            <v-list-item-title>Film Stocks</v-list-item-title>
          </v-list-item>
          <v-list-item @click="activeTab = 'cameras'">
            <template v-slot:prepend>
              <v-icon>mdi-camera</v-icon>
            </template>
            <v-list-item-title>Cameras</v-list-item-title>
          </v-list-item>
          <v-list-item @click="activeTab = 'chemicals'">
            <template v-slot:prepend>
              <v-icon>mdi-flask-outline</v-icon>
            </template>
            <v-list-item-title>Chemicals</v-list-item-title>
          </v-list-item>
          <v-list-item @click="activeTab = 'tools'">
            <template v-slot:prepend>
              <v-icon>mdi-tools</v-icon>
            </template>
            <v-list-item-title>Tools</v-list-item-title>
          </v-list-item>
          
          <v-divider class="my-2" />
          
          <v-list-subheader>Account</v-list-subheader>
          <v-list-item>
            <v-list-item-title>{{ authStore.user?.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ authStore.user?.email }}</v-list-item-subtitle>
          </v-list-item>
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
      <v-container :class="{ 'pa-2': mobile }">
        <v-tabs 
          v-model="activeTab" 
          color="primary" 
          class="mb-4"
          :grow="mobile"
          :show-arrows="mobile"
        >
          <v-tab value="chemical-batches">
            <v-icon :start="!mobile">mdi-flask</v-icon>
            <span v-if="!mobile">Chemical Batches</span>
          </v-tab>
          <v-tab value="one-shot-batches">
            <v-icon :start="!mobile">mdi-flask-empty</v-icon>
            <span v-if="!mobile">One-Shot Batches</span>
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

          <!-- Chemicals Tab -->
          <v-window-item value="chemicals">
            <ChemicalsTab ref="chemicalsRef" />
          </v-window-item>

          <!-- One-Shot Batches Tab -->
          <v-window-item value="one-shot-batches">
            <OneShotBatchesTab ref="oneShotBatchesRef" />
          </v-window-item>

          <!-- Tools Tab -->
          <v-window-item value="tools">
            <ToolsTab ref="toolsRef" />
          </v-window-item>
        </v-window>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme, useDisplay } from 'vuetify';
import { useAuthStore } from '@/stores/auth';
import ChemicalBatchesTab from '@/components/tabs/ChemicalBatchesTab.vue';
import FilmRollsTab from '@/components/tabs/FilmRollsTab.vue';
import FilmStocksTab from '@/components/tabs/FilmStocksTab.vue';
import CamerasTab from '@/components/tabs/CamerasTab.vue';
import ChemicalsTab from '@/components/tabs/ChemicalsTab.vue';
import OneShotBatchesTab from '@/components/tabs/OneShotBatchesTab.vue';
import ToolsTab from '@/components/tabs/ToolsTab.vue';

const router = useRouter();
const authStore = useAuthStore();
const theme = useTheme();
const display = useDisplay();

const activeTab = ref('chemical-batches');
const isDark = ref(theme.global.current.value.dark);

// Mobile detection
const mobile = computed(() => display.smAndDown.value);

// Tab refs for refreshing data
const chemicalBatchesRef = ref();
const filmRollsRef = ref();
const filmStocksRef = ref();
const camerasRef = ref();
const chemicalsRef = ref();
const oneShotBatchesRef = ref();
const toolsRef = ref();

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
    case 'chemicals':
      chemicalsRef.value?.refresh();
      break;
    case 'one-shot-batches':
      oneShotBatchesRef.value?.refresh();
      break;
    case 'tools':
      toolsRef.value?.refresh();
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
