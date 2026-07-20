import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'

// SVG icon set (@mdi/js): only the icons we actually import are bundled, instead
// of shipping the full ~1.3 MB Material Design Icons webfont.
//
// A light, GitHub-flavored theme. Component defaults keep the UI consistent
// without repeating props on every instance.
export const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1f2328',
          secondary: '#0969da',
          surface: '#ffffff',
          background: '#f6f8fa',
          error: '#cf222e',
          warning: '#9a6700',
          success: '#1a7f37',
        },
      },
    },
  },
  defaults: {
    VCard: { rounded: 'lg' },
    VBtn: { rounded: 'lg' },
    VTextField: { variant: 'outlined', density: 'comfortable' },
  },
})
