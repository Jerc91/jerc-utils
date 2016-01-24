// Validación del espacio de nombre principal "j"
if(!window.j) window.j = (NameSpace ? new NameSpace() : {});

//---------------------------------
// Common Tools, Namespace Main
//---------------------------------
(function () {

    // Private members
    // Var for get querystrings
    var qs = {};

    // Public API
    //---------------------------------
    // HTML

    /*
        //---------------------------------
        // Inserta un elemento enseguida del valor referenciado.
        // referencenode:   Elemento siguiente al nuevo nodo, o
        //                  al nodo de referencia   {ELEMENT}
        // newNode:         Elemento que va ser insertado antes que
        //                  el referenciado         {ELEMENT}
        //---------------------------------
    */
    function fnInsertAfter(referenceNode, newNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Carga la información que es devuelta por un web worker, datos en segundo plano
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // query:   HTML que retorna la función fnGetFile.  {string}
        //---------------------------------
    */
    function fnBind(query) {
        var element = document.querySelector(query);
        element.innerHTML = this.data.replace(/\r\n/, "\r").replace(/\t/g, '    ');
    } // end function
    //---------------------------------

    /*
        //---------------------------------    
        // Función para eliminar una tag
        //---------------------------------    
        // Parámetros:
        //---------------------------------    
        // object:  Objeto que será eliminado   {< />}
        //---------------------------------    
    */
    function fnDeleteTag(object) {
        if (!object) return;
        object.parentNode.removeChild(object);
    } // end method
    //---------------------------------

    /*
        //---------------------------------
        // Crea un objeto Date y recibe una fecha en formato json
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // jsonDate:    Fecha que es convertida al serializar un DateTime de .Net
        //              {/Date(1335205592410)/}
        //---------------------------------
    */
    function fnParseJsonDate(jsonDate) {
        var offset = new Date().getTimezoneOffset() * 60000;
        var parts = /\/Date\((-?\d+)([+-]\d{2})?(\d{2})?.*/.exec(jsonDate);
        if (parts[2] == undefined) parts[2] = 0;
        if (parts[3] == undefined) parts[3] = 0;
        return new Date(+parts[1] + offset + parts[2] * 3600000 + parts[3] * 60000);
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Método para tomar todas las queryString de la URL
        // Función autoejecutable que al final se podrá consultar
        // en la propiedad j.tools.queryString
        //---------------------------------
    */
    (function (a) {
        if (a == "") return {};
        for (var i = 0; i < a.length; ++i) {
            var p = a[i].split('=');
            if (p.length != 2) continue;
            qs[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        } // end for
    })(window.location.search.substr(1).split('&'));
    //---------------------------------

    /*
        //---------------------------------
        // Toma la fecha y hora actual para retornar esta información como una cadena de texto. (yyyy-MM-dd hh:mm)
        //---------------------------------
    */
    function fnNow() {
        var date = new Date();
        return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + (date.getDay() - 1) + ' ' + date.getHours() + ':' + date.getMinutes();
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Se busca un objeto dentro de un arregle sobre un worker
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // data:    Objeto que contiene las propiedades necesarias para la función
        //---------------------------------
        // data.src:    Arreglo de objetos en le cual se buscará un objeto.
        // data.fnCall: Función de callback cuando se encuentre el objeto o termine la iteración.
        // data.id:     Nombre de la pripedad con que se hará la validación
        // data.input:  Valor que será comparado los elemntos del arreglo.
        //---------------------------------
    */
    function fnFindOnWorker(data) {
        var worker = new Worker('assets/js/workers/worker-searcher-of-array.js');
        var fnCall = data.fnCall;
        delete data.fnCall;

        worker.addEventListener('message', function (d) {
            fnExec.call(this, fnCall, [d.data]);
            worker.terminate();
        }, false);

        worker.postMessage(data);
    } // end function 
    //---------------------------------

    /*
        //---------------------------------
        // Método para ejecutar una función
        // fn:          Función que se ejecutará de ser valida, 
        //              se ejecutará la fn meidante call, pasando
        //              como contexto el de la misma, o si se 
        //              llamo mediante call u se dispone de un ctx
        //              entonces se pasará éste. {function(){}}
        // paramenters: Arrleglo con valores que serán pasados
        //              a la función fn.    {[{}, {}]}
        // ctx(this):   Si se invoco la mediante apply, call el ctx
        //              cambiará.
    */
    function fnExec(fn, parameters) {
        if (fnIsFunction(fn)) fn.apply(this, parameters);
    } // end function
    //---------------------------------

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
        form.fnClean = fnClean;
        form.fnIsValid = fnIsValid;
        form.fnSetNoDisabled = fnSetNoDisabled;
        form.fnSet = fnSet;
        form.fnGet = fnGet;
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
        Array.prototype.forEach.call(hiddens, function (input) {
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
                    j.jui.fnShowForm.apply(forms[i].querySelector('header h4'));
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
                    var radio = Array.prototype.slice.call(control).fnFind(function (e) { return e.value.toString() == item[i].toString() });
                    if (radio) radio.checked = true;
                } // end if
                else if (control[0].getAttribute('type') == 'checkbox') {
                    for(var e = 0; e < control.length; e++) {
                        for(var a = 0; a < item[i].length; a++)
                            if(control[e].value == item[i][a]) control[e].checked = true;
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
        if(botones && !botones.length) botones = [botones];
        var buttons = botones || document.querySelectorAll('a.button, button.button');

        for(var i = 0; i < buttons.length; i++){

            buttons[i].addEventListener('click', function (e) {
                e.preventDefault();
                var circle, d, x, y, $this = $(this);
                circle = $this.find('.circle');
              
                if(!circle.height() && !circle.width()) {
                    d = Math.max($this.outerWidth(), $this.outerHeight());
                    circle.css({ height: d, width: d });
                } // end if
                
                x = e.pageX - $this.offset().left - circle.width() / 2;
                y = e.pageY - $this.offset().top - circle.height() / 2;
                
                circle.css({ top: y+'px', left: x + 'px' });
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
        var e = e || this;
        var art = e.parentNode.parentNode;
        if(resize) art = e;
        var ul = art.querySelector('fieldset ul');
        var head = art.querySelector('h4');

        if(!resize) {
            if (art.classList.contains("active") && !clickOnform) 
                art.classList.remove("active");
            else {
                if(!art.classList.contains("active")) {
                    art.classList.add("active");
                    art.setAttribute("data-active", '');
                    setTimeout(function() { art.removeAttribute('data-active'); }, 500);    
                } // end if actvie
            } // end active
        } // end resize
        
        var actived = art.classList.contains("active");
        ul.style.marginTop = actived ? '0px' : '-' + (ul.offsetHeight + head.offsetHeight) + 'px';
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Función para mostrar notificaciones, de tipo mensajes flotantes y mensajes tipo notificación dentro del
        // sistema operativo
        //---------------------------------
        // Parameters:
        //---------------------------------
        // title:          Título de la notificación.    ""
        // text:           Texto que se mostrará dentro de la notificación. {"","<tags />"}
        // styling:        Tipo de estilo para la notificación. {'fontawesome'}
        // shadow:         Para quitar la sombra del mensaje.    bool{true,false}
        // icon:           Nombre de la clase que se va a mostrar, esto solo aplica para fontawesome. {"", bool{true,false}}
        // type:           Tipo de notificación.  {'info','success', 'error'}
        // opacity:        Para agregar transparencia a la notificación.    {0.0,1.0}
        // cornerclass:    Para elegir una clase que controle las esquinas redondeadas. {'ui-pnotify-sharp'}
        // animate_speed:  Velocidad en que la animación se muestra y se oculta.    {'fast'}
        // animation:      Animación que se mostrara con la notificación.   {'none'}
        // width:          Elección del ancho de la notificación.  {'auto'}
        // hide:           Para que permanezca la notificación visible hasta que el usuario la cierre. bool{true,false}
        // buttons: {      Opciones para los botones de la notificación  object{}
        //     closer:         Para mostrar el botón de cerrar. bool{true, false}
        //     closer_hover:   Para mantener visible el botón de cerrar en cada notificación bool{true, false}
        //     sticker:        Para mmostrar el botón de mantener la notifiación visible. bool{true, false}
        //     sticker_hover:  Para mantener visible el botón de manterner la notificación visible 
        //                     en cada notificación bool{true, false}
        // },
        // min_height:     Alto minimo que debe tener la notificación.  ""
        // text_ascape:    Para codificar la inforamción de la propiedad text.  bool{true, false}
        // update: {},     Cambio de estado dentro de la notificación, éste objeto tendrá las mismas propiedas mencionadas
        //                 dentro de esta ayuda. object{}
        // addClass: '',   Para personalizar la aparencia de la notificación.   ""
        // desktop: {      Opciones para notificaciones de escritorio.  object{}
        //     desktop: true,  Para mostrar la notificaión en el escritorio del SO.   bool{true, false}
        //     icon: '',       Ruta de la imagen que se quiere mostrar en la notificación de escritorio
        // }
        //---------------------------------
        // Return: object PNotify
        //---------------------------------
        // Dependences: 
        // jqueryUI
        // PNotify; http://sciactive.com/pnotify
        //---------------------------------
    */
    function fnNotification(data) {
        // variables para animación de la notificación
        var effect_in = 'drop',
            effect_out = 'drop',
            easing_in = 'easeInOutCubic',
            easing_out = 'easeOutCirc',
            speed = 500;
        // Para animación
        var options_in = { easing: easing_in },
            options_out = { easing: easing_out };

        var objDefault = {
            styling: 'fontawesome',
            animate_speed: speed,
            animation: {
                'effect_in': effect_in,
                'options_in': options_in,
                'effect_out': effect_out,
                'options_out': options_out
            },
            /*
                buttons: {
                    closer_hover: false,
                    sticker_hover: false
                },
            */
        } // end objDefault

        $.extend(objDefault, data);

        return new PNotify(objDefault);
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
            j.tools.fnNotification({ text: request.Mensaje, type: type || 'success' });
        } // end if
        else if (!request.Estado) {
            j.tools.fnNotification({ text: request.Mensaje, type: type || 'error' });
            return false;
        } // end if
        return true;
    } // end function
    //---------------------------------

    //---------------------------------
    // Public API methods
    // HTML
    this.fnInsertAfter = fnInsertAfter;
    this.fnBind = fnBind;
    this.fnDeleteTag = fnDeleteTag;
    // Tools
    this.fnParseJsonDate = fnParseJsonDate;
    this.fnNow = fnNow;
    this.fnFindOnWorker = fnFindOnWorker;
    this.fnExec = fnExec;
    // Forms
    this.fnForm = fnForm;
    this.fnInitButtons = fnInitButtons;
    // Notificaciones
    this.fnNotification = fnNotification;
    this.fnValidateRequest = fnValidateRequest;
    // Public properties
    this.queryString = qs;
    // Expresiones regulares
    this.isDate = this.isDate || new RegExp(/(\d{4})-(\d{2})-(\d{2})T(\d{2})\:(\d{2})\:(\d{2})/);
    this.isNull = this.isNull || new RegExp('^null$');
    this.isTrue = this.isTrue || new RegExp('^true$');
    this.isFalse = this.isFalse || new RegExp('^false$');
    this.isZero = this.isZero || new RegExp('^0$');
    this.isHour = this.isHour || new RegExp(/^(0[1-9]|1\d|2[0-3]):([0-5]\d):([0-5]\d)$/);
    //---------------------------------    
}).apply(j.fnAddNS("tools"));
//---------------------------------

//---------------------------------
if(fnExtend) {
    fnExtend(j, {
        Author: 'Julian Ruiz',
        Created: '2016-01-17',
        Page: 'http://jerc91.github.io/#!/JTools',
        Title: 'JTools'
    }); // fin combinación
} // end if
//---------------------------------