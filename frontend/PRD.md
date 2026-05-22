# **PRD & Specs: Sistema de Control de Gimnasios (GymControl MVP)**

Este documento sirve como la única fuente de verdad (Single Source of Truth) para el desarrollo guiado por especificaciones (Spec-Driven Development) del MVP de control de accesos, asistencia y retención de clientes.

## **1\. Visión General del Producto (PRD)**

### **Objetivo del MVP**

Crear una plataforma web totalmente responsiva y adaptada para PC, tablets y smartphones. Permite a los dueños de gimnasios registrar socios, controlar accesos escaneando un código QR en recepción y recuperar automáticamente clientes en riesgo de abandono. El sistema está optimizado tanto para pantallas grandes en computadoras de escritorio de administración como para interfaces táctiles en tablets o celulares de recepción.

### **Usuarios Clave (Personas)**

1. **Administrador/Recepcionista (Gimnasio):** Gestiona los socios, visualiza métricas de asistencia y opera la pantalla de escaneo en recepción desde una PC de escritorio o una tablet.  
2. **Socio (Cliente):** Posee una tarjeta digital en su celular con un código QR para ingresar al gimnasio.

### **Alcance del MVP (Fase 1\)**

* **Gestión de Socios:** Registro básico con foto (vía cámara del dispositivo o URL), plan, fecha de vencimiento y generación de QR único.  
* **Control de Accesos (Recepción):** Interfaz para escanear el código QR del socio (usando la cámara de la tablet, celular o webcam de la PC) con feedback visual inmediato (Verde \= Permitido, Rojo \= Denegado/Vencido).  
* **Módulo de Retención:** Lista automática de "Socios en Riesgo" (socios frecuentes que llevan más de ![][image1] sin asistir).  
* **Métricas Básicas:** Gráfico simple de concurrencia por hora para identificar horas muertas.

## **2\. Arquitectura de Datos (Supabase Schema)**

Utilizaremos una base de datos relacional simple en Supabase con dos tablas principales: socios y asistencias.

### **Tabla 1: socios**

Guarda la información de membresía y perfil de cada persona.

| Columna | Tipo de Datos | Restricciones | Descripción |
| :---- | :---- | :---- | :---- |
| id | uuid | PRIMARY KEY, DEFAULT gen\_random\_uuid() | Identificador único del socio. Usado en el QR. |
| dni | text | UNIQUE, NOT NULL | Documento de identidad. |
| nombre | text | NOT NULL | Nombre completo del socio. |
| telefono | text |  | WhatsApp/Celular de contacto. |
| foto\_url | text |  | URL de la foto de perfil (almacenada en Supabase Storage o marcador de posición). |
| plan\_nombre | text | NOT NULL | Nombre del plan (ej. "Mensual", "Trimestral"). |
| plan\_precio | numeric | NOT NULL | Costo del plan en bolivianos (![][image2]). |
| fecha\_inicio | date | NOT NULL | Fecha de inicio de la membresía. |
| fecha\_vencimiento | date | NOT NULL | Fecha de expiración de la membresía. |
| activo | boolean | DEFAULT true | Estado manual de cuenta. |
| creado\_at | timestamp | DEFAULT now() | Fecha de registro en el sistema. |

### **Tabla 2: asistencias**

Registra cada entrada del socio para alimentar las estadísticas y el algoritmo de retención.

| Columna | Tipo de Datos | Restricciones | Descripción |
| :---- | :---- | :---- | :---- |
| id | bigint | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | ID único del registro. |
| socio\_id | uuid | FOREIGN KEY \-\> socios.id ON DELETE CASCADE | ID del socio que ingresa. |
| fecha\_hora | timestamp | DEFAULT now() | Fecha y hora exacta de la entrada. |

## **3\. Estructura de Rutas y Pantallas (Next.js App Router)**

El frontend estará construido bajo la carpeta /frontend usando Tailwind CSS y se dividirá en las siguientes vistas táctiles y responsivas (diseñadas con una barra lateral persistente en PC y un menú colapsable en móviles):

