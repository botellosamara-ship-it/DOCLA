# DOCLA – API de tienda de ropa urbana

## 1. Descripción del proyecto

DOCLA es un proyecto de desarrollo de software orientado a la gestión de una tienda de ropa urbana. Su API permite administrar productos, variantes, categorías, usuarios y pedidos, mediante servicios desarrollados con Node.js y Express.

El proyecto integra dos sistemas de bases de datos: MySQL para almacenar la información estructurada del negocio y MongoDB para registrar el historial de pedidos.

## 2. Objetivo general

Desarrollar una API para gestionar los procesos principales de una tienda virtual de ropa urbana, integrando bases de datos relacionales y no relacionales, y aplicando mecanismos de autenticación y autorización.

## 3. Tecnologías utilizadas

- **Node.js:** entorno de ejecución de JavaScript.
- **Express:** framework para desarrollar la API REST.
- **MySQL:** almacenamiento de usuarios, productos, variantes y categorías.
- **MongoDB Atlas:** almacenamiento del historial de pedidos.
- **JWT (JSON Web Token):** autenticación de usuarios.
- **bcrypt:** cifrado de contraseñas.
- **mysql2:** conexión con MySQL.
- **mongodb:** conexión con MongoDB.
- **dotenv:** administración de variables de entorno.
- **cors:** configuración de acceso entre orígenes.

## 4. Funcionalidades principales

### 4.1. Gestión de usuarios
- Registro de usuarios.
- Inicio de sesión.
- Cifrado de contraseñas.
- Generación y validación de tokens JWT.
- Consulta del perfil del usuario autenticado.
- Control de acceso según el rol del usuario.

### 4.2. Gestión de productos
- Consultar productos.
- Registrar productos.
- Actualizar información de productos.
- Eliminar productos, teniendo en cuenta sus relaciones con otros registros.

### 4.3. Gestión de variantes
- Consultar variantes de productos.
- Consultar variantes por producto.
- Registrar variantes.
- Actualizar talla, color y stock.
- Eliminar variantes.

### 4.4. Gestión de categorías
- Consultar categorías.
- Consultar una categoría por identificador.
- Registrar categorías.
- Actualizar categorías.
- Eliminar categorías.

### 4.5. Gestión de pedidos
- Registrar pedidos.
- Consultar el historial de pedidos.
- Consultar los pedidos del usuario autenticado.
- Consultar un pedido por identificador.
- Actualizar el estado de un pedido.
- Cancelar pedidos pendientes y gestionar la devolución de existencias.

Los pedidos se almacenan en MongoDB y la información de productos y existencias se consulta en MySQL.

### 4.6. Integración de bases de datos
El endpoint de integración consulta información de MySQL y MongoDB para presentar productos, categorías e historial de pedidos en una misma respuesta. El acceso a este recurso está restringido a usuarios administradores.

## 5. Arquitectura y organización del proyecto

El proyecto está organizado por módulos para separar la configuración, la seguridad, las rutas y el servidor principal.

```text
DOCLA/
│
├── src/
│   ├── config/
│   │   └── database.js
│   │
│   ├── middleware/
│   │   └── auth.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── productos.js
│   │   ├── variantes.js
│   │   ├── categorias.js
│   │   └── pedidos.js
│   │
│   └── server.js
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

**Descripción de las carpetas y archivos:**

- `src/config/database.js`: configura las conexiones con MySQL y MongoDB.
- `src/middleware/auth.js`: contiene las funciones para verificar tokens y roles.
- `src/routes/auth.js`: administra el registro, inicio de sesión y perfil de usuarios.
- `src/routes/productos.js`: contiene las rutas para administrar productos.
- `src/routes/variantes.js`: contiene las rutas para administrar las variantes.
- `src/routes/categorias.js`: contiene las rutas para administrar categorías.
- `src/routes/pedidos.js`: administra el registro, consulta, actualización y cancelación de pedidos.
- `src/server.js`: configura Express, registra las rutas e inicia el servidor.

## 6. Bases de datos

### 6.1. MySQL

Se utiliza MySQL como base de datos relacional para administrar la información estructurada del sistema.

La base de datos utilizada es `docla_db` e incluye las siguientes tablas:

- `usuarios`: almacena los datos de los usuarios y sus roles.
- `productos`: almacena la información de los productos.
- `variantes_producto`: registra las tallas, colores y existencias de cada producto.
- `categorias`: almacena las categorías de la tienda.
- `cancelaciones_pedidos`: registra las operaciones de cancelación utilizadas para controlar la devolución de existencias.

### 6.2. MongoDB

Se utiliza MongoDB Atlas como base de datos no relacional para almacenar el historial de pedidos.

La colección utilizada es:

- `historial_pedidos`: almacena la información de los pedidos, los productos incluidos, las cantidades, los totales, el estado y la fecha de registro.

### 6.3. Justificación de la integración

MySQL permite organizar los datos que requieren relaciones, claves primarias, claves foráneas y control de existencias. MongoDB permite almacenar documentos de pedidos con sus productos y datos históricos.

La integración permite consultar información de ambos sistemas desde un mismo servicio de la API.

## 7. Requisitos para ejecutar el proyecto

Antes de iniciar el proyecto se necesita:

- Node.js instalado.
- npm instalado.
- MySQL Server en funcionamiento.
- Una base de datos MySQL llamada `docla_db`.
- Una instancia de MongoDB Atlas.
- Las credenciales de conexión configuradas en un archivo `.env`.

## 8. Instalación y ejecución

### 8.1. Descargar el repositorio

Clonar el repositorio:

```bash
git clone URL_DEL_REPOSITORIO
```

Ingresar a la carpeta:

```bash
cd DOCLA
```

### 8.2. Instalar dependencias

```bash
npm install
```

### 8.3. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto y configurar las credenciales de MySQL, la URI de MongoDB Atlas y la clave secreta de JWT.

Los nombres de las variables deben coincidir con los utilizados en `src/config/database.js` y en el módulo de autenticación.

**Importante:** el archivo `.env` contiene información privada y no debe publicarse en GitHub.

### 8.4. Iniciar el servidor

Desde la carpeta principal del proyecto ejecutar:

```bash
node src/server.js
```

Si la configuración es correcta, se mostrará un mensaje indicando que MongoDB y MySQL se conectaron correctamente y que el servidor está disponible en:

`http://localhost:3000`

