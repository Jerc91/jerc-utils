// Usar depencia a jmain.js
// Quitar la información del plugin como objeto de js y dejarlo como comentario como todos los plugins

//---------------------------------
// Espacio de nombre para generar animaciones para esperas
//---------------------------------
(function () {

	/*
		//---------------------------------
		// Función para bloquear la pantalla con un spinner o
		// agregar el spinner dentro de un elemento
		//---------------------------------
		// Parámetros:
		//---------------------------------
		// @d: 				Objeto contenedor de los parámetros.
		// @d.query:		Query selector del elemento contenedor del spinner
		// @d.theme:		Número de spinner que se quiere mostrar.
		// @d.relative:		Si esta en true se agregará position relative al contenedor
		// @d.wrapper:		Se usa para buscar dentro de ese elemento con querySelector
		//---------------------------------
		// Contexto @ctx(this):	Instancia del plugin
		//---------------------------------
	*/
	function fnShow(d) {
		// Se crea un objeto 
		var ctx = this;
		
		return new Promise(function(resolve, reject) {
			var fragment;

			// Se crea una instancia del spinner
			if(!(ctx instanceof instance)) {
				ctx = d || {};
				ctx.theme = ctx.theme || obtenerRandom();
				ctx.content = (ctx.wrapper || document).querySelector(ctx.query || 'body');
				ctx.elemento = ctx.content.querySelector('.blockUI');
			}

			// Si el elemento contenedor no existe
			if (!ctx.content) return;

			/*
				// se agrega la clase posRelav, que contiene el estilo 
				// potition relative
			*/
			if (ctx.relative) ctx.content.classList.add('posRelav');

			// Si no se tiene un elemento con clase .blockUI se creará nuevo
			if (!ctx.elemento) {
				ctx.elemento = document.createElement('div');
				// Se agrega el nuevo elemento en el contenedor
				ctx.content.appendChild(ctx.elemento);
			} // end if
			ctx.elemento.setAttribute('class', 'blockUI none');

			// Se elimina el spinner dentro
			if (ctx.elemento.children.length > 0) {
				ctx.elemento.removeChild(ctx.elemento.children[0]);
			} // end if

			// Se crea el spinner
			ctx.spinner = document.createElement('div');
			ctx.spinner.classList.add('spinner');
			ctx.elemento.classList.add('a' + ctx.theme);
			ctx.spinner.classList.add('a' + ctx.theme);
			ctx.elemento.appendChild(ctx.spinner);

			// Se crea el tema al azar
			switch (parseInt(ctx.theme)) {
				case 1: fragment = fnGetHTML('double-bounce', 2, true); break;
				case 2: fragment = fnGetHTML('rect', 5, true); break;
				case 3: fragment = fnGetHTML('cube', 2, true); break;
				case 4: fragment = fnGetHTML('dot', 2, true); break;
				case 5: fragment = fnGetHTML('bounce', 3, true); break;
				case 6: fragment = fnGetHTML('cube', 9); break;
				default: fragment = fnGetHTML('circle', 1); break;
			}

			ctx.spinner.appendChild(fragment);
			ctx.elemento.classList.remove('off');
			ctx.elemento.classList.add('on');

			// Validar cual es mejor, Finalización de animación
			requestAnimationFrame(() => resolve(ctx));
		});

		// Función para crear los diferentes divs por cada tema
		function fnGetHTML(clase, elementos, incrementable) {
			var frag, div;
			frag = document.createDocumentFragment();
			for (var i = 0; i < elementos; i++) {
				div = document.createElement('div');
				div.classList.add(clase + (incrementable ? (i + 1) : ''));
				frag.appendChild(div);
			}
			return frag;
		}
	}

	/*
		//---------------------------------
		// Oculta la animación que bloquea la interfaz
		//---------------------------------
		// Parámetros:
		//---------------------------------
		// @d: 				Objeto contenedor de los parámetros.
		// @d.query:		Query selector que contiene el spinner.
		// @d.relative:		Si esta en true se eliminará position relative al contenedor
		// @d.fnCallBack:	Función de callback
		// @d.wrapper:		Se usa para buscar dentro de ese elemento con querySelector
		//---------------------------------
		// Contexto @ctx(this):	Instancia del jspinner
		//----------------------------------
	*/
	function fnHide(d) {
		var ctx = this;

		return new Promise(function(resolve, reject) {
			// Se crea una instancia del spinner
			if(!(ctx instanceof instance)) {
				ctx = d || {};
				ctx.theme = ctx.theme || obtenerRandom();
				ctx.content = (ctx.wrapper || document).querySelector(ctx.query || 'body');
				ctx.elemento = ctx.content.querySelector('.blockUI');
			}

			if(!ctx.elemento) resolve(ctx);
			if(!ctx.elemento.style.transition) resolve(ctx);

			ctx.elemento.removeEventListener('transitionend', handler, false);
			ctx.elemento.addEventListener('transitionend', handler, false);	

			ctx.elemento.classList.remove('on');
			ctx.elemento.classList.add('off');

			function handler(e) {
				requestAnimationFrame(() => {
					e.stopPropagation();
					if(e.propertyName !== 'opacity') return;

					/*
						// se elimina la clase posRelav, que contiene el estilo 
						// potition relative
					*/
					if (ctx.relative && ctx.elemento.parentNode) {
						ctx.content.parentNode.classList.remove('posRelav');
						ctx.elemento.parentNode.removeChild(ctx.elemento);
					}

					resolve(ctx);
				});
			}
		});
	}

	/*
		//---------------------------------
		// Función módelo para ocupar un espacio de memoria entre varias instancias
		//---------------------------------
	*/
	function instance(options) {
		// Se crea un objeto 
		var ctx = this;
		
		Object.assign({
			query: 'body',
			relative: false
		}, ctx, options);

		// Se crea una instancia del spinner
		ctx.theme = ctx.theme || obtenerRandom();
		ctx.content = (ctx.wrapper || document).querySelector(ctx.query || 'body');
		ctx.elemento = ctx.content.querySelector('.blockUI');

		// Public API
		ctx.block = fnShow;
		ctx.hide = fnHide;

		return ctx;
	}

	/*
		//---------------------------------
		// Función para obtener la instancia del JSlide
		//---------------------------------
	*/
	function fnGetInstance(options) {
		return new instance(options);
	}

	function obtenerRandom() {
		var math = Math;
		return math.floor(Math.random() * 14) + 1;
	}

	// Public API
	jr.addNS("jspinner", fnGetInstance);
	jr.jspinner.show = fnShow;
	jr.jspinner.hide = fnHide;
})();