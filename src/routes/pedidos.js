
const express = require("express");
const { ObjectId } = require("mongodb");

const {
    connectMongoDB,
    pool
} = require("../config/database");

const {
    verificarToken,
    verificarRol
} = require("../middleware/auth");

const router = express.Router();

const COLECCION_PEDIDOS = "historial_pedidos";

router.post("/historial", verificarToken, async (req, res) => {
    let conexion;
    let pedidoInsertado = null;
    let db;

    try {
        const { productos } = req.body;

        if (!Array.isArray(productos) || productos.length === 0) {
            return res.status(400).json({
                mensaje: "Debes incluir al menos un producto en el pedido."
            });
        }

        const idsVariantes = new Set();

        for (const producto of productos) {
            const idVariante = Number(producto.id_variante);
            const cantidad = Number(producto.cantidad);

            if (
                !Number.isInteger(idVariante) ||
                idVariante <= 0 ||
                !Number.isInteger(cantidad) ||
                cantidad <= 0
            ) {
                return res.status(400).json({
                    mensaje: "Cada producto debe tener un id_variante válido y una cantidad mayor que cero."
                });
            }

            if (idsVariantes.has(idVariante)) {
                return res.status(400).json({
                    mensaje: "No repitas una variante en el pedido."
                });
            }

            idsVariantes.add(idVariante);
        }

        conexion = await pool.getConnection();
        await conexion.beginTransaction();

        const [usuarios] = await conexion.execute(
            `SELECT id_usuario, nombre, correo
             FROM usuarios
             WHERE id_usuario = ?`,
            [req.usuario.id_usuario]
        );

        if (usuarios.length === 0) {
            await conexion.rollback();

            return res.status(404).json({
                mensaje: "No se encontró el usuario."
            });
        }

        const usuario = usuarios[0];
        const productosPedido = [];
        let total = 0;

        for (const producto of productos) {
            const idVariante = Number(producto.id_variante);
            const cantidad = Number(producto.cantidad);

            const [variantes] = await conexion.execute(
                `SELECT
                    v.id_variante,
                    v.id_producto,
                    v.talla,
                    v.color,
                    v.stock,
                    p.nombre,
                    p.precio
                 FROM variantes_producto v
                 INNER JOIN productos p
                    ON v.id_producto = p.id_producto
                 WHERE v.id_variante = ?
                 FOR UPDATE`,
                [idVariante]
            );

            if (variantes.length === 0) {
                await conexion.rollback();

                return res.status(404).json({
                    mensaje: `No existe la variante ${idVariante}.`
                });
            }

            const variante = variantes[0];

            if (Number(variante.stock) < cantidad) {
                await conexion.rollback();

                return res.status(400).json({
                    mensaje: `Stock insuficiente para ${variante.nombre}, talla ${variante.talla}, color ${variante.color}.`,
                    stock_disponible: variante.stock,
                    cantidad_solicitada: cantidad
                });
            }

            const precioUnitario = Number(variante.precio);
            const subtotal = precioUnitario * cantidad;

            productosPedido.push({
                id_variante: variante.id_variante,
                id_producto: variante.id_producto,
                nombre: variante.nombre,
                talla: variante.talla,
                color: variante.color,
                precio_unitario: precioUnitario,
                cantidad,
                subtotal
            });

            total += subtotal;
        }

        for (const producto of productosPedido) {
            const [resultado] = await conexion.execute(
                `UPDATE variantes_producto
                 SET stock = stock - ?
                 WHERE id_variante = ?
                   AND stock >= ?`,
                [
                    producto.cantidad,
                    producto.id_variante,
                    producto.cantidad
                ]
            );

            if (resultado.affectedRows !== 1) {
                throw new Error("No se pudo actualizar el inventario.");
            }
        }

        db = await connectMongoDB();

        const documentoPedido = {
            id_usuario: usuario.id_usuario,
            cliente: usuario.nombre,
            correo: usuario.correo,
            productos: productosPedido,
            total,
            estado: "pendiente",
            fecha_de_registro: new Date()
        };

        const resultadoMongo = await db
            .collection(COLECCION_PEDIDOS)
            .insertOne(documentoPedido);

        pedidoInsertado = resultadoMongo.insertedId;

        await conexion.commit();

        return res.status(201).json({
            mensaje: "Pedido guardado correctamente.",
            id_pedido: pedidoInsertado.toString(),
            total,
            estado: "pendiente",
            productos: productosPedido
        });

    } catch (error) {
        if (conexion) {
            try {
                await conexion.rollback();
            } catch (errorRollback) {
                console.error(errorRollback.message);
            }
        }

        if (pedidoInsertado && db) {
            try {
                await db.collection(COLECCION_PEDIDOS).deleteOne({
                    _id: pedidoInsertado
                });
            } catch (errorMongo) {
                console.error(errorMongo.message);
            }
        }

        console.error("Error al crear pedido:", error.message);

        return res.status(500).json({
            mensaje: "No fue posible crear el pedido."
        });

    } finally {
        if (conexion) {
            conexion.release();
        }
    }
});

