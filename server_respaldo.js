const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

console.log("Servidor WebSocket iniciado en puerto 8080");

wss.on("connection", (socket) => {
    console.log("Jugador conectado");

    socket.on("message", (data) => {
        // Recibimos algo como:
        // {"x":450,"y":280}

        console.log("Posición recibida:", data.toString());

        // Reenviar la posición a todos los demás jugadores
        for (const cliente of wss.clients) {
            if (cliente !== socket && cliente.readyState === WebSocket.OPEN) {
                cliente.send(data.toString());
            }
        }
    });

    socket.on("close", () => {
        console.log("Jugador desconectado");
    });
});