/frontend/app/  
├── layout.tsx              \# Estructura global (Sidebar adaptativo para PC, Bottom Nav o menú hamburguesa para móviles)  
├── page.tsx                \# Dashboard principal (Métricas, Concurrencia, Socios Activos)  
├── socios/  
│   ├── page.tsx            \# Lista de socios con buscador, filtros (Activos/Vencidos) y vista de tabla amplia en PC  
│   └── nuevo/  
│       └── page.tsx        \# Formulario de creación de socio con captura de foto (webcam integrada)  
├── control/  
│   └── page.tsx            \# Pantalla de recepción: Escáner QR (webcam/cámara frontal) y feedback visual a pantalla completa  
├── retencion/  
│   └── page.tsx            \# Listado de clientes valiosos en riesgo de abandono (\> 14 días sin asistir)  
└── socio/  
    └── \[id\]/  
        └── page.tsx        \# Vista del carnet digital pública (diseño móvil para guardar en el celular)

## **4\. Arquitectura y Estrategia de Despliegue (Serverless)**

### **Estructura Monorrepo**

El proyecto se mantiene exclusivamente bajo la carpeta /frontend debido a que adoptamos una arquitectura Serverless. Supabase actúa como el backend en la nube ya listo, eliminando la necesidad de programar y mantener un servidor tradicional en local.

### **Flujo de Comunicación**

El código de Next.js en el cliente realiza peticiones HTTPS directas a las APIs automáticas de Supabase usando el SDK @supabase/supabase-js y las variables de entorno de manera segura.

### **Estrategia de Despliegue**

* **Frontend:** Se desplegará en Vercel apuntando directamente a la subcarpeta /frontend. Vercel generará el enlace público para los clientes.  
* **Variables de Entorno:** Las variables NEXT\_PUBLIC\_SUPABASE\_URL y NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY se cargarán en el panel de configuración de variables de entorno en Vercel durante el despliegue para asegurar la conexión en producción.

## **5\. Plan de Ejecución de Spec-Driven Development**

Dividiremos la construcción en **5 hitos incrementales**. No pasaremos al siguiente hasta que el anterior esté completamente validado.

### **Hito 1: Infraestructura de Conexión y Base de Datos (¡NUESTRO PASO ACTUAL\!)**

1. Crear el cliente de conexión en /frontend/lib/supabaseClient.ts.  
2. Generar y ejecutar el script SQL en la consola de Supabase para crear las tablas socios and asistencias con datos de prueba.  
3. Validar la conexión exitosa imprimiendo datos en la consola durante el desarrollo.

### **Hito 2: Gestión de Socios y Carnet Digital**

1. Diseñar el formulario de registro (/socios/nuevo) para guardar socios en la base de datos con captura de cámara integrada.  
2. Desarrollar la vista del carnet digital del socio (/socio/\[id\]) que renderice su foto, su estado y un código QR generado dinámicamente con su id (UUID).

### **Hito 3: Pantalla de Recepción y Control de Accesos**

1. Implementar la interfaz de escaneo /control que utilice la webcam/cámara del dispositivo para leer el QR del socio.  
2. Desarrollar la lógica de verificación:  
   * Si la fecha actual es menor o igual a fecha\_vencimiento, registrar asistencia en la DB y mostrar pantalla **Verde (ACCESO CONCEDIDO)** con su foto.  
   * Si está vencido, mostrar pantalla **Roja (ACCESO DENEGADO \- VENCIDO)**.

### **Hito 4: Dashboard y Módulo de Retención**

1. Desarrollar la lógica del algoritmo de retención en /retencion para listar usuarios cuya última asistencia registrada sea ![][image3] atrás.  
2. Crear los gráficos básicos en la página principal (/page.tsx) usando datos reales de la tabla asistencias con un diseño de cuadrícula (Grid) fluido para PC.

### **Hito 5: Despliegue y Pruebas**

1. Preparar la aplicación para producción.  
2. Configurar el acceso rápido en recepción agregando un acceso directo en la pantalla de inicio del celular/tablet (PWA básica).

## **6\. Criterios de Aceptación para el Hito 1**

Para dar por concluido el **Hito 1**, debemos asegurar que:

