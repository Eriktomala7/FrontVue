<template>
  <main class="login-page">
    <section class="login-story" aria-label="Acerca de Stockwise">
      <a class="brand brand-light" href="/" aria-label="Stockwise, inicio">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
            <path d="m4.5 7.75 7.5 4.5 7.5-4.5M12 12.25V21" />
          </svg>
        </span>
        <span class="brand-copy">
          <strong>Stockwise</strong>
          <small>CONTROL DE INVENTARIO</small>
        </span>
      </a>

      <div class="story-copy">
        <p class="eyebrow">INVENTARIO SIMPLE, DECISIONES CLARAS</p>
        <h1>Todo lo que necesitas para mantener tu inventario en movimiento.</h1>
        <p class="story-description">
          Administra productos, atiende solicitudes y consulta el estado de tu operación desde un solo lugar.
        </p>
      </div>

      <div class="story-features">
        <div>
          <h2>Productos</h2>
          <p>Tu catálogo, siempre organizado</p>
        </div>
        <div>
          <h2>Movimientos</h2>
          <p>El estado de tu operación al día</p>
        </div>
      </div>
    </section>

    <section class="login-panel">
      <div class="login-content">
        <a class="brand brand-dark" href="/" aria-label="Stockwise, inicio">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
              <path d="m4.5 7.75 7.5 4.5 7.5-4.5M12 12.25V21" />
            </svg>
          </span>
          <span class="brand-copy">
            <strong>Stockwise</strong>
            <small>CONTROL DE INVENTARIO</small>
          </span>
        </a>

        <header class="form-heading">
          <p class="welcome">
            {{ isRegister ? 'Crea tu cuenta' : isEmailSent ? 'Recuperación de cuenta' : isResetPassword ? 'Recuperación de cuenta' : isForgotPassword ? 'Recuperación de cuenta' : 'Bienvenido de nuevo' }}
          </p>
          <h2>{{ isRegister ? 'Regístrate' : isEmailSent ? 'Revisa tu correo' : isResetPassword ? 'Restablece tu contraseña' : isForgotPassword ? '¿Olvidaste tu contraseña?' : 'Inicia sesión' }}</h2>
          <p class="form-description">
            {{ isRegister
              ? 'Completa tus datos para crear una cuenta de usuario.'
              : isEmailSent
                ? 'Si la dirección está registrada, recibirás un enlace para restablecer tu contraseña. Revisa también tu carpeta de spam.'
              : isResetPassword
                ? 'Crea una contraseña nueva para volver a acceder a tu cuenta.'
                : isForgotPassword
                  ? 'Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.'
                : 'Accede a tu espacio de trabajo para continuar.' }}
          </p>
        </header>

        <form v-if="!isEmailSent" class="login-form" @submit.prevent="isRegister ? onRegister() : isResetPassword ? onResetPassword() : isForgotPassword ? onForgotPassword() : onSubmit()">
          <div v-if="isRegister" class="field">
            <label for="name">Nombres</label>
            <input
              id="name"
              v-model.trim="name"
              type="text"
              autocomplete="name"
              required
              maxlength="100"
              placeholder="Tus nombres"
            />
          </div>
          <div v-if="!isResetPassword" class="field">
            <label for="email">Correo electrónico</label>
            <input
              id="email"
              v-model.trim="email"
              type="email"
              autocomplete="username"
              required
              maxlength="254"
              placeholder="tu@ejemplo.com"
            />
          </div>
          <div v-if="!isForgotPassword || isResetPassword" class="field">
            <label for="password">{{ isResetPassword ? 'Nueva contraseña' : 'Contraseña' }}</label>
            <input
              id="password"
              v-model="password"
              type="password"
              :autocomplete="isRegister || isResetPassword ? 'new-password' : 'current-password'"
              required
              :minlength="isRegister || isResetPassword ? 6 : undefined"
              placeholder="••••••••"
            />
          </div>
          <div v-if="isRegister || isResetPassword" class="field">
            <label for="confirm-password">{{ isResetPassword ? 'Confirmar nueva contraseña' : 'Confirmar contraseña' }}</label>
            <input
              id="confirm-password"
              v-model="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              placeholder="••••••••"
            />
          </div>
          <div v-if="!isRegister && !isForgotPassword && !isResetPassword" class="forgot-row">
            <RouterLink to="/forgot-password">¿Olvidaste tu contraseña?</RouterLink>
          </div>
          <button class="submit-button" type="submit" :disabled="loading">
            <span>
              {{ loading
                ? (isRegister ? 'Creando cuenta...' : isResetPassword ? 'Restableciendo...' : isForgotPassword ? 'Enviando...' : 'Ingresando...')
                : (isRegister ? 'Crear cuenta' : isResetPassword ? 'Restablecer contraseña' : isForgotPassword ? 'Enviar código' : 'Entrar al sistema') }}
            </span>
            <svg v-if="!loading" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </button>
          <p v-if="error" class="error-message" role="alert">{{ error }}</p>
          <p v-if="successMessage" class="success-message" role="status">{{ successMessage }}</p>
        </form>

        <p class="register-prompt">
          <template v-if="isEmailSent">
            ¿No recibiste el correo? <RouterLink to="/forgot-password">Intentar de nuevo</RouterLink>
          </template>
          <template v-else-if="isRegister || isForgotPassword || isResetPassword">
            ¿Ya tienes una cuenta? <RouterLink to="/login">Inicia sesión</RouterLink>
          </template>
          <template v-else>
            ¿No tienes una cuenta? <RouterLink to="/register">Regístrate</RouterLink>
          </template>
        </p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { login, register, requestPasswordReset, resetPassword } from '../services/authService'
