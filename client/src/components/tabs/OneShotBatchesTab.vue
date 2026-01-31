<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <h2 :class="mobile ? 'text-h6' : 'text-h5'">One-Shot Batches</h2>
      <v-btn color="primary" :size="mobile ? 'small' : 'default'" @click="openDialog()">
        <v-icon start>mdi-plus</v-icon>
        {{ mobile ? 'New' : 'New One-Shot Batch' }}
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
      {{ error }}
    </v-alert>

    <v-card v-if="loading" class="pa-4">
      <v-skeleton-loader type="table-row@3" />
    </v-card>

    <v-card v-else-if="batches.length === 0" class="pa-8 text-center">
      <v-icon size="64" color="grey">mdi-flask-empty</v-icon>
      <p class="text-h6 mt-4">No one-shot batches yet</p>
      <p class="text-body-2 text-grey">Track your one-shot chemical batch usage.</p>
      <v-btn color="primary" class="mt-4" @click="openDialog()">
        <v-icon start>mdi-plus</v-icon>
        Add First Batch
      </v-btn>
    </v-card>

    <!-- Mobile: Card layout -->
    <div v-else-if="mobile">
      <v-card v-for="batch in batches" :key="batch._id" class="mb-3">
        <v-card-item>
          <template #title>
            <div class="d-flex align-center justify-space-between">
              <span>{{ formatDate(batch.developedAt || batch.createdAt) }}</span>
              <div>
                <v-btn icon size="small" variant="text" @click="openDialog(batch)">
                  <v-icon size="small">mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon size="small" variant="text" color="error" @click="confirmDelete(batch)">
                  <v-icon size="small">mdi-delete</v-icon>
                </v-btn>
              </div>
            </div>
          </template>
        </v-card-item>
        <v-card-text class="pt-0">
          <div class="mb-2">
            <strong>Developer:</strong> {{ batch.developer.name }}
            <span v-if="batch.developer.ratio" class="text-grey">({{ batch.developer.ratio }})</span>
          </div>
          <div class="mb-2">
            <strong>Fixer:</strong> {{ batch.fixer.name }}
            <span v-if="batch.fixer.ratio" class="text-grey">({{ batch.fixer.ratio }})</span>
          </div>
          <div v-if="batch.stopBath" class="mb-2">
            <strong>Stop Bath:</strong> {{ batch.stopBath.name }}
            <span v-if="batch.stopBath.ratio" class="text-grey">({{ batch.stopBath.ratio }})</span>
          </div>
          <div v-if="batch.filmRolls && batch.filmRolls.length > 0" class="mb-2">
            <strong>Film Rolls:</strong>
            <div v-for="roll in batch.filmRolls" :key="roll._id" class="ml-2 text-grey">
              • {{ roll.filmStock.make }} {{ roll.filmStock.name }}
              <span v-if="roll.camera"> - {{ roll.camera.make }} {{ roll.camera.name }}</span>
            </div>
          </div>
          <div v-if="batch.notes" class="text-grey">
            {{ batch.notes }}
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Desktop: Table layout -->
    <v-table v-else>
      <thead>
        <tr>
          <th>Date</th>
          <th>Developer</th>
          <th>Fixer</th>
          <th>Stop Bath</th>
          <th>Film Rolls</th>
          <th>Notes</th>
          <th class="text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="batch in batches" :key="batch._id">
          <td>{{ formatDate(batch.developedAt || batch.createdAt) }}</td>
          <td>
            {{ batch.developer.name }}
            <span v-if="batch.developer.ratio" class="text-grey">({{ batch.developer.ratio }})</span>
          </td>
          <td>
            {{ batch.fixer.name }}
            <span v-if="batch.fixer.ratio" class="text-grey">({{ batch.fixer.ratio }})</span>
          </td>
          <td>
            <span v-if="batch.stopBath">
              {{ batch.stopBath.name }}
              <span v-if="batch.stopBath.ratio" class="text-grey">({{ batch.stopBath.ratio }})</span>
            </span>
            <span v-else>—</span>
          </td>
          <td>
            <span v-if="batch.filmRolls && batch.filmRolls.length > 0">
              {{ batch.filmRolls.length }} roll{{ batch.filmRolls.length > 1 ? 's' : '' }}
            </span>
            <span v-else>—</span>
          </td>
          <td>{{ batch.notes || '—' }}</td>
          <td class="text-right">
            <v-btn icon size="small" variant="text" @click="openDialog(batch)">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon size="small" variant="text" color="error" @click="confirmDelete(batch)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- Dialog -->
    <v-dialog v-model="dialog" max-width="600">
      <v-card>
        <v-card-title>
          {{ editingBatch ? 'Edit One-Shot Batch' : 'Add One-Shot Batch' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="saveBatch">
            <v-select
              v-model="form.developer"
              :items="developerOptions"
              item-title="label"
              item-value="value"
              label="Developer *"
              :rules="[(v: string) => !!v || 'Developer is required']"
              required
            />

            <v-select
              v-model="form.fixer"
              :items="fixerOptions"
              item-title="label"
              item-value="value"
              label="Fixer *"
              :rules="[(v: string) => !!v || 'Fixer is required']"
              required
            />

            <v-select
              v-model="form.stopBath"
              :items="stopBathOptions"
              item-title="label"
              item-value="value"
              label="Stop Bath"
              clearable
            />

            <div class="d-flex align-center ga-2">
              <v-select
                v-model="form.filmRolls"
                :items="filmRollOptions"
                item-title="label"
                item-value="value"
                label="Film Rolls"
                multiple
                chips
                clearable
                hint="Select the film rolls developed with this batch"
                persistent-hint
                class="flex-grow-1"
              />
              <v-btn
                icon
                size="small"
                color="primary"
                variant="text"
                @click="openFilmRollDialog"
                class="mt-n6"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </div>

            <v-text-field
              v-model="form.developedAt"
              label="Developed Date"
              type="date"
              class="mt-4"
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
          <v-btn text @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveBatch">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this one-shot batch?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deleteBatch">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Film Roll Creation Dialog -->
    <FilmRollDialog
      v-model="filmRollDialog"
      :film-stocks="filmStocks"
      :cameras="cameras"
      :saving="savingFilmRoll"
      @save="saveFilmRoll"
    />

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useDisplay } from 'vuetify';
import {
  oneShotBatchesApi,
  genericChemicalsApi,
  filmRollsApi,
  filmStocksApi,
  camerasApi,
  type OneShotChemicalBatch,
  type OneShotChemicalBatchInput,
  type GenericChemical,
  type FilmRoll,
  type FilmStock,
  type Camera,
} from '@/services/api';
import FilmRollDialog from '@/components/dialogs/FilmRollDialog.vue';

const display = useDisplay();
const mobile = computed(() => display.smAndDown.value);

const batches = ref<OneShotChemicalBatch[]>([]);
const chemicals = ref<GenericChemical[]>([]);
const filmRolls = ref<FilmRoll[]>([]);
const filmStocks = ref<FilmStock[]>([]);
const cameras = ref<Camera[]>([]);
const dialog = ref(false);
const deleteDialog = ref(false);
const filmRollDialog = ref(false);
const editingBatch = ref<OneShotChemicalBatch | null>(null);
const batchToDelete = ref<OneShotChemicalBatch | null>(null);
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');
const formRef = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const savingFilmRoll = ref(false);

const form = ref<OneShotChemicalBatchInput>({
  developer: '',
  fixer: '',
  stopBath: undefined,
  filmRolls: [],
  developedAt: undefined,
  notes: '',
});

// Filter chemicals by type for dropdowns
const developerOptions = computed(() => 
  chemicals.value
    .filter(c => c.type === 'developer')
    .map(c => ({
      label: c.ratio ? `${c.name} (${c.ratio})` : c.name,
      value: c._id,
    }))
);

const fixerOptions = computed(() => 
  chemicals.value
    .filter(c => c.type === 'fixer' || c.type === 'other')
    .map(c => ({
      label: c.ratio ? `${c.name} (${c.ratio})` : c.name,
      value: c._id,
    }))
);

const stopBathOptions = computed(() => 
  chemicals.value
    .filter(c => c.type === 'stopBath' || c.type === 'other')
    .map(c => ({
      label: c.ratio ? `${c.name} (${c.ratio})` : c.name,
      value: c._id,
    }))
);

const filmRollOptions = computed(() => 
  filmRolls.value.map(roll => ({
    label: `${roll.filmStock.make} ${roll.filmStock.name}${roll.camera ? ` - ${roll.camera.make} ${roll.camera.name}` : ''}`,
    value: roll._id,
  }))
);

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString();
};

