// TODO: 
// Para no leer del disco usar una lista de la url del archivo y y la fecha de inserción al cache usando indexdb

// Variables globales
self.requestFileSystemSync = self.webkitRequestFileSystemSync || self.requestFileSystemSync;
self.importScripts('requester-tools.js');
self.requester = {};

// Definición del módulo
(function () {
	// Si se desea guardar de forma permanente las archivos esta es la medidas
	let constFs = {
			SIZEFILES: 10 * 1024 * 1024,
			READ: { create: 0 },   // Objeto par cuando se quiere leer
			WRITE: { create: 1 }   //  Objeto par cuando se quiere guardar
		}, 
		// Sistema de archivos API
		fs = null;

	/*
		//---------------------------------
		// Obtiene el API para usar el FileSystem
		//---------------------------------
	*/
	function fnInitFileSystem() {
		// Compatibilidad con navegadores para que no se genere errores
		if (self.requestFileSystemSync) fs = fs || self.requestFileSystemSync(TEMPORARY, constFs.SIZEFILES);
		self.tools.factoryError(fnHandleMessagesError);        
	}

	/*
		//---------------------------------
		// Parámetros:
		//---------------------------------
		// @data:       {object}    Información de la petición a realizar.
		// @reponse:    {response}  Respuesta del servidor.
		//---------------------------------
		// Se guarda el blob dentro del explorador
		//---------------------------------
	*/
	function fnSaveFile(data, response) {
		return response.clone().blob().then(function (blob) {
			// Se crea o se lee el archivo
			let fileEntry = fs.root.getFile(data.name, constFs.WRITE),
				fileWriter;
			
			// Se elimina el archivo, Se vuelve a crear el archivo, Se escribe el archivo
			data.date = new Date();
			fileEntry.remove();
			fileEntry = fs.root.getFile(data.name, constFs.WRITE);
			fileWriter = fileEntry.createWriter();
			fileWriter.write(blob);

			return self.tools.getResult(data, response);
		}).catch(self.tools.error);
	} // fin método
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
	function fnGetSavedFile(data) {
		try {
			if(!fs) return self.tools.sendRequest(data);
			let hookReponse = new Response(fs.root.getFile(data.name, constFs.READ).file(), { status: 200 });
			return self.tools.getResult(data, hookReponse);
		} catch(e) {
			/*
				// Cuando se genera éste error al hacer la petición a través de la interfaz FileSystem 
				// se realiza la petición al servidor
			*/
			if (e.toString().includes('NotFoundError') > -1) return self.tools.sendRequest(data);
			else self.tools.error(e, data.name);
		}
	} // finend function
	//---------------------------------

	/*
		//---------------------------------
		// Función para eliminar los archivos del navegador
		//---------------------------------
	*/
	function fnDeleteFiles() {
		var reader = fs.root.createReader(),
			files = reader.readEntries();

		for (var i in files) {
			files[i].remove();
		} // end for

		/*
			Para obtener un archivo y elminarlo
			var fileEntry = fs.root.getFile('test.css', write);
			fileEntry.remove();
		*/
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
		console.trace(msj);
	} // fin método
	//---------------------------------

	// Public API
	this.getSavedFile = fnGetSavedFile;
	this.saveFile = fnSaveFile;
	this.removeAll = fnDeleteFiles;
	this.initFileSystem = fnInitFileSystem;
}).apply(self.requester);
// End namespace requester
//---------------------------------

//---------------------------------
// Recepción del App
self.addEventListener("message", function (e) {
	let data = e.data;
	
	// Use FileSystem
	if(data.useFS) {
		self.requester.initFileSystem();
		data.saveFile = self.requester.saveFile;
		data.getSavedFile = self.requester.getSavedFile;
	}
	
	// Get File
	// TODO: Revisar porque en ocasiones no viene el fileToUpdate
	self.tools.constants.FILES_SERVER = data.filesServerToUpdate;
	self.tools.getFile(data).then(datos => {
		self.postMessage(datos);
	}, error => {
		self.postMessage(error);
	});
});
//---------------------------------

/*  
	// Este código es para eliminar archivos
	self.requestFileSystemSync = self.webkitRequestFileSystemSync || self.requestFileSystemSync;
	var localSizeFiles = 10*1024*1024, write = { create:true };
	var fs = requestFileSystemSync(TEMPORARY, localSizeFiles);
	var fileEntry = fs.root.getFile('test.css', write);
	fileEntry.remove();
*/

/*
	   TODO Hacer para que funcione con la nueva implementación
					// Si el arcvivo va hacer tratado como texto entonces se lee el archivo y 
					// se retorna el texto que hay dentro del archivo
				
				if (data.isText) {
					var reader = new FileReader();
					reader.addEventListener('load', function (e) {
						var result = e.target.result;
						data.text = (data.mime != MIMES.TEXT) && result.length ? JSON.parse(result) : result;
						resolve({ blob: data.blob, result: data.text, path: data.src, observedId: data.observedId });
					});
					reader.addEventListener('error', reject);
					reader.readAsText(data.blob);
				} else {
					resolve({ blob: data.blob, result: data.text, path: data.src, observedId: data.observedId });
				}

*/