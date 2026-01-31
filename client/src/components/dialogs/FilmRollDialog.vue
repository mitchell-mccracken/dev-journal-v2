<template>
  <v-dialog v-model="isOpen" max-width="500">
    <v-card>
      <v-card-title>New Film Roll</v-card-title>
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
          <v-textarea
            v-model="form.notes"
            label="Notes"
            rows="3"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel">Cancel</v-btn>
        <v-btn color="primary" :loading="saving" @click="handleSave">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { FilmStock, Camera } from '@/services/api';

interface Props {
  modelValue: boolean;
  filmStocks: FilmStock[];
  cameras: Camera[];
  saving?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', filmRoll: {
    filmStock: string;
    camera?: string;
    frameCount?: number;
    status?: string;
    dateLoaded?: string;
    notes?: string;
  }): void;
}

const props = withDefaults(defineProps<Props>(), {
  saving: false,
});

const emit = defineEmits<Emits>();

const formRef = ref<any>(null);
const form = ref({
  filmStock: '',
  camera: undefined as string | undefined,
  frameCount: 36,
  status: 'loaded',
  dateLoaded: undefined as string | undefined,
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

// Reset form when dialog opens
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    form.value = {
      filmStock: '',
      camera: undefined,
      frameCount: 36,
      status: 'loaded',
      dateLoaded: undefined,
      notes: '',
    };
    formRef.value?.resetValidation();
  }
});

const handleSave = async () => {
  const { valid } = await formRef.value?.validate();
  if (!valid) return;

  emit('save', { ...form.value });
};

const handleCancel = () => {
  isOpen.value = false;
};
</script>
