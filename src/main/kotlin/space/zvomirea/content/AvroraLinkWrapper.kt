package space.zvomirea.content

import space.zvomirea.model.Resource
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import javax.ws.rs.GET
import javax.ws.rs.Path
import javax.ws.rs.PathParam
import javax.ws.rs.core.MediaType
import javax.ws.rs.core.Response

@Path("/{path:.+}")
class AvroraLinkWrapper {

    private var filesMap = mutableMapOf(
        "student/css/modules/task-dark.css" to Resource("task-dark.css", "text/css"),
        "student/js/app.js" to Resource("app.js", "application/js"),
        "student/js/modules/task/tools/code.js" to Resource("code.js", "application/js")
    )

    @GET
    fun hello(@PathParam("path") path: String): Response {
        println(path)
        if (path == "student/" || path == "student") {
            return Response.ok(File("avrora/index.html").readBytes(), MediaType.TEXT_HTML).build()
        } else if (filesMap.containsKey(path)) {
            return Response.ok(File("avrora/" + filesMap[path]?.path).readBytes(), filesMap[path]?.type).build()
        } else {
            val url = URL("https://mirea.aco-avrora.ru/" + path)
            with(url.openConnection() as HttpURLConnection) {
                requestMethod = "GET"
                setRequestProperty(
                    "User-Agent",
                    "Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.14.2 Chrome/77.0.3865.129 Safari/537.36"
                )
                setRequestProperty("Origin", "mirea.aco-avrora.ru")
                setRequestProperty("Referer", "https://mirea.aco-avrora.ru")

                return Response.ok(inputStream.readBytes(), getHeaderField("Content-Type")).build()
            }
        }

    }
}