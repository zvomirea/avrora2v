package space.zvomirea.websocket

import org.java_websocket.client.WebSocketClient
import org.java_websocket.handshake.ServerHandshake
import java.lang.Exception
import java.net.URI

class AvroraClient : WebSocketClient {


    private var onMessage: ((String) -> Unit)

    constructor(uri: URI, onMessage: (String) -> Unit) : super(uri) {
        removeHeader("Origin")
        removeHeader("")
        addHeader("Origin", "https://mirea.aco-avrora.ru")
        addHeader("User-Agent", "Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.14.2 Chrome/77.0.3865.129 Safari/537.36")
        this.onMessage = onMessage
    }

    override fun onOpen(p0: ServerHandshake?) {
        println("CONNECTED TO AVRORA")
    }

    override fun onMessage(p0: String?) {
        if (p0 != null) {
            onMessage.invoke(p0)
        }
    }

    override fun onClose(p0: Int, p1: String?, p2: Boolean) {
        println("CLIENT_CLOSED")
    }

    override fun onError(p0: Exception?) {
        println(p0)
    }
}