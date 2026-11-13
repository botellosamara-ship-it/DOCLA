
const express = require("express");
const { pool } = require("../config/database");

const {
    verificarToken,
    verificarRol
} = require("../middleware/auth");

const router = express.Router();


router.get("/", async (req, res) => {
    try {
        const [filas] = await pool.execute(`
            SELECT
                p.id_producto,
                p.nombre,
                p.descripcion,
                p.precio,
                p.fecha_creacion,
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

        for (const fila of filas) {
            let producto = productos.find(
                p => p.id_producto === fila.id_producto
            );

            if (!producto) {
                producto = {
                    id_producto: fila.id_producto,
                    nombre: fila.nombre,
                    descripcion: fila.descripcion,
                    precio: Number(fila.precio),
                    fecha_creacion: fila.fecha_creacion,
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
        }

        res.json(productos);

    } catch (error) {
        console.error("Error al consultar productos:", error.message);

        res.status(500).json({
            mensaje: "Error al consultar productos"
        });
    }
});



router.post(
    "/",
    verificarToken,
    verificarRol("administrador"),
    async (req, res) => {
        const { nombre, descripcion, precio } = req.body;

        if (
            typeof nombre !== "string" ||
            !nombre.trim() ||
            (descripcion !== undefined &&
                descripcion !== null &&
                typeof descripcion !== "string") ||
            typeof precio !== "number" ||
            !Number.isFinite(precio) ||
            precio <= 0
        ) {
            return res.status(400).json({
                mensaje: "Nombre, descripción válida y precio mayor que cero son obligatorios"
            });
        }

        let connection;

        try {
            connection = await pool.getConnection();

            const [resultado] = await connection.execute(
                `INSERT INTO productos
                (nombre, descripcion, precio)
                VALUES (?, ?, ?)`,
                [nombre.trim(), descripcion || "", precio]
            );

            res.status(201).json({
                mensaje: "Producto registrado correctamente",
                id_producto: resultado.insertId
            });

        } catch (error) {
            console.error("Error al registrar producto:", error.message);

            res.status(500).json({
                mensaje: "Error al registrar producto"
            });

        } finally {
            if (connection) connection.release();
        }
    }
);



router.put(
    "/:id",
    verificarToken,
    verificarRol("administrador"),
    async (req, res) => {
        const id = Number(req.params.id);
        const { nombre, descripcion, precio } = req.body;

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                mensaje: "Identificador de producto no válido"
            });
        }

        const campos = [];
        const valores = [];

        if (nombre !== undefined) {
            if (typeof nombre !== "string" || !nombre.trim()) {
                return res.status(400).json({
                    mensaje: "El nombre no es válido"
                });
            }

            campos.push("nombre = ?");
            valores.push(nombre.trim());
        }

        if (descripcion !== undefined) {
            if (typeof descripcion !== "string") {
                return res.status(400).json({
                    mensaje: "La descripción no es válida"
                });
            }

            campos.push("descripcion = ?");
            valores.push(descripcion);
        }

        if (precio !== undefined) {
            if (
                typeof precio !== "number" ||
                !Number.isFinite(precio) ||
                precio <= 0
            ) {
                return res.status(400).json({
                    mensaje: "El precio no es válido"
                });
            }

            campos.push("precio = ?");
            valores.push(precio);
        }

        if (campos.length === 0) {
            return res.status(400).json({
                mensaje: "No hay datos para actualizar"
            });
        }

        try {
            valores.push(id);

            const [resultado] = await pool.execute(
                `UPDATE productos
                 SET ${campos.join(", ")}
                 WHERE id_producto = ?`,
                valores
            );

            if (resultado.affectedRows === 0) {
                const [existentes] = await pool.execute(
                    "SELECT id_producto FROM productos WHERE id_producto = ?",
                    [id]
                );

                if (existentes.length === 0) {
                    return res.status(404).json({
                        mensaje: "Producto no encontrado"
                    });
                }
            }

            res.json({
                mensaje: "Producto actualizado correctamente"
            });

        } catch (error) {
            console.error("Error al actualizar producto:", error.message);

            res.status(500).json({
                mensaje: "Error al actualizar producto"
            });
        }
    }
);



router.delete(
    "/:id",
    verificarToken,
    verificarRol("administrador"),
    async (req, res) => {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                mensaje: "Identificador de producto no válido"
            });
        }

        try {
            const [resultado] = await pool.execute(
                "DELETE FROM productos WHERE id_producto = ?",
                [id]
            );

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: "Producto no encontrado"
                });
            }

            res.json({
                mensaje: "Producto eliminado correctamente"
            });

        } catch (error) {
            console.error("Error al eliminar producto:", error.message);

            if (error.code === "ER_ROW_IS_REFERENCED_2") {
                return res.status(409).json({
                    mensaje: "No se puede eliminar el producto porque tiene variantes asociadas"
                });
            }

            res.status(500).json({
                mensaje: "Error al eliminar producto"
            });
        }
    }
);

module.exports = router;
