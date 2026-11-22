/* Avisos push (p. ej. «un vendedor entró al sistema»). Lo importa el service worker de la PWA. */

self.addEventListener('push', (event) => {
  let datos = {}
  try {
    datos = event.data ? event.data.json() : {}
  } catch {
    datos = { body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    self.registration.showNotification(datos.title || 'SalesNet', {
      body: datos.body || '',
      icon: '/icons/pwa-192.png',
      badge: '/favicon-32.png',
      // Un aviso nuevo del mismo vendedor reemplaza al anterior en vez de acumularse.
      tag: datos.tag,
      data: { url: datos.url || '/' },
    }),
  )
})

// Al tocar el aviso: enfoca la app abierta y la lleva a la pantalla del aviso, o la abre.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      for (const ventana of ventanas) {
        if ('focus' in ventana) {
          return ventana.navigate(url).then((v) => (v || ventana).focus())
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
