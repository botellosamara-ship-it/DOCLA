const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        mensaje: "API de DOCLA funcionando correctamente"
    });
});
app.get("/api/productos", (req, res) => {
    
    const productos = [
        {
            id_producto: 1,
            nombre: "Camiseta DOCLA",
            descripcion: "Camiseta streetwear",
            precio: 45000,
            talla: "M",
            color: "Negro",
            stock: 10
        },
        {
            id_producto: 2,
            nombre: "Jean Street",
            descripcion: "Jean de estilo urbano",
            precio: 90000,
            talla: "30",
            color: "Azul",
            stock: 8
        }
    ];

   
    res.json(productos);
});
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

