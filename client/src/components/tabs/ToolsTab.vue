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
            <div class="d-flex flex-wrap align-center justify-space-between ga-2 mb-3">
              <p class="text-body-2 text-medium-emphasis">
                {{ processedPhotos.length }} image{{ processedPhotos.length > 1 ? 's' : '' }} processed
              </p>
              <v-btn
                v-if="canShareFiles && processedPhotos.length > 1"
                color="primary"
                variant="tonal"
                :size="mobile ? 'small' : 'default'"
                @click="saveAllPhotos"
              >
                <v-icon start>mdi-download-multiple</v-icon>
                Save All
              </v-btn>
            </div>
            <v-row>
              <v-col
                v-for="photo in processedPhotos"
                :key="photo.filename"
                cols="6"
                sm="4"
                md="3"
              >
                <v-card variant="outlined">
                  <!-- Small preview only: full-res <img>s exhaust iOS memory -->
                  <img
                    :src="photo.thumbUrl"
                    :alt="photo.filename"
                    style="width: 100%; display: block; object-fit: contain;"
                  />
                  <v-card-actions class="pa-1 justify-center">
                    <v-btn
                      size="small"
                      variant="text"
                      color="primary"
                      @click="savePhoto(photo)"
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
import { ref, shallowRef, reactive, computed, onBeforeUnmount } from 'vue';
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
  file: File;
  thumbUrl: string;
  filename: string;
}

const THUMBNAIL_MAX_EDGE = 600;

const photoFiles = ref<File[]>([]);
const photoMode = ref<'border' | 'resize'>('border');
const borderPercent = ref<number>(3);
const resizePercent = ref<number>(50);
// shallowRef: no need for Vue to proxy File objects
const processedPhotos = shallowRef<ProcessedPhoto[]>([]);
const isProcessing = ref(false);
const processingProgress = ref(0);

const onFilesChanged = () => {
  releaseProcessedPhotos();
};

const clearPhotoTool = () => {
  photoFiles.value = [];
  releaseProcessedPhotos();
  processingProgress.value = 0;
};

/** Revoke the object URLs backing processed photos so their blobs can be freed. */
const releaseProcessedPhotos = () => {
  for (const photo of processedPhotos.value) URL.revokeObjectURL(photo.thumbUrl);
  processedPhotos.value = [];
};

// iOS Safari: the share sheet offers "Save Image(s)" straight to Photos
const canShareFiles = computed(() => {
  if (!mobile.value || typeof navigator.canShare !== 'function') return false;
  const probe = new File([new Uint8Array(1)], 'probe.jpg', { type: 'image/jpeg' });
  return navigator.canShare({ files: [probe] });
});

const shareFiles = async (files: File[]) => {
  try {
    await navigator.share({ files });
  } catch (err) {
    // AbortError just means the user closed the share sheet
    if ((err as DOMException)?.name !== 'AbortError') console.error('Share failed', err);
  }
};

const downloadFile = (file: File) => {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const savePhoto = (photo: ProcessedPhoto) => {
  if (canShareFiles.value) shareFiles([photo.file]);
  else downloadFile(photo.file);
};

const saveAllPhotos = () => shareFiles(processedPhotos.value.map((p) => p.file));

onBeforeUnmount(releaseProcessedPhotos);

/** Decode a File into an ImageBitmap (respecting EXIF orientation). */
const loadImage = async (file: File): Promise<ImageBitmap> => {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Older WebKit doesn't accept the options bag
    return createImageBitmap(file);
  }
};

/**
 * Process a single image on an offscreen canvas and return it as a JPEG Blob.
 * maxEdge caps the output's longest edge (used for thumbnails).
 */
const processImage = async (
  img: ImageBitmap,
  mode: 'border' | 'resize',
  percent: number,
  maxEdge = Infinity,
): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  try {
    if (mode === 'resize') {
      const outW = img.width * (percent / 100);
      const outH = img.height * (percent / 100);
      const fit = Math.min(1, maxEdge / Math.max(outW, outH));
      canvas.width = Math.round(outW * fit);
      canvas.height = Math.round(outH * fit);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else {
      // Border: base px on longest edge
      const longestEdge = Math.max(img.width, img.height);
      const borderPx = Math.round(longestEdge * (percent / 100));
      const fit = Math.min(1, maxEdge / (longestEdge + borderPx * 2));
      canvas.width = Math.round((img.width + borderPx * 2) * fit);
      canvas.height = Math.round((img.height + borderPx * 2) * fit);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, borderPx * fit, borderPx * fit, img.width * fit, img.height * fit);
    }

    // toBlob encodes asynchronously and avoids a huge base64 string in memory
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode image'))),
        'image/jpeg',
        0.95,
      );
    });
  } finally {
    // iOS WebKit caps total canvas memory and frees it lazily; release it now
    canvas.width = 0;
    canvas.height = 0;
  }
};

const processPhotos = async () => {
  if (!photoFiles.value || photoFiles.value.length === 0) return;

  isProcessing.value = true;
  processingProgress.value = 0;
  releaseProcessedPhotos();

  const files = photoFiles.value;
  const mode = photoMode.value;
  const percent = mode === 'border' ? borderPercent.value : resizePercent.value;

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Yield to the event loop between each image to keep the UI responsive
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      const img = await loadImage(file);
      let blob: Blob;
      let thumb: Blob;
      try {
        blob = await processImage(img, mode, percent);
        thumb = await processImage(img, mode, percent, THUMBNAIL_MAX_EDGE);
      } finally {
        img.close();
      }

      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const filename = `${baseName}_${mode}.jpg`;

      processedPhotos.value = [
        ...processedPhotos.value,
        {
          file: new File([blob], filename, { type: 'image/jpeg' }),
          thumbUrl: URL.createObjectURL(thumb),
          filename,
        },
      ];
      processingProgress.value = Math.round(((i + 1) / files.length) * 100);
    }
  } finally {
    isProcessing.value = false;
  }
};

// ── Expose refresh ──────────────────────────────────────────────────────────

const refresh = () => {
  // No server data to refresh for tools
};
defineExpose({ refresh });
</script>
