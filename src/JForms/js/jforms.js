//---------------------------------
// Common Tools, Namespace Main
//---------------------------------
(function () {
    /*
		//---------------------------------
		// Función para agregar los diferentes eventos del API forms
		//---------------------------------
		// Parámetros
		//---------------------------------
		// form:    Elemento form al que se le van a agregar las funciones
		//          de validación y de limpiar.  {<form />}
		//---------------------------------
	*/
    function fnForm(form) {
        form.clean = fnClean;
        form.isValid = fnIsValid;
        form.setNoDisabled = fnSetNoDisabled;
        form.set = fnSet;
        form.get = fnGet;
        // Add a class for that the tooltips are visibility
        // form.addEventListener('invalid', fnFormInvalid, false);
        // form.addEventListener('input', fnFormInvalid, false);

        // Se agrega funcionalidad de acordion a los formularios
        fnShowForm(form, false, false);
        form.querySelector('h4').addEventListener('click', function () { fnShowForm(this); }, false);
        form.querySelector('ul').addEventListener('click', function () { fnShowForm(this, true); }, false);
    } // end function
    //---------------------------------

	/*
		//---------------------------------
		// Función para limpiar los formularios
		// ctx(this):   Elemento formulario     {<form />}
		//---------------------------------
	*/
    function fnClean() {
        this.reset();
        // Se elimina el estado del formulario
        this.removeAttribute("data-state");
        // Si el formulario se a validado se quita esta referencia
        var form = this.querySelector('.form.validated');
        if (form) form.classList.remove('validated');
        // Se capturan todos los datos de solo lectura
        fnCleanText(this.querySelectorAll('span[data-bind]'));
        fnCleanText(this.querySelectorAll('output[data-bind]'));
        // Se obtiene todos los controles que debe desabilitarsen
        var disableds = this.querySelectorAll('[data-disabled]');
        // Se agregan el atributo diabled
        if (disableds) {
            for (var i = 0; i < disableds.length; i++)
                disableds[i].setAttribute('disabled', 'disabled');
        } // end if

        // Se obtiene todos los controles que deben habilitarsen una vez se
        // haga click en el botón de cancelar o guardar
        var notDisableds = this.querySelectorAll('[data-not-disabled]');
        if (notDisableds) {
            for (var i = 0; i < notDisableds.length; i++)
                notDisableds[i].removeAttribute('disabled', 'disabled');
        } // end if

        // Función para limpiar los controles
        function fnCleanText(objects) {
            if (!objects) return;
            for (var i = 0; i < objects.length; i++)
                objects[i].textContent = '';
        } // end fuction

        // Se limipan los controles del typeahead
        var typeahead = this.querySelectorAll('[data-id]');
        if (typeahead) {
            for (var i = 0; i < typeahead.length; i++)
                delete typeahead[i].dataset.id;
        } // end if

        // Se ocultan los controles con el atributo data-fade
        var fade = this.querySelectorAll('[data-fade]');
        if (fade) {
            for (var i = 0; i < fade.length; i++)
                fade[i].classList.add('fade');
        } // end if

        // Se limpian todos los controles hidden
        var hiddens = this.querySelectorAll('[type="hidden"]:not([data-block])');
        [].slice.call(hiddens, function (input) {
            input.value = '';
        });

        // Se elimina la acción del botón guardar
        var buttonSave = this.querySelector('button[data-accion]');
        if (buttonSave) buttonSave.removeAttribute('data-accion');
    } // end function
    //---------------------------------

	/*
		//---------------------------------
		// Función validar si es correcto o no el formulario y para agregar la 
		// clase que indica que el formulario es invalido.
		// dentro de la tag Form, debe existir un elemento con la clase .form 
		// ctx(this):   Elemento formulario     {<form />}
		//---------------------------------
	*/
    function fnIsValid() {
        if (!this.checkValidity()) {
            // Se obtienen las secciones y se verfican
            var forms = this.querySelectorAll('.form');
            var input;
            for (var i = 0; i < forms.length; i++) {
                // Se obtiene el primer control invalido para y ejecutar la función focus()
                // al finalizar el ciclo, se obtiene el primer control invalido por si la 
                // sección esta oculta se muestra, (solo para mostrar las secciones que tienen 
                // controles invalidos)
                var inputOfForm = forms[i].querySelector(':invalid');
                input = input || inputOfForm;
                if (inputOfForm && !forms[i].classList.contains('active')) {
                    // Se expande el control del formulario por si esta contraido
                    fnShowForm.apply(forms[i].querySelector('header h4'));
                } // end if
                forms[i].classList.add("validated");
            } // end for
            if (input) input.focus();

            return false;
        } // end checkvalidity
        return true;
    } // end function
    //---------------------------------

	/*
		//---------------------------------
		// Función desabilitar controles con marca [data-no-disabled]
		// ctx: Formulario
		//---------------------------------
	*/
    function fnSetNoDisabled() {
        var ctx = this;
        var controls = ctx.querySelectorAll('[data-no-disabled]');
        for (var i = 0; i < controls.length; i++) {
            controls[i].setAttribute('data-no-disabled', 'active');
            controls[i].setAttribute('disabled', '');
        } // end for
    } // end function
    //---------------------------------

	/*
		//---------------------------------
		// Función para tomar los valores del formulario
		//---------------------------------
		// ctx: Formulario
		//---------------------------------
	*/
    function fnGet(inArray) {
        var ctx = this, entidad;

        // Se obtienen los controles para tomar los valores
        var controles = ctx.querySelectorAll('[data-bind]');
        if (controles.length == 0) return;
        // Se crea una insstacia
        entidad = {};

        // Se crea el objeto
        for (var i = 0; i < controles.length; i++) {
            if (controles[i].tagName.toLowerCase() == 'input') {
                if (controles[i].type.toLowerCase() == 'radio') {
                    if (controles[i].checked) {
                        entidad[controles[i].dataset.bind] = controles[i].value;
                    } // end if radio
                } else if (controles[i].type.toLowerCase() == 'checkbox') {
                    entidad[controles[i].dataset.bind] = controles[i].checked ? true : false;
                } else if (controles[i].type.toLowerCase() == 'file') {
                    entidad[controles[i].dataset.bind] = controles[i].file;
                } else {
                    entidad[controles[i].dataset.bind] = controles[i].value;
                } // end else
            } else {
                entidad[controles[i].dataset.bind] = controles[i].value;
            } // end if
        } // end for

        if (inArray) {
            var parametros = [];
            for (var i in entidad) parametros.push(entidad[i]);
            return parametros;
        } // end if

        return entidad;
    } // end function
    //---------------------------------

	/*
		//---------------------------------
		// Función para agregar valores a los controles de los 
		// formularios
		//---------------------------------
		// ctx: Formulario
		//---------------------------------
	*/
    function fnSet(item) {
        var ctx = this;

        for (var i in item) {
            var control = ctx.querySelectorAll('[data-bind="' + i + '"]');
            if (control[0]) {
                if (control[0].getAttribute('type') == 'radio') {
                    var radio;
                    [].slice.call(control).filter(function (e) { if (e.value.toString() == item[i].toString()) radio = e; });
                    if (radio) radio.checked = true;
                } // end if
                else if (control[0].getAttribute('type') == 'checkbox') {
                    for (var e = 0; e < control.length; e++) {
                        for (var a = 0; a < item[i].length; a++)
                            if (control[e].value == item[i][a]) control[e].checked = true;
                    } // end for                      
                } // end if
                else if (control[0].getAttribute('type') == 'file') {
                    continue;
                } // end else
                else if (control[0].fnGet) {
                    var bind = control[0].bind, db = control[0].db.length ? control[0].db : [control[0].db];
                    var value = db.fnFind(function (e) { return e[bind.id] == item[i] });
                    control[0].value = value[bind.text];
                    control[0].dataset.id = item[i];
                } // end else
                else {
                    control[0].value = item[i];
                } // end else
            } // end function
        } // end for
    } // end function
    //---------------------------------

	/*
		//---------------------------------
		// Función para dar un efecto de click en los botones
		//---------------------------------
		// Parámetros
		//---------------------------------
		// botones: Tags (elementos) que deben iniciarse con el efecto
		//---------------------------------
	*/
    function fnInitButtons(botones) {
        if (botones && !botones.length) botones = [botones];
        var buttons = botones || document.querySelectorAll('a.button, button.button');

        for (var i = 0; i < buttons.length; i++) {

            buttons[i].addEventListener('click', function (e) {
                e.preventDefault();
                var circle, d, x, y, $this = $(this);
                circle = $this.find('.circle');

                if (!circle.height() && !circle.width()) {
                    d = Math.max($this.outerWidth(), $this.outerHeight());
                    circle.css({ height: d, width: d });
                } // end if

                x = e.pageX - $this.offset().left - circle.width() / 2;
                y = e.pageY - $this.offset().top - circle.height() / 2;

                circle.css({ top: y + 'px', left: x + 'px' });
                circle.addClass('animate');
                setTimeout(function () { circle.removeClass('animate'); }, 700);
            }, false); // end click

        } // end for
    } // end function 
    //---------------------------------

	/*
		//---------------------------------
		// Función para mostrar los formularios cuando solo se muestra el título
		//---------------------------------
		// Parameters:
		//---------------------------------
		// e:           Evento de clic sobre el título de formulario (h4) y su cuerpo (ul).
		// clickOnform: Elemento en el que se hace clic (ctx).
		// resize:      Cuando se da clic en el cuerpo del formulario (ul), éste parámetro estará en true.
		//---------------------------------
	*/
    function fnShowForm(e, clickOnform, resize) {
        e = e || this;
        var art = e.parentNode.parentNode;
        if (resize) art = e;
        var ul = art.querySelector('fieldset ul');
        var head = art.querySelector('h4');

        if (!resize) {
            if (art.classList.contains("active") && !clickOnform)
                art.classList.remove("active");
            else {
                if (!art.classList.contains("active")) {
                    art.classList.add("active");
                    art.setAttribute("data-active", '');
                    setTimeout(function () { art.removeAttribute('data-active'); }, 500);
                } // end if actvie
            } // end active
        } // end resize

        var actived = art.classList.contains("active");
        ul.style.marginTop = actived ? '0px' : '-' + (ul.offsetHeight + head.offsetHeight) + 'px';
    } // end function
    //---------------------------------

	/*
		 //---------------------------------
		 // Funció que valida la respuesta del servidor, y que notifica al usuario
		 // de la acción que se llevo a cabo
		 //---------------------------------
		 // Parámetros:
		 //---------------------------------
		 // requets:     Elemento retorano por el servidor
		 //---------------------------------
		 // return:      Si el esado de la respuesta es correcta
		 //---------------------------------
	 */
    function fnValidateRequest(request, notification, type) {
        if (request.Estado && notification) {
            // fnNotification({ text: request.Mensaje, type: type || 'success' });
            return true;
        } // end if
        else if (!request.Estado) {
            // fnNotification({ text: request.Mensaje, type: type || 'error' });
            return false;
        } // end if
        return true;
    } // end function
    //---------------------------------

    //---------------------------------
    // Public API methods
    // Forms
    this.form = fnForm;
    this.showForm = fnShowForm;
    this.initButtons = fnInitButtons;
    // Expresiones regulares
    this.isDate = this.isDate || new RegExp(/(\d{4})-(\d{2})-(\d{2})T(\d{2})\:(\d{2})\:(\d{2})/);
    this.isNull = this.isNull || new RegExp('^null$');
    this.isTrue = this.isTrue || new RegExp('^true$');
    this.isFalse = this.isFalse || new RegExp('^false$');
    this.isZero = this.isZero || new RegExp('^0$');
    this.isHour = this.isHour || new RegExp(/^(0[1-9]|1\d|2[0-3]):([0-5]\d):([0-5]\d)$/);
    //---------------------------------    
}).apply(jr.addNS("jforms"));
//---------------------------------