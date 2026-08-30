const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

let siguienteId = 1;
const jugadores = new Map();

console.log("Servidor WebSocket iniciado en puerto 8080");

wss.on("connection", (socket) => {

    // Buscar el primer ID disponible
    let jugadorId = 1;

    while (jugadores.has(jugadorId)) {
        jugadorId++;
    }

    jugadores.set(jugadorId, socket);

    console.log("Jugador conectado. ID:", jugadorId);

    socket.on("message", (data) => {

        console.log(
            "Posición recibida del jugador",
            jugadorId + ":",
            data.toString()
        );

        const posicion = JSON.parse(data.toString());

        const mensaje = JSON.stringify({
            jugador: jugadorId,
            x: posicion.x,
            y: posicion.y
        });

        for (const cliente of wss.clients) {
            if (cliente !== socket && cliente.readyState === WebSocket.OPEN) {
                cliente.send(mensaje);
            }
        }
    });

    socket.on("close", () => {

        jugadores.delete(jugadorId);

        console.log("Jugador desconectado. ID:", jugadorId);
    });
});
