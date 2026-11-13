
const express = require("express");
const router = express.Router();

const { pool } = require("../config/database");
const { verificarToken, verificarRol } = require("../middleware/auth");


router.get("/", async (req, res) => {
    try {
        const [variantes] = await pool.execute(`
            SELECT
                v.id_variante,
                v.id_producto,
                p.nombre AS producto,
                v.talla,
                v.color,
                v.stock
            FROM variantes_producto v
            INNER JOIN productos p
                ON v.id_producto = p.id_producto
            ORDER BY v.id_producto, v.id_variante
        `);

        res.json(variantes);
    } catch (error) {
        console.error("Error al consultar variantes:", error.message);
        res.status(500).json({
            mensaje: "Error al consultar las variantes"
        });
    }
});


router.get("/producto/:id", async (req, res) => {
    try {
        const idProducto = Number(req.params.id);

        if (!Number.isInteger(idProducto) || idProducto <= 0) {
            return res.status(400).json({
                mensaje: "Identificador de producto no válido"
            });
        }

        const [variantes] = await pool.execute(`
            SELECT
                id_variante,
                id_producto,
                talla,
                color,
                stock
            FROM variantes_producto
            WHERE id_producto = ?
            ORDER BY id_variante
        `, [idProducto]);

        res.json(variantes);
    } catch (error) {
        console.error("Error al consultar variantes:", error.message);
        res.status(500).json({
            mensaje: "Error al consultar las variantes"
        });
    }
});


router.post(
    "/",
    verificarToken,
    verificarRol("administrador"),
    async (req, res) => {
        try {
            const { id_producto, talla, color, stock } = req.body;

            const idProducto = Number(id_producto);
            const cantidad = Number(stock);

            if (!Number.isInteger(idProducto) || idProducto <= 0) {
                return res.status(400).json({
                    mensaje: "El identificador del producto no es válido"
                });
            }

            if (
                typeof talla !== "string" || !talla.trim() ||
                typeof color !== "string" || !color.trim()
            ) {
                return res.status(400).json({
                    mensaje: "Debes indicar una talla y un color válidos"
                });
            }

            if (!Number.isInteger(cantidad) || cantidad < 0) {
                return res.status(400).json({
                    mensaje: "El stock debe ser un número entero igual o mayor que cero"
                });
            }

            const [productos] = await pool.execute(
                "SELECT id_producto FROM productos WHERE id_producto = ?",
                [idProducto]
            );

            if (productos.length === 0) {
                return res.status(404).json({
                    mensaje: "El producto indicado no existe"
                });
            }

            const [existentes] = await pool.execute(`
                SELECT id_variante
                FROM variantes_producto
                WHERE id_producto = ?
                  AND LOWER(talla) = LOWER(?)
                  AND LOWER(color) = LOWER(?)
            `, [idProducto, talla.trim(), color.trim()]);

            if (existentes.length > 0) {
                return res.status(409).json({
                    mensaje: "Esta talla y color ya existen para el producto"
                });
            }

            const [resultado] = await pool.execute(`
                INSERT INTO variantes_producto
                    (id_producto, talla, color, stock)
                VALUES (?, ?, ?, ?)
            `, [idProducto, talla.trim(), color.trim(), cantidad]);

            res.status(201).json({
                mensaje: "Variante creada correctamente",
                id_variante: resultado.insertId
            });
        } catch (error) {
            console.error("Error al crear variante:", error.message);
            res.status(500).json({
                mensaje: "Error al crear la variante"
            });
        }
    }
);


router.put(
    "/:id",
    verificarToken,
    verificarRol("administrador"),
    async (req, res) => {
        try {
            const idVariante = Number(req.params.id);
            const { talla, color, stock } = req.body;

            if (!Number.isInteger(idVariante) || idVariante <= 0) {
                return res.status(400).json({
                    mensaje: "Identificador de variante no válido"
                });
            }

            const campos = [];
            const valores = [];

            if (talla !== undefined) {
                if (typeof talla !== "string" || !talla.trim()) {
                    return res.status(400).json({
                        mensaje: "La talla no es válida"
                    });
                }
                campos.push("talla = ?");
                valores.push(talla.trim());
            }

            if (color !== undefined) {
                if (typeof color !== "string" || !color.trim()) {
                    return res.status(400).json({
                        mensaje: "El color no es válido"
                    });
                }
                campos.push("color = ?");
                valores.push(color.trim());
            }

            if (stock !== undefined) {
                const cantidad = Number(stock);

                if (!Number.isInteger(cantidad) || cantidad < 0) {
                    return res.status(400).json({
                        mensaje: "El stock debe ser un entero igual o mayor que cero"
                    });
                }

                campos.push("stock = ?");
                valores.push(cantidad);
            }

            if (campos.length === 0) {
                return res.status(400).json({
                    mensaje: "Debes enviar al menos un campo para actualizar"
                });
            }

            valores.push(idVariante);

            const [resultado] = await pool.execute(
                `UPDATE variantes_producto
                 SET ${campos.join(", ")}
                 WHERE id_variante = ?`,
                valores
            );

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: "La variante no existe o no hubo cambios"
                });
            }

            res.json({
                mensaje: "Variante actualizada correctamente"
            });
        } catch (error) {
            console.error("Error al actualizar variante:", error.message);
            res.status(500).json({
                mensaje: "Error al actualizar la variante"
            });
        }
    }
);


router.delete(
    "/:id",
    verificarToken,
    verificarRol("administrador"),
    async (req, res) => {
        try {
            const idVariante = Number(req.params.id);

            if (!Number.isInteger(idVariante) || idVariante <= 0) {
                return res.status(400).json({
                    mensaje: "Identificador de variante no válido"
                });
            }

            const [resultado] = await pool.execute(
                "DELETE FROM variantes_producto WHERE id_variante = ?",
                [idVariante]
            );

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: "La variante no existe"
                });
            }

            res.json({
                mensaje: "Variante eliminada correctamente"
            });
        } catch (error) {
            console.error("Error al eliminar variante:", error.message);
            res.status(500).json({
                mensaje: "Error al eliminar la variante"
            });
        }
    }
);

module.exports = router;
