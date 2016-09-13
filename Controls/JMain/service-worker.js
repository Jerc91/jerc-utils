if(!self.Promise) self.importScripts('https://www.promisejs.org/polyfills/promise-6.1.0.js');
if(!self.Request) self.importScripts('assets/js/polyfills/fetch.js');
if(!self.tools) self.importScripts('assets/js/workers/worker-tools.js');

// Varables del módulo
var ajax = {};

// Definición del módulo
(function() {
    // Variables privadas
    var CACHE_VERSION = 'app-v1';
    var CACHE_FILES = [];
    var SIZE_BLOB_DATE = SIZE_BLOB_DATE || self.tools.ajax.getBlobDate().size;
    var currentCache;

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
        var promiseCache = caches.open(CACHE_VERSION).then(function(cache) {
            // Se agregan los archivos para descargar
            return cache.addAll(CACHE_FILES);
        }).catch(function(err) { self.tools.ajax.error(new Error(err).stack); });

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
        var promiseCache = caches.keys().then(function(keys) {
            return Promise.all(keys.map(function(key, i) {
                if(key !== CACHE_VERSION) return caches.delete(keys[i]);
            }));
        }).catch(function(err) { self.tools.ajax.error(new Error(err).stack); });

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
        // Realiza la petición al cacheStorage o al servidor
        var promiseCache = caches.match(event.request).then(function(res) {
            return res ? res : fnRequestBackend(event);
        }).catch(function(err) { self.tools.ajax.error(new Error(err).stack); });

        // Espera hasta que sea respondida la petición
        event.respondWith(promiseCache);
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Se hace la petición hacia el servidor y se guarda en el cacheStorage
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // @event:  Evento de fetch.
        //---------------------------------
        // Retorna: Promesa de la petición usando fetch
        //---------------------------------
    */
    function fnRequestBackend(event) {
        var url = event.request.clone();

        // Se realiza la petición
        return fetch(url).then(function(res) {
            if(!res || res.status !== 200 || res.type !== 'basic') return res;
            var response = res.clone();

            // Se agrega al cache la respuesta
            caches.open(CACHE_VERSION).then(function(cache) {
                cache.put(event.request, response);
            });

            return res;
        }).catch(function(err) { self.tools.ajax.error(new Error(err).stack); });
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
        // Se envia la petiición si es necesaria
        var promiseCache = caches.open(CACHE_VERSION).then(function(cache) {
            event.data.save = fnSaveFile;
            event.data.getFile = fnGetFile;
            
            // Se obtiene la respuesta y esta es enviada al servidor
            return self.tools.ajax.get(event.data).then(function (datos) {
                return event.ports[0].postMessage(datos);
            });
        }).catch(function(err) { self.tools.ajax.error(new Error(err).stack); });

        // Espera hasta que el servidor responda la petición si esat se realiza
        event.waitUntil(promiseCache);
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // @data: {object} Información de la petición a realizar.
        //---------------------------------
        // Función para obtener el archivo o la petición solicitada, cuando el archivo existe éste se lee del navegador 
        // y se retorna la url del blob o el contenido del éste dependiendo del tipo de archivo (mime), si se presenta 
        // un error al leer el archivo del navegador, se hace la petición al servidor.
        //
        // Cuando el servidor responda la petición con OK se guardará la respuesta en el navegador si así se configura
        // en el parámetro de la función de inicio @cache.
        //---------------------------------
    */
    function fnGetFile(data) {
        try {
            // Esto se hace cuando no se quiere guardar el archivo en el navegador
            if (!data.cache) {
                return self.tools.ajax.send(data);
            } // fin if cache

            // Propiedad para evaluar si se va a actualizar o no el archivo
            data.update = true;

            // Se obtiene el archivo desde el navegador
            return Promise.resolve().then(function() { 
                return caches.match(new Request(data.src)).then(function(res) {
                    return !res ? res : res.blob().then(function(blobStorage) {
                        var savedDate = blobStorage.slice(0, SIZE_BLOB_DATE);
                        var savedBlob = blobStorage.slice(SIZE_BLOB_DATE, blobStorage.size, data.mime);
                        return new Response(savedBlob).blob().then(function(blob) {
                            data.blob = blob;
                            res.headers.jdate = JSON.parse(new FileReaderSync().readAsText(savedDate));
                            return res;
                        });
                    });
                }).catch(self.tools.ajax.error);
            }).then(function(respuesta) {
                if(data.name == 'controller-jmain.js') {
                    self.data = data;
                    self.respuesta = respuesta;
                }

                /*
                    // Si el archivo se encuentra en el .json de archivos a actualizar (filesToUpdate) se valida la fecha
                    // de la última modificación, con la fecha que se encuentra en el archivo local y si es mayor la fecha 
                    // del objeto es mayor a la del local entonces se hace la petición al servidor y se guarda en el navegador.
                */
                if(!respuesta) {
                    return self.tools.ajax.send(data);
                }
                else if(data.file && data.file.jdate > respuesta.headers.jdate) {
                    return self.tools.ajax.send(data);
                } else {
                    data.update = false;
                    return new Promise(function (resolve, reject) {
                        try { resolve(self.tools.ajax.getObject(data)); }
                        catch(e) { reject(e); }
                    });    
                } // end else
            }).catch(function(err) { self.tools.ajax.error(new Error().stack); });
        } // end try 
        catch (e) { 
            self.tools.ajax.error(new Error(e).stack);
            return self.tools.ajax.send(data); 
        }
    } // finend function
    //---------------------------------

    /*
        //---------------------------------
        // Se guarda la respuesta del servidor en la cache
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // @data:       {object}    Información de la petición a realizar.
        // @reponse:    {response}  Respuesta del servidor.
        //---------------------------------
    */
    function fnSaveFile(data, response) {
        var respuesta = response.clone(),
            fechaActualizacion;

        // Se guarda la fecha del servidor
        fechaActualizacion = (data.file && data.file.jdate) ? data.file.jdate : self.tools.ajax.getBlobDate();

        // Se guarda una respuesta en el cacheStorage, la estructura es blob([fecha, blob])
        return caches.open(CACHE_VERSION).then(function(cache) {
            return respuesta.blob().then(function(blobRequest) {
                var customResponse = new Response(new Blob([fechaActualizacion, blobRequest]));
                return cache.put(respuesta.url, customResponse).then(function() {
                    return blobRequest;
                });    
            });
        }).catch(function(err) { self.tools.ajax.error(new Error(err).stack); });
    } // fin método
    //---------------------------------

    //---------------------------------
    // Public API
    this.install = fnInstall;
    this.activate = fnActivate;
    this.fetch = fnFetch;
    this.message = fnMessage;
    //---------------------------------
}).call(ajax);

// Asignación de eventos
self.addEventListener('install', ajax.install);
self.addEventListener('activate', ajax.activate);
// self.addEventListener('fetch', fnFetch);
self.addEventListener('message', ajax.message);