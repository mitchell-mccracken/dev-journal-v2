<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <h2 :class="mobile ? 'text-h6' : 'text-h5'">Tools</h2>
    </div>

    <!-- Developing Time Calculator -->
    <v-card class="mb-4">
      <v-card-item>
        <template #title>
          <v-icon start>mdi-timer-outline</v-icon>
          Developing Time Calculator
        </template>
        <template #subtitle>
          Calculate developer and blix times based on rolls developed
        </template>
      </v-card-item>
      <v-card-text>
        <v-text-field
          v-model.number="rollsAlreadyDeveloped"
          label="Rolls Already Developed"
          type="number"
          min="0"
          :style="mobile ? '' : 'max-width: 300px'"
          hide-details
          class="mb-4"
        />
        
        <v-btn 
          color="primary" 
          :size="mobile ? 'small' : 'default'"
          @click="calculateTimes"
          class="mb-4"
        >
          <v-icon start>mdi-calculator</v-icon>
          Calculate
        </v-btn>

        <!-- Results -->
        <v-expand-transition>
          <div v-if="showResults">
            <v-divider class="mb-4" />
            <v-row>
              <v-col cols="12" sm="6">
                <v-card variant="tonal" color="primary">
                  <v-card-item>
                    <template #title>Developer Time</template>
                  </v-card-item>
                  <v-card-text class="text-h4">
                    {{ developerTime.minutes }}:{{ developerTime.seconds.toString().padStart(2, '0') }}
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" sm="6">
                <v-card variant="tonal" color="secondary">
                  <v-card-item>
                    <template #title>Blix Time</template>
                  </v-card-item>
                  <v-card-text class="text-h4">
                    {{ blixTime.minutes }}:{{ blixTime.seconds.toString().padStart(2, '0') }}
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </v-expand-transition>
      </v-card-text>
    </v-card>

    <!-- Placeholder for future tools -->
    <v-card variant="outlined" class="pa-8 text-center">
      <v-icon size="48" color="grey">mdi-tools</v-icon>
      <p class="text-body-2 text-grey mt-4">More tools coming soon...</p>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useDisplay } from 'vuetify';

const display = useDisplay();
const mobile = computed(() => display.smAndDown.value);

const rollsAlreadyDeveloped = ref<number>(0);
const showResults = ref(false);

const developerTime = reactive({
  minutes: 0,
  seconds: 0,
});

const blixTime = reactive({
  minutes: 0,
  seconds: 0,
});

// TODO: Fill in your calculation logic here
const calculateTimes = () => {
  const rolls = rollsAlreadyDeveloped.value || 0;
  
  const coeficient = 1 + (rolls * 0.02); // Example coefficient based on rolls
  const baseDeveloperSeconds = 210; // Base developer time in seconds
  const baseBlixSeconds = 480; // Base blix time in seconds
  
  const developerTotalSeconds = baseDeveloperSeconds * coeficient;
  const blixTotalSeconds = baseBlixSeconds * coeficient;
  
  developerTime.minutes = Math.floor(developerTotalSeconds / 60);
  developerTime.seconds = developerTotalSeconds % 60;
  
  blixTime.minutes = Math.floor(blixTotalSeconds / 60);
  blixTime.seconds = blixTotalSeconds % 60;
  
  showResults.value = true;
};

// Expose refresh method for consistency with other tabs
const refresh = () => {
  // No data to refresh for tools
};
defineExpose({ refresh });
</script>
