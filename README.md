# Plataforma-Leads-FS-UIDE • Asesor Educativo & Prospección Fuera de Sede

Plataforma web institucional responsive (mobile-first) diseñada para el equipo de admisiones y asesores educativos de la **Universidad Internacional del Ecuador (UIDE)**.

Combina una **tarjeta digital interactiva** inspirada en la credencial física de lanyard con un **formulario de prospección in situ**, **CRUD completo de campañas**, soporte oficial para **Código de Campaña Salesforce (18 caracteres)** y exportación con las **21 cabeceras oficiales y Celdas F-G-H fijas** acorde a `FORMATO CARGA DE LEADS.xlsx`.
- 🎓 **Charla FS** (Charlas fuera de sede en colegios)
- 🎪 **Ferias FS** (Ferias vocacionales y colegiales)
- 🏛️ **Visita a campus** (Jornadas de puertas abiertas y visitas guiadas)

---

## Características Principales

1. **Identidad Visual UIDE & ASU:**
   - Colores oficiales: Azul Marino UIDE (`#002d72`), Vino Tinto (`#910048`), Oro/Amarillo ASU (`#EAAA00`).
   - Tipografía: Poppins y Nunito.
   - Header que replica la credencial física institucional: *"ASESOR EDUCATIVO - Powered by Arizona State University"*.
   - Vista tipo simulador de teléfono en pantallas de escritorio y 100% nativa responsive en móviles.

2. **Lógica CRM & Pardot Oficial:**
   - Cascada reactiva: Sede $\to$ Tipo de Programa $\to$ Modalidad $\to$ Carrera con todos los IDs numéricos oficiales de Pardot (`esc_pgm`).
   - Cálculo determinístico de periodo de inicio 2026 (`2026-2 Q Pregrado`, `2026-1 Presencial Posgrado`, `2026-2A Online Pregrado`, etc.).
   - Validación estricta de teléfono celular ecuatoriano (+593 con 9 dígitos, remoción de 0 inicial) y normalización a formato internacional.
   - Validación de cédula de identidad ecuatoriana (10 dígitos).
   - Checkbox obligatorio de consentimiento de tratamiento de datos personales conforme a la LOPDP ecuatoriana.
   - Envío asíncrono mediante `hidden_iframe` a Pardot sin recargas de página.

3. **Herramientas para Asesores en Eventos:**
   - **Selector rápido de evento:** Permite alternar entre *Charla FS*, *Ferias FS* y *Visita a campus* con un solo toque.
   - **Generador de Código QR:** Muestra en pantalla el QR con la URL y parámetros del asesor para que el estudiante escanee y se registre desde su propio móvil.
   - **Respaldo Local Offline:** Guarda automáticamente cada prospecto en `localStorage`, permitiendo trabajar sin conexión y descargar la lista en **Excel / CSV** al final del evento.
   - **Seguimiento por WhatsApp:** Botón con un clic para abrir chat de WhatsApp con un mensaje de bienvenida personalizado para el estudiante registrado.

---

## Estructura del Proyecto

```text
fs-platform/
├── index.html              # Aplicación SPA completa (Mobile-first, Pardot Form & Linktree)
├── package.json            # Metadatos del proyecto y scripts npm
├── robots.txt              # Directivas anti-indexación universales (Disallow: /)
├── .htaccess               # Cabeceras X-Robots-Tag y protección de datos en Apache/cPanel
├── web.config              # Cabeceras X-Robots-Tag y protección de datos en Windows IIS
├── iniciar-app.bat         # Script de arranque rápido local en Windows
├── assets/                 # Logotipo UIDE y foto credencial institucional
├── css/
│   └── styles.css          # Estilos institucionales UIDE, Glassmorphism y Responsive
├── js/
│   ├── advisor-auth.js     # Autenticación segura de asesores y gestión de PIN (2026)
│   ├── app.js              # Enrutamiento SPA, menú hamburguesa SVG, QR y perfiles
│   ├── leads-storage.js    # Respaldo de prospectos (LocalStorage + API sync + Exportación)
│   └── uide-form-logic.js  # Lógica CRM Pardot, cascadas de carreras, periodos 2026 y DataLayer
├── server/
│   ├── formatters.js       # Principios SOLID: Formateadores CSV, JSON y Markdown
│   ├── leads-service.js    # Servicio de persistencia y consulta de prospectos
│   └── security.js         # Aislamiento LOPDP y autenticación de endpoints
├── server.js               # Servidor HTTP Node.js nativo (Zero dependencias externas)
├── data/                   # Carpeta de persistencia protegida (JSON, CSV, Markdown)
└── test/
    ├── test_logic.js       # 13 suites de pruebas automatizadas (Teléfonos, Periodos, SOLID, etc.)
    └── verify.js           # Verificación estricta de 263 IDs del DOM en index.html
```

---

## 🚀 Despliegue en el Servidor de UIDE

El aplicativo está preparado para funcionar de inmediato bajo cualquiera de las siguientes modalidades de infraestructura institucional:

### Opción A: Alojamiento Web Estático (Apache / cPanel / IIS / Nginx / Subcarpeta)
Si el servidor UIDE es un hosting web tradicional:
1. Copiar toda la carpeta al directorio web (ej. `public_html/prospeccion/` o raíz del dominio).
2. El frontend (`index.html`) opera 100% de manera autónoma en el navegador:
   - Los formularios envían directamente los leads a Pardot en segundo plano.
   - El DataLayer captura los 13 campos analíticos.
   - Los leads quedan respaldados en el almacenamiento local del asesor (`localStorage`) con descarga en CSV, JSON y Markdown.
   - Las reglas de `.htaccess` y `web.config` impiden la indexación en Google (`noindex, nofollow`) y bloquean el acceso directo a la carpeta `/data/`.

### Opción B: Servidor de Aplicaciones Node.js (VPS / PM2 / Azure / cPanel Node App)
Si se desea habilitar la persistencia centralizada en disco y la API REST:
1. Subir la carpeta al servidor.
2. Iniciar el servidor mediante:
   ```bash
   npm start
   # o bien:
   node server.js
   ```
   *(El puerto se detecta automáticamente mediante `process.env.PORT` o usa el `8080` por defecto)*.
3. Para mantenerlo activo en producción como servicio:
   ```bash
   pm2 start server.js --name "uide-prospeccion"
   ```

---

## 🔒 Seguridad y Privacidad Garantizada (LOPDP & Anti-Indexación)
- **Anti-Indexación Total**: Protegido contra rastreo en 5 capas (`robots.txt`, metaetiquetas en HTML, cabeceras HTTP `X-Robots-Tag` en `server.js`, `.htaccess` y `web.config`).
- **Aislamiento de Prospectos**: Acceso a `/data/` restringido con HTTP 403 Forbidden y credenciales obligatorias (`x-advisor-pin`).
- **Clave de Acceso Asesor**: Clave por defecto `2026` / `UIDE2026`, con capacidad de cambio de PIN personalizado por cada asesor desde su panel de configuración.

---

## 🧪 Verificación y Pruebas

Para validar la integridad de la carpeta antes o después de subirla:

```bash
npm test
# o manualmente:
node test/verify.js
node test/test_logic.js
```
