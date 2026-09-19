# Passkeys en el frontend

- Login: «Ingresar con mi dispositivo», sin solicitar usuario. Comparte el manejador de sesión y el selector de sucursal con contraseña y patrón; el `pre_token` solo se utiliza al seleccionar sucursal.
- Administración → Passkeys (`/administracion/passkeys`): registro, listado y revocación de credenciales propias para administradores y vendedores.
- La contraseña de confirmación se lee del formulario y se borra al enviar; no se guarda en el store ni en la caché de mutaciones.
- Cada reintento inicia nuevas opciones WebAuthn. El login público no adjunta JWT ni dispara refresh al ser rechazado.

## Configuración

`VITE_API_URL` debe incluir el prefijo `/api` del backend. No se necesitan dependencias adicionales ni variables WebAuthn en el frontend. Configurar en el backend `WEBAUTHN_RP_ID` con el dominio del frontend y `WEBAUTHN_ORIGINS` con su origen exacto, incluido el puerto local. Usar HTTPS en producción o localhost para desarrollo. El listado espera el array de credenciales indicado en el contrato (`id`, `nombre` opcional).

La conversión de challenge, usuario, IDs y respuestas usa base64url y ArrayBuffer para navegadores que no incluyen los métodos JSON recientes de WebAuthn. Se conserva la configuración de verificación de usuario enviada por el servidor. Referencia: https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API

## Validación manual con backend y dispositivos reales

1. Entrar con contraseña y registrar una passkey con nombre y contraseña actual.
2. Comprobar rechazo de contraseña incorrecta y cancelación del diálogo del dispositivo; reintentar.
3. Cerrar sesión e ingresar con dispositivo sin escribir usuario.
4. Probar administrador, vendedor con sucursal única y vendedor con varias sucursales.
5. Revocar una passkey, cerrar sesión y comprobar que ya no permite ingresar; comprobar acceso con contraseña.
6. Probar en los teléfonos y laptops objetivo sobre HTTPS, incluyendo credenciales sincronizadas.

Las pruebas unitarias simulan el navegador y HTTP; no verifican biometría física ni la configuración del backend desplegado.
