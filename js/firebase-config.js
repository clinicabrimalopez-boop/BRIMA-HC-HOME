// Configuración pública del cliente web de Firebase.
// No pongas aquí service-account keys, contraseñas ni claves privadas.
// Proyecto Firebase: brimahome-ba120.
export const firebaseConfig = {
  apiKey: "AIzaSyBgnCzI2ATWGBR1za42bv81BhmUf27gEbc",
  authDomain: "brimahome-ba120.firebaseapp.com",
  databaseURL: "https://brimahome-ba120-default-rtdb.firebaseio.com",
  projectId: "brimahome-ba120",
  storageBucket: "brimahome-ba120.firebasestorage.app",
  messagingSenderId: "316855396296",
  appId: "1:316855396296:web:7b40c8f20c7a20196782fd"
};

// El primer administrador se reclama una sola vez mediante el documento
// configuracion/admin_principal. La contraseña se administra exclusivamente
// por Firebase Authentication; nunca se guarda en documentos de BRIMA.