import './Login.css'

const route = useRoute()
const router = useRouter()
const isRegister = computed(() => route.path === '/register')
const isForgotPassword = computed(() => route.path === '/forgot-password')
const isEmailSent = computed(() => route.path === '/email-sent')
const isResetPassword = computed(() =>
  route.path === '/reset-password' || (route.path === '/login' && typeof route.query.token === 'string'),
)
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

function getResetToken(): string {
  const token = route.query.token
  return typeof token === 'string' ? token : ''
}

watch(() => [route.path, route.query.token], () => {
  error.value = null
  successMessage.value = null
  if (isResetPassword.value && !getResetToken()) {
    error.value = 'El enlace no contiene un código de restablecimiento válido. Solicita uno nuevo.'
  }
}, { immediate: true })

function roleHome(rol?: string) {
  return rol === 'ADMIN' ? '/admin' : '/dashboard'
}

async function onSubmit() {
  try {
    error.value = null
    loading.value = true
    const res = await login(email.value, password.value)
    const stored = res.user || JSON.parse(localStorage.getItem('user') || 'null')
    const fallback = roleHome(stored?.rol)
    const redirect = (route.query.redirect as string) || fallback
    router.replace(redirect)
  } catch (e: any) {
    error.value = e?.message || 'No se pudo iniciar sesión'
  } finally {
    loading.value = false
  }
}

async function onRegister() {
  error.value = null
  successMessage.value = null

  if (!name.value.trim()) {
    error.value = 'Ingresa tus nombres'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }

  if (password.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }

  try {
    loading.value = true
    await register({
      nombre: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
      rol: 'USUARIO',
    })
    successMessage.value = 'Cuenta creada correctamente. Serás redirigido al inicio de sesión.'
    window.setTimeout(() => {
      void router.replace('/login')
    }, 1800)
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || 'Error al registrar la cuenta. Inténtalo nuevamente.'
    console.error('Registration error:', e)
  } finally {
    loading.value = false
  }
}

async function onForgotPassword() {
  error.value = null
  successMessage.value = null

  try {
    loading.value = true
    await requestPasswordReset(email.value.trim())
    await router.replace('/email-sent')
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || 'No se pudo solicitar la recuperación. Inténtalo nuevamente.'
    console.error('Password recovery error:', e)
  } finally {
    loading.value = false
  }
}