const loadBatches = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await oneShotBatchesApi.getAll();
    batches.value = response.data.data;
  } catch (error) {
    console.error('Error loading batches:', error);
    showSnackbar('Error loading batches', 'error');
  } finally {
    loading.value = false;
  }
};

const loadChemicals = async () => {
  try {
    const response = await genericChemicalsApi.getAll();
    chemicals.value = response.data.data;
  } catch (error) {
    console.error('Error loading chemicals:', error);
    showSnackbar('Error loading chemicals', 'error');
  }
};

const loadFilmRolls = async () => {
  try {
    const response = await filmRollsApi.getAll();
    filmRolls.value = response.data;
  } catch (error) {
    console.error('Error loading film rolls:', error);
    showSnackbar('Error loading film rolls', 'error');
  }
};

const loadFilmStocks = async () => {
  try {
    const response = await filmStocksApi.getAll();
    filmStocks.value = response.data;
  } catch (error) {
    console.error('Error loading film stocks:', error);
    showSnackbar('Error loading film stocks', 'error');
  }
};

const loadCameras = async () => {
  try {
    const response = await camerasApi.getAll();
    cameras.value = response.data;
  } catch (error) {
    console.error('Error loading cameras:', error);
    showSnackbar('Error loading cameras', 'error');
  }
};

