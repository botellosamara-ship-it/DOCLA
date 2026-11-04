
const express = require("express");
const cors = require("cors");

const {
    connectMongoDB,
    connectMariaDB,
    pool
} = require("./config/database");


const pedidosRoutes = require("./routes/pedidos");

const app = express();


app.use(cors());
app.use(express.json());


app.use("/api/pedidos", pedidosRoutes);


app.get("/", (req, res) => {
    res.json({
        mensaje: "API de DOCLA funcionando correctamente"
    });
});


app.get("/api/productos", async (req, res) => {
    try {
        const [filas] = await pool.execute(`
            SELECT
                p.id_producto,
                p.nombre,
                p.descripcion,
                p.precio,
                v.id_variante,
                v.talla,
                v.color,
                v.stock
            FROM productos p
            LEFT JOIN variantes_producto v
                ON p.id_producto = v.id_producto
            ORDER BY p.id_producto, v.id_variante
        `);

        const productos = [];

        filas.forEach((fila) => {
            let producto = productos.find(
                (p) => p.id_producto === fila.id_producto
            );

            if (!producto) {
                producto = {
                    id_producto: fila.id_producto,
                    nombre: fila.nombre,
                    descripcion: fila.descripcion,
                    precio: Number(fila.precio),
                    variantes: []
                };

                productos.push(producto);
            }

            if (fila.id_variante !== null) {
                producto.variantes.push({
                    id_variante: fila.id_variante,
                    talla: fila.talla,
                    color: fila.color,
                    stock: fila.stock
                });
            }
        });

        res.json(productos);

    } catch (error) {
        console.error("Error al consultar productos:", error.message);

        res.status(500).json({
            mensaje: "Error al consultar los productos"
        });
    }
});


app.get("/api/integracion", async (req, res) => {
    try {
        // Consultar productos en MariaDB
        const [productos] = await pool.execute(`
            SELECT
                p.id_producto,
                p.nombre,
                p.precio,
                v.talla,
                v.color,
                v.stock
            FROM productos p
            LEFT JOIN variantes_producto v
                ON p.id_producto = v.id_producto
            ORDER BY p.id_producto
        `);

        
        const db = await connectMongoDB();

        const historial = await db
            .collection("historial_pedidos")
            .find({})
            .toArray();

        
        res.json({
            mensaje: "Integración MariaDB y MongoDB funcionando",
            productos: productos,
            historial_pedidos: historial
        });

    } catch (error) {
        console.error("Error en la integración:", error.message);

        res.status(500).json({
            mensaje: "Error al consultar las bases de datos"
        });
    }
});


async function iniciarServidor() {
    try {
        await connectMongoDB();
        await connectMariaDB();

        const PORT = 3000;

        app.listen(PORT, () => {
            console.log(
                `Servidor ejecutándose en http://localhost:${PORT}`
            );
        });

    } catch (error) {
        console.error(
            "No se pudo iniciar DOCLA:",
            error.message
        );
    }
}

iniciarServidor();




