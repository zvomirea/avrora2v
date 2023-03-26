package space.zvomirea;

import io.quarkus.runtime.Quarkus;
import io.quarkus.runtime.annotations.QuarkusMain;


@QuarkusMain
public class Main {
    public static void main(String[] args) {
        MainWebsocket.Companion.start();
        Quarkus.run(args);
    }
}
