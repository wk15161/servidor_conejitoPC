const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({ port: PORT });


const jugadores = new Map();

console.log(`Servidor WebSocket iniciado en puerto ${PORT}`);


wss.on("connection", (socket) => {

    // Buscar el primer ID disponible
    let jugadorId = 1;

    while (jugadores.has(jugadorId)) {
        jugadorId++;
    }

    jugadores.set(jugadorId, socket);

    console.log("Jugador conectado. ID:", jugadorId);

    console.log(
        "cantidad de jugadores en línea: ",
        jugadores.size
    )


    // Avisarle al jugador cuál es su ID
    socket.send(JSON.stringify({
        tipo: "id",
        jugador: jugadorId
    }));

    enviarCantidadJugadores();


    socket.on("message", (data) => {

        /*console.log(
            "Posición recibida del jugador",
            jugadorId + ":",
            data.toString()
        );*/

        const posicion = JSON.parse(data.toString());

        const mensaje = JSON.stringify({
            tipo: "movimiento",
            jugador: jugadorId,

            x: posicion.x,
            y: posicion.y,

            /*modoAparecer: posicion.modoAparecer,
            modoMuerto: posicion.modoMuerto,
            modoDesaparecer: posicion.modoDesaparecer,
            modoQuieto: posicion.modoQuieto,
            dentroDelAgua: posicion.dentroDelAgua,

            direccionDelJugador: posicion.direccionDelJugador*/

            spriteDelJugador: posicion.sprite,
            frameDelJugador: posicion.frame,
            nivelActual: posicion.nivelActual,
            nivelTerminado: posicion.nivelTerminado,
            modoMuerto: posicion.modoMuerto
        });


        // Mandar la posición a todos los demás jugadores
        for (const cliente of wss.clients) {

            if (
                cliente !== socket &&
                cliente.readyState === WebSocket.OPEN
            ) {
                cliente.send(mensaje);
            }
        }
    });


    socket.on("close", () => {

        jugadores.delete(jugadorId);

        console.log(
            "Jugador desconectado. ID:",
            jugadorId
        );
        console.log(
            "cantidad de jugadores en línea: ",
            jugadores.size
        )


        // Avisar a los demás jugadores
        const mensaje = JSON.stringify({
            tipo: "desconectado",
            jugador: jugadorId
        });


        for (const cliente of wss.clients) {

            if (cliente.readyState === WebSocket.OPEN) {
                cliente.send(mensaje);
            }
        }

        enviarCantidadJugadores();

    });


    function enviarCantidadJugadores() {
    const mensaje = JSON.stringify({
        tipo: "jugadoresConectados",
        cantidad: jugadores.size
    });

    for (const cliente of wss.clients) {
        if (cliente.readyState === WebSocket.OPEN) {
            cliente.send(mensaje);
        }
    }
}
});


