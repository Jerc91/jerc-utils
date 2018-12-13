// TODO:
// Peticiones invalida online
// Validar catch con fallas en cada promise
// Validar performance de la aplicación con un archivo grande
// Validar si se requiere usar fnHandleMessagesError, para utilizar con el patrón command
// Se debe verificar el uso de streamning
// 
// Revisar de nuevo los service worker
// ver lo del controller usar nuevos eventos
// ver si es mejor usar skipWaiting
// 

self.importScripts('/assets/js/workers/requester-tools.js');

// Varables del módulo
self.requester = {};

(function () {
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
		// Valida si el parametro es una función y la ejecuca pasandole los parámetros que se indiquen
		//---------------------------------
		// Parámetros:
		//---------------------------------
		// @cb:     {function}  Función a ejecutar
		// @arg1:   {any}       Parámetro a ejecutar
		// @arg2:   {any}       Parámetro a ejecutar
		// @arg...: {any}       Parámetro a ejecutar
		//---------------------------------
		// Retorna: El resultado de la función
		//---------------------------------
	*/
	function fnExecFunction(cb) {
		var pars = fnParametersWithoutFirst(...arguments);
		if(fnIsFunction(cb)) return pars ? cb(...pars) : cb(pars);
	} // end fnExecFunction

	/*
		//---------------------------------
		// Obtiene los parametros excepto el primero y retorna un array
		//---------------------------------
	*/
	function fnParametersWithoutFirst() {
		var pars,
			size = arguments.length;
		if (size > 1) {
			pars = [];
			for(var i = 1; i < size; i++) pars[pars.length] = arguments[i];
		}
		return pars;
	}

	// Constructor quien administra los observados
	function Command() {
		const _commands = {},
			_api = this;

		_api.on = (command, fnCallback) => {
			_commands[command] = function () {
				return fnExecFunction(fnCallback, ...arguments);
			};
			return _api;
		}

		_api.off = (command) => {
			delete _commands[command];
			return _api;
		}
		_api.trigger = function (command) {
			let pars = fnParametersWithoutFirst(...arguments) || [];
			return _commands[command](...pars);
		}

		return _api;
	}

	Object.defineProperty(self, 'command', { get: () => new Command() });
})();

