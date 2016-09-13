//---------------------------------
// Funciones globales, de uso común
//---------------------------------
(function () {

    // Variables privadas de la función anonima autoejecutable
    var _cantidadWorkers,
        _workers = [],
        _workerActual = 0,
        _patterns = new Namespace();

    // Sección para agregar funcionalidades necesarias de EC6 (Para IE11)
    if(!window.Promise) {
        var script = document.createElement('script'),
             referencia = document.querySelector('script[src*="main.js"]');
        
        // La función fnPolyfills se carga en la función fnInitJMain
        script.src = 'https://www.promisejs.org/polyfills/promise-6.1.0.js';
        script.addEventListener('load', function() { window.fnPolyfills(); }, false);

        // Se toma el script main como referencia
        if(referencia) referencia.parentNode.insertBefore(script, referencia.nextSibling);
        else document.body.appendChild(referencia);
    } // end if

    //---------------------------------
    // Inicio Métodos para Arrays
    //---------------------------------

    (function () {

        /*
            //---------------------------------
            // Método para ordenar un Array de objetos
            // Ejemplo array.fnSortBy(function () { return this.index })
            // "Index" propiedad por la que se ordenará
            //---------------------------------
        */
        if (typeof Object.defineProperty === 'function') {
            try { Object.defineProperty(Array.prototype, 'fnSortBy', { value: sb }); } catch (e) { fnErrorHandler(e); }
        } // fin if
        if (!Array.prototype.fnSortBy) Array.prototype.fnSortBy = sb;

        /*
            //---------------------------------
            // Función para ordenar
            //---------------------------------
            // Parámetros:
            //---------------------------------
            // @f:       Función anonima en la que se retorna la propiedad
            //           por la que se quiere ordenar    {function}
            //---------------------------------
            // return:   Retorna el Array ordenado
            //---------------------------------
        */
        function sb(f) {
            for (var i = this.length; i;) {
                var o = this[--i];
                this[i] = [].concat(f.call(o, o, i), o);
            } // fin for
            this.sort(function (a, b) {
                for (var i = 0, len = a.length; i < len; ++i) {
                    if (a[i] != b[i]) return a[i] < b[i] ? -1 : 1;
                } // fin for
                return 0;
            }); // fin método sort
            for (var i = this.length; i;) {
                this[--i] = this[i][this[i].length - 1];
            } // fin for
            return this;
        } // fin método
        //---------------------------------

        /*
            //---------------------------------
            // Función para encontrar un objeto dentro de un Array
            // Ejemeplo: array.fnFind(function (e) { return e.name == valorBuscado; });
            //---------------------------------
        */
        if (!Array.prototype.fnFind) {
            Object.defineProperty(Array.prototype, 'fnFind', {
                enumerable: false,
                configurable: true,
                writable: true,
                value: function (predicate, all) {
                    if (this == null) throw new TypeError('Array.prototype.fnFind called on null or undefined');
                    if (typeof predicate !== 'function') throw new TypeError('predicate must be a function');

                    var list = Object(this);
                    var length = list.length >>> 0;
                    var thisArg = arguments[1];
                    var value;
                    var listNew = [];

                    for (var i = 0; i < length; i++) {
                        if (i in list) {
                            value = list[i];
                            if (predicate.call(thisArg, value, i, list)) {
                                // Si se recibe el parametro all como true,
                                // se devolverán todos los elementos que 
                                // coincidan con el criterio de búsqueda
                                if (!all) return value;
                                else listNew.push(value);
                            } // fin if
                        } // fin if
                    } // fin for
                    return !all ? undefined : listNew;
                } // fin function of value
            }); // fin define property
        } // fin if function fnFind
        //---------------------------------
    })(); // Fin para los métodos para los Arrays
    //---------------------------------

    //---------------------------------
    // Fin Métodos para Arrays
    //---------------------------------





    //---------------------------------
    // Inicio Métodos para elementos HTML
    //---------------------------------

    (function () {

        //---------------------------------
        // Encuentra en padre del elemento asignado al query
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // @query:  QuerySelector del elemento superior a encontrar
        //---------------------------------
        // return:  Si se encuentra un elemento igual al querySelector
        //          se retorna éste.
        //---------------------------------
        Element.prototype.fnClosest = function (query) {
            if (this.parentNode.nodeType === Node.ELEMENT_NODE)
                return this === this.parentNode.querySelector(query) ? this : this.parentNode.fnClosest(query);
        }; // end function closets
    })(); // End function autoejecutable
    //---------------------------------

    //---------------------------------
    // Fin Métodos para elementos HTML
    //---------------------------------





    //---------------------------------
    // inicio Métodos para Espaciones de Nombres
    //---------------------------------

    /*
        //---------------------------------
        // Estructura para los nombre de espacios
        // Ejemplo: var myApp = new Namespace();
        // Para crear un modulo myApp.fnAddNS('modulA');
        // myApp.modulA = {object}
        //---------------------------------
        // Parametros:
        //---------------------------------
        // @ns: Espacio de nombres
        //---------------------------------
        // Retorna: Objeto con la propiedad fnAddNS
        //---------------------------------
    */
    function Namespace(ns) {
        // Función para crear un nuevo nombre de espacio
        this.fnAddNS = function (name) {
            if (!name) return;
            if (!name.match(window.validateNS)) return;
            // Crea una propiedad si esta no existe
            if (typeof this[name] == 'undefined') this[name] = new Namespace();
            return this[name];
        }; // fin método AddNS

        // Se genera un espacio de nombre por cada punto dentro de la variable ns
        if(ns && ns.indexOf('.')) {
            var ctx = this;
            ns.split('.').forEach(function(name) {
                ctx = ctx.fnAddNS(name);
            }); // end forEach
        } // end if
    } // fin método
    //---------------------------------

    /*
        //---------------------------------
        // Función para encontrar la ruta de un nombre de espacios
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // @ns:     Nombre de espacio el cual sera retornado   'miNombreEspacion.Tools' 
        //---------------------------------
        // return:  Retorna el nombre de espacion que conicida con el nombre indicado   {}
        //---------------------------------
    */
    function fnImport(ns) {
        var parent;
        try {
            var parts = ns.split('.');
            for (var i = 0; i < parts.length; i++) {
                if (!parent && i == 0) parent = window;
                parent = parent[parts[i]];
            } // fin for
            return parent;
        } // fin try
        catch (e) {
            fnErrorHandler(e);
            return null;
        } // fin catch
    } // fin método
    //---------------------------------

    /*
        //---------------------------------
        // Valida que el objeto herede de la función Namespace
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // @dependencies:   Arreglo con los nombres de espacio a validar    
        //                  [{namespace}, {namespace}] || {namespace}
        // return:          Retorna un bool (0 || 1)
        //---------------------------------
    */
    function fnDepenciesTrue(dependencies) {
        if (!dependencies) return false;
        if (dependencies.constructor === Namespace) if (!dependencies) return false;
        if (dependencies.constructor === Array) for (var i in dependencies) if (!dependencies[i]) return false;
        return true;
    } // end method
    //---------------------------------

    //---------------------------------
    // Fin Métodos para Espaciones de Nombres
    //---------------------------------





    //---------------------------------
    // Inicio Métodos para peticiones Sincronos
    //---------------------------------

    /*
        //---------------------------------
        // fnGet()
        // Esta función usa hilos (webworkers), se cargan archivos mediante ajax, para el navegador Google Chrome.  
        // Estos archivo se guardan en el navegador haciendo usao de la interfaz FileSystem.
        // Con esto se logra menos peticiones al servidor y una carga más rápida de la página.
        //
        // Se debe cargar la primera vez un archivo .json con los nombre de los archivos que deban actualizar, los
        // objetos del .json deberán tener las siguientes propiedades: nombre y la fecha de actualización.
        // La estructura del json debe ser la siguiente:
        //  [
        //      { "name":"ui.js", "date":"2014-06-24-15" }
        //  ]
        //---------------------------------
        // Parametros:
        //---------------------------------
        // @data:   Objeto con la información para cargar los archivos          [{},{}]
        // @then:   Método que se ejecuta cuando carguen todos los archivos     (function (response, args) {})
        //---------------------------------
        // Retorna: Estructura de una objeto Promesa
        //---------------------------------
    */
    function fnGet(data) {
        var requests, _fnCallback, promesas, estructuraPromise;

        // Se trabajar con un objeto iterable si esté no lo es
        requests = !data.length ? [data] : data;

        /*
            // Se referencia el resultado de Promises.all() [resultadoPromesa1, ..., n], esto retorna un arreglo
            // con los parámetros de cada una de las promesas y su respuesta, con esto se altera cuando solo 
            // se tiene un request.
        */
        promesas = Promise.all(requests.map(window.useServiceWorker ? fnSendRequestSW : fnSendRequest)).then(function() {
            var pars;
            if(!fnIsFunction(_fnCallback)) return;

            /*
                // Cuando se realiza solo una petición se agregan las propiedades
                // que no hacen parte de una petición,
                // Esto porque las promesa al usar Promise.all, el resultado de cada
                // promesa se retorna como un Array
            */
            if(requests.length == 1 && arguments[0].length) { 
                arguments[0].push(fnGetDiferences(window.REQUESTOBJECT, requests[0]));
                return _fnCallback.apply(this, arguments[0]);
            } // end if

            return _fnCallback.apply(arguments);
        });

        /*
            // Se emula la función then del objeto Promise, esto para modificar el 
            // comportamiento del mismo.
        */
        estructuraPromise = {};
        estructuraPromise.then = function(fnCallback) {
            _fnCallback = fnCallback;
            return promesas;
        } // end then

        // Patrón Modular
        return estructuraPromise;
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Se obtiene la referencia de un worker, y se envian los 
        // datos al servidor
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // @data:   {object} Objeto con la información para cargar los archivos.
        //---------------------------------
        // Retorna: {Promise} Retorna un objeto Promise
        //---------------------------------
    */
    function fnSendRequest(request) {
        // Variables para cuando retorne información el worker
        var _fnCallback, _resolve;
        
        // Se crea una referencia hacia la funnción de callback.
        _fnCallback = request.then;
        // Se elimina la función de callback para que no tenga problemas con el envió al worker.
        delete request.then;

        // Se crea una nueva promesa
        return new Promise(function(resolve, reject) {
            var command, worker;

            // Se usa el patrón Command
            command = _patterns.command.instance;
            command.on('message', fnReseiver);
            command.on('error', reject);

            // Instancia del worker
            worker = fnGetWorker();

            // Se usa el patrón Observador
            worker.observador.add(request.src, function(e) { 
                command.trigger(e.type, e.data, request, resolve);
            });

            // Se envia los datos al worker
            worker.postMessage(fnExtend({ files: window.filesToUpdate }, request));
        }).then(function(args) {
            // Se ejecuta la función de callback por cada petición
            if(!fnIsFunction(_fnCallback)) return args;
            _fnCallback(args, fnGetDiferences(window.REQUESTOBJECT, request));
        }).catch(function() { console.log(arguments); });
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Se obtiene la referencia de un worker, y se envian los 
        // datos al servidor
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // @data:   {object} Objeto con la información para cargar los archivos.
        //---------------------------------
        // Retorna: {Promise} Retorna un objeto Promise
        //---------------------------------
    */
    function fnSendRequestSW(request) {
        // Variables para cuando retorne información el worker
        var _fnCallback, _resolve;
        
        // Se crea una referencia hacia la funnción de callback.
        _fnCallback = request.then;
        // Se elimina la función de callback para que no tenga problemas con el envió al worker.
        delete request.then;

        // Se recarga la página para activar el wervice worker
        if (!navigator.serviceWorker.controller) window.location.reload();

        // Se crea una nueva promesa
        return new Promise(function(resolve, reject) {
            var messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = function(event) {
                fnReseiver(event.data, request, resolve);
                // event.data.error ? reject(event.data.error) : 
            } // end function

            // This sends the message data as well as transferring messageChannel.port2 to the service worker.
            // The service worker can then use the transferred port to reply via postMessage(), which
            // will in turn trigger the onmessage handler on messageChannel.port1.
            // See https://html.spec.whatwg.org/multipage/workers.html#dom-worker-postmessage
            navigator.serviceWorker.controller.postMessage(
                fnExtend({ files: window.filesToUpdate }, request), 
                [messageChannel.port2]
            );

        }).then(function(args) {
            // Se ejecuta la función de callback por cada petición
            if(!fnIsFunction(_fnCallback)) return args;
            _fnCallback(args, fnGetDiferences(window.REQUESTOBJECT, request));
        }).catch(function() { console.log(arguments); });
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Se encarga de recibir la información del observador, que a su vez
        // recibe la información del worker, resuelve la promesa, y ejecuta
        // la función de callback, si es unapetición para archivos js o css
        // se crean sus respectivas tag en el documento.
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // @reponse:    {object}    Información que se retorno desde el worker.
        // @request:    {object}    Request que se realiza al servidor.
        // @resolve:    {function}  Función que resulve una promesa.
        //---------------------------------
    */
    function fnReseiver(response, request, resolve) {
        var resumen, type;
        resumen = { data: response.result, name: response.path };
        resumen.data = resumen.data || URL.createObjectURL(response.blob);

        type = /.*\.(css|js)$/gi.exec(resumen.name);
        // Cuando el archivo es un script o un estilo se crea la tag respectiva y se agrega al documento
        if (!response.result && type && (request.mime == type[1] || !request.mime)) {
            // Si es una archivo de tipo javascript o una hoja de estilos se crea una tag,
            // si se tiene una función para hacer callback se ejecuta esta.
            fnCreateScriptTemp({
                href: resumen.data, type: type[1],
                name: resumen.name, fnCallTag: resolve,
                repeatTag: request.repeatTag
            }); // end fnCreateScriptTemp
        } else resolve(resumen);
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Obtiene las propiedeades diferente entre una referencia (objeto) y un objeto.
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // @source: {object} Objeto con la estructura a no tomar.
        // @target: {object} Objeto con la información para obtener las.
        //---------------------------------
        // Retorna: {object} Retorna un objeto con las diferencias.
        //---------------------------------
    */
    function fnGetDiferences(source, target) {
        var diference = {};
        for(var i in target) { 
            if(!(i in source)) diference[i] = target[i];
        } // end for
        return diference;
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Obtiene un worker, esto se configura con un objeto observador.
        //---------------------------------
        // Retorna: {Worker} Retorna un WebWorker para realizar peticiones.
        //---------------------------------
    */
    function fnGetWorker() {
        var worker;

        // Por dejecto son 3 los worker que se mantiene en la aplicación.
        _cantidadWorkers = _cantidadWorkers || 3;

        // Se genera un Worker y se obtiene un observador
        if(_cantidadWorkers > _workers.length) {
            worker = new Worker(window.urlWorkerImport || 'assets/js/workers/worker-import.js');
            worker.observador = _patterns.observer.instance;
            worker.addEventListener("message", fnListenerWoker, false);
            worker.addEventListener("error", fnListenerWoker, false);
            _workers.push(worker);
        } // end if

        // Se obtiene el worker y se aumenta contador
        if(_workerActual >= _workers.length) _workerActual = 0;
        worker = _workers[_workerActual];
        _workerActual++;

        return worker;

        function fnListenerWoker(e) {
            // Se notifica al observado y se elimina éste
            var observado = worker.observador.notify(e.data.path, e);
            worker.observador.remove(observado);
        } // end function
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Registra un service worker si el navegador lo soporta.
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // @fnCallback: Función de callack cuando se registre el serviceworker.
        //---------------------------------
    */
    function fnInitServiceWorker() {
        return Promise.resolve().then(function() {
            return navigator.serviceWorker.register('./service-worker.js').then(function(registration) { 
                console.log('Service Worker registrado con el contexto: ' + registration.scope);
            });
        }).then(function() {
            return navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
                return serviceWorkerRegistration.pushManager.getSubscription();
            });
        }).catch(function(err) { 
            console.log(err);
            delete window.useServiceWorker;
        });
    } // end function
    //---------------------------------
    

    /*
        //---------------------------------
        // Crea una tag script o una tag css para asignar el la url de un blob
        //---------------------------------
        // parámetros:
        //---------------------------------
        // @d:             Objeto con los parametro necesarios para la ejecución de la función
        // @d.href:        Dirección del blob  'string'
        // @d.type:        Tipo de tag a crear ('js' || 'css')
        // @d.name:        Nombre del archivo para identificarlo en la tag
        // @d.fnCallTag:   Método callback que será ejecutado cuando se cargue la información
        //                 en el documento
        // @d.repeatTag:   Valor para saber si se salta la validación de si existe el 
        //                 objeto en el DOM. (true || false)
        //---------------------------------
    */
    function fnCreateScriptTemp(d) {
        /*
            // Se valida si ya hay una tag con el data-name igual
            // para no volverlo a crear
        */
        if (!d.repeatTag) {
            var query = (d.type == 'js' ? 'script' : 'link') + '[data-name="' + d.name + '"]';
            if (document.querySelectorAll(query).length) {
                if (fnIsFunction(d.fnCallTag)) {
                    // Se envia parámetros para que se simula la carga de un evento
                    d.fnCallTag(true);
                } // end if
                return;
            } // end if
        } // end if repeatTag

        // Se elije que tipo de tag se va a crear
        var tag;
        switch (d.type) {
            case 'js':
                tag = document.createElement("script");
                tag.setAttribute("src", d.href);
                break;
            case 'css':
                tag = document.createElement("link");
                tag.setAttribute("href", d.href);
                tag.setAttribute("rel", 'stylesheet');
                tag.setAttribute("type", 'text/css');
                break;
        } // fin switch
        tag.dataset.name = d.name;
        // Cuando la tag se carga se ejecuta la funcion del item
        tag.addEventListener('load', d.fnCallTag, false);

        // Se agrega la nueva tag en el DOM        
        document.querySelector('body').appendChild(tag);
    } // fin método
    //---------------------------------

    /*
        //---------------------------------
        // fnDeleteWorkers()
        // Función para eliminar un arreglo de _workers
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // @workers: [{Worker}] Webworkers a eliminar
        //---------------------------------
    */
    function fnDeleteWorkers(workers) {
        if (!_workers) return;
        if (!_workers.length) return;
        do {
            _workers[0].terminate();
            _workers.splice(0, 1);
        } while (_workers.length) // end do while 
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // fnInitJMain()
        // Función para mejorar la funcionalidad de las
        // peticiones asincronas, además envia la petición
        // del archivo filesToUpdate
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // @opciones:   Valores de configuración.
        // @.srcFiles:      Path del archivo filesToUpdate.json
        // @.workersCount:  Cantidad de workers que realizaran las peticiones.
        // @.useSW:         Bandera para identificar si se debe usa un service worker.
        //---------------------------------
    */
    function fnInitJMain(opciones) {
        var estructuraPromise = {}, _fnCallback;

        if(opciones) {
            _cantidadWorkers = opciones.workersCount;
            opciones.srcFiles = opciones.srcFiles || 'assets/config/filesToUpdate.json';
            window.useServiceWorker = opciones.useSW && !!navigator.serviceWorker;
        } // end if

        // Se verifica la cache y se actualiza esta
        window.addEventListener('load', function (e) {
            window.applicationCache.addEventListener('updateready', function () {
                if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
                    window.applicationCache.swapCache();
                    window.location.reload();
                } // end if
            }, false); // end functoin updaterady
        }, false); // end function load

        // Cuando se soporta Promise nativo
        if(window.Promise && !window.useServiceWorker) return fnGetFilesToUpdate();
        
        /*
            // Para navegadores antiguos se crea una estructura de Promise para emular esta, mientras
            // se carga el polyfill, se guarda una función fnPolyfills, que ejecutara el callback
            // de .then
        */
        estructuraPromise.then = function(fnCallback) {
            _fnCallback = fnCallback;
            if(!window.Promise) window.fnPolyfills = fnGetFilesToUpdate;
            if(window.useServiceWorker) fnInitServiceWorker().then(fnGetFilesToUpdate);
        } // end function then

        // Función de recursividad
        function fnGetFilesToUpdate() {
            var respuesta = fnGet({ src: opciones.srcFiles, cache: false }).then(function (response) { 
                window.filesToUpdate = response.data;
            });

            return fnIsFunction(_fnCallback) ? respuesta.then(_fnCallback) : respuesta;
        } // end function

        // Patrón Modular
        return estructuraPromise;
    } // end function
    //---------------------------------

    //---------------------------------
    // Fin Métodos para peticiones Sincronos
    //---------------------------------





    //---------------------------------
    // Inicio Funciones Comunes
    //---------------------------------

    /*
        //---------------------------------
        // Método similar al Jquery.extend, que combina propiedades entre objetos,
        // mantiene la referencias de los objeto que se combinen
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // arguments:   Objetos que se quieren combinar, el primer parámetro
        //              es al que see le van a referencias el resto de parámetros.
        //---------------------------------
        // Retorna:     Retorna el primer parámetro.
        //---------------------------------
    */
    function fnExtend() {
        var e = arguments[0];
        delete arguments[0];
        for (var i in arguments)
            for (var key in arguments[i])
                e[key] = arguments[i][key];

        return e;
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Valida si el parametro es una tipo de objeto function
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // @x:  {object} Valor a validar
        //---------------------------------
        // Retorna: Si el parámetro x es una función o no
        //---------------------------------
    */
    function fnIsFunction(x) {
        return Object.prototype.toString.call(x) == '[object Function]';
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Agrega texto dentro de la consola, para el manejo de errores
        //---------------------------------
    */
    function fnErrorHandler(e) {
        console.log('Error: ' + e.message);
    } // end function
    //---------------------------------

    //---------------------------------
    // Fin Funciones Comunes
    //---------------------------------




    //---------------------------------
    // Inicio Patrones de Diseño
    //---------------------------------

    (function() {
        // Variables privadas
        var _observer;

        //---------------------------------
        // Inicio Patrón Command
        //---------------------------------

        (function() {

            // Constructor quien administra los observados
            function Command() {  
                var commands = {}, api = {}, ctx = this;

                api.on = function(command, fnCallback) { commands[command] = fnCallback; return ctx; }
                api.off = function(command) { delete commands[command]; return ctx; }
                api.trigger = function(command) { 
                    return commands[command] && commands[command].apply(commands, [].slice.call(arguments, 1));
                } // end function

                // Public API
                return api;
            } // emnd constructor
            
            // Constructor observado, key, listenNotify
            function Observer(name, fnCallback) {
                this.update = fnCallback;
                this.name = name;
            } // end function

            // Public API
            this.instance = new Command();
        }).call(this.fnAddNS('command'));

        //---------------------------------
        // Fin Patrón Command
        //---------------------------------


        //---------------------------------
        // Inicio Patrón Observer
        //---------------------------------

        (function() {

            // Constructor quien administra los observados
            function Subject() {  
                var observers = [], api = {}, ctx = this;

                api.add = function(name, fnCallback) { observers.push(new Observer(name, fnCallback)); return ctx; }
                api.remove = function(observer) { observers.splice(indexOf(observer, 0), 1); return ctx; }
                api.notify = function(name, args) { 
                    var observado = observers.fnFind(function(e) { return e.name ===  name });
                    observado.update(args);
                    return observado;
                } // end function

                // Public API
                return api;

                function indexOf(obj, startIndex) {
                    var i = startIndex;
                    while(i < observers.length) {
                        if(observers[i] === obj) return i;
                        i++;
                    } // end while
                    return -1;
                } // end function
            } // end constructor
            
            // Constructor observado, key, listenNotify
            function Observer(name, fnCallback) {
                this.update = fnCallback;
                this.name = name;
            } // end function

            // Public API
            this.instance = new Subject();
        }).call(this.fnAddNS('observer'));

        //---------------------------------
        // Fin Patrón Observer
        //---------------------------------

        /*
            //---------------------------------
            // Se obtiene una instancia única del objeto a evaluar
            //---------------------------------
            // Parámetros
            //---------------------------------
            // @referencia:         {object}    Referencia al objeto que se quiere evaluar.
            // @funcionInstancia:   {object}    Función que retorna la instancia del objeto a evaluar.
            //---------------------------------
            // Retorna: Objeto resultante de la funcion de instancia, más la propiedad de singletonInstance.
            //---------------------------------
        */
        function fnSingleton(referencia, funcionInstancia) {
            if(referencia && referencia.singletonInstance) return referencia;
            if(!fnIsFunction(funcionInstancia)) return;

            referencia = funcionInstancia();
            referencia.singletonInstance = true;
            return referencia;
        } // end function
        //---------------------------------

        // Public API
        this.singleton = fnSingleton;
    }).call(_patterns);

    //---------------------------------
    // Fin Patrones de Diseño
    //---------------------------------




    
    //---------------------------------
    // Public API
    //---------------------------------

    // Métodos para NameSpacing
    this.Namespace = Namespace;
    this.fnImport = fnImport;
    this.fnDepenciesTrue = fnDepenciesTrue;
    // Métodos para peticiones asícronas
    this.get = fnGet;
    this.fnCreateScriptTemp = fnCreateScriptTemp;
    this.fnInitJMain = fnInitJMain;
    // Métodos comunes
    this.fnExtend = fnExtend;
    this.fnIsFunction = fnIsFunction;
    this.fnErrorHandler = fnErrorHandler;
    // Patrones de Diseño
    this.patterns = _patterns;
    //---------------------------------

    //---------------------------------
    // Variables globales
    //---------------------------------

    // Varable para validar los nombres de espacios
    this.validateNS = /^[a-zA-Z]?[a-zA-z0-9]+$/;
    // Contador de tags
    countTags = 0;
    // Variables para los diferentes emuladores
    this.URL = this.URL || this.webkitURL;
    this.requestFileSystem = this.requestFileSystem || this.webkitRequestFileSystem;
    this.persistentStorage = this.persistentStorage || navigator.webkitPersistentStorage;
    // Variables de configuración
    this.filesToUpdate = [];
    this.urlWorkerImport;
    // Variable para conocer si se esta navegando bajo el protocolo seguro (https)
    this.ssl = (location.origin.indexOf('https') > -1);
    // Estructura de objeto para realizar peticiones asíncronas
    this.REQUESTOBJECT = new function() {
        return {
            src: '{string} Ruta para el request.',
            then: '{function} Función de callback.',
            mime: '{string} Mime Type especial, este se puede obtener a través de la extensión.',
            cache: '{bool} Identifica si se debe realizar la petición al servidor.',
            method: '{string} Identifica el verbo que se debe usar en la petición.',
            value: '{Object} Valores que se enviaran en la petición.'
        }
    } // end function
    //-----------------------------

    // Legunaje de la página
    this.lang = document.querySelector("html").getAttribute("lang");
})(window);
//---------------------------------

//---------------------------------
// Nombre de espacio principal Main for library
// Se crea el nombre de espacio j, este será usada para el resto de plugins
//---------------------------------
var j = new Namespace();
fnExtend(j, {
    Author: 'Julian Ruiz',
    Created: '2016-08-10',
    Page: 'http://jerc91.github.io/',
    Title: 'JMain'
}); // fin combinación
//---------------------------------