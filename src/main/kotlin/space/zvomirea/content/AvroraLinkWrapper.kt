package space.zvomirea.content

import space.zvomirea.model.Resource
import java.io.File
import java.io.PrintStream
import java.io.PrintWriter
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLConnection
import java.nio.file.Files
import java.util.Scanner
import javax.ws.rs.GET
import javax.ws.rs.Path
import javax.ws.rs.PathParam
import javax.ws.rs.core.MediaType
import javax.ws.rs.core.Response

@Path("/{path:.+}")
class AvroraLinkWrapper {

    private val listFiles = ArrayList<String>()

    @GET
    fun hello(@PathParam("path") path: String): Response {
        if (listFiles.isEmpty()) {
            val s = Scanner(File("avrora/indexing"))
            while (s.hasNextLine())
                listFiles.add(s.nextLine())
        }

        if (path == "student/" || path == "student") {
            return Response.ok(File("avrora/index.html").readBytes(), MediaType.TEXT_HTML).build()
        } else if (listFiles.contains(path)) {
            return Response.ok(File("avrora/$path").readBytes(), URLConnection.guessContentTypeFromName(path)).build()
        } else {
            println(path)
            val url = URL("https://mirea.aco-avrora.ru/" + path)
            with(url.openConnection() as HttpURLConnection) {
                requestMethod = "GET"
                setRequestProperty(
                    "User-Agent",
                    "Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.14.2 Chrome/77.0.3865.129 Safari/537.36"
                )
                setRequestProperty("Origin", "mirea.aco-avrora.ru")
                setRequestProperty("Referer", "https://mirea.aco-avrora.ru")

                val bytes = inputStream.readBytes()
                return Response.ok(bytes, getHeaderField("Content-Type")).build()
            }
        }
    }

    private fun downloadFile(name: String, bytes: ByteArray) {
        val f = File("avrora/" + name)
        if (f.exists())
            return
        f.parentFile.mkdirs()
        f.createNewFile()
        f.writeBytes(bytes)
    }


}