// Variable para cada explorador
self.requestFileSystemSync = self.webkitRequestFileSystemSync || self.requestFileSystemSync;
if(!self.Promise) self.importScripts('https://www.promisejs.org/polyfills/promise-6.1.0.js');
if(!self.Request) self.importScripts('../polyfills/fetch.js');
if(!self.tools) self.importScripts('worker-tools.js');

// Varables del módulo
var ajax = {};

// Si se desea guardar de forma permanente las archivos esta es la medidas
var constFs = {
    SIZEFILES: 10 * 1024 * 1024,
    READ: { create: 0 },   // Objeto par cuando se quiere leer
    WRITE: { create: 1 }   //  Objeto par cuando se quiere guardar
};

// Definición del módulo
(function () {
    // Objeto principal
    var fs = null;       // Sistema de archivos API
            
    // Compatibilidad con navegadores para que no se genere errores
    if (self.requestFileSystemSync) fs = fs || self.requestFileSystemSync(TEMPORARY, constFs.SIZEFILES);

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
                return self.tools.ajax.send(data);
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
            if(data.file && data.file.jdate > Date.parse(data.blob.lastModifiedDate)) { 
                return self.tools.ajax.send(data);
            } else {
                data.update = false;
                return new Promise(function (resolve, reject) {
                    try { resolve(self.tools.ajax.getObject(data)); }
                    catch(e) { reject(e); }
                });
            } // end else
        } // end try 
        catch (e) {
            /*
                // Cuando se genera éste error al hacer la petición a través de la interfaz FileSystem 
                // se realiza la petición al servidor
            */
            if (e.toString().indexOf('NotFoundError') > -1) return self.tools.ajax.send(data);
            else self.tools.ajax.error(e, data.name);
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
        return respuesta.blob().then(function(blob) { 
            // Se crea o se lee el archivo
            var fileEntry = fs.root.getFile(data.name, constFs.WRITE);
            // Se elimina el archivo
            fileEntry.remove();
            // Se vuelve a crear el archivo
            fileEntry = fs.root.getFile(data.name, constFs.WRITE);
            // Se escribe el archivo
            var fileWriter = fileEntry.createWriter();
            fileWriter.write(blob);
            
            return blob;
        }).catch(function(err) { self.tools.ajax.error(new Error(err).stack); });
    } // fin método
    //---------------------------------

    /*
        //---------------------------------
        // Función para eliminar los archivos del navegador
        //---------------------------------
    */
    function fnDeleteFiles() {
        var reader = fs.root.createReader();
        var files = reader.readEntries();
        
        for(var i in files) {
            files[i].remove();
        } // end for

        /*
            Para obtener un archivo y elminarlo
            var fileEntry = fs.root.getFile('test.css', write);
            fileEntry.remove();
        */
    } // end function
    //---------------------------------

    // Public API
    this.getFile = fnGetFile;
    this.save = fnSaveFile;
    this.removeAll = fnDeleteFiles;
}).apply(ajax);
// End namespace ajax
//---------------------------------

//---------------------------------
// Recepción del App
self.addEventListener("message", function (e) {
    var datos  = e.data;
    datos.getFile = ajax.getFile;
    datos.save = ajax.save;

    // Init
    try {
        self.tools.ajax.get(e.data).then(self.postMessage).catch(self.tools.ajax.error);
    } catch(e) { console.log(datos); throw new Error(e); }
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