package space.zvomirea

import org.java_websocket.server.WebSocketServer
import space.zvomirea.websocket.MitmWebsocketServer
import java.net.InetSocketAddress

class MainWebsocket {

    companion object {
        fun start(){
            val host = "localhost"
            val port = 8001

            val server: WebSocketServer = MitmWebsocketServer(InetSocketAddress(host, port))
            Thread(server).start()
        }
    }

}