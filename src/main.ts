import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { router } from '@/router'
import { vuetify } from '@/plugins/vuetify'
import App from '@/App.vue'
import '@/styles/main.scss'

createApp(App)
    .use(createPinia())
    .use(router)
    .use(vuetify).mount('#app')
