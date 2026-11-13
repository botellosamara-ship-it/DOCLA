
const express = require("express");
const cors = require("cors");

const {
    connectMongoDB,
    connectMariaDB,
    pool
} = require("./config/database");

const {
    verificarToken,
    verificarRol
} = require("./middleware/auth");

const authRoutes = require("./routes/auth");
const pedidosRoutes = require("./routes/pedidos");
const productosRoutes = require("./routes/productos");
const variantesRoutes = require("./routes/variantes");
const categoriasRoutes = require("./routes/categorias");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/variantes", variantesRoutes);
app.use("/api/categorias", categoriasRoutes);

app.get("/", (req, res) => {
    res.json({
        mensaje: "API de DOCLA funcionando correctamente"
    });
});

app.get(
    "/api/integracion",
    verificarToken,
    verificarRol("administrador"),
    async (req, res) => {
        try {
            const [productos] = await pool.execute(`
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

            const [categorias] = await pool.execute(`
                SELECT *
                FROM categorias
                ORDER BY id_categoria
            `);

            const db = await connectMongoDB();

            const historial = await db
                .collection("historial_pedidos")
                .find({})
                .sort({ fecha_de_registro: -1 })
                .toArray();

            return res.json({
                mensaje: "Integración MySQL y MongoDB funcionando",
                productos,
                categorias,
                historial_pedidos: historial
            });

        } catch (error) {
            console.error("Error en la integración:", error.message);

            return res.status(500).json({
                mensaje: "Error al consultar las bases de datos."
            });
        }
    }
);

app.use((req, res) => {
    res.status(404).json({
        mensaje: "La ruta solicitada no existe"
    });
});

async function iniciarServidor() {
    try {
        console.log("Iniciando API de DOCLA...");

        await connectMongoDB();
        await connectMariaDB();

        const PORT = 3000;

        app.listen(PORT, () => {
            console.log("----------------------------------");
            console.log("DOCLA iniciado correctamente");
            console.log("MongoDB: conectado");
            console.log("MySQL: conectado");
            console.log("Servidor: http://localhost:" + PORT);
            console.log("----------------------------------");
        });

    } catch (error) {
        console.error("No se pudo iniciar DOCLA:", error.message);
        process.exitCode = 1;
    }
}

iniciarServidor();





