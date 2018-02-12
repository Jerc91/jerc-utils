// TODO: 
// Para no leer del disco usar una lista de la url del archivo y y la fecha de inserción al cache usando indexdb

// Variables globales
self.requestFileSystemSync = self.webkitRequestFileSystemSync || self.requestFileSystemSync;
self.importScripts('requester-tools.js');
self.requester = {};

// Definición del módulo
(function () {
    // Si se desea guardar de forma permanente las archivos esta es la medidas
    var constFs = {
        SIZEFILES: 10 * 1024 * 1024,
        READ: { create: 0 },   // Objeto par cuando se quiere leer
        WRITE: { create: 1 }   //  Objeto par cuando se quiere guardar
    };

    // Sistema de archivos API
    var fs = null;

    // Compatibilidad con navegadores para que no se genere errores
    if (self.requestFileSystemSync) fs = fs || self.requestFileSystemSync(TEMPORARY, constFs.SIZEFILES);
    self.tools.factoryError(fnHandleMessagesError);

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
            if (!data.cache || !fs) {
                return self.tools.send(data);
            } // fin if cache

            // Propiedad para evaluar si se va a actualizar o no el archivo
            data.update = true;

            // Se obtiene el archivo desde el navegador
            var fileEntry = fs.root.getFile(data.name, constFs.READ);
            data.blob = fileEntry.file();

            /*
                // Si el archivo se encuentra en el .json de archivos a actualizar (filesToUpdate) se valida la fecha
                // de la última modificación, con la fecha que se encuentra en el archivo local y si es mayor la fecha 
                // del objeto es mayor a la del local entonces se hace la petición al servidor y se gaurda en el navegador.
            */
            if (!isNaN(data.jdate) && data.jdate > Date.parse(data.blob.lastModifiedDate)) {
                return self.tools.send(data);
            } else {
                data.update = false;
                return self.tools.getObject(data);
            } // end else
        } // end try 
        catch (e) {
            /*
                // Cuando se genera éste error al hacer la petición a través de la interfaz FileSystem 
                // se realiza la petición al servidor
            */
            if (e.toString().indexOf('NotFoundError') > -1) return self.tools.send(data);
            else self.tools.error(e, data.name);
        } // fin catch
    } // finend function
    //---------------------------------

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
        var respuesta = response.clone();
        return respuesta.blob().then(function (blob) {
            // Se crea o se lee el archivo
            var fileEntry = fs.root.getFile(data.name, constFs.WRITE),
                fileWriter;
            // Se elimina el archivo
            fileEntry.remove();
            // Se vuelve a crear el archivo
            fileEntry = fs.root.getFile(data.name, constFs.WRITE);
            // Se escribe el archivo
            fileWriter = fileEntry.createWriter();
            fileWriter.write(blob);

            return blob;
        }).catch(self.tools.error);
    } // fin método
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
    this.getFile = fnGetFile;
    this.save = fnSaveFile;
    this.removeAll = fnDeleteFiles;
}).apply(self.requester);
// End namespace requester
//---------------------------------

//---------------------------------
// Recepción del App
self.addEventListener("message", function (e) {
    var datos = e.data;
    datos.getFile = self.requester.getFile;
    datos.save = self.requester.save;

    // Init
    try {
        self.tools.get(e.data)
            .then(self.postMessage)
            .catch(self.tools.error);
    } catch (e) {
        self.tools.error(e);        
    }
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