async function onResetPassword() {
  error.value = null
  successMessage.value = null

  if (!getResetToken()) {
    error.value = 'El enlace no contiene un código de restablecimiento válido. Solicita uno nuevo.'
    return
  }

  if (password.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }

  try {
    loading.value = true
    await resetPassword(getResetToken(), password.value)
    successMessage.value = 'Tu contraseña se restableció correctamente. Serás redirigido al inicio de sesión.'
    window.setTimeout(() => {
      void router.replace('/login')
    }, 1800)
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || 'No se pudo restablecer la contraseña. Solicita un enlace nuevo e inténtalo nuevamente.'
    console.error('Password reset error:', e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: grid;
  grid-template-columns: minmax(0, 1.03fr) minmax(0, 0.97fr);
  min-height: 100vh;
  color: #10234a;
  background: #fff;
}

.login-story {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
  overflow: hidden;
  padding: 16px clamp(36px, 7vw, 96px) 22px;
  color: #fff;
  background-color: #142e68;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.055) 1px, transparent 1px),
    linear-gradient(115deg, #101f45, #1e3d83);
  background-size: 32px 32px, 32px 32px, auto;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  width: fit-content;
  color: inherit;
  text-decoration: none;
}

.brand-mark {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.13);
}

.brand-mark svg {
  width: 25px;
  height: 25px;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.brand-copy strong {
  font-size: 16px;
  font-weight: 750;
  line-height: 1.2;
}

.brand-copy small {
  font-size: 9px;
  letter-spacing: 1.2px;
  line-height: 1.5;
}

.brand-light .brand-copy small {
  color: #dbe6ff;
}

.story-copy {
  width: min(100%, 530px);
  margin: 26px 0;
}

.eyebrow {
  margin: 0 0 20px;
  color: #2ce5c3;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 2px;
}

.story-copy h1 {
  margin: 0;
  font-size: clamp(32px, 3vw, 38px);
  font-weight: 750;
  letter-spacing: -0.7px;
  line-height: 1.2;
}

.story-description {
  max-width: 480px;
  margin: 24px 0 0;
  color: #e2eaff;
  font-size: 16px;
  line-height: 1.8;
}

.story-features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 26px;
}

.story-features h2 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
}

.story-features p {
  margin: 0;
  color: #d5e1ff;
  font-size: 13px;
}

.login-panel {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 40px 32px;
}

.login-content {
  width: min(100%, 384px);
}

.brand-dark {
  color: #112447;
}

.brand-dark .brand-mark {
  width: 42px;
  height: 42px;
  color: #fff;
  background: #2860f5;
  box-shadow: 0 8px 18px rgba(40, 96, 245, 0.25);
}

.brand-dark .brand-copy small {
  color: #7183a4;
}

.form-heading {
  margin-top: 57px;
}

.welcome {
  margin: 0 0 10px;
  color: #00a98b;
  font-size: 13px;
}

.form-heading h2 {
  margin: 0;
  color: #10234a;
  font-size: 30px;
  font-weight: 750;
  letter-spacing: -0.5px;
  line-height: 1.25;
}

.form-description {
  margin: 10px 0 0;
  color: #7183a4;
  font-size: 13px;
}

.login-form {
  margin-top: 37px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 21px;
}

.field label {
  color: #10234a;
  font-size: 13px;
  font-weight: 600;
}

.field input {
  box-sizing: border-box;
  width: 100%;
  height: 46px;
  padding: 0 14px;
  border: 1px solid #d1def3;
  border-radius: 10px;
  outline: none;
  color: #10234a;
  background: #e9f0fd;
  font: inherit;
  font-size: 13px;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.field input:focus {
  border-color: #2860f5;
  box-shadow: 0 0 0 3px rgba(40, 96, 245, 0.13);
}

.field input::placeholder {
  color: #8291ad;
}

.forgot-row {
  margin-top: -9px;
  text-align: right;
}

.forgot-row a,
.register-prompt a {
  color: #1555ee;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
}

.forgot-row a:hover,
.register-prompt a:hover {
  text-decoration: underline;
}

.submit-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 46px;
  margin-top: 24px;
  border: 0;
  border-radius: 10px;
  color: #fff;
  background: #2860f5;
  box-shadow: 0 8px 16px rgba(40, 96, 245, 0.2);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  transition: background-color 160ms ease, transform 160ms ease;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #1d52e4;
}

.submit-button:disabled {
  cursor: wait;
  opacity: 0.75;
}

.submit-button svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.error-message {
  margin: 14px 0 0;
  color: #b42318;
  font-size: 13px;
}

.success-message {
  margin: 14px 0 0;
  color: #008767;
  font-size: 13px;
}

.register-prompt {
  margin: 28px 0 0;
  color: #8794aa;
  font-size: 12px;
  text-align: center;
}

.register-prompt a {
  font-size: inherit;
}

@media (max-width: 900px) {
  .login-page {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  }

  .login-story {
    padding-right: 36px;
    padding-left: 36px;
  }

  .story-copy h1 {
    font-size: clamp(28px, 4vw, 36px);
  }
}

@media (max-width: 700px) {
  .login-page {
    display: block;
  }

  .login-story {
    display: none;
  }

  .login-panel {
    min-height: 100vh;
    padding: 36px 24px;
  }

  .form-heading {
    margin-top: 48px;
  }
}

@media (max-height: 650px) and (min-width: 701px) {
  .login-panel {
    padding-top: 24px;
    padding-bottom: 24px;
  }

  .form-heading {
    margin-top: 32px;
  }

  .login-form {
    margin-top: 24px;
  }
}
</style>
