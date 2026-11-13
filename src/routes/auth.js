
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { pool } = require("../config/database");

const {
    verificarToken,
    verificarRol
} = require("../middleware/auth");

const router = express.Router();

router.post("/registro", async (req, res) => {
    try {
        const { nombre, correo, contrasena } = req.body;

        if (!nombre || !correo || !contrasena) {
            return res.status(400).json({
                mensaje: "Todos los campos son obligatorios"
            });
        }

        if (
            typeof nombre !== "string" ||
            typeof correo !== "string" ||
            typeof contrasena !== "string"
        ) {
            return res.status(400).json({
                mensaje: "Los datos enviados no son válidos"
            });
        }

        const nombreLimpio = nombre.trim();
        const correoLimpio = correo.trim().toLowerCase();

        if (!nombreLimpio || !correoLimpio) {
            return res.status(400).json({
                mensaje: "Nombre y correo no pueden estar vacíos"
            });
        }

        if (contrasena.length < 8) {
            return res.status(400).json({
                mensaje: "La contraseña debe tener al menos 8 caracteres"
            });
        }

        const [usuariosExistentes] = await pool.execute(
            "SELECT id_usuario FROM usuarios WHERE correo = ?",
            [correoLimpio]
        );

        if (usuariosExistentes.length > 0) {
            return res.status(409).json({
                mensaje: "Este correo ya está registrado"
            });
        }

        const contrasenaHash = await bcrypt.hash(contrasena, 12);

        const [resultado] = await pool.execute(
            `INSERT INTO usuarios
            (nombre, correo, contrasena, rol)
            VALUES (?, ?, ?, 'cliente')`,
            [nombreLimpio, correoLimpio, contrasenaHash]
        );

        res.status(201).json({
            mensaje: "Usuario registrado correctamente",
            id_usuario: resultado.insertId
        });

    } catch (error) {
        console.error("Error en el registro:", error.message);

        res.status(500).json({
            mensaje: "Error al registrar el usuario"
        });
    }
});



router.post("/login", async (req, res) => {
    try {
        const { correo, contrasena } = req.body;

        if (
            typeof correo !== "string" ||
            typeof contrasena !== "string" ||
            !correo.trim() ||
            !contrasena
        ) {
            return res.status(400).json({
                mensaje: "Correo y contraseña son obligatorios"
            });
        }

        const correoLimpio = correo.trim().toLowerCase();

        const [usuarios] = await pool.execute(
            "SELECT * FROM usuarios WHERE correo = ?",
            [correoLimpio]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                mensaje: "Correo o contraseña incorrectos"
            });
        }

        const usuario = usuarios[0];

        const contrasenaValida = await bcrypt.compare(
            contrasena,
            usuario.contrasena
        );

        if (!contrasenaValida) {
            return res.status(401).json({
                mensaje: "Correo o contraseña incorrectos"
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET no está configurada");
        }

        const token = jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                correo: usuario.correo,
                rol: usuario.rol
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "2h"
            }
        );

        res.json({
            mensaje: "Inicio de sesión exitoso",
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error("Error en el inicio de sesión:", error.message);

        res.status(500).json({
            mensaje: "Error al iniciar sesión"
        });
    }
});



router.get("/perfil", verificarToken, async (req, res) => {
    try {
        const [usuarios] = await pool.execute(
            `SELECT id_usuario, nombre, correo, rol
             FROM usuarios
             WHERE id_usuario = ?`,
            [req.usuario.id_usuario]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado"
            });
        }

        res.json({
            mensaje: "Perfil consultado correctamente",
            usuario: usuarios[0]
        });

    } catch (error) {
        console.error("Error al consultar el perfil:", error.message);

        res.status(500).json({
            mensaje: "Error al consultar el perfil"
        });
    }
});



router.get(
    "/admin",
    verificarToken,
    verificarRol("administrador"),
    (req, res) => {
        res.json({
            mensaje: "Acceso autorizado para administrador"
        });
    }
);



module.exports = router;

