// Espacio de nombres
self.tools = {};

// Definición del módulo
(function() {
	var hostPath, info, respuesta;

	// Mime types que permite el worker para importar archivos
	var constMimes = {
	    BLOB: 'application/octet-stream',
	    CSS: 'text/css; charset="utf-8"',
	    IMG: 'image/jpeg',
	    JS: 'text/javascript; charset="utf-8"',
	    JSON: 'application/json; charset="utf-8"',
	    TEXT: 'text/plain; charset="utf-8"',
	    FORMQ: 'application/x-www-form-urlencoded',
	    FORMDATA: 'multipart/form-data'
	}; // Tipos de archivo por defecto

	/*
	    //---------------------------------
	    // Inicio del worker, toma el FileSystem y antes toma el archivo, si el archivo no esta en
	    // explorador éste es creado
	    //---------------------------------
	    // Parámetros:
	    //---------------------------------
	    // @pars:           información del archivo a solicitar {}
	    //---------------------------------
	    // @pars.cache:     Para que no se guarde en el explorador de ser 0 ( 0 || 1)
	    // @pars.src:       Dirección del archivo a solicitar.  ''
	    // @pars.mime:      El tipo de mime que se traerá
	    // @pars.method:    Tipo de petición que se hará al servidor
	    // @pars.files:     Arreglo con los objetos que contiene los archivos a actualizar
	    //---------------------------------
	    // Retorna:	Retorna la respuesta del servidor
	    //---------------------------------
	*/
	function fnInit(pars) {
	    // variables privadas
	    var data = {};

	    // Se obtiene el nombre del archivo o ruta de la petición
	    data.name = pars.src.split("/");
	    data.name = data.name[data.name.length - 1];

	    // Se combinan los parámetros de la petición a realizar, con parámetros por defecto
	    fnExtend(data, pars, {
	        cache: true,   // Para que no se guarde en el explorador
	        method: 'GET', // Tipo de petición o verbo
	        mime: (data.mime || fnGetMime(data.name)) || 'JS'
	    }); // fin combinación

	    // Se obtiene el mime de la petición
	    data.mime = constMimes[data.mime.toUpperCase()];
	    data.isText = (data.mime == constMimes.JSON || data.mime == constMimes.TEXT || data.mime == constMimes.FORMQ);

	    /*
	        // Si dentro de los objetos filesToUpdate de la primera carga se encuentra el arhivo
	        // que se quiere cargar se retorna el objeto que debe tener la estructura nombre fecha
	    */
	    if(data.files && data.files.fnFind) {
	    	data.file = data.files.fnFind(function (e) { return data.name == e.name; });
	    	if(data.file) data.file.jdate = Date.parse(data.file.date);
	    } 
	    
	    // Se obtiene la ruta del servidor, el webworker debe estar contenido dentro de la carpeta assets
	    if(!hostPath) {
	        hostPath = location.href.substring(0, location.href.indexOf('assets'));
	        // Se valida que no se agregue doble slash
	        if (hostPath[hostPath.length - 1] == data.src[0]) {
	            data.src = data.src.substr(1, data.src.length - 1);
	        } // end if
	    }

	    // Se obtiene la variable
	    info = pars;
	    return (data.getFile) ? data.getFile(data) : fnSendRequest(data); 
	} // fin fnInit
	//---------------------------------

	/*
	    //---------------------------------
	    // Se hace solicitud al servidor y la respuesta es guardara con el API FileSystem, o CacheStorage
	    // dependiendo de la configuración.
	    //---------------------------------
	    // Parámetros:
	    //---------------------------------
	    // @data: 	{object} Información de la petición a realizar.
	    //---------------------------------
	    // Retorna una promesa de fetch
	    //---------------------------------
	*/
	function fnSendRequest(data) {
		var request = new Request(hostPath + data.src, {
	        method: data.method,
	        cache: 'no-cache',
	        headers: new Headers({ "Content-Type": data.mime }),
	        body: JSON.stringify(data.value)
	    });

	    // Se obtiene la respuesta del servidor y se retorna la promesa
	    return fetch(request).then(function(response) {
	    	if (!response.ok) { // See https://fetch.spec.whatwg.org/#ok-status
				throw new Error('Invalid HTTP response: ' + response.status);
			}
    		return !data.update ? response.blob() : data.save(data, response);
	    }).then(function(response) {
	    	data.blob = response;
        	return fnGetObject(data);
        }).catch(function(err) { fnOnError(new Error(err).stack); });
	} // fin método
	//---------------------------------

	/*
	    //---------------------------------
	    // Se captura la información y se envia a la App 
	    //---------------------------------
	    // Parámetros:
	    //---------------------------------
	    // @data: 		{object} 	Información de la petición realizada.
	    //---------------------------------
	    // Retorna: Respues del servidor
	    //---------------------------------
	*/
	function fnGetObject(data) {
		/*  
	        // Si el arcvivo va hacer tratado como texto entonces se lee el archivo y 
	        // se retorna el texto que hay dentro del archivo
	    */
	    if (data.isText) {
	        var reader = new FileReaderSync();
	        data.text = reader.readAsText(data.blob);
	        data.text = (data.mime != constMimes.TEXT) && data.text.length ? JSON.parse(data.text) : data.text;
	    } // fin if isText

	    // Se envia la informacion a la App
	    return { blob: data.blob, result: data.text, path: data.src };
	}  // fin método
	//---------------------------------

	/*
	    //---------------------------------
	    // Método similar al Jquery.extend, que combina propiedades entre objetos
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
	    for (var i = 1; i < arguments.length; i++)
	        for (var key in arguments[i])
	            if (arguments[i].hasOwnProperty(key))
	                arguments[0][key] = arguments[0][key] !== undefined ? arguments[0][key] : arguments[i][key];
	    return arguments[0];
	} // end function
	//---------------------------------

	/*
	    //---------------------------------
	    // Función para obtener la extensión de un archivo
	    //---------------------------------
	    // Parámetros:
	    //---------------------------------
	    // @name:       Ruta de la petición
	    //---------------------------------
	    // Retorna:     Propiedad de constMimes
	    //---------------------------------
	*/
	function fnGetMime(name) {
	    var mime, extension;
	    
	    extension = name.split('.');
	    extension = extension[extension.length - 1].toLowerCase();

	    // Imágenes
	    if(extension == 'jpg' || extension == 'png') mime = constMimes.BLOB;
	    else if(extension == 'css') mime = constMimes.CSS;
	    else if(extension == 'js') mime = constMimes.JS;
	    else if(extension == 'json') mime = constMimes.JSON;
	    else if(extension == 'txt' || extension == 'html') mime = constMimes.TEXT;

	    // Se usa el nombre de la propiedad como valor
	    for(var i in constMimes) if(constMimes[i] == mime) return i;
	    return mime;        
	} // end function
	//---------------------------------

	/*
	    //---------------------------------
	    // Agrega texto dentro de la consola, para el manejo de errores
	    //---------------------------------
	    // Paràmetros:
	    //---------------------------------
	    // @e:  Parámetro que retorna un error en la estructura try, catch
	    //---------------------------------
	*/
	function fnOnError(err) { console.log('Error: ' + err, info.src); }
	//---------------------------------

	/*
        //---------------------------------
        // Función para retornar la fecha actual en formato números, esto dentro de un blob,
        // para obtener el número de bytes que tiene éste formato y así usarlo para separar un blob
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // Retorna:     Blob.
        //---------------------------------
    */
    function fnGetBlobDate() {
    	return new Blob([Date.parse(new Date())]);
    }

	//---------------------------------
	// Public API
	this.mimes = constMimes;
	this.get = fnInit;
	this.getObject = fnGetObject;
	this.send = fnSendRequest;
	this.error = fnOnError;
	this.getBlobDate = fnGetBlobDate;
	//---------------------------------
}).call(tools.ajax || (tools.ajax = {}));

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