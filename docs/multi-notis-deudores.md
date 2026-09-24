# Varios horarios para avisos de deudores

El administrador puede añadir horarios con **+**, quitar los adicionales y guardar
la programación. Los horarios usan `America/Guatemala`, se ordenan al guardar y
no admiten duplicados. Los días globales y los días de cada cliente se mantienen.

La tarea consulta los saldos actuales en cada envío. Un aviso exitoso cubre los
horarios vencidos hasta esa revisión; no vuelve a enviarlos al reiniciar. Si la
tarea estuvo detenida, envía un solo resumen actualizado en lugar de acumular
varios correos atrasados. Si el envío falla o no hay clientes elegibles, no se
marca como enviado y puede reintentarse.

La opción de horario por defecto conserva un envío por día al ejecutarse la tarea.
Para probar a una hora concreta, selecciona **Elegir horarios**.

## Despliegue en PythonAnywhere

1. Pausar temporalmente la tarea Always-on y esperar a que termine.
2. Desplegar el backend de `feature/MultiNotisDeudores`.
3. Aplicar la migración con el entorno de producción:

   ```bash
   cd "$HOME/backend-tipicos"
   .venv/bin/python manage.py migrate
   ```

4. Recargar la aplicación web del backend en PythonAnywhere.
5. Desplegar el frontend de la misma rama.
6. Iniciar la tarea Always-on con el mismo comando:

   ```bash
   cd $HOME/backend-tipicos && $HOME/backend-tipicos/.venv/bin/python -u manage.py notificar_cobros --continuo
   ```

La tarea diaria anterior de producción debe permanecer pausada.
La revisión sigue siendo cada 60 segundos.

## Prueba hoy

La migración conserva la hora anterior. Si ya se envió un aviso hoy, usa el
momento de la migración como corte para evitar repetir horarios anteriores;
los nuevos horarios posteriores sí pueden ejecutarse hoy.

1. Habilitar el día actual en la programación global.
2. Comprobar que haya un cliente activo con saldo pendiente y ese día marcado.
3. Añadir una hora dos o tres minutos en el futuro, en Guatemala, y guardar.
4. Confirmar `Running` y revisar el log de la tarea y el correo destinatario.
5. Añadir otra hora posterior para comprobar el segundo envío del día.

Guardar una hora que ya pasó puede provocar un envío en la siguiente revisión
si es posterior al último envío registrado. Para pruebas predecibles, usar
siempre una hora futura.

## Compatibilidad

La API acepta `horas_notificacion: ["07:15", "12:00"]`. El campo anterior
`hora_notificacion` sigue disponible; escribirlo sustituye la lista por esa
única hora. No se deben enviar ambos campos en una misma petición.

El control usa `ultimo_envio`, además de conservar `ultima_fecha_envio` para
los consumidores existentes. Las pruebas usan base de datos aislada y correo
simulado; no se enviaron avisos ni se migraron datos de producción.
