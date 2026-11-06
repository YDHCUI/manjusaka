import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/global.scss'
import './styles/themes.scss'

import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

import { useAppStore } from './stores/app'
useAppStore(pinia).initTheme()

app.mount('#app')
