//---------------------------------
// Funciones globales, de uso común
// Función para crear espacio de nombres 
// Función para cargar archivos de forma sincrona
(function () {
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
            // return:   retorna el Array ordenado
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
        // Ejemplo: var myApp = new NameSpace();
        // Para crear un modulo myApp.fnAddNS('modulA');
        // myApp.modulA = {object}
        //---------------------------------
    */
    function NameSpace() {
        this.Author = '';
        this.Created = '';
        this.Description = '';
        this.Title = '';
        // Función para crear un nuevo nombre de espacio
        this.fnAddNS = function (name) {
            if (!name) return;
            if (!name.match(validateNS)) return;
            // Crea una propiedad si esta no existe
            if (typeof this[name] == 'undefined') this[name] = new NameSpace();
            return this[name];
        }; // fin método AddNS
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
        // Valida que el objeto herede de la función Assembly
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
        if (dependencies.constructor === Assembly) if (!dependencies) return false;
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
        // 1. fnGetFile()
        // Esta función crea hilos (webworkers), en estos hilos se cargan archivos por ajax, para chrome se guardan los archivos 
        // dentro del explorador, se logra menos peticiones al servidor y una carga más rápida de la página.
        // Se debe cargar la primera vez un json con los nombre de los archivos que se quieran actualizar, dentro del json
        // deben haber objetos con las pripiedades del nombre y la fecha, la estructura del json debe ser la siguiente:
        //  [
        //      { "name":"ui.js", "date":"2014-06-24-15" }
        //  ]
        //---------------------------------
        // Parametros:
        //---------------------------------
        // @data:        Objeto con la información para cargar los archivos          [{},{}]
        // @fnCall:      Método que se ejecuta cuando carguen todos los archivos     (function () {})
        // @ctx(this):   Contexto al que se agregarán los workers que se creén
        //               Dentro de éste método.                                      {}
        // @query:       querySelector del elemento para cargar el html devuelto     ""
        //---------------------------------
        // La siguiente es la secuecia en que se sejecutarán las funciones para fnGetFile:
        // 1. fnGetFile
        // 2. fnCreateWorker
        // 3. fnSendMessage
        // 4. fnCreateScriptTemp
        // 5. fnExecFunction
        // 6. fnEnding
        // 7. fnDeleteWorkers
        //---------------------------------
    */
    function fnGetFile(data, fnCall) {
        // No hay elementos a cargar no se ejecuta la función
        if (!data) return;

        /*
            // Se hace refencia al contexto para que los websorkers queden asociados a éste,
            // esto para que sean eliminados de la memoria si el contexto es eliminado
            // la variable scripts se toma para calcular que las tags scripts y link (css)
            // se cargue y así se puedan ejecutar la función de callback.
            // ctx:             contexto, cuando se quiere cargar los workers a un elemento especifico
            // workers:         arreglo con todos los WebWorkers que se instancien
            // scripts:         son todos los WebWorkers que hagan peticiones de .css o .js
            // eventosLoad:     funciona como una bandera para marcar que por lo menos hay una petición .css o .js
            // fnCallExecuted:  funciona como una bandera para marcar si la función principal fue ejecutada
        */
        var ctx = this, workers = [], scripts = 0, eventosLoad, fnCallExecuted;

        /*
            // Ya que la función esta hecha para trabajar con varios objetos si se 
            // recibe solo un objeto éste se carga en un arreglo
            // para que sea más comodo trabajar con éste.
        */
        if (!data.length) data = [data];

        // Se crea cada worker
        data.forEach(fnCreateWorker);

        /*
            //---------------------------------
            // 2. fnCreateWorker()
            // Función para crear workers. una vez creado se ejecuta dicho worker
            //---------------------------------
            // Parámetros:
            //---------------------------------
            // @infoWorker:    Información del worker
            //---------------------------------
        */
        function fnCreateWorker(infoWorker) {
            /*
                // Definición de variables por cada archivo
                // Ruta del webwoker que importa y guarda los archivos
            */
            var worker = new Worker(window.urlWorkerImport || 'assets/js/workers/worker-import.js');
            var fnCallItem = infoWorker.fnCall;
            
            /*
                // archivos que se van actualizar, este se debe cargar con anterioridad cuando termine de cargar el .json
                // con la información de los archivos a actualizar
            */
            infoWorker.files = filesToUpdate;

            /*
                // Si el infoWorker trae una método de callback, esta se ejecutara cuando el archivo sea retornado por el servidor,
                // esto se hace por que la definición de los webworkers no permite que se transporten funciones entre
                // los mensajes que se envian desde el app y el worker. 
                // Se Suarda esta método con aterioridad y se elimina del objeto
            */
            delete infoWorker.fnCall;
            // Se envia la información al worker
            worker.postMessage(infoWorker);
            // Se asigna la función para cuando el sevidor retorne la información
            worker.addEventListener("message", function (d) {
                fnSendMessage.call(this, {
                    data: d.data,
                    info: infoWorker,
                    fnCallItem: fnCallItem
                }); // end fnSendMessage
            }); // end addEventListener
        } // end function create workers
        //---------------------------------


        /*
            //---------------------------------
            // 3. fnSendMessage()
            // Cada vez que el servidor retorna un archivo solicitado mediante 
            // webworkers esta información será tratada
            //---------------------------------
            // Parámetros:
            //---------------------------------
            // @worker.data:                Información retornada por el webworker
            // @worker.data.src:            URL del blob que contiene la informació del archivo solicitado  'string'
            // @worker.data.result:         Texto del archivo, solo para archivos de texto                  'string'
            // @worker.fnCallItem:          Función de Callback para cuando se ejecute el worker
            //---------------------------------
        */
        function fnSendMessage(worker) {
            var src = worker.info.src;
            var datos = worker.data;
            var resumen = { data: datos.result || datos.src, name: src };
            urlArchivo = resumen.name;
            // Se agrea el worker al arreglo de workers para saber cuando se han cargado todos los archivos
            workers.push(this);

            // Cuando el archivo es un script o un estilo se crea la tag respectiva y se agrega al documento
            if (!datos.result && (src.indexOf('.js') > -1 || src.indexOf('.css') > -1) && worker.mime != 'blob') {
                var type = src.indexOf('.js') > -1 ? 'js' : 'css';
                eventosLoad = true;
                scripts += 1;
                // Si es una archivo de tipo javascript o una hoja de estilos se crea una tag,
                // si se tiene una función para hacer callback se ejecuta esta.
                fnCreateScriptTemp({
                    href: datos.src,
                    type: type,
                    name: src,
                    fnCallTag: fnExecFunction,
                    repeatTag: worker.info.repeatTag
                }); // end fnCreateScriptTemp
            } else fnExecFunction();

            /*
                //---------------------------------
                // 5. fnExecFunction()
                // Se cargue se ejecuta la función del infoWorker fnCall
                //---------------------------------
            */
            function fnExecFunction() {
                if (arguments.length) scripts -= 1;

                // Se ejecuta el método que trae el infoWorker, cuando achivo ha cargado 
                if (fnIsFunction(worker.fnCallItem))
                    worker.fnCallItem.call(resumen, worker.info.query);

                // Si es la última tag en cargar se ejecutará la función de callback total
                fnEnding(resumen);
            } // fnExecFunciton
            //---------------------------------

            // Se evaluará si todas las tags han cargado
            fnEnding(resumen);
        } // fin fnSendMessage
        //---------------------------------

        /*
            //---------------------------------
            // 6. fnEnding()
            // Función para ejecutar el callback una vez se
            // hallan cargados todos los workers completamente
            // con el evento load de los scripts y de los links
            //---------------------------------
            // Parámetros:
            //---------------------------------
            // @item:       Parámetro con la información necesaria para la 
            //              ejecución de la función {object}.
            // @item.data   Contenido retornado por el servidor acerca del 
            //              archivo solicitado (json, string, binary)
            // @item.name   Ruta del archivo solicitado
            //---------------------------------
        */
        function fnEnding(item) {
            // Si hay scripts y aún no se han cargado en el DOM se retorna la funcións
            if (eventosLoad && scripts || fnCallExecuted) return;

            /*
                // Se evalua por cada respuesta del worker si se han terminado 
                // de cargar todos los archivos, esto para ejecutar el método
                // de callback recibida como segundo parametro
            */
            if (workers.length == data.length) {
                /*
                    // Cuando seán cargados todas los archivos se procede a cerrar todos los workers,
                    // se pone dentro de un intervalo de tiempo por que se genera error si se cierran los 
                    // web workers tan pronto como responde el servidor.
                    // Dentro de las pruebas que se hicierón 5 segundos fue la mejor opción para que no se bloqueara la 
                    // pestaña en el explorador, si se cambia éste valor a un número menor puede presentarsen bloqueos
                    // en la pestaña.
                */
                if (ctx !== window) {
                    ctx.workers = ctx.workers || [];
                    workers.forEach(function (trabajador) {
                        ctx.workers.push(trabajador);
                    }); // endforEach
                } else {
                    setTimeout(fnDeleteWorkers, 30000, workers); // end setTimeout
                } // end else

                // Se ejecuta la función de callback general
                if (fnIsFunction(fnCall))
                    fnCall.apply(item);

                // Para marcar que la función principal ya se ejecuto
                fnCallExecuted = true;
            } // fin if
        } // end function
        //---------------------------------
    } // fin método
    //---------------------------------

    /*
        //---------------------------------
        // 4. fnCreateScriptTemp()
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
        // 7. fnDeleteWorkers()
        // Función para eliminar a los workers
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // @workers: Webworkers a eliminar
        //---------------------------------
    */
    function fnDeleteWorkers(workers) {
        if (!workers) return;
        if (!workers.length) return;
        do {
            workers[0].terminate();
            workers.splice(0, 1);
        } while (workers.length) // end do while 
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
        // @fnCall:     Función de callback para cuando se
        //              configure la aplicación
        //---------------------------------
    */
    function fnInitJMain(fnCall) {
        fnGetFile({
            src: 'assets/config/filesToUpdate.json',
            mime: 'json', cache: false,
            fnCall: function () {
                filesToUpdate = this.data;
                // Se ejecuta la función de calback general
                if (fnIsFunction(fnCall)) fnCall();
            } // end function fnCall
        }); // end fnGetFile filesToUpdate

        window.addEventListener('load', function (e) {
            window.applicationCache.addEventListener('updateready', function () {
                if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
                    window.applicationCache.swapCache();
                    // window.location.reload();
                } // end if
            }, false); // end functoin updaterady
        }, false); // end function load
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
    // Public API
    //---------------------------------

    // -Métodos para NameSpacing
    this.NameSpace = NameSpace;
    this.fnImport = fnImport;
    this.fnDepenciesTrue = fnDepenciesTrue;
    // Métodos para peticiones asícronas
    this.fnGetFile = fnGetFile;
    this.fnCreateScriptTemp = fnCreateScriptTemp;
    this.fnDeleteWorkers = fnDeleteWorkers;
    this.fnInitJMain = fnInitJMain;
    // Métodos comunes
    this.fnExtend = fnExtend;
    this.fnIsFunction = fnIsFunction;
    this.fnErrorHandler = fnErrorHandler;
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
    //-----------------------------

    // Legunaje de la página
    this.lang = document.querySelector("html").getAttribute("lang");
})(window);
//---------------------------------

//---------------------------------
// Nombre de espacio principal Main for library
// Se crea el nombre de espacio j, este será usada para el resto de plugins
//---------------------------------
var j = new NameSpace();
fnExtend(j, {
    Author: 'Julian Ruiz',
    Created: '2016-01-17',
    Page: 'http://jerc91.github.io/',
    Title: 'JMain'
}); // fin combinación
//---------------------------------