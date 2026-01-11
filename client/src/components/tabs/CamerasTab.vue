<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <h2 class="text-h5">Cameras</h2>
      <v-btn color="primary" @click="openCreateDialog">
        <v-icon start>mdi-plus</v-icon>
        New Camera
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
      {{ error }}
    </v-alert>

    <v-card v-if="loading" class="pa-4">
      <v-skeleton-loader type="table-row@3" />
    </v-card>

    <v-card v-else-if="cameras.length === 0" class="pa-8 text-center">
      <v-icon size="64" color="grey">mdi-camera</v-icon>
      <p class="text-h6 mt-4">No cameras yet</p>
      <p class="text-body-2 text-grey">Add your cameras to track which one you use for each roll.</p>
      <v-btn color="primary" class="mt-4" @click="openCreateDialog">
        <v-icon start>mdi-plus</v-icon>
        Add First Camera
      </v-btn>
    </v-card>

    <v-table v-else>
      <thead>
        <tr>
          <th>Make</th>
          <th>Name</th>
          <th>Format</th>
          <th>Notes</th>
          <th class="text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="camera in cameras" :key="camera._id">
          <td>{{ camera.make }}</td>
          <td><strong>{{ camera.name }}</strong></td>
          <td>{{ camera.format || '—' }}</td>
          <td>{{ camera.notes || '—' }}</td>
          <td class="text-right">
            <v-btn icon size="small" variant="text" @click="openEditDialog(camera)">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon size="small" variant="text" color="error" @click="confirmDelete(camera)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialogOpen" max-width="500">
      <v-card>
        <v-card-title>{{ editingCamera ? 'Edit Camera' : 'New Camera' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="saveCamera">
            <v-text-field
              v-model="form.make"
              label="Make (e.g., Nikon, Canon)"
              :rules="[rules.required]"
              class="mb-2"
            />
            <v-text-field
              v-model="form.name"
              label="Model Name (e.g., F3, AE-1)"
              :rules="[rules.required]"
              class="mb-2"
            />
            <v-select
              v-model="form.format"
              label="Format (optional)"
              :items="['35mm', '120', '4x5', '8x10', 'other']"
              clearable
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
          <v-btn color="primary" :loading="saving" @click="saveCamera">
            {{ editingCamera ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialogOpen" max-width="400">
      <v-card>
        <v-card-title>Delete Camera?</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ deletingCamera?.make }} {{ deletingCamera?.name }}"?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialogOpen = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteCamera">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { camerasApi, type Camera, type CameraInput } from '@/services/api';

const cameras = ref<Camera[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const saving = ref(false);
const deleting = ref(false);

const dialogOpen = ref(false);
const deleteDialogOpen = ref(false);
const editingCamera = ref<Camera | null>(null);
const deletingCamera = ref<Camera | null>(null);
const formRef = ref();

const form = reactive<CameraInput>({
  make: '',
  name: '',
  format: '',
  notes: '',
});

const rules = {
  required: (v: string) => !!v || 'This field is required',
};

const resetForm = () => {
  form.make = '';
  form.name = '';
  form.format = '';
  form.notes = '';
  editingCamera.value = null;
};

const fetchCameras = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await camerasApi.getAll();
    cameras.value = response.data;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load cameras';
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  resetForm();
  dialogOpen.value = true;
};

const openEditDialog = (camera: Camera) => {
  editingCamera.value = camera;
  form.make = camera.make;
  form.name = camera.name;
  form.format = camera.format || '';
  form.notes = camera.notes || '';
  dialogOpen.value = true;
};

const saveCamera = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  saving.value = true;
  error.value = null;
  try {
    if (editingCamera.value) {
      await camerasApi.update(editingCamera.value._id, form);
    } else {
      await camerasApi.create(form);
    }
    dialogOpen.value = false;
    await fetchCameras();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to save camera';
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (camera: Camera) => {
  deletingCamera.value = camera;
  deleteDialogOpen.value = true;
};

const deleteCamera = async () => {
  if (!deletingCamera.value) return;

  deleting.value = true;
  error.value = null;
  try {
    await camerasApi.delete(deletingCamera.value._id);
    deleteDialogOpen.value = false;
    await fetchCameras();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to delete camera';
  } finally {
    deleting.value = false;
  }
};

// Expose refresh method for parent component
const refresh = () => fetchCameras();
defineExpose({ refresh });

onMounted(fetchCameras);
</script>
