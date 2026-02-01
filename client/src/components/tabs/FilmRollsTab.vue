<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <h2 :class="mobile ? 'text-h6' : 'text-h5'">Film Rolls</h2>
      <v-btn color="primary" :size="mobile ? 'small' : 'default'" @click="openCreateDialog">
        <v-icon start>mdi-plus</v-icon>
        {{ mobile ? 'New' : 'New Roll' }}
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

    <!-- Mobile Card Layout -->
    <div v-else-if="mobile">
      <v-card v-for="roll in rolls" :key="roll._id" class="mb-3">
        <v-card-item>
          <template #title>
            <div class="d-flex align-center justify-space-between">
              <span>{{ roll.filmStock?.make }} {{ roll.filmStock?.name }}</span>
              <div>
                <v-btn icon size="small" variant="text" @click="openEditDialog(roll)">
                  <v-icon size="small">mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon size="small" variant="text" color="error" @click="confirmDelete(roll)">
                  <v-icon size="small">mdi-delete</v-icon>
                </v-btn>
              </div>
            </div>
          </template>
          <template #subtitle>
            <div>{{ roll.camera ? `${roll.camera.make} ${roll.camera.name}` : 'No camera' }}</div>
            <div>Added: {{ formatDate(roll.createdAt) }}</div>
          </template>
        </v-card-item>
        <v-card-text class="pt-0">
          <div class="d-flex flex-wrap gap-2 mb-2">
            <v-chip size="small" :color="getStatusColor(roll.status)">
              {{ roll.status }}
            </v-chip>
            <v-chip size="small" variant="outlined">
              {{ roll.frameCount }} frames
            </v-chip>
          </div>
          <div class="text-caption text-grey">
            Loaded: {{ roll.dateLoaded ? formatDate(roll.dateLoaded) : '—' }}
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Desktop Table Layout -->
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

    <!-- Film Roll Dialog -->
    <FilmRollDialog
      v-model="filmRollDialog"
      :film-stocks="filmStocks"
      :cameras="cameras"
      :chemical-batches="chemicalBatches"
      :editing-roll="editingRoll"
      :saving="saving"
      :show-all-fields="true"
      @save="saveRoll"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useDisplay } from 'vuetify';
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
import FilmRollDialog from '../dialogs/FilmRollDialog.vue';

const display = useDisplay();
const mobile = computed(() => display.smAndDown.value);

const rolls = ref<FilmRoll[]>([]);
const filmStocks = ref<(FilmStock & { displayName: string })[]>([]);
const cameras = ref<(Camera & { displayName: string })[]>([]);
const chemicalBatches = ref<ChemicalBatch[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const saving = ref(false);
const deleting = ref(false);

const filmRollDialog = ref(false);
const deleteDialogOpen = ref(false);
const editingRoll = ref<FilmRoll | null>(null);
const deletingRoll = ref<FilmRoll | null>(null);

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
  editingRoll.value = null;
  filmRollDialog.value = true;
};

const openEditDialog = (roll: FilmRoll) => {
  editingRoll.value = roll;
  filmRollDialog.value = true;
};

const saveRoll = async (filmRollData: FilmRollInput) => {
  saving.value = true;
  error.value = null;
  try {
    if (editingRoll.value) {
      await filmRollsApi.update(editingRoll.value._id, filmRollData);
    } else {
      await filmRollsApi.create(filmRollData);
    }
    filmRollDialog.value = false;
    editingRoll.value = null;
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