const openDialog = (batch?: OneShotChemicalBatch) => {
  if (batch) {
    editingBatch.value = batch;
    form.value = {
      developer: typeof batch.developer === 'string' ? batch.developer : batch.developer._id,
      fixer: typeof batch.fixer === 'string' ? batch.fixer : batch.fixer._id,
      stopBath: batch.stopBath ? (typeof batch.stopBath === 'string' ? batch.stopBath : batch.stopBath._id) : undefined,
      filmRolls: batch.filmRolls ? batch.filmRolls.map(roll => typeof roll === 'string' ? roll : roll._id) : [],
      developedAt: batch.developedAt ? batch.developedAt.split('T')[0] : undefined,
      notes: batch.notes || '',
    };
  } else {
    editingBatch.value = null;
    form.value = {
      developer: '',
      fixer: '',
      stopBath: undefined,
      filmRolls: [],
      developedAt: undefined,
      notes: '',
    };
  }
  dialog.value = true;
};

const saveBatch = async () => {
  const { valid } = await formRef.value?.validate();
  if (!valid) return;

  try {
    if (editingBatch.value) {
      await oneShotBatchesApi.update(editingBatch.value._id, form.value);
      showSnackbar('Batch updated successfully', 'success');
    } else {
      await oneShotBatchesApi.create(form.value);
      showSnackbar('Batch created successfully', 'success');
    }
    dialog.value = false;
    await loadBatches();
  } catch (error: any) {
    console.error('Error saving batch:', error);
    const message = error.response?.data?.message || 'Error saving batch';
    showSnackbar(message, 'error');
  }
};

const confirmDelete = (batch: OneShotChemicalBatch) => {
  batchToDelete.value = batch;
  deleteDialog.value = true;
};

const openFilmRollDialog = () => {
  filmRollDialog.value = true;
};

const saveFilmRoll = async (filmRollData: any) => {
  savingFilmRoll.value = true;
  try {
    const response = await filmRollsApi.create(filmRollData);
    const newRoll = response.data;
    
    // Add to local filmRolls array (at the beginning)
    filmRolls.value.splice(0, 0, newRoll);
    
    // Add to selected film rolls in the batch form
    if (!form.value.filmRolls) {
      form.value.filmRolls = [];
    }
    form.value.filmRolls.splice(0, 0, newRoll._id);
    
    showSnackbar('Film roll created successfully', 'success');
    filmRollDialog.value = false;
  } catch (error: any) {
    console.error('Error creating film roll:', error);
    const message = error.response?.data?.message || 'Error creating film roll';
    showSnackbar(message, 'error');
  } finally {
    savingFilmRoll.value = false;
  }
};

const deleteBatch = async () => {
  if (!batchToDelete.value) return;

  try {
    await oneShotBatchesApi.delete(batchToDelete.value._id);
    showSnackbar('Batch deleted successfully', 'success');
    deleteDialog.value = false;
    await loadBatches();
  } catch (error) {
    console.error('Error deleting batch:', error);
    showSnackbar('Error deleting batch', 'error');
  }
};

const showSnackbar = (text: string, color: string) => {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
};

const refresh = async () => {
  await loadBatches();
  await loadChemicals();
  await loadFilmRolls();
  await loadFilmStocks();
  await loadCameras();
};

onMounted(async () => {
  await loadChemicals();
  await loadFilmRolls();
  await loadFilmStocks();
  await loadCameras();
  await loadBatches();
});

defineExpose({ refresh });
</script>
