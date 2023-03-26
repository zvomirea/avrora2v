## Avrora Research
> ### Дисклеймер
> Автор не несёт ответственности за блокировку аккаунтов/адресов за неправомерное использование модификации. Сделано в образовательных целях. Не несёт негативный подтекст. Использование модификаций ACO Avrora может караться представителяит ВУЗа. Может быть удалено по требованию правообладателя.
> У данного исследования не было целей как-либо навредить программной системе и образовательному процессу
> <br>
> <div align="center">
> <img src="images/diskleimer.jpg" width=200>
> </div>

## Установка и запуск (Windows native)
* Перейти в раздел релизов
* Скачать последнюю сборку в виде zip файла (ARM_STUDENT_NATIVE.zip)
* Распаковать её в основную папку авроры
* Запустить avrora2v.exe
* Запустить Аврору

## Установка и запуск (Из jar)
* Перейти в раздел релизов
* Скачать последнюю сборку в виде zip файла
* Распаковать её в основную папку авроры
* Запустить start.bat
  * Для его запуска необходима java11+ установленная по умолчанию
  * Либо скачать jdk11 в директорию Авроры и изменить start.bat
* Запустить Аврору

## Сборка
* Склонировать или скачать данный репозиторий
* `mvn install`


## Небольшое вступление
Уверен, каждый студент РТУ МИРЭА института Информационных технологий сталкивался, ну или хотя бы слышал, о так горячо нелюбимой студентами АВРОРЕ.

Ну и я конечно не исключение. Однако вместо того, чтобы просто на неё жаловаться, я решил, что интересным решением будет её анализ.
Собственно поэтому я и здесь. Ну что ж начнём её лома... то есть анализировать.

Сама по себе эта программа представляет набор фич для того, чтобы научиться правильно писать и оформлять код

## Первый взгляд
Ну логично предположить, что первым моим действием с авророй стал её запуск.
Однако это был не простой запуск, а запуск без интернета. 
И о чудо, мы уже что-то находим.

<img src="images\withoutInternet.png" width=400>

Какие уже из этого можно сделать выводы
* Собранный файл авроры - лишь движок для отрисовки вэб страниц
* Основной домен авроры - mirea.aco-avrora.ru

Уже неплохо. Попробуем пойти дпльше. Проверим этот домен.

<img src="images\not_found.png" width=300>

Грустно, это явно не тот результат, что мы ожидали. Ну что ж играем по крупному

## Анализ авроры
Раз аврора подсказок не даёт, найдём их сами.
Для этого как-никак кстати подойдёт Charles Proxy. Запустим аврору и начнём отслеживать запросы

<img src="images\student.png" width=400>
<img src="images\ws.png" width=300>

Ого, сразу находим интересную нам информацию. Вкратце:
* Оказывается, Аврора работает с каталогом /student/
* Для того чтобы подключиться к ней необходим специальный User-Agent
* Сама Аврора общается с сервером посредством вэбсокетов.

Попытаемся зайти на сайт с этими данными.

И тут мы сталкиваемся с проблемой. Да, работает вэбсокет и грузится информация, да - ты можешь попробовать ввести свои данные, но увы - авторизоваться не получиться.

Почему? - Всё просто, Аврора для авторизации генерирует специальный код по полученным с сервера данным.  Ниже приведён кусок кода авторизации.
```js
var hash = CryptoJS.MD5(_clgGen+'_'+password+'_'+d.data).toString();
if(DS.ArmAPI){
    var t = setTimeout(function(){
        fn('timeout');
        }, 10000);
    try{
        // console.error('signRequest');
        DS.ArmAPI.signRequest(idUser, hash, function(d){
            fn(d);
            clearTimeout(t);
        });
    }
    catch(e){
        fn(e.toString());
        clearTimeout(t);
    }
}
else{
    fn(CryptoJS.SHA256(hash).toString());
}
return;
```

Получается, что Аврора ищет какой-то ArmAPI, чтобы войти в аккаунт.
Чуть поискав в файлах находим что этот ArmAPI такое.

```js
new QWebChannel(qt.webChannelTransport, function (channel) {
    try {
        DS.ArmAPI = channel.objects.ArmAPI;
        _close = DS.ArmAPI.close.bind(DS.ArmAPI);
        if (_dt) {
            DS.ArmAPI.close();
        }
    } catch (e) {
        console.error(e);
    }
    if (_isConnected) {
        start();
    } else {
        DS.addEvent(DS, 'ws/connected', function () {
            start();
        });
    }
});
```

Ну глядя на этот кусок кода сразу становится понятно, что ArmAPI связан непосредственно с самим клиентом.
Что ж, нужно копать дальше.

Недельные раскопки exe файла с помощью Cutter и Ghidra практически не дали результатов. Были найдены заголовки функций, по которым вэб общается с авророй, однако сами эти функции разобрать не удалось.

Была найдена директория в Appdata - Appdata/Local/DogmaNet/{AVRORA_CLIENT_NAME} в который хранился кэш Авроры

Так же был найден адрес строковый ресурс, содержащий URL сервера авроры.

## Первые попытки модификации
Первые попытки модификации заключались в подмене файлов с помощью прокси. Для этого мне помог модуль mitmproxy, который с помощью python скрипта мог подменять нужные мне файлы.

Этот скрипт выглядел примерно так.
```python
from mitmproxy import http

def response(flow):
    if "app.js" in flow.request.url and "mirea" in flow.request.url:
        with open("app2.js",mode="rb") as f:
            flow.response.content = f.read()
    if "ws.js" in flow.request.url and "mirea" in flow.request.url:
         with open("ws.js",mode="rb") as f:
            flow.response.content = f.read()
    if "proxy.js" in flow.request.url and "mirea" in flow.request.url:
         with open("proxy.js",mode="rb") as f:
            flow.response.content = f.read()
    if "modules/task/tools/code.js" in flow.request.url:
        with open("modules/task/tools/code.js",mode="rb") as f:
            flow.response.content = f.read()
    if "css/modules/task-dark.css" in flow.request.url:
        with open("css/modules/task-dark.css",mode="rb") as f:
            flow.response.content = f.read()
```

И уже интереснее, теперь я мог менять внешний вид и скрипты авроры так как захочу.

Но для того чтобы это работало необходимо слишком много действий
* Установить python
* Установить mitmproxy
* Во время работы с авророй включить прокси на 0.0.0.0:8080
* Запустить скрипт для mitmproxy
* Запустить аврору
* После завершения работы отключить скрипт и выключить прокси на своём компьютере

Да, это слишком долго, не пойдёт.

## Создание Kotlin сервера между авророй и её сервером

Исходя из всего выше сказанного я решил сделать сервер между Авророй и её бэкендом.
Первой попыткой стал nginx, однако так и не получилось его сконфигурировать так, чтобы он нормаьлно отдавал запросы когда мне это было нужно.

После я написал сервер, который редиректит все запросы с локалхоста на сервер Авроры. Тут возникла проблема с вэбсокетом, тк Origin заголовок отличался от оригинального. Пришлось подделать и его.
Ниже представлены функции для получения файлов с серверов Авроры и обёртка для вэбсокета.
```kotlin
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
```

```kotlin
removeHeader("Origin")
addHeader("Origin", "https://mirea.aco-avrora.ru")
addHeader("User-Agent", "Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.14.2 Chrome/77.0.3865.129 Safari/537.36")
```

В конце концов я поменял адрес в клиенте Авроры и заставил её работать по моим сценариям.

Собственно, анализ Авроры на этом можно считать **завершённым**.