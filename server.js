const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({ port: PORT });

const jugadores = new Map();

console.log(`Servidor WebSocket iniciado en puerto ${PORT}`);


function comprobarSiEsUnservidor(request){
    const userAgent = request.headers["user-agent"] || "";
    return userAgent === "ConejitoPC-Server-Monitor/1.0";
}

wss.on("connection", (socket, request) => {

    if(comprobarSiEsUnservidor(request)){
       socket.close();
        return; 
    }
    

    // Buscar el primer ID disponible
    let jugadorId = 1;

    while (jugadores.has(jugadorId)) {
        jugadorId++;
    }

    jugadores.set(jugadorId, {
        socket: socket,
        estado: null
    });

    /*console.log("Jugador conectado. ID:", jugadorId);

    console.log(
        "cantidad de jugadores en línea:",
        jugadores.size
    );*/


    // Avisarle al jugador cuál es su ID
    socket.send(JSON.stringify({
        tipo: "id",
        jugador: jugadorId
    }));


    /*
     * Enviar al jugador nuevo el último estado
     * conocido de todos los jugadores que ya estaban.
     */
    for (const [id, jugador] of jugadores) {

        // No mandarnos a nosotros mismos
        if (id === jugadorId) {
            continue;
        }

        if (
            jugador.socket.readyState === WebSocket.OPEN &&
            jugador.estado !== null
        ) {

            socket.send(JSON.stringify({
                tipo: "movimiento",
                jugador: id,

                x: jugador.estado.x,
                y: jugador.estado.y,

                spriteDelJugador: jugador.estado.sprite,
                frameDelJugador: jugador.estado.frame,

                nivelActual: jugador.estado.nivelActual,
                nivelTerminado: jugador.estado.nivelTerminado,
                modoMuerto: jugador.estado.modoMuerto
            }));
        }
    }


    enviarCantidadJugadores();


    socket.on("message", (data) => {

        /*console.log(
            "Posición recibida del jugador",
            jugadorId + ":",
            data.toString()
        );*/

        const posicion = JSON.parse(data.toString());


        /*
         * Guardamos el último estado conocido
         * de este jugador.
         */
        const jugador = jugadores.get(jugadorId);

        if (jugador !== undefined) {

            jugador.estado = {

                x: posicion.x,
                y: posicion.y,

                sprite: posicion.sprite,
                frame: posicion.frame,

                nivelActual: posicion.nivelActual,
                nivelTerminado: posicion.nivelTerminado,
                modoMuerto: posicion.modoMuerto
            };
        }


        /*
         * Creamos el mensaje que será enviado
         * a los demás jugadores.
         */
        const mensaje = JSON.stringify({

            tipo: "movimiento",
            jugador: jugadorId,

            x: posicion.x,
            y: posicion.y,

            spriteDelJugador: posicion.sprite,
            frameDelJugador: posicion.frame,

            nivelActual: posicion.nivelActual,
            nivelTerminado: posicion.nivelTerminado,
            modoMuerto: posicion.modoMuerto
        });


        // Mandar la información a todos los demás jugadores
        for (const [id, cliente] of jugadores) {

            if (
                id !== jugadorId &&
                cliente.socket.readyState === WebSocket.OPEN
            ) {
                cliente.socket.send(mensaje);
            }
        }
    });


    socket.on("close", () => {

        jugadores.delete(jugadorId);

        /*console.log(
            "Jugador desconectado. ID:",
            jugadorId
        );

        console.log(
            "cantidad de jugadores en línea:",
            jugadores.size
        );*/


        // Avisar a los demás jugadores
        const mensaje = JSON.stringify({
            tipo: "desconectado",
            jugador: jugadorId
        });


        for (const jugador of jugadores.values()) {

            if (
                jugador.socket.readyState === WebSocket.OPEN
            ) {
                jugador.socket.send(mensaje);
            }
        }


        enviarCantidadJugadores();

    });


    function enviarCantidadJugadores() {

        const mensaje = JSON.stringify({
            tipo: "jugadoresConectados",
            cantidad: jugadores.size
        });

        for (const jugador of jugadores.values()) {

            if (
                jugador.socket.readyState === WebSocket.OPEN
            ) {
                jugador.socket.send(mensaje);
            }
        }
    }

});