// Variable para cada explorador
self.requestFileSystemSync = self.webkitRequestFileSystemSync || self.requestFileSystemSync;

// Varable del módulo
var ajax = {};

// Mime types que permite el worker para importar archivos
var mimes = {
    blob: 'application/octet-stream',
    css: 'text/css; charset="utf-8"',
    img: 'image/jpeg',
    js: 'text/javascript; charset="utf-8"',
    json: 'application/json; charset="utf-8"',
    text: 'text/plain; charset="utf-8"',
    formQ: 'application/x-www-form-urlencoded',
    formData: 'multipart/form-data'
}; // Tipos de archivo por defecto

// Definición del objeto
(function () {
    // Objeto principal
    var ctx = {
        // Si se desea guardar de forma permanente las archivos esta es la medidas
        localSizeFiles: 10 * 1024 * 1024,
        read: { create: 0 },    // Objeto par cuando se quiere leer
        write: { create: 1 },   //  Objeto par cuando se quiere guardar
        name: [],       // Name of file
        fs: null,       // Sistema de archivos API
        blob: null,     // Bynary object
        mime: null,     // Tipo de archivo
        hostPath: null, // Maríz del sitio web
        data: null,     // Propiedades del archivo
        file: null,     // Información del archivo
        xhr: null       // Refencia de un objeto XMLHttpRequest
    };

    /*
        //---------------------------------
        // Agrega texto dentro de la consola, para el manejo de errores
        //---------------------------------
        // Paràmetros:
        //---------------------------------
        // @e:	Parámetro que retorna un error en la estructura try, catch
        //---------------------------------
    */
    function fnOnError(e) {
        console.log('Error: ' + e.message + '\n' + ctx.name);
    } // end function
    //---------------------------------

    /*
		//---------------------------------
		// Inicio del worker, toma el FileSystem y antes toma el archivo, si el archivo no esta en
		// explorador éste es creado
		//---------------------------------
		// Paràmetros:
		//---------------------------------
        // @pars:			información del archivo a solicitar	{}
        //---------------------------------
		// @pars.cache:		Para que no se guarde en el explorador de ser 0 ( 0 || 1)
		// @pars.src:		Dirección del archivo a solicitar.	''
		// @pars.mime:		El tipo de mime que se traerá
		// @pars.method:	Tipo de petición que se hará al servidor
        // @pars.files:	    Arreglo con los objetos que contiene los archivos a actualizar
		//---------------------------------
	*/
    function fnInit(pars) {
        // Compatibilidad con navegadores para que no se genere errores
        if (requestFileSystemSync) {
            ctx.fs = requestFileSystemSync(TEMPORARY, ctx.localSizeFiles);
        } // end if
        else {
            pars.cache = false;
        } // end else

        // Se obtiene el nombre del archivo o ruta de la petición
        ctx.name = pars.src.split("/");
        ctx.name = ctx.name[ctx.name.length - 1];

        // Se obtiene la ruta del servidor, el webworker debe estar contenido dentro de la carpeta assets
        ctx.hostPath = location.href.substring(0, location.href.indexOf('assets'));

        // Se combinan los parámetros de la petición a realizar, con parámetros por defecto
        fnExtend(pars, {
            cache: true,        // Para que no se guarde en el explorador
            // Para retornar texto y no la URL del blob
            isText: (pars.mime == 'json' || pars.mime == 'text' || pars.mime == 'formQ'),
            method: 'GET',      // Tipo de petición o verbo
            mime: 'js',         // MimeType
            text: null,
            update: false
        }); // fin combinación

        // Se obtiene el mime de la petición
        ctx.mime = mimes[pars.mime];

        /*
			// Si dentro de los objetos filesToUpdate de la primera carga se encuentra el arhivo
			// que se quiere cargar se retorna el objeto que debe tener la estructura nombre fecha
		*/
        if(pars.files)
            ctx.file = pars.files.fnFind(function (e) { return ctx.name == e.name; });

        // Se referencia los párametros de entrada con el objeto principal (ctx)
        ctx.data = pars;
    } // fin fnInit
    //---------------------------------

    /*
		//---------------------------------
	    // Función para obtener el archivo o la petición solicitada, cuando el archivo existe éste se lee del navegador 
        // y se retorna la url del blob o el contenido del éste dependiendo del tipo de archivo (mime), si se presenta 
        // un error al leer el archivo del navegador, se hace la petición al servidor.
        //
        // Cuando el servidor responda la petición con OK se guardará la respuesta en el navegador si así se configura
        // en el parámetro de la función de inicio @cache.
	    //---------------------------------
    */
    function fnGetFile() {
        try {
            // Esto se hace cuando no se quiere guardar el archivo en el navegador
            if (!ctx.data.cache) {
                fnSendRequestFile();
                return;
            } // fin if cache

            // Se obtiene el archivo desde el navegador
            var fileEntry = ctx.fs.root.getFile(ctx.name, ctx.read);
            ctx.blob = fileEntry.file();

            /*
				// Si el archivo se encuentra en el .json de archivos a actualizar (filesToUpdate) se valida la fecha
                // de la última modificación, con la fecha que se encuentra en el archivo local y si es mayor la fecha 
                // del objeto es mayor a la del local entonces se hace la petición al servidor y se gaurda en el navegador.
			*/
            if (ctx.file) {
                // JDate, retorna un objeto Date, la diferencia es que recibe un string con el formato yyyy-MM-dd-hh
                if (new JDate(ctx.file.date) > ctx.blob.lastModifiedDate) {
                    // Propiedad para evaluar si se va a actualizar o no el archivo
                    ctx.data.update = true;
                    fnSendRequestFile(ctx.data);
                    return;
                } // fin if compare dates
            } // fin if exist file to update

            // Se captura la información y se envia a la App (Quien invoca el WebWorker)
            fnGetObject();
        } // end try 
        catch (e) {
            /*
				// Cuando se genera éste error al hacer la petición a través de la interfaz FileSystem 
				// se 
			*/
            if (e.toString().indexOf('NotFoundError') > -1) {
                // Como no se encuntra se debe guardar el archivo en el explorador, si se quiere guardar (cache = false)
                if (ctx.data.cache) ctx.data.update = true;
                fnSendRequestFile(ctx.data);
            } // fin if not found
            else fnOnError(e);
        } // fin catch
    } // finend function
    //---------------------------------

    /*
		//---------------------------------
		// Se hace solicitud al servidor y la respuesta es guardara con el API FileSystem
		//---------------------------------
	*/
    function fnSendRequestFile() {
        // Se valida que no se agregue doble slash
        if (ctx.hostPath[ctx.hostPath.length - 1] == ctx.data.src[0]) {
            ctx.data.src = ctx.data.src.substr(1, ctx.data.src.length - 1);
        } // end if

        ctx.xhr = new XMLHttpRequest();
        ctx.xhr.open(ctx.data.method, ctx.hostPath + ctx.data.src, true);
        ctx.xhr.responseType = 'arraybuffer';
        // Esto se hace ya que por defecto los exploradores guardan en cache las llamadas xhr
        ctx.xhr.setRequestHeader("Content-Type", ctx.mime); // simulate a file MIME POST request.
        //---------------------------------
        // Headers para evitar que se guarde en cache el recurso solicitado
        ctx.xhr.setRequestHeader('Cache-Control', 'max-age=0');
        ctx.xhr.setRequestHeader('Pragma', 'No-cache');
        ctx.xhr.setRequestHeader('Pragma', 'Cache-Control: no-cache');

        /*
			//---------------------------------
			// Forma de como se agregar un header a la petición
			// this.xhr.setRequestHeader('key', 'value');
			// Se sobreescreibe el mime type si se quiere
			// ctx.xhr.overrideMimeType(mime); 
			//---------------------------------
		*/
        ctx.xhr.overrideMimeType(ctx.mime);

        ctx.xhr.onreadystatechange = function (e) {
            if (this.readyState == 4) {
                // Si hay alguna clase de error se envía a la wep app
                if (this.status == 200) {
                    ctx.blob = new Blob([new Uint8Array(this.response)], { type: (ctx.mime == mimes.formQ ? mimes.json : ctx.mime) });
                    // Se captura la información y se envia a la App 
                    try {
                        fnGetObject();
                    } catch (e) {
                        fnOnError(e);
                    } // end try catch	
                } // end 200
                else {
                    // El tipo de objeto que retorna el navegador es { Estado: (1|0), Mensaje: '' }
                    postMessage({ Estado: false, Mensaje: e.responseText });
                } // end else
            } // end if xhr IsReafy
        }; // end function statechange of Xhr 

        // Si el worker es para hacer una pertición post o put se envía la información
        var parSend;
        if (ctx.data.value) {
            switch (ctx.mime) {
                case mimes.formQ:
                    var parSend = '';
                    for (var i in ctx.data.value) {
                        form += i + '=' + ctx.data.value[i] + '&';
                    } // end for
                    break;
                case mimes.json:
                    parSend = JSON.stringify(ctx.data.value);
                    break;
            } // end switch
        } // end if

        ctx.xhr.send(parSend);
        ctx.xhr.addEventListener('error', fnOnError, false);
    } // fin método
    //---------------------------------

    /*
	    //---------------------------------
	    // Se captura la información y se envia a la App 
	    //---------------------------------
	*/
    function fnGetObject() {
        /*
		    // Si el arcvivo va hacer tratado como texto entonces se lee el archivo y 
		    // se retorna el texto que hay dentro del archivo
	    */
        if (ctx.data.isText) {
            var reader = new FileReaderSync();
            ctx.text = reader.readAsText(ctx.blob);
            ctx.text = (ctx.mime == mimes.json || ctx.mime == mimes.formQ) && ctx.text.length ? JSON.parse(ctx.text) : ctx.text;
        } // fin if isText
        // se guarda el archivo, dentro de la función se evalua si se debe actualizar o no
        fnSaveFile();
        // Se envia la informacion a la App
        postMessage({ src: fnGetURL(ctx.blob), result: ctx.text });
    }  // fin método
    //---------------------------------

    /*
		//---------------------------------
		// Se guarda el blob dentro del explorador
		//---------------------------------
	*/
    function fnSaveFile() {
        if (ctx.data.update) {
            // Se crea o se lee el archivo
            var fileEntry = ctx.fs.root.getFile(ctx.name, ctx.write);
            // Se elimina el archivo
            fileEntry.remove();
            // Se vuelve a crear el archivo
            fileEntry = ctx.fs.root.getFile(ctx.name, ctx.write);
            // Se escribe el archivo
            var fileWriter = fileEntry.createWriter();
            fileWriter.write(ctx.blob);
        } // fin if update
    } // fin método
    //---------------------------------

    /*
		//---------------------------------
		// Retorna la url del blob
		//---------------------------------
		// Paràmetros:
		//---------------------------------
		// @blob:	Objeto binario con la información de la petición
		//			retornada por el servidor.
		//---------------------------------
	*/
    function fnGetURL() {
        return URL.createObjectURL(ctx.blob);
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Método similar al Jquery.extend, que combina propiedades entre objetos
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // arguments:	Objetos que se quieren combinar, el primer parámetro
		// 				es al que see le van a referencias el resto de parámetros.
        //---------------------------------
        // Retorna:		Retorna el primer parámetro.
        //---------------------------------
    */
    function fnExtend() {
        for (var i = 1; i < arguments.length; i++)
            for (var key in arguments[i])
                if (arguments[i].hasOwnProperty(key))
                    arguments[0][key] = arguments[0][key] !== undefined ? arguments[0][key] : arguments[i][key];
        return arguments[0];
    } // end function
    //---------------------------------

    /*
		//---------------------------------
		// Costructor para la fecha con formato yyyy-MM-dd
		//---------------------------------
		// Parámetros:
		//---------------------------------
		// @date: 		Fromato de fecha yyyy-MM-dd-hh
		//---------------------------------
		// Retorna:		Retorna un objeto Date.
        //---------------------------------
    */
    var JDate = function (date) {
        var ad = date.split('-'); // Array date
        return new Date(ad[0], ad[1], ad[2], ad[3]);
    }; // fin costructor
    //---------------------------------

    // Public API
    this.fnInit = fnInit;
    this.fnGetFile = fnGetFile;
    this.fnSaveFile = fnSaveFile;
    // Para desarollo
    this.info = ctx;
    // Public property
}).apply(ajax);
// End namespace ajax
//---------------------------------

//---------------------------------
// Recepción del App
self.addEventListener("message", function (e) {
    // Init
    ajax.fnInit(e.data);
    // Se procede hacer la petición al servidor y a guardar el archivo si se quiere
    ajax.fnGetFile();
});
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


/*	
	// Este código es para eliminar archivos
	self.requestFileSystemSync = self.webkitRequestFileSystemSync || self.requestFileSystemSync;
	var localSizeFiles = 10*1024*1024, write = { create:true };
	var fs = requestFileSystemSync(TEMPORARY, localSizeFiles);
	var fileEntry = fs.root.getFile('test.css', write);
	fileEntry.remove();
*/