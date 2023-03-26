package space.zvomirea.websocket

import org.java_websocket.WebSocket
import org.java_websocket.handshake.ClientHandshake
import org.java_websocket.server.WebSocketServer
import java.net.InetSocketAddress
import java.net.URI

class MitmWebsocketServer(address: InetSocketAddress?) : WebSocketServer(address) {

    private var webSocketClient: AvroraClient? = null;

    override fun onOpen(p0: WebSocket?, p1: ClientHandshake?) {
//        webSocketClient = space.zvomirea.websocket.AvroraClient(URI("ws://localhost:8886")) { message ->
        webSocketClient = AvroraClient(URI("wss://mirea.aco-avrora.ru/student/arm/")) { message ->
            p0?.send(message)
        }
        webSocketClient?.connect()
    }

    override fun onClose(p0: WebSocket?, p1: Int, p2: String?, p3: Boolean) {
        webSocketClient?.close()
    }

    override fun onMessage(p0: WebSocket?, p1: String?) {
        while (webSocketClient == null || !webSocketClient!!.isOpen){
//            println("CLOSED")
            Thread.sleep(10)
        }
        webSocketClient?.send(p1)
    }

    override fun onError(p0: WebSocket?, p1: Exception?) {

    }

    override fun onStart() {

    }
}