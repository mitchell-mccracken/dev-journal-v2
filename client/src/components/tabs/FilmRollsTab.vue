<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <h2 class="text-h5">Film Rolls</h2>
      <v-btn color="primary" @click="openCreateDialog">
        <v-icon start>mdi-plus</v-icon>
        New Roll
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
      {{ error }}
    </v-alert>

    <v-card v-if="loading" class="pa-4">
      <v-skeleton-loader type="table-row@3" />
    </v-card>

    <v-card v-else-if="rolls.length === 0" class="pa-8 text-center">
      <v-icon size="64" color="grey">mdi-filmstrip</v-icon>
      <p class="text-h6 mt-4">No film rolls yet</p>
      <p class="text-body-2 text-grey">Start tracking your film rolls.</p>
      <v-btn color="primary" class="mt-4" @click="openCreateDialog">
        <v-icon start>mdi-plus</v-icon>
        Add First Roll
      </v-btn>
    </v-card>

    <v-table v-else>
      <thead>
        <tr>
          <th>Film Stock</th>
          <th>Camera</th>
          <th>Status</th>
          <th>Frames</th>
          <th>Date Loaded</th>
          <th class="text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="roll in rolls" :key="roll._id">
          <td>
            <strong>{{ roll.filmStock?.make }} {{ roll.filmStock?.name }}</strong>
          </td>
          <td>{{ roll.camera ? `${roll.camera.make} ${roll.camera.name}` : '—' }}</td>
          <td>
            <v-chip size="small" :color="getStatusColor(roll.status)">
              {{ roll.status }}
            </v-chip>
          </td>
          <td>{{ roll.frameCount }}</td>
          <td>{{ roll.dateLoaded ? formatDate(roll.dateLoaded) : '—' }}</td>
          <td class="text-right">
            <v-btn icon size="small" variant="text" @click="openEditDialog(roll)">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon size="small" variant="text" color="error" @click="confirmDelete(roll)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialogOpen" max-width="500">
      <v-card>
        <v-card-title>{{ editingRoll ? 'Edit Roll' : 'New Film Roll' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="saveRoll">
            <v-select
              v-model="form.filmStock"
              label="Film Stock"
              :items="filmStocks"
              item-title="displayName"
              item-value="_id"
              :rules="[rules.required]"
              class="mb-2"
            />
            <v-select
              v-model="form.camera"
              label="Camera (optional)"
              :items="cameras"
              item-title="displayName"
              item-value="_id"
              clearable
              class="mb-2"
            />
            <v-select
              v-model="form.chemicalBatch"
              label="Chemical Batch (optional)"
              :items="chemicalBatches"
              item-title="name"
              item-value="_id"
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
            <v-text-field
              v-model="form.dateFinished"
              label="Date Finished"
              type="date"
              class="mb-2"
            />
            <v-textarea
              v-model="form.notes"
              label="Notes (optional)"
              rows="3"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogOpen = false">Cancel</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveRoll">
            {{ editingRoll ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialogOpen" max-width="400">
      <v-card>
        <v-card-title>Delete Roll?</v-card-title>
        <v-card-text>
          Are you sure you want to delete this film roll? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialogOpen = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteRoll">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { 
  filmRollsApi, 
  filmStocksApi, 
  camerasApi, 
  chemicalBatchesApi,
  type FilmRoll, 
  type FilmRollInput,
  type FilmStock,
  type Camera,
  type ChemicalBatch
} from '@/services/api';

const rolls = ref<FilmRoll[]>([]);
const filmStocks = ref<(FilmStock & { displayName: string })[]>([]);
const cameras = ref<(Camera & { displayName: string })[]>([]);
const chemicalBatches = ref<ChemicalBatch[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const saving = ref(false);
const deleting = ref(false);

const dialogOpen = ref(false);
const deleteDialogOpen = ref(false);
const editingRoll = ref<FilmRoll | null>(null);
const deletingRoll = ref<FilmRoll | null>(null);
const formRef = ref();

const form = reactive<FilmRollInput>({
  filmStock: '',
  camera: '',
  chemicalBatch: '',
  frameCount: 36,
  status: 'loaded',
  dateLoaded: '',
  dateFinished: '',
  notes: '',
});

const rules = {
  required: (v: string) => !!v || 'This field is required',
};

const resetForm = () => {
  form.filmStock = '';
  form.camera = '';
  form.chemicalBatch = '';
  form.frameCount = 36;
  form.status = 'loaded';
  form.dateLoaded = '';
  form.dateFinished = '';
  form.notes = '';
  editingRoll.value = null;
};

const fetchData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const [rollsRes, stocksRes, camerasRes, batchesRes] = await Promise.all([
      filmRollsApi.getAll(),
      filmStocksApi.getAll(),
      camerasApi.getAll(),
      chemicalBatchesApi.getAll(),
    ]);
    rolls.value = rollsRes.data;
    filmStocks.value = stocksRes.data.map(s => ({ ...s, displayName: `${s.make} ${s.name}` }));
    cameras.value = camerasRes.data.map(c => ({ ...c, displayName: `${c.make} ${c.name}` }));
    chemicalBatches.value = batchesRes.data;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load data';
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  resetForm();
  dialogOpen.value = true;
};

const openEditDialog = (roll: FilmRoll) => {
  editingRoll.value = roll;
  form.filmStock = roll.filmStock?._id || '';
  form.camera = roll.camera?._id || '';
  form.chemicalBatch = roll.chemicalBatch?._id || '';
  form.frameCount = roll.frameCount;
  form.status = roll.status;
  form.dateLoaded = roll.dateLoaded ? roll.dateLoaded.split('T')[0] : '';
  form.dateFinished = roll.dateFinished ? roll.dateFinished.split('T')[0] : '';
  form.notes = roll.notes || '';
  dialogOpen.value = true;
};

const saveRoll = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  saving.value = true;
  error.value = null;
  try {
    const payload = { ...form };
    if (!payload.camera) delete payload.camera;
    if (!payload.chemicalBatch) delete payload.chemicalBatch;
    
    if (editingRoll.value) {
      await filmRollsApi.update(editingRoll.value._id, payload);
    } else {
      await filmRollsApi.create(payload);
    }
    dialogOpen.value = false;
    await fetchData();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to save roll';
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (roll: FilmRoll) => {
  deletingRoll.value = roll;
  deleteDialogOpen.value = true;
};

const deleteRoll = async () => {
  if (!deletingRoll.value) return;

  deleting.value = true;
  error.value = null;
  try {
    await filmRollsApi.delete(deletingRoll.value._id);
    deleteDialogOpen.value = false;
    await fetchData();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to delete roll';
  } finally {
    deleting.value = false;
  }
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    loaded: 'blue',
    shot: 'orange',
    developed: 'success',
    scanned: 'purple',
  };
  return colors[status] || 'grey';
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

// Expose refresh method for parent component
const refresh = () => fetchData();
defineExpose({ refresh });

onMounted(fetchData);
</script>