* supabaseClient.ts inicialice correctamente el cliente usando NEXT\_PUBLIC\_SUPABASE\_URL y NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY.  
* Las tablas socios y asistencias estén creadas en la base de datos de Supabase con los tipos de datos correctos y las relaciones (Foreign Keys) funcionales.  
* Tengamos un script de SQL listo para ejecutar en el editor de consultas de Supabase con datos ficticios para pruebas de lectura rápidas.

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD0AAAAlCAYAAADx5+EfAAAD9UlEQVR4Xu2X+09PcRjH+09KYhaVii5oXUQluRVFdLOmi1TuKbq5JXQRhZRKYchEK9eichmzYcZsZmPYXOY2jF8e5/3YOc4t59t812zn/PDet3PO83nO5/X5PM/7c3I4duMnmU0O6htmkAVtFlnQZpEFPZw6ev0HNVx4Q809H/WfXXxLrf3fNM/sIQ10bcczytvVrgnU08bqTkpYXqq5b6Ts4gZydHRkpeXVaJ7nV54lJ6cRlFVYr3lmDzF09clHwkQaKWRGLL9s3pIcTaBaWBzPiVNsitVTzekn5OrmqYGuOvGQxrp5UXRCLjX3ftKMs4ckaOxaWdNNcvf0MQRB2cUkreadMoodTAe7XpKHt78C+vDl9zQtKp7S8/ZS28B3zRh7SVHe4kSMQDZUnKHFGcU2LdBg0oNGL9d3v+Jfdbw9NWRolPX8lLW059Rjw1i5sHO7Wu8K/drBlbW/87kCGtUD4PKWO7T1UB+19f/ZaRheQfU5WrqynBcc1+r8GL+tYYAy8mupuPYiVRy7T/vOPNXEQUOCRuIlmSW0o+W2YaxcAJwcEkUR81LYJGFQgWHR5DzSRYLGYobNSWRPCY6YL7k6etx13HhKyNrM71xbdpx7vqDqnJS//vxr9qNNNV0cU1x3iTy8/KiwplszF2hI0HDVzII6Lj+jWFHo0yABMCo2TXEE6RkZ8s5etFwBXdZ0ixcHHiLGxKXm03jvScJivuB72Nmg8BhquvJBypVb2vzv0LVnhbJOXsMQRrFyYfVheOvKTyru6/U0hHxyaL0zG2NcRo/hdsF16YFerpBZCzP578ZL7+jItS8s9Xwgm6DRX4lZW7isjWLVwgQBrV51W6EhtEdc6gY+IqdGLqRJwZEKaLHtxLMfmhWXIW2QWjZBo2fQg+gTUeM8JnByZ+eRfJ1T0qRJDv0rdEndZRolAC5OL6KWq5+lnHJoaZ6CEcLoZi5Yxu+MT9ukexLYBK0nW2N/l54T95je+L9BozxhbhP8gxlIjBGhf7v1PgG0Q+MNKbllmooRpQsNM9FbIblQcjinjWKxO+Fzk9jMxHJD/Pqd7bwYydnbFfF60HLTEvMBuvRAD8WnF/Lu4nSQH2Urig7xV53e3BgauwEAmIHYEygp34DpVHn8gWIAPg3RLyhrMXaMq/ug5Q3BiODefgFhfMYDBOUK98Z4/8Bw2trQT96+gVJO9C/evfvoPfLyCSCfyaE8NjImlc0RufBeHH9oHeTwD4wQXH4Vl3fozEW8Meq5SNDDJeweyhTGg48VeIVe+akl/keGePHzFL+io7f2fVXkhHurc8g1rND/iyxos8iCNossaLPIgjaLLGizyII2iyxos+gXswOfVpccewUAAAAASUVORK5CYII=>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAiCAYAAAC0nUK+AAACSklEQVR4XmNYcfzXf1phBnQBauJRw7HiUcOxYhTDOxee+K9vZPFfXl4ejlXVNP7r6JuA2QoKiv/dA+L/T1l3E8MgbBiry6PSa/+rqKr/71lyBkV8yvpb/w1Nbf6bWDr+n7n1EYY+dIxh+KL9H/47eob+N7N2/j9310sMDUGxBWBf1E/ZgSGHjjEMn7bxLjgYguMK/y8/9hNFDmaxkrIKMAhPYhiGjjEMr5uyHeyywuZFGIor+9aDwz0itfr/siPfMeQX7H37v2nmPrCv5u16hWl4Yn4H2GWN03f/n739KRhP33z/f0px739tXaP/FT3r/i87imlwzcQt/60dff6Xda78X9Kx4r+tsx+q4TBva+kYgIMlNKkMjEMSisFxkFjQ+X/BvncYBs/Z8ey/laP3/475x8D8yt51YB+iGI4vvKdvug9OKZb2nv/n7HyOIte79Nx/FWCSBTli6oY7YMva5h5GNRxfeIMwLKWAggxZHGSZmbULPG+AfN4O9AWK4bjSNwgvPvjpv6tfDNC7Cv+bZx3AkAcFV3nX6v9eISlgC5y9IxGGE0rfIJeAItrFJwqsFiZe1LIYHL6NM/bAxUCJApST4YZPWnP9v6a23n//qByU8AalDFAwaGjpgr0OSjnIloYklABzrAO8SABZDPIhyBcMIBfpG1vCwwvkCj1DM3AZA6IVFZX+Gxhb/c+tnwMOGnQf9Sw9+9/C1h0cH6CUBUqCmVXT/i898g0znZODQb4DRSoII+cBqhiOC48ajhWPGo4VjxqOFQ9dwwEO+7pVzfRMEwAAAABJRU5ErkJggg==>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFMAAAAlCAYAAAA+ydXcAAAExUlEQVR4Xu2Y+U9VRxTH/U9AREUUkKpVYu1zt0RAg6IiotUgi8QVFcEVsYS4PEBRxIIg+AS3UsCmrrjrDy5xa4w11jRN27h0tdXUX473e5q5ue/ed9997znvFzM/fALMnLnLZ+acmUuv9utvSSGHXuYGRegomRJRMiWiZEpEyZSIkimRD0pm09mXjLkdHLz0yrZPFmGXeejqGyp1f011XU8tfWaaz/1G0+Yup+rD9y19/thc30ORkb0pIiKC0rOXWfpx3XGTM2nIcBc1nPrV0i+LsMhsvfg3baw9SbPz1lPc4GEU3S+GdnhuW+KMtF37j/KKdwYU64v9p59TkivZIhPXzcrfQLGDBtMXDRct42TCMpECwNwZKpBZVneGKhovU07RjoAEbW29QTGx8QHF+qLl/J80JjnDInNtdTeNHJNCuzseW8bIhmXu6XxC41Myae7iLTzD5qD3Ib+k1lEQ0jBj/irKWLDaMdYOO5nNPb9Ty4W/LPHhQE9zpEPV4Xs0MS2bpn9epAn+wRIcCk4ycd/CdXt5BTnFmsfVfvVIG9dF2z23aP+ZFxaZ2HDqup9yyan/5ie9HXUc91ha1kQFJbv5d7SZ77H3xI+0qrKdlpe3cB2vbLpGh65Y4wQ+a+au448oZUYeg9/N/cHgJGhb602as6iMPFdeO8YKsJLxbCPHplLxtmNUVOGhCalZ1D9moJdMyELNxsYEoWgTNTThoxF8753HHlJy+gJeRLiuGLtiSyulZRbyZICZOSXaZM3gDDA/j8CnTAFWJ1bp6EnTuKbhQcwxTvgTxOmtpbbY6f3FCiAdOz5EGkuS3Qa0/eBNiu7bX5eJlQVJ/WJiqar9HrdVH3mg1es4vj/+RlnA7r+u5oR+ncbTzzSha0KXKfjy259p1sLSkKTaCeL0Xl9PpVWdjrFG0IeY+UsrvdrtaqaIFzKB+cyJ90sYkqSPRf+kqfNoUMJQXt21Hd9rbf/QgZ4//L57QDIBZh4z45qYHtCZUWAnyN12R09vp1gjkIK0FatIEIxM1EfU6FHj0mho0mitZORSVJ9or7HutrtcCnAvgBKCE4r5eYw4yvx/Va7lehHsqgR2gpZtPsAPa6SvFocHj41LJJeWBb4O2O8rE3GpM/P5figBaDOvTAEmGptbbnEN9+OsWnP0O8szCWxlol7iuILljl0+WIkCO5m+CCQWG8aAgfH8QWBsD1Rm+b4L2tdSJC3Z1KjHGGWif4MWi7psPAHgnIq0N65wM14yw3E8YkHaBiBWgT+wApxixW6cOOwTr3JT2XydpSFljccXO5nGlV2+7zx/jkImTgel7k7OxOKtR/WYhpO/0KjxU/xONMvEAyKFcQGkNGbKHBgM2A3TZi3iLxpRcwBmdk7BJks8XhCpLeLwYp9OmOozzQG+sLILy1koJn3y9IV8Kkhyfcbj4xM/5nMh7hUV1Ue/ZlbBRk5dfJxg0nC8ws6es9LNchGL8rJLO7/iuIQTA37i2qiv2Iz8ZSjLRGGdt6RC+tdPuMGui4nHT7wknj/Q/wyJscajjufyv3wdIL6a0I9Vadwo7bCtmYrgUTIlomRKRMmUiJIpESVTIkqmRJRMiSiZElEyJaJkSkTJlIiSKRElUyJKpkTeASJ8UJDtMs7cAAAAAElFTkSuQmCC>