router.get(
    "/historial",
    verificarToken,
    verificarRol("administrador"),
    async (req, res) => {
        try {
            const db = await connectMongoDB();

            const pedidos = await db
                .collection(COLECCION_PEDIDOS)
                .find({})
                .sort({ fecha_de_registro: -1 })
                .toArray();

            return res.json({
                cantidad: pedidos.length,
                pedidos
            });

        } catch (error) {
            console.error(error.message);

            return res.status(500).json({
                mensaje: "Error al consultar el historial de pedidos."
            });
        }
    }
);

router.get("/mis-pedidos", verificarToken, async (req, res) => {
    try {
        const db = await connectMongoDB();

        const pedidos = await db
            .collection(COLECCION_PEDIDOS)
            .find({
                id_usuario: req.usuario.id_usuario
            })
            .sort({ fecha_de_registro: -1 })
            .toArray();

        return res.json({
            cantidad: pedidos.length,
            pedidos
        });

    } catch (error) {
        console.error(error.message);

        return res.status(500).json({
            mensaje: "Error al consultar tus pedidos."
        });
    }
});

router.get("/historial/:id", verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                mensaje: "El identificador del pedido no es válido."
            });
        }

        const db = await connectMongoDB();

        const pedido = await db
            .collection(COLECCION_PEDIDOS)
            .findOne({ _id: new ObjectId(id) });

        if (!pedido) {
            return res.status(404).json({
                mensaje: "No se encontró el pedido."
            });
        }

        const esAdministrador = req.usuario.rol === "administrador";
        const esPropietario =
            String(pedido.id_usuario) === String(req.usuario.id_usuario);

        if (!esAdministrador && !esPropietario) {
            return res.status(403).json({
                mensaje: "No tienes permiso para consultar este pedido."
            });
        }

        return res.json(pedido);

    } catch (error) {
        console.error(error.message);

        return res.status(500).json({
            mensaje: "Error al consultar el pedido."
        });
    }
});

router.put(
    "/historial/:id",
    verificarToken,
    verificarRol("administrador"),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    mensaje: "El identificador del pedido no es válido."
                });
            }

            const transicionesPermitidas = {
                pendiente: ["procesando"],
                procesando: ["enviado"],
                enviado: ["entregado"]
            };

            if (
                typeof estado !== "string" ||
                !["procesando", "enviado", "entregado"].includes(estado)
            ) {
                return res.status(400).json({
                    mensaje: "Estado no válido."
                });
            }

            const db = await connectMongoDB();
            const coleccion = db.collection(COLECCION_PEDIDOS);
            const objectId = new ObjectId(id);

            const pedido = await coleccion.findOne({
                _id: objectId
            });

            if (!pedido) {
                return res.status(404).json({
                    mensaje: "No se encontró el pedido."
                });
            }

            const estadosSiguientes =
                transicionesPermitidas[pedido.estado] || [];

            if (!estadosSiguientes.includes(estado)) {
                return res.status(409).json({
                    mensaje: `No se puede cambiar el pedido de ${pedido.estado} a ${estado}.`
                });
            }

            const resultado = await coleccion.updateOne(
                {
                    _id: objectId,
                    estado: pedido.estado
                },
                {
                    $set: {
                        estado,
                        fecha_actualizacion: new Date()
                    }
                }
            );

            if (resultado.modifiedCount !== 1) {
                return res.status(409).json({
                    mensaje: "El estado del pedido cambió. Consulta nuevamente."
                });
            }

            return res.json({
                mensaje: "Estado actualizado correctamente.",
                estado
            });

        } catch (error) {
            console.error(error.message);

            return res.status(500).json({
                mensaje: "Error al actualizar el pedido."
            });
        }
    }
);

