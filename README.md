# Tienda MikeTech S.A (PayPhone + Docker)

## 1) Configura credenciales (IMPORTANTE)
1. Entra a PayPhone Developer y asegúrate de crear una app tipo **WEB** y registrar:
   - Dominio Web
   - URL de Respuesta (ResponseUrl)
2. En `api/` copia:
   - `.env.example` -> `.env`
3. Llena:
   - `PAYPHONE_TOKEN`
   - `PAYPHONE_STORE_ID`
   - `PAYPHONE_RESPONSE_URL` (ej: http://localhost:8080/result.html)

## 2) Levantar con Docker Compose
```bash
cd TiendaMikeTech
docker compose up --build
```

- Web: http://localhost:8080
- API: http://localhost:3000/api/health

## 3) Flujo del pago
- En la tienda: agrega productos y presiona **Pagar con PayPhone**
- Se abre una pestaña con el formulario (recomendado por seguridad)
- Al finalizar, PayPhone redirige a `result.html` con parámetros `id` y `clientTransactionId`
- La página confirma el estado llamando a `/api/payphone/confirm`

> Nota PayPhone: si no confirmas en ~5 minutos, puede haber reverso automático.
