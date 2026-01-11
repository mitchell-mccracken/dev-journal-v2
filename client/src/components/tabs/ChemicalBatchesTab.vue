<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <h2 :class="mobile ? 'text-h6' : 'text-h5'">Chemical Batches</h2>
      <v-btn color="primary" :size="mobile ? 'small' : 'default'" @click="openCreateDialog">
        <v-icon start>mdi-plus</v-icon>
        {{ mobile ? 'New' : 'New Batch' }}
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
      {{ error }}
    </v-alert>

    <v-card v-if="loading" class="pa-4">
      <v-skeleton-loader type="table-row@3" />
    </v-card>

    <v-card v-else-if="batches.length === 0" class="pa-8 text-center">
      <v-icon size="64" color="grey">mdi-flask-empty-outline</v-icon>
      <p class="text-h6 mt-4">No chemical batches yet</p>
      <p class="text-body-2 text-grey">Create your first batch to start tracking your development chemistry.</p>
      <v-btn color="primary" class="mt-4" @click="openCreateDialog">
        <v-icon start>mdi-plus</v-icon>
        Create First Batch
      </v-btn>
    </v-card>

    <!-- Mobile Card Layout -->
    <div v-else-if="mobile">
      <v-card v-for="batch in batches" :key="batch._id" class="mb-3">
        <v-card-item>
          <template #title>
            <div class="d-flex align-center justify-space-between">
              <span>{{ batch.name }}</span>
              <div>
                <v-btn icon size="small" variant="text" @click="openEditDialog(batch)">
                  <v-icon size="small">mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon size="small" variant="text" color="error" @click="confirmDelete(batch)">
                  <v-icon size="small">mdi-delete</v-icon>
                </v-btn>
              </div>
            </div>
          </template>
          <template #subtitle>
            <span v-if="batch.description">{{ batch.description }}</span>
          </template>
        </v-card-item>
        <v-card-text class="pt-0">
          <div class="d-flex flex-wrap gap-2 mb-2">
            <v-chip size="small" :color="getTypeColor(batch.chemicalType)">
              {{ batch.chemicalType }}
            </v-chip>
            <v-chip size="small" :color="getStatusColor(batch.status)">
              {{ batch.status }}
            </v-chip>
            <v-chip size="small" color="info">
              {{ batchRollCounts[batch._id] || 0 }} rolls
            </v-chip>
          </div>
          <div class="text-caption text-grey">Created: {{ formatDate(batch.createdAt) }}</div>
        </v-card-text>
        <v-card-actions>
          <v-btn 
            variant="text" 
            size="small"
            @click="toggleExpand(batch._id)"
          >
            <v-icon start>{{ expandedRows[batch._id] ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            {{ expandedRows[batch._id] ? 'Hide Rolls' : 'Show Rolls' }}
          </v-btn>
        </v-card-actions>
        
        <!-- Expanded Rolls (Mobile) -->
        <v-expand-transition>
          <div v-if="expandedRows[batch._id]">
            <v-divider />
            <v-card-text>
              <div v-if="loadingRolls[batch._id]" class="text-center py-4">
                <v-progress-circular indeterminate size="24" />
              </div>
              <div v-else-if="!batchRolls[batch._id]?.length" class="text-grey text-center py-2">
                No rolls developed yet.
              </div>
              <v-list v-else density="compact" class="pa-0">
                <v-list-item 
                  v-for="roll in batchRolls[batch._id]" 
                  :key="roll._id"
                  class="px-0"
                >
                  <v-list-item-title class="text-body-2">
                    {{ roll.filmStock?.make }} {{ roll.filmStock?.name }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ roll.camera ? `${roll.camera.make} ${roll.camera.name}` : 'No camera' }}
                  </v-list-item-subtitle>
                  <template #append>
                    <v-chip size="x-small" :color="getRollStatusColor(roll.status)">
                      {{ roll.status }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </div>
        </v-expand-transition>
      </v-card>
    </div>

    <!-- Desktop Table Layout -->
    <v-card v-else>
      <v-table>
        <thead>
          <tr>
            <th style="width: 40px"></th>
            <th>Name</th>
            <th>Type</th>
            <th>Status</th>
            <th>Rolls</th>
            <th>Created</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="batch in batches" :key="batch._id">
            <tr>
              <td>
                <v-btn 
                  icon 
                  size="small" 
                  variant="text"
                  @click="toggleExpand(batch._id)"
                >
                  <v-icon>{{ expandedRows[batch._id] ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                </v-btn>
              </td>
              <td>
                <strong>{{ batch.name }}</strong>
                <div v-if="batch.description" class="text-caption text-grey">{{ batch.description }}</div>
              </td>
              <td>
                <v-chip size="small" :color="getTypeColor(batch.chemicalType)">
                  {{ batch.chemicalType }}
                </v-chip>
              </td>
              <td>
                <v-chip size="small" :color="getStatusColor(batch.status)">
                  {{ batch.status }}
                </v-chip>
              </td>
              <td>
                <v-chip size="small" color="info">
                  {{ batchRollCounts[batch._id] || 0 }}
                </v-chip>
              </td>
              <td>{{ formatDate(batch.createdAt) }}</td>
              <td class="text-right">
                <v-btn icon size="small" variant="text" @click="openEditDialog(batch)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon size="small" variant="text" color="error" @click="confirmDelete(batch)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </td>
            </tr>
            <!-- Expanded Row: Rolls for this batch -->
            <tr v-if="expandedRows[batch._id]">
              <td colspan="7" class="pa-0">
                <v-card flat color="grey-darken-4" class="ma-2">
                  <v-card-title class="text-subtitle-1">
                    <v-icon start size="small">mdi-filmstrip</v-icon>
                    Rolls Developed ({{ batchRolls[batch._id]?.length || 0 }})
                  </v-card-title>
                  <v-card-text v-if="loadingRolls[batch._id]" class="text-center py-4">
                    <v-progress-circular indeterminate size="24" />
                  </v-card-text>
                  <v-card-text v-else-if="!batchRolls[batch._id]?.length" class="text-grey">
                    No rolls developed with this batch yet.
                  </v-card-text>
                  <v-table v-else density="compact">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Film Stock</th>
                        <th>Camera</th>
                        <th>Frames</th>
                        <th>Status</th>
                        <th>Date Finished</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(roll, index) in batchRolls[batch._id]" :key="roll._id">
                        <td>{{ index + 1 }}</td>
                        <td>{{ roll.filmStock?.make }} {{ roll.filmStock?.name }}</td>
                        <td>{{ roll.camera ? `${roll.camera.make} ${roll.camera.name}` : '—' }}</td>
                        <td>{{ roll.frameCount }}</td>
                        <td>
                          <v-chip size="x-small" :color="getRollStatusColor(roll.status)">
                            {{ roll.status }}
                          </v-chip>
                        </td>
                        <td>{{ roll.dateFinished ? formatDate(roll.dateFinished) : '—' }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-card>
              </td>
            </tr>
          </template>
        </tbody>
      </v-table>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialogOpen" max-width="500">
      <v-card>
        <v-card-title>{{ editingBatch ? 'Edit Batch' : 'New Chemical Batch' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="saveBatch">
            <v-text-field
              v-model="form.name"
              label="Batch Name"
              :rules="[rules.required]"
              class="mb-2"
            />
            <v-text-field
              v-model="form.description"
              label="Description (optional)"
              class="mb-2"
            />
            <v-select
              v-model="form.chemicalType"
              label="Chemical Type"
              :items="['C41', 'E6', 'BW', 'Other']"
              :rules="[rules.required]"
              class="mb-2"
            />
            <v-select
              v-model="form.status"
              label="Status"
              :items="['in-use', 'exhausted', 'archived']"
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
          <v-btn color="primary" :loading="saving" @click="saveBatch">
            {{ editingBatch ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialogOpen" max-width="400">
      <v-card>
        <v-card-title>Delete Batch?</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ deletingBatch?.name }}"? This batch will be archived and can be restored later.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialogOpen = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteBatch">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useDisplay } from 'vuetify';
import { chemicalBatchesApi, type ChemicalBatch, type ChemicalBatchInput, type FilmRoll } from '@/services/api';

const display = useDisplay();
const mobile = computed(() => display.smAndDown.value);

const batches = ref<ChemicalBatch[]>([]);

// Expandable rows state
const expandedRows = ref<Record<string, boolean>>({});
const batchRolls = ref<Record<string, FilmRoll[]>>({});
const batchRollCounts = ref<Record<string, number>>({});
const loadingRolls = ref<Record<string, boolean>>({});
const loading = ref(true);
const error = ref<string | null>(null);
const saving = ref(false);
const deleting = ref(false);

const dialogOpen = ref(false);
const deleteDialogOpen = ref(false);
const editingBatch = ref<ChemicalBatch | null>(null);
const deletingBatch = ref<ChemicalBatch | null>(null);
const formRef = ref();

const form = reactive<ChemicalBatchInput>({
  name: '',
  description: '',
  chemicalType: 'C41',
  status: 'in-use',
  notes: '',
});

const rules = {
  required: (v: string) => !!v || 'This field is required',
};

const resetForm = () => {
  form.name = '';
  form.description = '';
  form.chemicalType = 'C41';
  form.status = 'in-use';
  form.notes = '';
  editingBatch.value = null;
};

const fetchBatches = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await chemicalBatchesApi.getAll();
    batches.value = response.data;
    
    // Fetch roll counts for each batch
    await fetchAllRollCounts();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load batches';
  } finally {
    loading.value = false;
  }
};

const fetchAllRollCounts = async () => {
  // Fetch rolls for each batch to get counts
  for (const batch of batches.value) {
    try {
      const response = await chemicalBatchesApi.getRolls(batch._id);
      batchRollCounts.value[batch._id] = response.data.length;
    } catch {
      batchRollCounts.value[batch._id] = 0;
    }
  }
};

const getRollsHelper = async (batchId: string) => {
  try {
    const response = await chemicalBatchesApi.getRolls(batchId);
    batchRolls.value[batchId] = response.data;
    batchRollCounts.value[batchId] = response.data.length;
  } catch (error) {
    console.error('Failed to get rolls for batch:', error);
    throw error;
  }
};

const toggleExpand = async (batchId: string) => {
  // Toggle the expanded state
  expandedRows.value[batchId] = !expandedRows.value[batchId];
  
  // If expanding and we haven't loaded rolls yet, fetch them
  if (expandedRows.value[batchId] && !batchRolls.value[batchId]) {
    loadingRolls.value[batchId] = true;
    try {
      await getRollsHelper(batchId);
    } catch (err: any) {
      console.error('Failed to load rolls for batch:', err);
      batchRolls.value[batchId] = [];
    } finally {
      loadingRolls.value[batchId] = false;
    }
  }
};

const openCreateDialog = () => {
  resetForm();
  dialogOpen.value = true;
};

const openEditDialog = (batch: ChemicalBatch) => {
  editingBatch.value = batch;
  form.name = batch.name;
  form.description = batch.description || '';
  form.chemicalType = batch.chemicalType;
  form.status = batch.status;
  form.notes = batch.notes || '';
  dialogOpen.value = true;
};

const saveBatch = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  saving.value = true;
  error.value = null;
  try {
    if (editingBatch.value) {
      await chemicalBatchesApi.update(editingBatch.value._id, form);
    } else {
      await chemicalBatchesApi.create(form);
    }
    dialogOpen.value = false;
    await fetchBatches();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to save batch';
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (batch: ChemicalBatch) => {
  deletingBatch.value = batch;
  deleteDialogOpen.value = true;
};

const deleteBatch = async () => {
  if (!deletingBatch.value) return;

  deleting.value = true;
  error.value = null;
  try {
    await chemicalBatchesApi.delete(deletingBatch.value._id);
    deleteDialogOpen.value = false;
    await fetchBatches();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to delete batch';
  } finally {
    deleting.value = false;
  }
};

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    C41: 'orange',
    E6: 'purple',
    BW: 'grey',
    Other: 'blue',
  };
  return colors[type] || 'grey';
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'in-use': 'success',
    exhausted: 'error',
    archived: 'grey',
  };
  return colors[status] || 'grey';
};

const getRollStatusColor = (status: string) => {
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
const refresh = () => {
  // if batches have expanded rows, re-fetch their rolls
  batches.value
    .filter(batch =>  !!expandedRows.value[batch._id])
    .map(batch => getRollsHelper(batch._id));

  return fetchBatches();
};
defineExpose({ refresh });

onMounted(fetchBatches);
</script>
