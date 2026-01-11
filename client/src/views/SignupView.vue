<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Sign Up</v-toolbar-title>
          </v-toolbar>
          
          <v-card-text>
            <v-form @submit.prevent="handleSignup" ref="formRef">
              <v-text-field
                v-model="form.name"
                label="Name"
                prepend-icon="mdi-account"
                :rules="[rules.required]"
                :disabled="authStore.loading"
              />

              <v-text-field
                v-model="form.email"
                label="Email"
                type="email"
                prepend-icon="mdi-email"
                :rules="[rules.required, rules.email]"
                :disabled="authStore.loading"
              />
              
              <v-text-field
                v-model="form.password"
                label="Password"
                :type="showPassword ? 'text' : 'password'"
                prepend-icon="mdi-lock"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="showPassword = !showPassword"
                :rules="[rules.required, rules.minLength]"
                :disabled="authStore.loading"
              />

              <v-text-field
                v-model="form.confirmPassword"
                label="Confirm Password"
                :type="showPassword ? 'text' : 'password'"
                prepend-icon="mdi-lock-check"
                :rules="[rules.required, rules.passwordMatch]"
                :disabled="authStore.loading"
              />

              <v-alert
                v-if="authStore.error"
                type="error"
                density="compact"
                class="mb-4"
              >
                {{ authStore.error }}
              </v-alert>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-btn
              color="secondary"
              variant="text"
              :to="{ name: 'login' }"
            >
              Back to Login
            </v-btn>
            <v-spacer />
            <v-btn
              color="primary"
              :loading="authStore.loading"
              @click="handleSignup"
            >
              Sign Up
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const formRef = ref();
const showPassword = ref(false);

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
});

const rules = {
  required: (v: string) => !!v || 'This field is required',
  email: (v: string) => /.+@.+\..+/.test(v) || 'Enter a valid email',
  minLength: (v: string) => v.length >= 6 || 'Password must be at least 6 characters',
  passwordMatch: (v: string) => v === form.password || 'Passwords do not match',
};

const handleSignup = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  const success = await authStore.signup({
    name: form.name,
    email: form.email,
    password: form.password,
  });
  
  if (success) {
    router.push('/home');
  }
};
</script>
