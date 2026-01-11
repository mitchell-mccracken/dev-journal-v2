<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <h2 class="text-h5">Film Stocks</h2>
      <v-btn color="primary" @click="openCreateDialog">
        <v-icon start>mdi-plus</v-icon>
        New Film Stock
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
      {{ error }}
    </v-alert>

    <v-card v-if="loading" class="pa-4">
      <v-skeleton-loader type="table-row@3" />
    </v-card>

    <v-card v-else-if="stocks.length === 0" class="pa-8 text-center">
      <v-icon size="64" color="grey">mdi-filmstrip-box</v-icon>
      <p class="text-h6 mt-4">No film stocks yet</p>
      <p class="text-body-2 text-grey">Add your film stocks to use when creating rolls.</p>
      <v-btn color="primary" class="mt-4" @click="openCreateDialog">
        <v-icon start>mdi-plus</v-icon>
        Add First Stock
      </v-btn>
    </v-card>

    <v-table v-else>
      <thead>
        <tr>
          <th>Make</th>
          <th>Name</th>
          <th>ISO</th>
          <th>Format</th>
          <th>Type</th>
          <th class="text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="stock in stocks" :key="stock._id">
          <td>{{ stock.make }}</td>
          <td><strong>{{ stock.name }}</strong></td>
          <td>{{ stock.iso || '—' }}</td>
          <td>{{ stock.format || '—' }}</td>
          <td>
            <v-chip v-if="stock.type" size="small" :color="getTypeColor(stock.type)">
              {{ stock.type }}
            </v-chip>
            <span v-else>—</span>
          </td>
          <td class="text-right">
            <v-btn icon size="small" variant="text" @click="openEditDialog(stock)">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon size="small" variant="text" color="error" @click="confirmDelete(stock)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialogOpen" max-width="500">
      <v-card>
        <v-card-title>{{ editingStock ? 'Edit Film Stock' : 'New Film Stock' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="saveStock">
            <v-text-field
              v-model="form.make"
              label="Make (e.g., Kodak, Fuji)"
              :rules="[rules.required]"
              class="mb-2"
            />
            <v-text-field
              v-model="form.name"
              label="Name (e.g., Portra 400)"
              :rules="[rules.required]"
              class="mb-2"
            />
            <v-text-field
              v-model.number="form.iso"
              label="ISO (optional)"
              type="number"
              class="mb-2"
            />
            <v-select
              v-model="form.format"
              label="Format (optional)"
              :items="['35mm', '120', '4x5', '8x10', 'other']"
              clearable
              class="mb-2"
            />
            <v-select
              v-model="form.type"
              label="Type (optional)"
              :items="['color', 'bw', 'slide']"
              clearable
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogOpen = false">Cancel</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveStock">
            {{ editingStock ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialogOpen" max-width="400">
      <v-card>
        <v-card-title>Delete Film Stock?</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ deletingStock?.make }} {{ deletingStock?.name }}"?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialogOpen = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteStock">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { filmStocksApi, type FilmStock, type FilmStockInput } from '@/services/api';

const stocks = ref<FilmStock[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const saving = ref(false);
const deleting = ref(false);

const dialogOpen = ref(false);
const deleteDialogOpen = ref(false);
const editingStock = ref<FilmStock | null>(null);
const deletingStock = ref<FilmStock | null>(null);
const formRef = ref();

const form = reactive<FilmStockInput>({
  make: '',
  name: '',
  iso: undefined,
  format: '',
  type: '',
});

const rules = {
  required: (v: string) => !!v || 'This field is required',
};

const resetForm = () => {
  form.make = '';
  form.name = '';
  form.iso = undefined;
  form.format = '';
  form.type = '';
  editingStock.value = null;
};

const fetchStocks = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await filmStocksApi.getAll();
    stocks.value = response.data;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load film stocks';
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  resetForm();
  dialogOpen.value = true;
};

const openEditDialog = (stock: FilmStock) => {
  editingStock.value = stock;
  form.make = stock.make;
  form.name = stock.name;
  form.iso = stock.iso;
  form.format = stock.format || '';
  form.type = stock.type || '';
  dialogOpen.value = true;
};

const saveStock = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  saving.value = true;
  error.value = null;
  try {
    if (editingStock.value) {
      await filmStocksApi.update(editingStock.value._id, form);
    } else {
      await filmStocksApi.create(form);
    }
    dialogOpen.value = false;
    await fetchStocks();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to save film stock';
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (stock: FilmStock) => {
  deletingStock.value = stock;
  deleteDialogOpen.value = true;
};

const deleteStock = async () => {
  if (!deletingStock.value) return;

  deleting.value = true;
  error.value = null;
  try {
    await filmStocksApi.delete(deletingStock.value._id);
    deleteDialogOpen.value = false;
    await fetchStocks();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to delete film stock';
  } finally {
    deleting.value = false;
  }
};

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    color: 'orange',
    bw: 'grey',
    slide: 'purple',
  };
  return colors[type] || 'grey';
};

// Expose refresh method for parent component
const refresh = () => fetchStocks();
defineExpose({ refresh });

onMounted(fetchStocks);
</script>
