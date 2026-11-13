
const express = require("express");
const { pool } = require("../config/database");
const { verificarToken, verificarRol } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const [categorias] = await pool.execute(
            "SELECT * FROM categorias ORDER BY id_categoria DESC"
        );

        return res.json({
            cantidad: categorias.length,
            categorias
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({
            mensaje: "Error al consultar las categorías."
        });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensaje: "Identificador de categoría inválido."
            });
        }

        const [categorias] = await pool.execute(
            "SELECT * FROM categorias WHERE id_categoria = ?",
            [id]
        );

        if (categorias.length === 0) {
            return res.status(404).json({
                mensaje: "Categoría no encontrada."
            });
        }

        return res.json(categorias[0]);
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({
            mensaje: "Error al consultar la categoría."
        });
    }
});

router.post(
    "/",
    verificarToken,
    verificarRol("administrador"),
    async (req, res) => {
        try {
            const { nombre, descripcion } = req.body;

            if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
                return res.status(400).json({
                    mensaje: "El nombre de la categoría es obligatorio."
                });
            }

            const [resultado] = await pool.execute(
                "INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)",
                [
                    nombre.trim(),
                    typeof descripcion === "string" && descripcion.trim()
                        ? descripcion.trim()
                        : null
                ]
            );

            return res.status(201).json({
                mensaje: "Categoría creada correctamente.",
                id_categoria: resultado.insertId
            });
        } catch (error) {
            if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    mensaje: "Ya existe una categoría con ese nombre."
                });
            }

            console.error(error.message);
            return res.status(500).json({
                mensaje: "Error al crear la categoría."
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
            const id = Number(req.params.id);
            const { nombre, descripcion } = req.body;

            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({
                    mensaje: "Identificador de categoría inválido."
                });
            }

            if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
                return res.status(400).json({
                    mensaje: "El nombre de la categoría es obligatorio."
                });
            }

            const [resultado] = await pool.execute(
                `UPDATE categorias
                 SET nombre = ?, descripcion = ?
                 WHERE id_categoria = ?`,
                [
                    nombre.trim(),
                    typeof descripcion === "string" && descripcion.trim()
                        ? descripcion.trim()
                        : null,
                    id
                ]
            );

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: "Categoría no encontrada."
                });
            }

            return res.json({
                mensaje: "Categoría actualizada correctamente."
            });
        } catch (error) {
            if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    mensaje: "Ya existe una categoría con ese nombre."
                });
            }

            console.error(error.message);
            return res.status(500).json({
                mensaje: "Error al actualizar la categoría."
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
            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({
                    mensaje: "Identificador de categoría inválido."
                });
            }

            const [resultado] = await pool.execute(
                "DELETE FROM categorias WHERE id_categoria = ?",
                [id]
            );

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: "Categoría no encontrada."
                });
            }

            return res.json({
                mensaje: "Categoría eliminada correctamente."
            });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({
                mensaje: "No fue posible eliminar la categoría."
            });
        }
    }
);

module.exports = router;
