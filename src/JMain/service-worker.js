// TODO:
// Peticiones invalida online
// Validar catch con fallas en cada promise
// Validar performance de la aplicación con un archivo grande
// Validar si se requiere usar fnHandleMessagesError, para utilizar con el patrón command

self.importScripts('/assets/js/workers/requester-tools.js');

// Varables del módulo
self.requester = {};

// Definición del módulo
(function () {
    // Variables privadas
    let CACHE_VERSION = self.tools.constants.CACHE_VERSION,
        HEADER_JR = self.tools.constants.HEADER_JR,
        CACHE_FILES = [
            "assets/css/no-save.css",
            "assets/fonts/fontawesome-webfont.ttf",
            "assets/fonts/fontawesome-webfont.woff2",
            "assets/fonts/roboto/Roboto-Light.ttf",
            "assets/fonts/roboto/Roboto-Light.woff2",
            "assets/js/jmain.js",
            "assets/js/workers/requester-worker.js",
            "assets/js/workers/requester-tools.js",
            "controllers/controller-main.js",
            "favicon.ico",
            "index.html"
        ],
        CACHE_CURRENT,
        ORIGIN_PATH = '',
        FILESTOUPDATE = 'assets/config/filesToUpdate.json',
        INIT_SERVICE = false,
        paths = [];

    // Inicio Service Worker
    paths = location.href.split('/');
    ORIGIN_PATH = paths.splice(0, paths.length - 1).join('/');
    ORIGIN_PATH += '/';
    
    // Errores    
    self.tools.factoryError(fnHandleMessagesError);

	/*
		//---------------------------------
		// Función para obtener los archivos estaticos
		//---------------------------------
	*/
    function fnInit() {
        if (INIT_SERVICE) return Promise.resolve();
        return caches.keys().then(keys => {
            return Promise.all(keys.map((key, i) => {
                if (key !== CACHE_VERSION) return caches.delete(keys[i]);
            }))
            .then(() => caches.has(CACHE_VERSION).then(result => {
                let promiseCache = caches.open(CACHE_VERSION);
                return result ? promiseCache.then(assignCache) : promiseCache.then(cache => assignCache(cache).addAll(CACHE_FILES));
            })
            .then(() => INIT_SERVICE = true));
        }).catch(self.tools.error);

        function assignCache(cache) {
            return CACHE_CURRENT = cache;
        }
    } // end function
    //---------------------------------

	/*
		//---------------------------------
		// Una vez se registra el service worker éste se instala, y se pueden agregar archivos,
		// para que sean descargados en cache.
		//---------------------------------
		// Parámetros:
		//---------------------------------
		// @event:  Evento de install.
		//---------------------------------
	*/
    function fnInstall(event) {
        var promiseCache;

        promiseCache = fnInit().then(function () {
            // fuerza a que éste se active
            return self.skipWaiting();
        }).catch(self.tools.error);

        // Espera a que se obtengan los archivos iniciales de cache
        event.waitUntil(promiseCache);
    } // end function
    //---------------------------------

	/*
		//---------------------------------
		// Una vez se instala el service worker éste se activa, y se elimina la cache,
		// para que sean descargados en cache.
		//---------------------------------
		// Parámetros:
		//---------------------------------
		// @event:  Evento de active.
		//---------------------------------
	*/
    function fnActivate(event) {
        // Se eliminan versiones de cache si este ha cambiado
        var promiseCache = fnInit().then(function () {
            // Se asegura que se efectue el service worker de manera inmediata
            return self.clients.claim();
        }).catch(self.tools.error);

        // Espera a que se elimine la cache
        event.waitUntil(promiseCache);
    } // end function
    //---------------------------------

	/*
		//---------------------------------
		// Éste evento filtra todas las peticiones hacia el servidor, y maneja estas, de tal forma
		// decide si enviar la petición al serividor o usar una versión local de la respuesta.
		//---------------------------------
		// Parámetros:
		//---------------------------------
		// @event:  Evento de fetch.
		//---------------------------------
	*/
    function fnFetch(event) {
        // Peticiones realizadas desde worker o para saltarse el cacheStorage
        if(event.request.headers.has(HEADER_JR)) {
            event.request.headers.remove(HEADER_JR);
            return event.respondWith(fetch(event.request));
        }

        let promiseCache = fnInit().then(function () {
            let OFFLINEURL = 'index.html',
                HASHTAG = '#!',
                request = event.request,
                requestUrl = request.url.replace(ORIGIN_PATH, ''),
                targetUrl;

            targetUrl = (!requestUrl || requestUrl.includes(HASHTAG)) ? OFFLINEURL : requestUrl;

            return CACHE_CURRENT.match(targetUrl).then((responseCache) => {
                if(responseCache) return responseCache;
                return fetch(event.request).then((response) => {
                    if (!response || response.status !== 200) return response;
                    CACHE_CURRENT.put(event.request, response.clone());
                    return response;
                });
            });
        });

        // Realiza la petición al cacheStorage o al servidor
        return event.respondWith(promiseCache);
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Se ejecuta cuando la aplicación principal envia datos y con esto se hace
        // el manejo de los archivos a actualizar con el archivo filesToUpdate
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // @event:  Evento de message.
        //---------------------------------
        // Retorna: Promesa de la petición usando fetch
        //---------------------------------
    */
    function fnMessage(event) {
        if (!navigator.onLine && event.data.src == FILESTOUPDATE) {
            return event.ports[0].postMessage({ result: [], path: FILESTOUPDATE, observedId: event.data.observedId });
        }

        // Se obtiene la respuesta y esta es enviada al servidor
        return self.tools.getFile(event.data).then(function (datos) {
            return event.ports[0].postMessage(datos);
        }, function (error) {
            return event.ports[0].postMessage(error);
        });
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Se envia a los clientes el mensaje que se pasa como párametro
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // @msj:    {object}    Información de la petición a realizar.
        //---------------------------------
    */
    function fnHandleMessagesError(msj) {
        self.clients.matchAll().then(function (clients) {
            clients.forEach(function (client) {
                send_message_to_client(client, msj);
            });
        });
    } // fin método
    //---------------------------------

    function send_message_to_client(client, msg) {
        return new Promise(function (resolve, reject) {
            var msg_chan = new MessageChannel();

            msg_chan.port1.onmessage = function (event) {
                if (event.data.error) {
                    reject(event.data.error);
                } else {
                    resolve(event.data);
                }
            };

            client.postMessage("SW Says: '" + msg + "'", [msg_chan.port2]);
        });
    }

    //---------------------------------
    // Public API
    this.install = fnInstall;
    this.activate = fnActivate;
    this.fetch = fnFetch;
    this.message = fnMessage;
    this.error = fnHandleMessagesError;
    //---------------------------------
}).call(self.requester);

// Asignación de eventos
self.addEventListener('install', self.requester.install);
self.addEventListener('activate', self.requester.activate);
self.addEventListener('fetch', self.requester.fetch);
self.addEventListener('message', self.requester.message);