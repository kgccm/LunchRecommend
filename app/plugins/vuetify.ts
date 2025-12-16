import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    ssr: true,
    components,
    directives,
    theme: {
      defaultTheme: "light",
      themes: {
        light: {
          dark: false,
          colors: {
            primary: "#FF5722", // Deep Orange
            secondary: "#26A69A", // Teal Lighten-1
            accent: "#FFC107", // Amber
            error: "#FF5252",
            info: "#2196F3",
            success: "#4CAF50",
            warning: "#FB8C00",
            background: "#F5F5F5", // Light Grey background
            surface: "#FFFFFF",
          },
        },
      },
    },
    defaults: {
      VCard: {
        elevation: 2,
        rounded: "lg",
      },
      VBtn: {
        rounded: "lg",
        fontWeight: "bold",
      },
      VTextField: {
        variant: "outlined",
        density: "comfortable",
        color: "primary",
      },
    },
  });

  nuxtApp.vueApp.use(vuetify);
});
