
const express = require("express");
const { ObjectId } = require("mongodb");
const { connectMongoDB } = require("../config/database");

const router = express.Router();


router.post("/historial", async (req, res) => {
    try {
        const db = await connectMongoDB();

        const pedido = {
            ...req.body,
            fecha_registro: new Date()
        };

        const resultado = await db
            .collection("historial_pedidos")
            .insertOne(pedido);

        res.status(201).json({
            mensaje: "Pedido guardado correctamente",
            id: resultado.insertedId
        });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al guardar el pedido",
            error: error.message
        });
    }
});


router.get("/historial", async (req, res) => {
    try {
        const db = await connectMongoDB();

        const pedidos = await db
            .collection("historial_pedidos")
            .find({})
            .toArray();

        res.json(pedidos);

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al consultar los pedidos"
        });
    }
});


router.get("/historial/:id", async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                mensaje: "ID de pedido no válido"
            });
        }

        const db = await connectMongoDB();

        const pedido = await db
            .collection("historial_pedidos")
            .findOne({
                _id: new ObjectId(req.params.id)
            });

        if (!pedido) {
            return res.status(404).json({
                mensaje: "Pedido no encontrado"
            });
        }

        res.json(pedido);

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al consultar el pedido"
        });
    }
});


router.put("/historial/:id", async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                mensaje: "ID de pedido no válido"
            });
        }

        const db = await connectMongoDB();

        const { _id, ...datos } = req.body;

        const resultado = await db
            .collection("historial_pedidos")
            .updateOne(
                { _id: new ObjectId(req.params.id) },
                { $set: datos }
            );

        if (resultado.matchedCount === 0) {
            return res.status(404).json({
                mensaje: "Pedido no encontrado"
            });
        }

        res.json({
            mensaje: "Pedido actualizado correctamente"
        });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al actualizar el pedido"
        });
    }
});


router.delete("/historial/:id", async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                mensaje: "ID de pedido no válido"
            });
        }

        const db = await connectMongoDB();

        const resultado = await db
            .collection("historial_pedidos")
            .deleteOne({
                _id: new ObjectId(req.params.id)
            });

        if (resultado.deletedCount === 0) {
            return res.status(404).json({
                mensaje: "Pedido no encontrado"
            });
        }

        res.json({
            mensaje: "Pedido eliminado correctamente"
        });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al eliminar el pedido"
        });
    }
});

module.exports = router;
