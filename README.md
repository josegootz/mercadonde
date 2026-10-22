# MercaDónde 📦🚚

Aplicación web Full Stack, reactiva y minimalista para la **centralización, geolocalización en tiempo real y monitoreo de envíos de Mercado Libre**.

## Características Principales

1. **Ingesta Inteligente y Multi-URL de Mercado Libre:**
   - Soporte para enlaces de seguimiento (`mercadolibre.com.*/gz/shipping/tracking/...`), enlaces de compras/productos y códigos directos (`MEL-...`).
   - Motor híbrido de extracción (API pública de Mercado Libre + Scraper de metadatos HTML + Hidratación resiliente ante muros de login o Captchas).
2. **Dashboard Minimalista (Mobile-First + Dark/Light Mode):**
   - Tarjetas reactivas con estados visuales claros (*En preparación*, *En distribución*, *Llega hoy*, *Próximo a llegar*, *Entregado*).
   - Filtros rápidos por estado, buscador interno en tiempo real y ordenamiento cronológico / por prioridad de entrega.
3. **Mapa Interactivo en Tiempo Real (Leaflet + CartoDB):**
   - **Vista Individual y Vista Global** de todos los paquetes activos.
   - Trazado dinámico de la ruta desde el centro de distribución hasta el domicilio, paradas intermedias y marcador vivo con tooltip detallado.
   - **Simulador de Rastreo en Vivo** para probar el avance de los repartidores y las alertas en tiempo real.
4. **Sistema Multicanal de Alertas:**
   - **Alertas Sonoras Sutiles:** Sintetizador propio basado en **Web Audio API** (sin dependencia de archivos externos) al pasar a *"En camino a tu domicilio"* o *"Próximo a llegar"*.
   - **Notificaciones Push del Navegador** + integración lista para **Resend (Email)** y **Webhooks salientes (Discord/Slack/JSON)**.

## Comandos

```bash
# Instalar dependencias
npm install

# Ejecutar pruebas automatizadas
npm test

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```
