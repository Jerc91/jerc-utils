// Validación del espacio de nombre principal "j"
if(!window.j) window.j = (Namespace ? new Namespace() : {});

//---------------------------------
// Espacio de nombre para generar animaciones para esperas
//---------------------------------
(function() {

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
		//---------------------------------
		// Contexto @ctx(this):	Instancia del jspinner
		//----------------------------------
	*/
	function fnUnBlockUI(d) {
 		var ctx = this;
 		var query = (d && d.query) ? d.query : null;
 		var elemento = (ctx && ctx.elemento) ? ctx.elemento : null;

	    setTimeout(function () {
	    	var content = elemento || document.querySelector(query || 'body');
	        var block = !elemento ? content.querySelector('.blockUI') : elemento;
	        if(!block) return;
	        block.classList.add('out');
	        
	        setTimeout(function() { 
	        	block.classList.add('none');

	        	if(!d) return;

	        	/*
					// se elimina la clase posRelav, que contiene el estilo 
					// potition relative
				*/
				if (d.relative) {
					content.parentNode.classList.remove('posRelav');
					block.parentNode.removeChild(block);
				}  // end if				

				// Se ejecuta el callback
				if(fnIsFunction(d.fnCallback)) d.fnCallback();
			}, 500); // end remove .none
		}, 500); // end remove .out
	} // fin método
	//---------------------------------


	/*
		//---------------------------------
		// Función para bloquear la pantalla con un spinner o
		// agregar el spinner dentro de un elemento
		//---------------------------------
		// Parámetros:
		//---------------------------------
		// @d: 					Objeto contenedor de los parámetros.
		// @d.query:			Query selector del elemento contenedor del spinner
		// @d.theme:			Número de spinner que se quiere mostrar.
		// @d.relative:	Si esta en true se agregará position relative al contenedor
		//---------------------------------
		// Contexto @ctx(this):	Instancia del plugin
		//---------------------------------
	*/
	function fnBlockUI(d) {
		// Se crea un objeto 
		var ctx = this, fragment;
		d = d || ctx;
		var query = d ? d.query : null;

		// Se crea una instancia del spinner
		d.theme = d.theme || Math.floor(Math.random() * 14) + 1;
		d.content = document.querySelector(d.query || 'body');
		d.elemento = d.content.querySelector('.blockUI');
		
		// Si el elemento contenedor no existe
		if(!d.content) return;

		/*
			// se agrega la clase posRelav, que contiene el estilo 
			// potition relative
		*/
		if (d.relative) d.content.classList.add('posRelav');

		// Si no se tiene un elemento con clase .blockUI se creará nuevo
		if(!d.elemento) {
			d.elemento = document.createElement('div');
			// Se agrega el nuevo elemento en el contenedor
			d.content.appendChild(d.elemento);
		} // end if
		d.elemento.setAttribute('class', 'blockUI none');

		// Se elimina el spinner dentro
		if(d.elemento.children.length > 0) {
			d.elemento.removeChild(d.elemento.children[0]);
		} // end if

		// Se crea el spinner
		d.spinner = document.createElement('div');
		d.spinner.classList.add('spinner');
		d.elemento.classList.add('a' + d.theme);
		d.spinner.classList.add('a' + d.theme);	
		d.elemento.appendChild(d.spinner);
		
		// Se crea el tema al azar
		switch (parseInt(d.theme)) {
		    case 1: fragment = fnGetHTML('double-bounce', 2, true); break;
		    case 2: fragment = fnGetHTML('rect', 5, true); break;
		    case 3: fragment = fnGetHTML('cube', 2, true); break;
		    case 4: fragment = fnGetHTML('dot', 2, true); break;
		    case 5: fragment = fnGetHTML('bounce', 3, true); break;
		    case 6: fragment = fnGetHTML('cube', 9); break;
		    default: fragment = fnGetHTML('circle', 1); break;
		} // end switch
		
		d.spinner.appendChild(fragment);
		d.elemento.classList.remove('none');
		d.elemento.classList.remove('out');

		// Función para crear los diferentes divs por cada tema
		function fnGetHTML(clase, elementos, incrementable) {
		    var frag, div;
		    frag = document.createDocumentFragment();
		    for (var i = 0; i < elementos; i++) {
		        div = document.createElement('div');
		        div.classList.add(clase + (incrementable ? (i + 1) : ''));
		        frag.appendChild(div);
		    } // end for
		    return frag;
		} // end funciton
	} // end method
	//---------------------------------
	
	/*
        //---------------------------------
        // Función módelo para ocpar un espacio de memoria entre varias instancias
        //---------------------------------
    */
    function instance() {
        // Public API
        this.fnUnBlockUI = fnUnBlockUI;
		this.fnBlockUI = fnBlockUI;
    } // end function
    //---------------------------------

    /*
	    //---------------------------------
	    // Función para obtener la instancia del JSpinner
	    //---------------------------------
    */
    function fnGetInstance() {
        return new instance();
    } // enf function
    //---------------------------------

	// Public API
	this.fnUnBlockUI = fnUnBlockUI;
	this.fnBlockUI = fnBlockUI;
	this.fnGetInstance = fnGetInstance;
}).call(j.fnAddNS('jspinner'));

//---------------------------------
if(fnExtend) {
    fnExtend(j, {
        Author: 'Julian Ruiz',
        Created: '2016-01-17',
        Page: 'http://jerc91.github.io/#!/JSpinner',
        Title: 'JSpinner'
    }); // fin combinación
} // end if
//---------------------------------