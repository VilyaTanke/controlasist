# ⛪ Control NVSR - Iglesia Nueva Vida de Soto del Real
### Sistema de Registro, Asistencia y Exportación a Excel

Aplicación web profesional diseñada para el control y registro de asistentes (Nuevos y Consolidados) de la **Iglesia Nueva Vida de Soto del Real**.

---

## 🌐 Despliegue en Dominio IONOS (checknvsr.lab-amprojs.es)

La aplicación cuenta con integración continua (CI/CD) automática mediante **GitHub Actions** hacia tu servidor VPS de IONOS.

### 1. Secretos requeridos en GitHub
En tu repositorio [https://github.com/VilyaTanke/controlasist/settings/secrets/actions](https://github.com/VilyaTanke/controlasist/settings/secrets/actions), añade los siguientes *Repository secrets*:

| Nombre del Secreto | Descripción |
|---|---|
| `IONOS_HOST` | Dirección IP o dominio de tu VPS IONOS |
| `IONOS_USER` | Usuario SSH (ej. `root` o tu usuario sudo) |
| `IONOS_SSH_KEY` | Clave privada SSH para conectar al servidor |
| `IONOS_PORT` | Puerto SSH (opcional, por defecto `22`) |

---

### 2. Configurar Nginx y Dominio en el VPS de IONOS

1. **DNS en IONOS**:
   En el panel de IONOS para `checknvsr.lab-amprojs.es`, asegúrate de que el registro **A** apunte a la IP de tu VPS.

2. **Crear archivo de Nginx en el servidor**:
   ```bash
   sudo nano /etc/nginx/sites-available/checknvsr.lab-amprojs.es
   ```
   Pega la configuración (incluida en `scripts/nginx-checknvsr.conf`):
   ```nginx
   server {
       listen 80;
       server_name checknvsr.lab-amprojs.es;

       location / {
           proxy_pass http://127.0.0.1:3005;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Activar el sitio y reiniciar Nginx**:
   ```bash
   sudo ln -sf /etc/nginx/sites-available/checknvsr.lab-amprojs.es /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

4. **Certificado SSL Gratuito (HTTPS)**:
   ```bash
   sudo certbot --nginx -d checknvsr.lab-amprojs.es
   ```

---

## 🌟 Características Principales

1. **Formulario Rápido y Adaptado a Móviles/Tablets**:
   - **Nombre y Apellidos**: Campo principal obligatorio.
   - **Teléfono**: Enlace directo a llamada y botón de **WhatsApp** con saludo de bienvenida precargado.
   - **Dirección**: Dirección del asistente o visitante.
   - **Cumpleaños**: Fecha de nacimiento para el registro de felicitaciones.
   - **Casilla de Selección (Nuevo o Consolidado)**: Selector visual grande y táctil.
   - **Fecha y Hora Automática**: Se captura y guarda en tiempo real.
   - **Observaciones**: Peticiones de oración, notas pastorales, ujier asignado.

2. **Exportación Idéntica a Excel (.xlsx)**:
   - Encabezado institucional exacto:
     - *Iglesia Nueva Vida de Soto del Real*
     - *Dirección: Calle del Prado, 15, 28791 Soto del Real, Madrid.*
     - *Horario de cultos: Domingos a las 18:00 h.*
     - *Pastores principales: Jorge Gámez Zúñiga y Carmen Vera Mendoza.*
   - **Dos formatos de descarga**:
     - 📄 **Formato Original Exacto**: `[Nombres, Telefono, Cumpleaños, Nuevo, Consolidado]`.
     - 📑 **Formato Completo**: Incluye `Fecha y Hora, Dirección, Observaciones`.

3. **Base de Datos Local Persistente (SQLite)**:
   - Se guarda en `data/control_nvsr.db`.
   - Funciona 100% offline.

---

## 🚀 Cómo Iniciar la Aplicación en Local

### Opción 1: Doble Clic en Windows
Doble clic en [iniciar.bat](file:///g:/proyectos/ControlNVSR/iniciar.bat) (puerto 3005).

### Opción 2: Terminal
```bash
npm start
```
