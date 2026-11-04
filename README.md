# DOCLA – Plataforma de ropa Streetwear

## Descripción
DOCLA es una plataforma web orientada a la consulta de productos de ropa streetwear y la gestión de pedidos. El proyecto implementa persistencia políglota mediante una base de datos relacional y una base de datos NoSQL.

## Tecnologías utilizadas
- Node.js
- Express
- MariaDB / MySQL
- MongoDB
- JavaScript
- Git y GitHub

## Arquitectura de bases de datos

### MariaDB (SQL)
Se utiliza para almacenar información estructurada:
- Productos.
- Variantes de productos.
- Tallas.
- Colores.
- Stock.
- Precios.

### MongoDB (NoSQL)
Se utiliza para almacenar información dinámica relacionada con los pedidos:
- Datos del cliente.
- Productos incluidos en el pedido.
- Cantidades.
- Total.
- Estado del pedido.
- Fecha de registro.

## Integración de las bases de datos
El backend permite consultar información de MariaDB y MongoDB desde un mismo endpoint:

`GET /api/integracion`

Este endpoint obtiene los productos y sus variantes desde MariaDB y el historial de pedidos desde MongoDB, devolviendo ambos resultados en una sola respuesta.

## Funcionalidades implementadas

### Productos
- Consulta de productos.
- Consulta de variantes, tallas, colores y stock.

### Historial de pedidos
- `POST /api/pedidos/historial`: registra un pedido.
- `GET /api/pedidos/historial`: consulta todos los pedidos.
- `GET /api/pedidos/historial/:id`: consulta un pedido por su identificador.
- `PUT /api/pedidos/historial/:id`: actualiza un pedido.
- `DELETE /api/pedidos/historial/:id`: elimina un pedido.

## Instalación y ejecución

1. Clonar o descargar el repositorio.
2. Abrir una terminal en la carpeta del proyecto.
3. Instalar las dependencias:

   `npm install`

4. Configurar las variables de entorno en un archivo `.env`:

   - `MONGODB_URI`
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`

5. Verificar que MariaDB esté iniciado y que MongoDB Atlas sea accesible.
6. Ejecutar el servidor:

   `node src/server.js`

7. Abrir en el navegador:

   `http://localhost:3000`

## Seguridad
El archivo `.env` contiene credenciales y datos de conexión. No debe publicarse en GitHub. La carpeta `node_modules` tampoco debe incluirse en el repositorio.

## Estado del proyecto
Se encuentran implementadas y probadas las conexiones con MariaDB y MongoDB, las consultas de productos, el endpoint de integración y las operaciones CRUD del historial de pedidos.