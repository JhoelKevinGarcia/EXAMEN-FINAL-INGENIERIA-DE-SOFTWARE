# ⛽ JK Carburantes - Sistema de Gestión de Combustible

Este es un sistema **Full-Stack** completo para la gestión y control de ventas de combustible (Gasolina y Diésel) diseñado con una interfaz moderna y un algoritmo de asignación de cupos dinámicos para clientes.

## 🚀 Características Principales

1. **Dashboard en Tiempo Real:** Visualización de estadísticas generales, control visual (tipo glassmorphism) de la capacidad de los tanques de combustible y un historial en red de las últimas ventas.
2. **Algoritmo de Cupo Dinámico:** Control estricto de ventas mediante un algoritmo que promedia el consumo semanal de los clientes para establecer límites máximos y evitar ventas inusuales (factor de holgura y límite variable configurables).
3. **Gestión Total de Clientes:** CRUD completo que incluye clientes Nuevos, Particulares, Transporte Público o Empresa. Soporta registro rápido directamente desde el panel de despacho y control de suspensión.
4. **Almacenamiento y Tanques:** Registro de ingresos de combustible (con factura a proveedores) y validaciones estrictas del stock de tanques para prohibir ventas si el inventario llega a su mínimo definido.
5. **Configuración de Empresa:** Configuración remota de parámetros del algoritmo (ej. días de evaluación, cupo base nuevos clientes) y de información física de la estación.

## 🛠️ Tecnologías Empleadas

### Backend
* **Entorno:** Node.js, Express.js
* **Base de Datos:** PostgreSQL alojada de manera remota en **Supabase** (transacciones `BEGIN/COMMIT/ROLLBACK` para protección concurrente).
* **Driver DB:** `pg` (manejo nativo en la nube)
* **API:** JSON Restful Endpoints estructurados Modularmente.

### Frontend
* **Core:** Vanilla JavaScript funcional usando Async/Await a través del cliente Web Fetch.
* **UI/UX:** Diseño 'Premium Dark Theme' construido en puro CSS. Integra modales fluidos, microanimaciones al hacer hover sobre botones, y notificaciones Toast interactivas y asíncronas.
* **Estructura en un PWA Base:** Single Page Application feel gracias a la navegación vía Modificar Views del DOM (cambio sin recarga).

## 📦 Instalación Local

1. Clona este repositorio
```bash
git clone https://github.com/tu_usuario/EXAMEN-FINAL-INGENIERIA-DE-SOFTWARE.git
```
2. Instala las dependencias en Node.js
```bash
npm install
```
3. Configura tus variables de Entorno copiando el `.env.example` en `.env`
```env
PORT=3000
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[USUARIODb].supabase.co:5432/postgres
```
4. Ejecuta el servidor (asegúrate de haber corrido las Query SQL previas en tu Supabase):
```bash
npm start
```
5. Abre y navega al entorno **localhost** (ej: `http://localhost:3000`)

## 🌐 Estructura del Despliegue en Render Cloud

Esta estructurado para compilar con su propio script interno conectándose a un Web Service de `Render.com` en constante Build mediante GitHub.
- **Build command:** `npm install`
- **Start command:** `npm start`
- Las variables de entorno son inyectadas en la capa de servicios.

---

> Creado, diseñado e implementado como proyecto de ingeniería de software estructurada.
