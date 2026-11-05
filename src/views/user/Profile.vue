<template>
  <section class="profile-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">CUENTA PERSONAL</p>
        <h2>Mi perfil</h2>
        <p class="page-description">Administra tu información y mantén segura tu cuenta.</p>
      </div>
    </header>

    <div class="profile-grid">
      <section class="profile-card" aria-labelledby="profile-card-title">
        <header class="card-heading">
          <div>
            <span class="card-kicker">TU ESPACIO</span>
            <h3 id="profile-card-title">Información personal</h3>
          </div>
          <span class="card-heading-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
          </span>
        </header>

        <div class="profile-banner">
          <span class="banner-decoration banner-decoration-one" aria-hidden="true"></span>
          <span class="banner-decoration banner-decoration-two" aria-hidden="true"></span>
          <div class="profile-avatar" aria-hidden="true">{{ initials }}</div>
          <div class="banner-copy">
            <span>PERFIL DE USUARIO</span>
            <strong>{{ user?.rol === 'ADMIN' ? 'Administrador' : 'Colaborador' }}</strong>
          </div>
          <span class="account-status"><span></span> Sesión activa</span>
        </div>

        <form class="profile-form" @submit.prevent="saveProfile">
          <div class="section-label">
            <h4>Datos de la cuenta</h4>
            <p>Actualiza el nombre que aparece en tu espacio de trabajo.</p>
          </div>

          <label class="form-field">
            <span>Nombre completo</span>
            <span class="input-wrap">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
              <input v-model.trim="name" type="text" autocomplete="name" maxlength="100" required :disabled="savingProfile" />
            </span>
          </label>

          <label class="form-field">
            <span>Correo electrónico <small>Solo lectura</small></span>
            <span class="input-wrap readonly">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
              <input :value="user?.email || ''" type="email" autocomplete="email" readonly />
              <svg class="lock-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
            </span>
            <small class="field-hint">Para cambiar tu correo, comunícate con el administrador.</small>
          </label>

          <p v-if="profileError" class="feedback error-feedback" role="alert">{{ profileError }}</p>
          <p v-if="profileSuccess" class="feedback success-feedback" role="status">{{ profileSuccess }}</p>

          <footer class="form-footer">
            <span class="save-note">Tus datos solo son visibles para ti y los administradores.</span>
            <button class="primary-button" type="submit" :disabled="savingProfile || !hasProfileChanges">
              <svg v-if="!savingProfile" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 4h12l3 3v13H4V4h1Z" /><path d="M8 4v6h8V4m-8 16v-6h8v6" /></svg>
              <span v-else class="button-spinner" aria-hidden="true"></span>
              {{ savingProfile ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </footer>
        </form>
      </section>

      <section class="security-card" aria-labelledby="security-title">
        <header class="card-heading">
          <div>
            <span class="card-kicker">PROTECCIÓN</span>
            <h3 id="security-title">Seguridad de la cuenta</h3>
          </div>
          <span class="security-heading-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></svg>
          </span>
        </header>

        <div class="security-content">
          <div class="security-intro">
            <span class="security-art" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none"><path d="M24 5 39 11v10c0 10-6.2 17.2-15 21-8.8-3.8-15-11-15-21V11l15-6Z" /><path d="m17 23 5 5 10-11" /></svg>
            </span>
            <div>
              <h4>Protege tu contraseña</h4>
              <p>Solicita un enlace seguro para restablecerla. Así verificamos tu identidad antes de guardar una nueva contraseña.</p>
            </div>
          </div>

          <div class="security-divider"></div>

          <div class="security-email">
            <span class="email-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
            </span>
            <div>
              <span>Enviaremos las instrucciones a</span>
              <strong>{{ user?.email || 'Correo no disponible' }}</strong>
            </div>
          </div>

          <p v-if="passwordError" class="feedback error-feedback" role="alert">{{ passwordError }}</p>
          <p v-if="passwordSuccess" class="feedback success-feedback" role="status">{{ passwordSuccess }}</p>

          <button class="security-button" type="button" @click="sendPasswordReset" :disabled="sendingReset || !user?.email">
            <span v-if="sendingReset" class="button-spinner" aria-hidden="true"></span>
            <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12a8 8 0 1 1 2.3 5.7M4 17v-5h5m3-5v5l3 2" /></svg>
            {{ sendingReset ? 'Enviando instrucciones...' : 'Restablecer contraseña' }}
          </button>

          <p class="security-footnote">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></svg>
            Si no recibes el correo, revisa tu carpeta de spam.
          </p>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getCurrentUser, requestPasswordReset, updateCurrentUser, type User } from '../../services/authService'
import { updateUsuario } from '../../services/usersService'

const user = ref<User | null>(getCurrentUser())
const name = ref(user.value?.nombre || '')
const originalName = ref(name.value)
const savingProfile = ref(false)
const profileError = ref<string | null>(null)
const profileSuccess = ref<string | null>(null)
const sendingReset = ref(false)
const passwordError = ref<string | null>(null)
const passwordSuccess = ref<string | null>(null)

const hasProfileChanges = computed(() => name.value.trim() !== originalName.value)
const initials = computed(() => {
  const parts = (user.value?.nombre || 'U').trim().split(/\s+/)
  const first = parts[0] ?? ''
  const last = parts[parts.length - 1] ?? ''
  return parts.length > 1
    ? `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    : first.charAt(0).toUpperCase() || 'U'
})

async function saveProfile() {
  const currentUser = user.value
  const nextName = name.value.trim()
  const id = Number(currentUser?.id)

  if (!currentUser || !Number.isInteger(id) || id <= 0) {
    profileError.value = 'No se encontró una cuenta válida para guardar los cambios.'
    return
  }
  if (!nextName) {
    profileError.value = 'Escribe tu nombre para continuar.'
    return
  }
  if (!hasProfileChanges.value) return

  try {
    savingProfile.value = true
    profileError.value = null
    profileSuccess.value = null
    const updatedUser = await updateUsuario(id, { nombre: nextName })
    const nextUser = { ...currentUser, nombre: updatedUser.nombre || nextName }
    updateCurrentUser(nextUser)
    user.value = nextUser
    name.value = nextUser.nombre
    originalName.value = nextUser.nombre
    profileSuccess.value = 'Tu nombre se actualizó correctamente.'
  } catch (cause: unknown) {
    console.error(cause)
    profileError.value = cause instanceof Error ? cause.message : 'No se pudieron guardar los cambios.'
  } finally {
    savingProfile.value = false
  }
}

async function sendPasswordReset() {
  const email = user.value?.email
  if (!email) {
    passwordError.value = 'No hay un correo asociado a esta cuenta.'
    return
  }

  try {
    sendingReset.value = true
    passwordError.value = null
    passwordSuccess.value = null
    await requestPasswordReset(email)
    passwordSuccess.value = 'Si el correo está registrado, recibirás las instrucciones para restablecer tu contraseña.'
  } catch (cause: unknown) {
    console.error(cause)
    passwordError.value = cause instanceof Error ? cause.message : 'No se pudo enviar el correo. Inténtalo de nuevo.'
  } finally {
    sendingReset.value = false
  }
}
</script>

<style scoped>
.profile-page { width: min(100%, 1040px); margin: 0 auto; }
.page-heading { margin: 4px 0 20px; }
.eyebrow { margin: 0 0 6px; color: #2860f5; font-size: 9px; font-weight: 750; letter-spacing: 1.35px; }
.page-heading h2 { margin: 0; color: #10234a; font-size: 23px; font-weight: 750; letter-spacing: -.45px; }
.page-description { margin: 6px 0 0; color: #7183a4; font-size: 11px; line-height: 1.55; }
.profile-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.08fr); align-items: start; gap: 16px; }
.profile-card, .security-card { overflow: hidden; border: 1px solid #e0e8f4; border-radius: 11px; background: #fff; box-shadow: 0 5px 18px rgba(24, 48, 91, .035); }
.card-heading { display: flex; min-height: 65px; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 19px; border-bottom: 1px solid #edf1f7; }
.card-kicker { display: block; margin-bottom: 4px; color: #8795ad; font-size: 8px; font-weight: 700; letter-spacing: 1px; }
.card-heading h3 { margin: 0; color: #10234a; font-size: 13px; font-weight: 700; }
.card-heading-icon, .security-heading-icon { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; border-radius: 9px; color: #2860f5; background: #edf3ff; }
.card-heading-icon svg, .security-heading-icon svg { width: 17px; height: 17px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.6; }
.security-heading-icon { color: #188a71; background: #e9f7f2; }
.profile-banner { position: relative; display: flex; min-height: 91px; align-items: center; gap: 12px; overflow: hidden; padding: 13px 19px; background: linear-gradient(110deg, #f2f6ff 0%, #f8faff 62%, #eef3ff 100%); }
.banner-decoration { position: absolute; border: 1px solid rgba(80, 125, 224, .12); border-radius: 50%; pointer-events: none; }
.banner-decoration-one { top: -80px; right: 30px; width: 170px; height: 170px; }
.banner-decoration-two { top: -115px; right: -60px; width: 200px; height: 200px; background: rgba(255,255,255,.35); }
.profile-avatar { position: relative; z-index: 1; display: grid; width: 50px; height: 50px; flex: 0 0 50px; place-items: center; border: 3px solid #fff; border-radius: 15px; color: #fff; background: linear-gradient(145deg, #2860f5, #7295f4); box-shadow: 0 3px 9px rgba(27, 74, 191, .16); font-size: 17px; font-weight: 750; }
.banner-copy { position: relative; z-index: 1; display: flex; flex: 1; flex-direction: column; gap: 5px; }
.banner-copy span { color: #8190aa; font-size: 8px; font-weight: 700; letter-spacing: 1px; }
.banner-copy strong { color: #263b5c; font-size: 12px; font-weight: 700; }
.account-status { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 5px; padding: 5px 8px; border: 1px solid #d7eee4; border-radius: 999px; color: #24815e; background: rgba(255,255,255,.8); font-size: 8px; font-weight: 650; white-space: nowrap; }
.account-status span { width: 5px; height: 5px; border-radius: 50%; background: #2aaa77; }
.profile-form { padding: 19px; }
.section-label { margin-bottom: 16px; }
.section-label h4 { margin: 0; color: #263b5c; font-size: 12px; font-weight: 700; }
.section-label p { margin: 5px 0 0; color: #8290a8; font-size: 9px; line-height: 1.5; }
.form-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; color: #405574; font-size: 10px; font-weight: 650; }
.form-field > span:first-child { display: flex; align-items: center; justify-content: space-between; }
.form-field > span:first-child small { color: #96a3b7; font-size: 8px; font-weight: 500; }
.input-wrap { display: flex; min-height: 38px; align-items: center; gap: 9px; padding: 0 10px; border: 1px solid #dce5f1; border-radius: 7px; color: #8290a8; background: #fff; transition: border-color 140ms ease, box-shadow 140ms ease; }
.input-wrap:focus-within:not(.readonly) { border-color: #7193ed; box-shadow: 0 0 0 3px rgba(40, 96, 245, .09); }
.input-wrap > svg { width: 15px; height: 15px; flex: 0 0 15px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }
.input-wrap input { width: 100%; min-width: 0; height: 35px; padding: 0; border: 0; outline: 0; color: #263b5c; background: transparent; font: inherit; font-size: 10px; font-weight: 500; }
.input-wrap.readonly { border-color: #e5eaf2; color: #a1adc0; background: #f7f9fc; }
.input-wrap.readonly input { color: #75849c; }
.input-wrap .lock-icon { width: 13px; height: 13px; color: #98a6bc; }
.field-hint { display: block; color: #929fb3; font-size: 8px; font-weight: 400; }
.form-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 19px; padding-top: 15px; border-top: 1px solid #edf1f7; }
.save-note { max-width: 210px; color: #929fb3; font-size: 8px; line-height: 1.5; }
.primary-button, .security-button { display: inline-flex; min-height: 36px; align-items: center; justify-content: center; gap: 7px; padding: 0 12px; border: 1px solid #2860f5; border-radius: 7px; color: #fff; background: #2860f5; box-shadow: 0 3px 8px rgba(40, 96, 245, .13); cursor: pointer; font: inherit; font-size: 10px; font-weight: 650; white-space: nowrap; transition: background-color 140ms ease, box-shadow 140ms ease; }
.primary-button:hover:not(:disabled), .security-button:hover:not(:disabled) { background: #174fe0; box-shadow: 0 5px 12px rgba(40, 96, 245, .2); }
.primary-button:disabled, .security-button:disabled { border-color: #c8d4e8; color: #fff; background: #b6c5df; box-shadow: none; cursor: not-allowed; }
.primary-button svg, .security-button svg { width: 14px; height: 14px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.7; }
.security-content { padding: 22px 20px 19px; }
.security-intro { display: flex; align-items: center; gap: 13px; }
.security-art { display: grid; width: 58px; height: 58px; flex: 0 0 58px; place-items: center; border: 1px solid #e1eee9; border-radius: 16px; color: #229376; background: linear-gradient(145deg, #f1faf6, #e7f5ef); }
.security-art svg { width: 34px; height: 34px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }
.security-intro h4 { margin: 0; color: #263b5c; font-size: 12px; font-weight: 700; }
.security-intro p { margin: 6px 0 0; color: #7183a4; font-size: 9px; line-height: 1.65; }
.security-divider { height: 1px; margin: 19px 0; background: #edf1f7; }
.security-email { display: flex; align-items: center; gap: 10px; min-height: 53px; padding: 9px 11px; border: 1px solid #e7edf6; border-radius: 8px; background: #fafbfe; }
.email-icon { display: grid; width: 30px; height: 30px; flex: 0 0 30px; place-items: center; border-radius: 8px; color: #6280c1; background: #edf2fc; }
.email-icon svg { width: 15px; height: 15px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }
.security-email > div { display: flex; min-width: 0; flex-direction: column; gap: 4px; }
.security-email > div span { color: #8290a8; font-size: 8px; }
.security-email strong { overflow: hidden; color: #344a6b; font-size: 10px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
.security-button { width: 100%; min-height: 38px; margin-top: 14px; }
.security-button:disabled { border-color: #c8d4e8; }
.security-footnote { display: flex; align-items: flex-start; gap: 6px; margin: 12px 0 0; color: #929fb3; font-size: 8px; line-height: 1.5; }
.security-footnote svg { width: 12px; height: 12px; flex: 0 0 12px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }
.feedback { margin: 8px 0; padding: 9px 10px; border: 1px solid; border-radius: 7px; font-size: 9px; line-height: 1.5; }
.error-feedback { border-color: #f4c7c7; color: #a53636; background: #fff5f4; }
.success-feedback { border-color: #ccebdd; color: #187451; background: #f2fbf6; }
.button-spinner { width: 13px; height: 13px; border: 2px solid rgba(255,255,255,.5); border-top-color: #fff; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.primary-button:focus-visible, .security-button:focus-visible { outline: 3px solid rgba(40, 96, 245, .25); outline-offset: 2px; }

@media (max-width: 760px) {
  .profile-grid { grid-template-columns: minmax(0, 1fr); }
  .security-content { padding: 19px; }
}

@media (max-width: 440px) {
  .page-heading h2 { font-size: 21px; }
  .card-heading { padding-right: 15px; padding-left: 15px; }
  .profile-banner { padding-right: 14px; padding-left: 14px; }
  .profile-form { padding: 16px 15px; }
  .form-footer { align-items: flex-start; flex-direction: column; }
  .save-note { max-width: none; }
  .primary-button { align-self: stretch; }
  .security-intro { align-items: flex-start; }
  .security-art { width: 48px; height: 48px; flex-basis: 48px; border-radius: 13px; }
  .security-art svg { width: 29px; height: 29px; }
}

@media (prefers-reduced-motion: reduce) {
  .input-wrap, .primary-button, .security-button { transition: none; }
  .button-spinner { animation-duration: 1.8s; }
}
</style>