## 9. Endpoints de la API

La API utiliza el prefijo `/api`.

### 9.1. Autenticación

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/auth/registro` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/perfil` | Consultar perfil autenticado |
| GET | `/api/auth/admin` | Acceso exclusivo de administrador |

### 9.2. Productos

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/productos` | Consultar productos |
| POST | `/api/productos` | Registrar producto |
| PUT | `/api/productos/:id` | Actualizar producto |
| DELETE | `/api/productos/:id` | Eliminar producto |

### 9.3. Variantes

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/variantes` | Consultar variantes |
| GET | `/api/variantes/producto/:id` | Consultar variantes de un producto |
| POST | `/api/variantes` | Registrar variante |
| PUT | `/api/variantes/:id` | Actualizar variante |
| DELETE | `/api/variantes/:id` | Eliminar variante |

### 9.4. Categorías

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/categorias` | Consultar categorías |
| GET | `/api/categorias/:id` | Consultar categoría por identificador |
| POST | `/api/categorias` | Registrar categoría |
| PUT | `/api/categorias/:id` | Actualizar categoría |
| DELETE | `/api/categorias/:id` | Eliminar categoría |

### 9.5. Pedidos

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/pedidos/historial` | Registrar pedido |
| GET | `/api/pedidos/historial` | Consultar todos los pedidos (administrador) |
| GET | `/api/pedidos/mis-pedidos` | Consultar pedidos propios |
| GET | `/api/pedidos/historial/:id` | Consultar pedido por identificador |
| PUT | `/api/pedidos/historial/:id` | Actualizar estado del pedido (administrador) |
| POST | `/api/pedidos/historial/:id/cancelar` | Cancelar pedido pendiente (administrador) |
| DELETE | `/api/pedidos/historial/:id` | Operación no permitida; los pedidos se conservan para auditoría |

### 9.6. Integración

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/integracion` | Consultar información de MySQL y MongoDB (administrador) |

## 10. Seguridad

El proyecto implementa medidas básicas de seguridad:

- Las contraseñas se almacenan mediante hash con bcrypt.
- La autenticación se realiza mediante tokens JWT.
- Las rutas protegidas requieren un token enviado en el encabezado `Authorization`.
- Se aplica control de roles para restringir operaciones administrativas.
- Se validan datos recibidos antes de realizar operaciones en las bases de datos.
- Las credenciales se administran mediante variables de entorno.

Para acceder a rutas protegidas se debe enviar el encabezado:

```text
Authorization: Bearer TOKEN_GENERADO
```

## 11. Pruebas

Las pruebas de los endpoints se realizan utilizando Postman y el navegador para comprobar las respuestas de la API.

Se verifican, entre otras, las siguientes operaciones:

- Inicio de la API y conexión con las bases de datos.
- Registro e inicio de sesión.
- Validación de tokens y permisos por rol.
- Consulta de productos y variantes.
- Consulta y administración de categorías.
- Registro y consulta de pedidos.
- Integración de información de MySQL y MongoDB.

## 12. Consideraciones

- El servidor utiliza el puerto `3000`.
- MySQL se configura en el entorno local del proyecto.
- MongoDB Atlas almacena el historial de pedidos.
- Las operaciones administrativas requieren autenticación y rol de administrador.
- La cancelación de pedidos está limitada a pedidos pendientes.
- La información sensible de conexión no debe compartirse ni publicarse.

## 13. Autoría

**Proyecto:** DOCLA  
**Tipo de proyecto:** API para la gestión de una tienda de ropa urbana.  
**Tecnologías principales:** Node.js, Express, MySQL y MongoDB.  
**Repositorio:** [Agregar aquí la URL del repositorio de GitHub].  
**Autor(es):** [Escribir nombres de los integrantes].  
**Institución:** [Escribir nombre de la institución].  
**Asignatura:** [Escribir nombre de la asignatura].

