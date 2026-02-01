<template>
  <v-dialog v-model="isOpen" max-width="500">
    <v-card>
      <v-card-title>{{ editingRoll ? 'Edit Film Roll' : 'New Film Roll' }}</v-card-title>
      <v-card-text>
        <v-form ref="formRef" @submit.prevent="handleSave">
          <v-select
            v-model="form.filmStock"
            label="Film Stock *"
            :items="filmStockOptions"
            item-title="label"
            item-value="value"
            :rules="[(v: string) => !!v || 'Film stock is required']"
            required
            class="mb-2"
          />
          <v-select
            v-model="form.camera"
            label="Camera"
            :items="cameraOptions"
            item-title="label"
            item-value="value"
            clearable
            class="mb-2"
          />
          
          <!-- Show chemical batch and date finished only when showAllFields is true -->
          <template v-if="showAllFields">
            <v-select
              v-model="form.chemicalBatch"
              label="Chemical Batch"
              :items="chemicalBatchOptions"
              item-title="label"
              item-value="value"
              clearable
              class="mb-2"
            />
          </template>

          <v-text-field
            v-model.number="form.frameCount"
            label="Frame Count"
            type="number"
            class="mb-2"
          />
          <v-select
            v-model="form.status"
            label="Status"
            :items="['loaded', 'shot', 'developed', 'scanned']"
            class="mb-2"
          />
          <v-text-field
            v-model="form.dateLoaded"
            label="Date Loaded"
            type="date"
            class="mb-2"
          />
          
          <template v-if="showAllFields">
            <v-text-field
              v-model="form.dateFinished"
              label="Date Finished"
              type="date"
              class="mb-2"
            />
          </template>

          <v-checkbox
            v-model="form.countAsFullRoll"
            label="Count as full roll"
            hint="Include this roll when calculating total rolls developed"
            persistent-hint
          />
          <v-textarea
            v-model="form.notes"
            label="Notes"
            rows="3"
            class="mt-2"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel">Cancel</v-btn>
        <v-btn color="primary" :loading="saving" @click="handleSave">
          {{ editingRoll ? 'Update' : 'Create' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { FilmStock, Camera, ChemicalBatch, FilmRoll, FilmRollInput } from '@/services/api';

interface Props {
  modelValue: boolean;
  filmStocks: FilmStock[];
  cameras: Camera[];
  chemicalBatches?: ChemicalBatch[];
  editingRoll?: FilmRoll | null;
  saving?: boolean;
  showAllFields?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', filmRoll: FilmRollInput): void;
}

const props = withDefaults(defineProps<Props>(), {
  saving: false,
  chemicalBatches: () => [],
  editingRoll: null,
  showAllFields: false,
});

const emit = defineEmits<Emits>();

const formRef = ref<any>(null);
const form = ref<FilmRollInput>({
  filmStock: '',
  camera: undefined,
  chemicalBatch: undefined,
  frameCount: 36,
  status: 'loaded',
  dateLoaded: undefined,
  dateFinished: undefined,
  countAsFullRoll: true,
  notes: '',
});

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const filmStockOptions = computed(() =>
  props.filmStocks.map(stock => ({
    label: `${stock.make} ${stock.name}`,
    value: stock._id,
  }))
);

const cameraOptions = computed(() =>
  props.cameras.map(camera => ({
    label: `${camera.make} ${camera.name}`,
    value: camera._id,
  }))
);

const chemicalBatchOptions = computed(() =>
  (props.chemicalBatches || []).map(batch => ({
    label: batch.name,
    value: batch._id,
  }))
);

// Watch for dialog opening to reset/populate form
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    if (props.editingRoll) {
      // Editing mode - populate form
      form.value = {
        filmStock: props.editingRoll.filmStock?._id || '',
        camera: props.editingRoll.camera?._id || undefined,
        chemicalBatch: props.editingRoll.chemicalBatch?._id || undefined,
        frameCount: props.editingRoll.frameCount,
        status: props.editingRoll.status,
        dateLoaded: props.editingRoll.dateLoaded ? props.editingRoll.dateLoaded.split('T')[0] : undefined,
        dateFinished: props.editingRoll.dateFinished ? props.editingRoll.dateFinished.split('T')[0] : undefined,
        countAsFullRoll: props.editingRoll.countAsFullRoll,
        notes: props.editingRoll.notes || '',
      };
    } else {
      // Create mode - reset to defaults
      form.value = {
        filmStock: '',
        camera: undefined,
        chemicalBatch: undefined,
        frameCount: 36,
        status: 'loaded',
        dateLoaded: undefined,
        dateFinished: undefined,
        countAsFullRoll: true,
        notes: '',
      };
    }
    formRef.value?.resetValidation();
  }
});

const handleSave = async () => {
  const { valid } = await formRef.value?.validate();
  if (!valid) return;

  const payload = { ...form.value };
  
  // Clean up undefined/empty values
  if (!payload.camera) delete payload.camera;
  if (!payload.chemicalBatch) delete payload.chemicalBatch;
  if (!payload.dateLoaded) delete payload.dateLoaded;
  if (!payload.dateFinished) delete payload.dateFinished;
  if (!payload.notes) delete payload.notes;

  emit('save', payload);
};

const handleCancel = () => {
  isOpen.value = false;
};
</script>