router.post(
    "/historial/:id/cancelar",
    verificarToken,
    verificarRol("administrador"),
    async (req, res) => {
        let conexion;

        try {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    mensaje: "El identificador del pedido no es válido."
                });
            }

            const db = await connectMongoDB();
            const coleccion = db.collection(COLECCION_PEDIDOS);
            const objectId = new ObjectId(id);

            let pedido = await coleccion.findOneAndUpdate(
                {
                    _id: objectId,
                    estado: "pendiente"
                },
                {
                    $set: {
                        estado: "cancelando",
                        fecha_inicio_cancelacion: new Date()
                    }
                },
                {
                    returnDocument: "after"
                }
            );

            if (!pedido) {
                pedido = await coleccion.findOne({
                    _id: objectId
                });

                if (!pedido) {
                    return res.status(404).json({
                        mensaje: "No se encontró el pedido."
                    });
                }

                if (pedido.estado === "cancelado") {
                    return res.json({
                        mensaje: "El pedido ya estaba cancelado.",
                        estado: "cancelado"
                    });
                }

                if (pedido.estado !== "cancelando") {
                    return res.status(409).json({
                        mensaje: "Solo se pueden cancelar pedidos pendientes."
                    });
                }
            }

            if (
                !Array.isArray(pedido.productos) ||
                pedido.productos.length === 0
            ) {
                await coleccion.updateOne(
                    { _id: objectId, estado: "cancelando" },
                    {
                        $set: { estado: "pendiente" },
                        $unset: { fecha_inicio_cancelacion: "" }
                    }
                );

                return res.status(409).json({
                    mensaje: "El pedido no contiene productos válidos para devolver al inventario."
                });
            }

            for (const producto of pedido.productos) {
                if (
                    !Number.isInteger(Number(producto.id_variante)) ||
                    !Number.isInteger(Number(producto.cantidad)) ||
                    Number(producto.id_variante) <= 0 ||
                    Number(producto.cantidad) <= 0
                ) {
                    await coleccion.updateOne(
                        { _id: objectId, estado: "cancelando" },
                        {
                            $set: { estado: "pendiente" },
                            $unset: { fecha_inicio_cancelacion: "" }
                        }
                    );

                    return res.status(409).json({
                        mensaje: "El pedido no tiene los datos necesarios para devolver el inventario."
                    });
                }
            }

            conexion = await pool.getConnection();
            await conexion.beginTransaction();

            const [registroCancelacion] = await conexion.execute(
                `INSERT IGNORE INTO cancelaciones_pedidos (id_pedido)
                 VALUES (?)`,
                [id]
            );

            if (registroCancelacion.affectedRows === 1) {
                for (const producto of pedido.productos) {
                    const [resultadoStock] = await conexion.execute(
                        `UPDATE variantes_producto
                         SET stock = stock + ?
                         WHERE id_variante = ?`,
                        [
                            Number(producto.cantidad),
                            Number(producto.id_variante)
                        ]
                    );

                    if (resultadoStock.affectedRows !== 1) {
                        throw new Error(
                            `No se encontró la variante ${producto.id_variante}.`
                        );
                    }
                }
            }

            await conexion.commit();

            const actualizacion = await coleccion.updateOne(
                {
                    _id: objectId,
                    estado: "cancelando"
                },
                {
                    $set: {
                        estado: "cancelado",
                        fecha_cancelacion: new Date()
                    },
                    $unset: {
                        fecha_inicio_cancelacion: ""
                    }
                }
            );

            if (actualizacion.modifiedCount !== 1) {
                return res.status(500).json({
                    mensaje: "La devolución quedó registrada, pero no se pudo actualizar el estado. Reintenta la solicitud."
                });
            }

            return res.json({
                mensaje: "Pedido cancelado correctamente.",
                inventario: registroCancelacion.affectedRows === 1
                    ? "Devuelto correctamente."
                    : "La devolución ya estaba registrada.",
                estado: "cancelado"
            });

        } catch (error) {
            if (conexion) {
                try {
                    await conexion.rollback();
                } catch (errorRollback) {
                    console.error(errorRollback.message);
                }
            }

            console.error("Error al cancelar pedido:", error.message);

            return res.status(500).json({
                mensaje: "No fue posible completar la cancelación."
            });

        } finally {
            if (conexion) {
                conexion.release();
            }
        }
    }
);

router.delete(
    "/historial/:id",
    verificarToken,
    verificarRol("administrador"),
    async (req, res) => {
        return res.status(405).json({
            mensaje: "Los pedidos se conservan en el historial. Utiliza la ruta de cancelación."
        });
    }
);

module.exports = router;
