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

    <!-- Photo Border & Resize Tool -->
    <v-card class="mb-4">
      <v-card-item>
        <template #title>
          <v-icon start>mdi-image-edit-outline</v-icon>
          Photo Border &amp; Resize
        </template>
        <template #subtitle>
          Upload photos, then resize or add a white border
        </template>
      </v-card-item>
      <v-card-text>
        <!-- File Input -->
        <v-file-input
          v-model="photoFiles"
          label="Upload Photos"
          accept="image/*"
          multiple
          prepend-icon="mdi-image-multiple-outline"
          :style="mobile ? '' : 'max-width: 500px'"
          hide-details
          class="mb-4"
          @update:model-value="onFilesChanged"
        />

        <!-- Mode Toggle -->
        <div class="mb-4">
          <p class="text-body-2 text-medium-emphasis mb-2">Operation</p>
          <v-btn-toggle
            v-model="photoMode"
            mandatory
            rounded="lg"
            color="primary"
            :density="mobile ? 'compact' : 'default'"
          >
            <v-btn value="border">
              <v-icon start>mdi-border-outside</v-icon>
              Add Border
            </v-btn>
            <v-btn value="resize">
              <v-icon start>mdi-resize</v-icon>
              Resize
            </v-btn>
          </v-btn-toggle>
        </div>

        <!-- Border % Input -->
        <v-text-field
          v-if="photoMode === 'border'"
          v-model.number="borderPercent"
          label="Border Size"
          type="number"
          min="1"
          max="50"
          suffix="%"
          hint="% of longest edge added to all sides (typically 5–10%)"
          persistent-hint
          :style="mobile ? '' : 'max-width: 300px'"
          class="mb-4"
        />

        <!-- Resize % Input -->
        <v-text-field
          v-if="photoMode === 'resize'"
          v-model.number="resizePercent"
          label="Resize To"
          type="number"
          min="1"
          max="200"
          suffix="%"
          hint="Scale the image dimensions by this percentage"
          persistent-hint
          :style="mobile ? '' : 'max-width: 300px'"
          class="mb-4"
        />

        <!-- Process Button & Clear -->
        <div class="d-flex align-center gap-2 mb-4">
          <v-btn
            color="primary"
            :size="mobile ? 'small' : 'default'"
            :disabled="!photoFiles || photoFiles.length === 0 || isProcessing"
            :loading="isProcessing"
            @click="processPhotos"
          >
            <v-icon start>mdi-image-sync-outline</v-icon>
            Process {{ photoFiles && photoFiles.length > 1 ? `${photoFiles.length} Images` : 'Image' }}
          </v-btn>
          <v-btn
            v-if="processedPhotos.length > 0 || (photoFiles && photoFiles.length > 0)"
            variant="text"
            :size="mobile ? 'small' : 'default'"
            @click="clearPhotoTool"
          >
            <v-icon start>mdi-close</v-icon>
            Clear
          </v-btn>
        </div>

        <!-- Progress -->
        <v-progress-linear
          v-if="isProcessing"
          :model-value="processingProgress"
          color="primary"
          rounded
          height="6"
          class="mb-4"
        />

        <!-- Results Thumbnails -->
        <v-expand-transition>
          <div v-if="processedPhotos.length > 0">
            <v-divider class="mb-4" />
            <p class="text-body-2 text-medium-emphasis mb-3">
              {{ processedPhotos.length }} image{{ processedPhotos.length > 1 ? 's' : '' }} processed —
              <span v-if="!mobile">click the download button to save</span>
              <span v-else>long-press an image to save</span>
            </p>
            <v-row>
              <v-col
                v-for="photo in processedPhotos"
                :key="photo.filename"
                cols="6"
                sm="4"
                md="3"
              >
                <v-card variant="outlined">
                  <img
                    :src="photo.dataUrl"
                    :alt="photo.filename"
                    style="width: 100%; display: block; object-fit: contain;"
                  />
                  <v-card-actions v-if="!mobile" class="pa-1 justify-center">
                    <v-btn
                      :href="photo.dataUrl"
                      :download="photo.filename"
                      size="small"
                      variant="text"
                      color="primary"
                      tag="a"
                    >
                      <v-icon start>mdi-download</v-icon>
                      Save
                    </v-btn>
                  </v-card-actions>
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

// ── Developing Time Calculator ──────────────────────────────────────────────

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

const calculateTimes = () => {
  const rolls = rollsAlreadyDeveloped.value || 0;

  const coeficient = 1 + (rolls * 0.02);
  const baseDeveloperSeconds = 210;
  const baseBlixSeconds = 480;

  const developerTotalSeconds = baseDeveloperSeconds * coeficient;
  const blixTotalSeconds = baseBlixSeconds * coeficient;

  developerTime.minutes = Math.floor(developerTotalSeconds / 60);
  developerTime.seconds = Math.round(developerTotalSeconds % 60);

  blixTime.minutes = Math.floor(blixTotalSeconds / 60);
  blixTime.seconds = Math.round(blixTotalSeconds % 60);

  showResults.value = true;
};

// ── Photo Border & Resize Tool ──────────────────────────────────────────────

interface ProcessedPhoto {
  dataUrl: string;
  filename: string;
}

const photoFiles = ref<File[]>([]);
const photoMode = ref<'border' | 'resize'>('border');
const borderPercent = ref<number>(3);
const resizePercent = ref<number>(50);
const processedPhotos = ref<ProcessedPhoto[]>([]);
const isProcessing = ref(false);
const processingProgress = ref(0);

const onFilesChanged = () => {
  processedPhotos.value = [];
};

const clearPhotoTool = () => {
  photoFiles.value = [];
  processedPhotos.value = [];
  processingProgress.value = 0;
};

/** Load a File into an HTMLImageElement, wrapped in a Promise. */
const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
};

/** Process a single image on an offscreen canvas, wrapped in a Promise. */
const processImage = (img: HTMLImageElement, mode: 'border' | 'resize', percent: number): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    if (mode === 'resize') {
      const scale = percent / 100;
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else {
      // Border: base px on longest edge
      const longestEdge = Math.max(img.naturalWidth, img.naturalHeight);
      const borderPx = Math.round(longestEdge * (percent / 100));
      canvas.width = img.naturalWidth + borderPx * 2;
      canvas.height = img.naturalHeight + borderPx * 2;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, borderPx, borderPx, img.naturalWidth, img.naturalHeight);
    }

    resolve(canvas.toDataURL('image/jpeg', 0.95));
  });
};

const processPhotos = async () => {
  if (!photoFiles.value || photoFiles.value.length === 0) return;

  isProcessing.value = true;
  processingProgress.value = 0;
  processedPhotos.value = [];

  const files = photoFiles.value;
  const mode = photoMode.value;
  const percent = mode === 'border' ? borderPercent.value : resizePercent.value;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Yield to the event loop between each image to keep the UI responsive
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    const img = await loadImage(file);
    const dataUrl = await processImage(img, mode, percent);

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const filename = `${baseName}_${mode}.jpg`;

    processedPhotos.value.push({ dataUrl, filename });
    processingProgress.value = Math.round(((i + 1) / files.length) * 100);
  }

  isProcessing.value = false;
};

// ── Expose refresh ──────────────────────────────────────────────────────────

const refresh = () => {
  // No server data to refresh for tools
};
defineExpose({ refresh });
</script>
