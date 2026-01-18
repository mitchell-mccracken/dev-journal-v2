<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <h2 :class="mobile ? 'text-h6' : 'text-h5'">Chemicals</h2>
    </div>

    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
      {{ error }}
    </v-alert>

    <!-- Developer Section -->
    <v-card class="mb-4">
      <v-card-item>
        <template #title>
          <div class="d-flex align-center justify-space-between">
            <div>
              <v-icon start>mdi-flask-outline</v-icon>
              Developer
            </div>
            <v-btn 
              color="primary" 
              :size="mobile ? 'small' : 'default'" 
              @click="openCreateDialog('developer')"
            >
              <v-icon start>mdi-plus</v-icon>
              {{ mobile ? 'Add' : 'Add Developer' }}
            </v-btn>
          </div>
        </template>
      </v-card-item>
      <v-card-text>
        <div v-if="loading" class="text-center py-4">
          <v-progress-circular indeterminate />
        </div>
        <div v-else-if="!developerChemicals.length" class="text-center py-4 text-grey">
          No developers added yet
        </div>
        <div v-else class="d-flex flex-wrap gap-2">
          <v-menu v-for="chemical in developerChemicals" :key="chemical._id">
            <template v-slot:activator="{ props }">
              <v-chip 
                size="large"
                variant="tonal"
                color="primary"
                v-bind="props"
              >
                {{ chemical.name }}{{ chemical.ratio ? ` (${chemical.ratio})` : '' }}
              </v-chip>
            </template>
            <v-list>
              <v-list-item @click="openEditDialog(chemical)">
                <template #prepend>
                  <v-icon>mdi-pencil</v-icon>
                </template>
                <v-list-item-title>Edit</v-list-item-title>
              </v-list-item>
              <v-list-item @click="confirmDelete(chemical)">
                <template #prepend>
                  <v-icon>mdi-delete</v-icon>
                </template>
                <v-list-item-title>Delete</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </v-card-text>
    </v-card>

    <!-- Fixer Section -->
    <v-card class="mb-4">
      <v-card-item>
        <template #title>
          <div class="d-flex align-center justify-space-between">
            <div>
              <v-icon start>mdi-flask</v-icon>
              Fixer
            </div>
            <v-btn 
              color="secondary" 
              :size="mobile ? 'small' : 'default'" 
              @click="openCreateDialog('fixer')"
            >
              <v-icon start>mdi-plus</v-icon>
              {{ mobile ? 'Add' : 'Add Fixer' }}
            </v-btn>
          </div>
        </template>
      </v-card-item>
      <v-card-text>
        <div v-if="loading" class="text-center py-4">
          <v-progress-circular indeterminate />
        </div>
        <div v-else-if="!fixerChemicals.length" class="text-center py-4 text-grey">
          No fixers added yet
        </div>
        <div v-else class="d-flex flex-wrap gap-2">
          <v-menu v-for="chemical in fixerChemicals" :key="chemical._id">
            <template v-slot:activator="{ props }">
              <v-chip 
                size="large"
                variant="tonal"
                color="secondary"
                v-bind="props"
              >
                {{ chemical.name }}{{ chemical.ratio ? ` (${chemical.ratio})` : '' }}
              </v-chip>
            </template>
            <v-list>
              <v-list-item @click="openEditDialog(chemical)">
                <template #prepend>
                  <v-icon>mdi-pencil</v-icon>
                </template>
                <v-list-item-title>Edit</v-list-item-title>
              </v-list-item>
              <v-list-item @click="confirmDelete(chemical)">
                <template #prepend>
                  <v-icon>mdi-delete</v-icon>
                </template>
                <v-list-item-title>Delete</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </v-card-text>
    </v-card>

    <!-- Stop Bath Section -->
    <v-card class="mb-4">
      <v-card-item>
        <template #title>
          <div class="d-flex align-center justify-space-between">
            <div>
              <v-icon start>mdi-pause</v-icon>
              Stop Bath
            </div>
            <v-btn 
              color="warning" 
              :size="mobile ? 'small' : 'default'" 
              @click="openCreateDialog('stopBath')"
            >
              <v-icon start>mdi-plus</v-icon>
              {{ mobile ? 'Add' : 'Add Stop Bath' }}
            </v-btn>
          </div>
        </template>
      </v-card-item>
      <v-card-text>
        <div v-if="loading" class="text-center py-4">
          <v-progress-circular indeterminate />
        </div>
        <div v-else-if="!stopBathChemicals.length" class="text-center py-4 text-grey">
          No stop baths added yet
        </div>
        <div v-else class="d-flex flex-wrap gap-2">
          <v-menu v-for="chemical in stopBathChemicals" :key="chemical._id">
            <template v-slot:activator="{ props }">
              <v-chip 
                size="large"
                variant="tonal"
                color="warning"
                v-bind="props"
              >
                {{ chemical.name }}{{ chemical.ratio ? ` (${chemical.ratio})` : '' }}
              </v-chip>
            </template>
            <v-list>
              <v-list-item @click="openEditDialog(chemical)">
                <template #prepend>
                  <v-icon>mdi-pencil</v-icon>
                </template>
                <v-list-item-title>Edit</v-list-item-title>
              </v-list-item>
              <v-list-item @click="confirmDelete(chemical)">
                <template #prepend>
                  <v-icon>mdi-delete</v-icon>
                </template>
                <v-list-item-title>Delete</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </v-card-text>
    </v-card>

    <!-- Other Section -->
    <v-card class="mb-4">
      <v-card-item>
        <template #title>
          <div class="d-flex align-center justify-space-between">
            <div>
              <v-icon start>mdi-beaker-outline</v-icon>
              Other
            </div>
            <v-btn 
              color="info" 
              :size="mobile ? 'small' : 'default'" 
              @click="openCreateDialog('other')"
            >
              <v-icon start>mdi-plus</v-icon>
              {{ mobile ? 'Add' : 'Add Chemical' }}
            </v-btn>
          </div>
        </template>
      </v-card-item>
      <v-card-text>
        <div v-if="loading" class="text-center py-4">
          <v-progress-circular indeterminate />
        </div>
        <div v-else-if="!otherChemicals.length" class="text-center py-4 text-grey">
          No other chemicals added yet
        </div>
        <div v-else class="d-flex flex-wrap gap-2">
          <v-menu v-for="chemical in otherChemicals" :key="chemical._id">
            <template v-slot:activator="{ props }">
              <v-chip 
                size="large"
                variant="tonal"
                color="info"
                v-bind="props"
              >
                {{ chemical.name }}{{ chemical.ratio ? ` (${chemical.ratio})` : '' }}
              </v-chip>
            </template>
            <v-list>
              <v-list-item @click="openEditDialog(chemical)">
                <template #prepend>
                  <v-icon>mdi-pencil</v-icon>
                </template>
                <v-list-item-title>Edit</v-list-item-title>
              </v-list-item>
              <v-list-item @click="confirmDelete(chemical)">
                <template #prepend>
                  <v-icon>mdi-delete</v-icon>
                </template>
                <v-list-item-title>Delete</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </v-card-text>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialogOpen" max-width="500">
      <v-card>
        <v-card-title>
          {{ editingChemical ? 'Edit' : 'New' }} 
          {{ dialogType.charAt(0).toUpperCase() + dialogType.slice(1) }}
        </v-card-title>
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="saveChemical">
            <v-text-field
              v-model="form.name"
              label="Chemical Name"
              :rules="[rules.required]"
              class="mb-2"
            />
            <v-text-field
              v-model="form.ratio"
              label="Ratio (optional)"
              placeholder="e.g., 1:100, 1:50"
              class="mb-2"
            />
            <v-menu
              v-model="dateMenu"
              :close-on-content-click="false"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-model="formattedExpirationDate"
                  label="Expiration Date (optional)"
                  prepend-inner-icon="mdi-calendar"
                  readonly
                  v-bind="props"
                  class="mb-2"
                />
              </template>
              <v-date-picker
                v-model="form.expirationDate"
                @update:model-value="dateMenu = false"
              />
            </v-menu>
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
          <v-btn color="primary" :loading="saving" @click="saveChemical">
            {{ editingChemical ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialogOpen" max-width="400">
      <v-card>
        <v-card-title>Delete Chemical?</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ deletingChemical?.name }}"?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialogOpen = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteChemical">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useDisplay } from 'vuetify';
