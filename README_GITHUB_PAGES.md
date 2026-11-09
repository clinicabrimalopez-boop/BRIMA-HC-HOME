# BRIMA HC HOME 0.3.17 — GitHub Pages

Este paquete contiene únicamente el sitio web estático de BRIMA HC HOME.
`index.html` está en la raíz para que GitHub Pages pueda publicarlo desde `main / (root)`.

## Publicar
1. Crea un repositorio en GitHub.
2. Sube **todo el contenido** de este ZIP a la raíz del repositorio (incluidos `index.html`, `css/`, `js/`, `icons/` y `.nojekyll`).
3. En Settings > Pages, selecciona Deploy from a branch, branch `main`, folder `/(root)`, y guarda.
4. En Firebase Console > Authentication > Settings > Authorized domains, agrega el dominio `TU-USUARIO.github.io` (sin https ni ruta).

## Importante
- Este paquete no contiene bases de datos ni exportaciones de pacientes.
- Conserva la configuración cliente existente de Firebase en `js/firebase-config.js`; no se han cambiado proyecto, credenciales cliente ni código funcional.
- No contiene reglas ni índices de Firestore y no los publica ni modifica.
- La configuración cliente de Firebase es visible en una aplicación web. La seguridad debe aplicarse mediante Firebase Authentication y reglas de Firebase; nunca incluyas claves privadas o service-account.
- GitHub Pages solo aloja archivos estáticos. No ejecuta Python ni un servidor.
