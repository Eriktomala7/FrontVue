import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

const appElement = document.querySelector('#app')

if (!appElement) {
  throw new Error('No se encontró el elemento raíz "#app".')
}

createApp(App)
  .use(router)
  .mount(appElement)

  