import { genericChemicalsApi, type GenericChemical, type GenericChemicalInput } from '@/services/api';

const display = useDisplay();
const mobile = computed(() => display.smAndDown.value);

const chemicals = ref<GenericChemical[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const saving = ref(false);
const deleting = ref(false);

const dialogOpen = ref(false);
const deleteDialogOpen = ref(false);
const dateMenu = ref(false);
const dialogType = ref<'developer' | 'fixer' | 'stopBath' | 'other'>('developer');
const editingChemical = ref<GenericChemical | null>(null);
const deletingChemical = ref<GenericChemical | null>(null);
const formRef = ref();

const form = reactive<GenericChemicalInput>({
  name: '',
  ratio: '',
  type: 'developer',
  expirationDate: undefined,
  notes: '',
});

// Computed properties to filter chemicals by type
const developerChemicals = computed(() => chemicals.value.filter(c => c.type === 'developer'));
const fixerChemicals = computed(() => chemicals.value.filter(c => c.type === 'fixer'));
const stopBathChemicals = computed(() => chemicals.value.filter(c => c.type === 'stopBath'));
const otherChemicals = computed(() => chemicals.value.filter(c => c.type === 'other'));

const formattedExpirationDate = computed(() => {
  return form.expirationDate ? new Date(form.expirationDate).toLocaleDateString() : '';
});

const rules = {
  required: (v: string) => !!v || 'This field is required',
};

const resetForm = () => {
  form.name = '';
  form.ratio = '';
  form.type = dialogType.value;
  form.expirationDate = undefined;
  form.notes = '';
  editingChemical.value = null;
};

const fetchChemicals = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await genericChemicalsApi.getAll();
    chemicals.value = response.data.data;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load chemicals';
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = (type: 'developer' | 'fixer' | 'stopBath' | 'other') => {
  dialogType.value = type;
  resetForm();
  dialogOpen.value = true;
};

const openEditDialog = (chemical: GenericChemical) => {
  editingChemical.value = chemical;
  dialogType.value = chemical.type;
  form.name = chemical.name;
  form.ratio = chemical.ratio || '';
  form.type = chemical.type;
  form.expirationDate = chemical.expirationDate ? new Date(chemical.expirationDate) : undefined;
  form.notes = chemical.notes || '';
  dialogOpen.value = true;
};

const saveChemical = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  saving.value = true;
  error.value = null;
  try {
    if (editingChemical.value) {
      await genericChemicalsApi.update(editingChemical.value._id, form);
    } else {
      await genericChemicalsApi.create(form);
    }
    dialogOpen.value = false;
    await fetchChemicals();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to save chemical';
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (chemical: GenericChemical) => {
  deletingChemical.value = chemical;
  deleteDialogOpen.value = true;
};

const deleteChemical = async () => {
  if (!deletingChemical.value) return;

  deleting.value = true;
  error.value = null;
  try {
    await genericChemicalsApi.delete(deletingChemical.value._id);
    deleteDialogOpen.value = false;
    await fetchChemicals();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to delete chemical';
  } finally {
    deleting.value = false;
  }
};

// Expose refresh method for consistency with other tabs
const refresh = () => fetchChemicals();
defineExpose({ refresh });

onMounted(fetchChemicals);
</script>