// Definición del módulo
(function () {
	// Variables privadas
	let CACHE_VERSION = self.tools.constants.CACHE_VERSION,
		HEADER_JR = self.tools.constants.HEADER_JR,
		FILESTOUPDATE = self.tools.constants.FILESTOUPDATE,
		CACHE_FILES = [""],
		COMMAND = self.command
			.on('request', sendRequest)
			.on('filesToUpdate', updateFilesToUpdate);

	let	CACHE_CURRENT,
		ORIGIN_PATH = '',
		INIT_SERVICE = false,
		paths = [];

	// Inicio Service Worker
	paths = location.href.split('/');
	ORIGIN_PATH = paths.splice(0, paths.length - 1).join('/');
	ORIGIN_PATH += '/';
	
	// Errores    
	self.tools.factoryError(sendMessageClients);

	/**
	 * Función para obtener los archivos estaticos
	 * @return {Promise<Cache>} Obtiene el cache storage
	 */
	function init() {
		if (INIT_SERVICE) return Promise.resolve();
		return caches.keys().then(keys => {
			return Promise.all(keys.map((key, i) => {
				if (key !== CACHE_VERSION) return caches.delete(keys[i]);
			}))
			.then(() => caches.has(CACHE_VERSION).then(result => {
				let promiseCache = caches.open(CACHE_VERSION);
				return result ? promiseCache.then(assignCache) : promiseCache.then(cache => {
					assignCache(cache).addAll(CACHE_FILES);
				});
			})
			.then(() => INIT_SERVICE = true));
		}).catch(self.tools.error);

		/**
		 * Función de recursividad
		 * @param  {CacheStorage} cache actual cache
		 * @return {CacheStorage}       actual cache
		 */
		function assignCache(cache) {
			return CACHE_CURRENT = cache;
		}
	}

	/**
	 * Una vez se instala el service worker, elimina el cache y se descarga los archivos iniciales si el caceh actual no esta definido
	 * @param  {Event} event evento instalar del service worker
	 * @return {Promise}       Se resuelve al iniciar el cache actual
	 */
	function handlerInstall(event) {
		// Espera a que se obtengan los archivos iniciales de cache
		event.waitUntil(init().then(self.skipWaiting).catch(self.tools.error));
	}

	/**
	 * Una vez se active el service worker, elimina el cache y se descarga los archivos iniciales si el caceh actual no esta definido
	 * @param  {Event} event evento activar del service worker
	 * @return {Promise}       Se resuelve al iniciar el cache actual
	 */
	function handlerActive(event) {
		// Espera a que se elimine la cache
		event.waitUntil(init().then(() => self.clients.claim()).catch(self.tools.error));
	}

	/**
	 * Filtra todas las peticiones hacia el servidor, y decide si enviar la petición al serividor o usar una versión local de la respuesta.
	 * @param  {Event} event evento fetch del service worker
	 * @return {Promesa}       Espera mientras se resuelve a donde realizar la petición
	 */
	function handlerFetch(event) {
		// Peticiones realizadas desde worker o para saltarse el cacheStorage
		if(event.request.headers.has(HEADER_JR)) {
			event.request.headers.remove(HEADER_JR);
			return event.respondWith(fetch(event.request));
		}

		if(!event.request.url.startsWith(self.location.origin)) {
			return event.respondWith(fetch(event.request));
		} 

		let promiseCache = init().then(() => {
			let OFFLINEURL = 'index.html',
				HASHTAG = '#!',
				request = event.request,
				requestUrl = request.url.replace(ORIGIN_PATH, ''),
				targetUrl,
				options,
				cors;

			targetUrl = (!requestUrl || requestUrl.includes(HASHTAG) || !requestUrl.indexOf('?')) ? OFFLINEURL : requestUrl;
			
			return self.tools.getFile({ src: targetUrl, fromFetch: true });
		});

		// Realiza la petición al cacheStorage o al servidor
		return event.respondWith(promiseCache);
	}

	/**
	 * Usa el patrón command para recibir y enviar información, se usa para peticiones personalizadas
	 * @param  {Event} event evento message del service worker
	 * @return {Promise}       se resuelve una vez se obtenga la información de la petición
	 */
	function handlerMessage(event) {
		let port = event.ports[0];
		
		// Se obtiene la respuesta y esta es enviada al servidor
		return COMMAND.trigger(event.data.command, event.data)
			.then(datos => port.postMessage(datos))
			.catch(error => port.postMessage(error));
	}

	/**
	 * Se envia a los clientes el mensaje que se pasa como párametro
	 * @param  {Object} mensaje información que se quiere transmitir al usuario
	 * @return {Promise}     Se resuelve una vez se envia el mensaje a todos los clientes solicitados
	 */
	function sendMessageClients(mensaje) {
		return self.clients.matchAll().then(clients => {
			clients.forEach(client => client.postMessage(`SW Says: '${JSON.stringify(mensaje)}'`));
		});
	}

	/**
	 * Obtiene la respuesta de una petición sea guardada o en línea
	 * @param  {object} datos información de la petición
	 * @return {Promise<object>}       Se resuelve al obtener la respuesta.
	 */
	function sendRequest(datos) {
		if (!navigator.onLine && datos.src == FILESTOUPDATE) {
			return Promise.resolve({ result: {}, path: FILESTOUPDATE, observedId: datos.observedId });
		}

		return self.tools.getFile(datos);
	}


	function updateFilesToUpdate() {
		if(!navigator.onLine) return Promise.resolve(self.tools.constants.FILES_SERVER = {});

		return fetch(FILESTOUPDATE, { headers: { cache: 'no-cache' } })
			.then(response => response.json())
			.then(files => self.tools.constants.FILES_SERVER = files);
	}

	//---------------------------------
	// Public API
	this.handlerInstall = handlerInstall;
	this.handlerActive = handlerActive;
	this.handlerFetch = handlerFetch;
	this.handlerMessage = handlerMessage;
	this.sendMessageClients = sendMessageClients;
	//---------------------------------
}).call(self.requester);

// Asignación de eventos
self.addEventListener('install', self.requester.handlerInstall);
self.addEventListener('activate', self.requester.handlerActive);
self.addEventListener('fetch', self.requester.handlerFetch);
self.addEventListener('message', self.requester.handlerMessage);