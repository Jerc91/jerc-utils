// Variable para cada explorador
self.requestFileSystemSync = self.webkitRequestFileSystemSync || self.requestFileSystemSync;

var ajax = {};

// Definición del objeto
(function () {
	// Varialbes privadas
	// Si se desea guardar de forma permanente las archivos esta es la medidas
	var localSizeFiles = 10*1024*1024, 
	name = [], // Name of file
	read = { create: false }, // Objeto par cuando se quiere leer
	write = { create: true }, //  Objeto par cuando se quiere guardar
	// Mime types que permite el worker para importar archivos
	mimes = { 
		blob: 'application/octet-stream',
		css: 'text/css; charset="utf-8"',
		img: 'image/jpeg',
		js:'text/javascript; charset="utf-8"',
		json:'application/json; charset="utf-8"',
		text:'text/plain; charset="utf-8"'
	}, // Tiposd earchivo por defecto
	fs, blob, mime, hostPath, data; 
	// Sistema de archivos API,	(fs) 
	// Bynary object, 			(blob)
	// tipo de archivo,			(mime)
	// aríz del sitio web,		(hostPath) 
	// Propiedades del archivo 	(data)

	/*
        //---------------------------------
        // Agrega texto dentro de la consola, para el manejo de errores
        //---------------------------------
        // Paràmetros:
        //---------------------------------
        // @e:	Parámetro que retorna un error en la estructura try, catch
        //---------------------------------
    */
    function fnOnError(e){
        console.log('Error: ' + e.message);
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
		// @pars.cache:		Para que no se guarde en el explorador de ser 0 ( 0 || 1)
		// @pars.src:		Dirección del archivo a solicitar.	''
		// @pars.mime:		El tipo de mime que se traerá
		// @pars.method:	Tipo de petición que se hará al servidor
		//---------------------------------
	*/
	function fnInit(pars) {
		// Si se llama de nuevo el hilo y el archivo 
		// ya fue creado se retorna
		if(this.created) return;

		// Compatibilidad con navegadores
		// para que no se genere errores
		if(requestFileSystemSync) {
			fs = requestFileSystemSync(TEMPORARY, localSizeFiles);
		} // end if
		else {
			pars.cache = false;
		} // end else

		name = pars.src.split("/");
		name = name[name.length - 1];
		hostPath = location.href.substring(0,location.href.indexOf('assets'));
		
		// Objecto por defecto
		fnExtend(pars, {
			cache: true, // Para que no se guarde en el explorador
			file: undefined, // Nombre del archivo
			// Para retorna el texto y no una URL del blob
			isText: (pars.mime == 'json' || pars.mime == 'text'), 
			method: 'GET', // Tipo de petición o verbo
			mime: 'js', // MimeType
			text: undefined,
			update: false
		}); // fin combinación

		mime = mimes[pars.mime];
		/*
			// Si dentro de los objetos filesToUpdate de la primera carga se encuentra el arhivo
			// que se quiere cargar se retorna el objeto que debe tener la estructura nombre fecha
		*/
		pars.file = pars.files.fnFind(function (e) { return name == e.name; });
		
		data = pars;
		this.created = true;
	} // fin fnInit
	//---------------------------------
	
	/*
		//---------------------------------
	    // Obtiene el archivo, cuando el archivo existe este se lee del explorador y se retornal la 
	    // url del blob, o se retorna el texto de blob, is se presenta un error al leer, esto sucederá, 
	    // por que el archivo no existe en el explorador, entonces se hace una petición al servidor,
	    // cuando éste responda se guardará la respuesta en el explorador
	    //---------------------------------
    */
	function fnGetFile(){
		try {
			// Esto se hace cuando no se quiere guardar el archivo
			if (!data.cache) {
				fnGetRequestFile(data);
				return;
			} // fin if cache

			// Se obtiene el archivo desde el explorador
			var fileEntry = fs.root.getFile(name, read);
			var file = fileEntry.file();
			
			/*
				// Si el archivo se encuentra en el .json de archivos a actualizar se valida la fecha de la última modificación
				// con la fecha que se encuentra en el arvhico local y si es mayor la fecha del objeto es mayor a la del local
				// entonces se hace la petición al servidor y se gaurda en el explorador
			*/
			if(data.file){
				// JDate, retorna un objeto Date, la diferencia es que recibe un string con el formato yyyy-MM-dd-hh
				if(new JDate(data.file.date) > file.lastModifiedDate) { 
					// Propiedad para evaluar si se va a actualizar o no el archivo
					data.update = true;
					fnGetRequestFile(data);
					return;
				} // fin if compare dates
			} // fin if exist file to update
			fnGetObject(file);
		} // end try 
		catch(e){
			/*
				// Se genera este error cuando se hace el request al FileSystem 
				// del explorador y no se encuentra el archivo buscando
			*/
			if(e.toString().indexOf('NotFoundError') > -1)  {
				// Como no se encuntra se debe guardar el archivo en el explorador, si se quiere guardar (cache = false)
				if(data.cache) data.update = true;
				fnGetRequestFile(data);
			} // fin if not found
			else fnOnError(e);
		} // fin catch
	} // finend function
	//---------------------------------

	/*
		//---------------------------------
		// Se hace solicitud al servidor y la respuesta es guardara con el API FileSystem
		//---------------------------------
		// Parámetros
		//---------------------------------
		// @data: 			Objeto con los valores necesarios para importar un archivo
		// @data.method:	Tipo de peteción que se solicitará al servidor (POST, GET, PUT, DELETE)
		// @data.src:		Url en donde se hará la petición al servidor
		// @data.value:		Son los datos de un formulario para enviar al servidor
		//---------------------------------
	*/
	function fnGetRequestFile(data){
		if(!this.xhr) this.xhr = new XMLHttpRequest();
		this.xhr.open(data.method, hostPath + data.src, true);
		this.xhr.responseType = 'arraybuffer'; 
		if (data.value) this.xhr.responseType = '';
		// Esto se hace ya que por defecto los exploradores guardan en cache las llamadas xhr
		this.xhr.setRequestHeader("Content-Type", mime); // simulate a file MIME POST request.
		//---------------------------------
		// Headers para evitar que se guarde en cache el recurso solicitado
		this.xhr.setRequestHeader('Cache-Control', 'max-age=0');
		this.xhr.setRequestHeader('Pragma', 'No-cache');
		this.xhr.setRequestHeader('Pragma', 'Cache-Control: no-cache');
		
		/*
			//---------------------------------
			// Forma de como se agregar un header a la petición
			// this.xhr.setRequestHeader('key', 'value');
			// Se sobreescreibe el mime type si se quiere
			// this.xhr.overrideMimeType(mime); 
			//---------------------------------
		*/

		this.xhr.onreadystatechange = function(e) {
			if (this.readyState == 4) {
				// Si hay alguna clase de error se envía a la wep app
				if(this.status == 200) {
					// Se crea el blob
					blob = new Blob([new Uint8Array(this.response)], { type: mime });
					try{ 
					    fnGetObject(blob);
					} catch (e) {
						fnOnError(e);
					} // end try catch	
				} // end 200
				else {
					postMessage({ result: 'Error: ' + e.srcElement.responseText });
				} // end else
			} // end if xhr IsReafy
		}; // end function statechange of Xhr 

		// Si el worker es para hacer una pertición post o put se envía la información
		if (data.value) 
			this.xhr.send(JSON.stringify(data.value));
		else 
			this.xhr.send();
		this.xhr.addEventListener('error',fnOnError, false);
	} // fin método
    //---------------------------------

    /*
	    //---------------------------------
	    // Se captura la información y se envia a la App 
	    //---------------------------------
		// Paràmetros:
		//---------------------------------
		// @blob:	Objeto binario con la información de la petición
		//			retornada por el servidor.
		//---------------------------------
	*/
	function fnGetObject(blob) {
		/*
		    // Si el arcvivo va hacer tratado como texto entonces se lee el archivo y 
		    // se retorna el texto que hay dentro del archivo
	    */
	    if (data.isText) {
	        var reader = new FileReaderSync();
	        data.text = reader.readAsText(blob);
	        data.text = data.mime == 'json' && data.text.length ? JSON.parse(data.text) : data.text;
	    } // fin if isText
	    // se guarda el archivo, dentro de la función se evalua si se debe actualizar o no
	    fnSaveFile();
        // Se envia la informacion a la App
	    postMessage({ src: fnGetURL(blob), result: data.text, action: 'read', update: data.update });
	}  // fin método
    //---------------------------------

	/*
		//---------------------------------
		// Se guarda el blob dentro del explorador
		//---------------------------------
	*/
	function fnSaveFile() {
		if(data.update) { 
			// Se crea o se lee el archivo
			var fileEntry = fs.root.getFile(name, write);
			// Se elimina el archivo
			fileEntry.remove(); 
			// Se vuelve a crear el archivo
			fileEntry = fs.root.getFile(name, write);
			// Se escribe el archivo
			var fileWriter = fileEntry.createWriter();
			fileWriter.write(blob);
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
	function fnGetURL(blob){
		return URL.createObjectURL(blob);
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
    function fnExtend(){
        for(var i=1; i < arguments.length; i++)
            for(var key in arguments[i])
                if(arguments[i].hasOwnProperty(key))
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
    var JDate = function (date){
    	var ad = date.split('-'); // Array date
    	return new Date(ad[0], ad[1], ad[2], ad[3]);
    }; // fin costructor
    //---------------------------------

	// Public API
	this.fnInit = fnInit;
	this.fnGetFile = fnGetFile;
	this.fnSaveFile = fnSaveFile;
	// Public property
	this.created = false;
}).apply(ajax);
// End namespace ajax
//---------------------------------

//---------------------------------
// Recepción del App
self.addEventListener("message", function(e){
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
        value: function(predicate,all) {
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
                        if(!all) return value;
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