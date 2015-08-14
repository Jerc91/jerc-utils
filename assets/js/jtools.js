//---------------------------------
// Common Tools, Namespace Main
(function () {
    // Private members
     // Var for get querystrings
    var qs = {};

    // Public API
    //---------------------------------
    
    /*
        //---------------------------------
        // Inserta un elemento enseguida del valor referenciado
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
        // Crea una expresión regular para un rango de números
        // max: es el número al cual debe llegar el número máximo
        //      en la expresión regular {int}
        //---------------------------------
    */
    function fnGetERNumberRange(max) {
        var range = "[0-9]{";
        for (var i = 0; i < max; i++) range += (i + 1) + (i + 1 != max ? ',' : '');
        return range += "}";
    } // end function
    //--------------------------------

    /*
        //---------------------------------
        // Agrega el prefijo de los navegadores, para la creación de reglas de 
        // estilos como: -webkit-, -moz-, ...
        // debe existir una variable "j" con la propiedad preBrowsers []
        // text: text al que se van agregar los prefijos de los navegadores {string}
        //---------------------------------
    */
    function fnGetTextPreBrowsers(text) {
        var result = '';
        for(var i in j.preBrowsers) result += (j.preBrowsers[i] + text);
        return result;
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Crea un objeto Date y recibe una fecha en formato json
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
        for (var i = 0; i < a.length; ++i)
        {
            var p=a[i].split('=');
            if (p.length != 2) continue;
            qs[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        } // end for
    })(window.location.search.substr(1).split('&'));
    //---------------------------------

    /*
        //---------------------------------
        // Toma la hecha y hora (yyyy-MM-dd hh:mm)
        //---------------------------------
    */
    function fnNow() {
        var date = new Date();
        return date.getFullYear() + '-' + date.getMonth() + '-' + date.getDay() + ' ' + date.getHours() + ':' + date.getMinutes();
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Carga la información que es devuelta por un web worker, datos en segundo plano
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
        // Función para agregar los diferentes eventos del API forms
        // form:    Elemento formulario al que se le van a agregar las funciones
        //          de validación y de limpiar.  {<form />}
        //---------------------------------
    */
    function fnForm(form) {
        form.fnClean = fnClean;
        form.fnIsValid = fnIsValid;
        // Add a class for that the tooltips are visibility
        // form.addEventListener('invalid', fnFormInvalid, false);
        // form.addEventListener('input', fnFormInvalid, false);
    } // end function
    //---------------------------------

    //---------------------------------
    // Función capturar, aún en construcción
    function fnFormInvalid(e) {
        var elemento = e.target;
        elemento.focus();
        var msg = elemento.getAttribute('data-cv');
        msg = msg || '';
        elemento.setCustomValidity(msg.toString() + ' >=C');
        this.classList.add("validated");
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Función para limpiar los formularios
        // ctx(this):   Elemento formulario     {<form />}
        //---------------------------------
    */
    function fnClean(){
        this.reset();
        // SE elimina el estado del formulario
        this.removeAttribute("data-state");
        // Si el formulario se a validado se quita esta referencia
        var form = this.querySelector('.form.validated');
        if(form) form.classList.remove('validated');
        // Se capturan todos los datos de solo lectura
        fnCleanText(this.querySelectorAll('span[data-bind]'));
        fnCleanText(this.querySelectorAll('output[data-bind]'));
        // Se obtiene todos los controles que debe desabilitarsen
        var disableds = this.querySelectorAll('[data-disabled]');
        // Se agregan el atributo diabled
        if (disableds){
            for (var i = 0; i < disableds.length; i++)
                disableds[i].setAttribute('disabled', 'disabled');
        } // end if

        // Se obtiene todos los controles que deben habilitarsen una vez se
        // haga click en el botón de cancelar o guardar
        var notDisableds = this.querySelectorAll('[data-not-disabled]');
        if (notDisableds){
            for (var i = 0; i < notDisableds.length; i++)
                notDisableds[i].removeAttribute('disabled', 'disabled');
        } // end if

        // Función para limpiar los controles
        function fnCleanText(objects) {
            if(!objects) return;
            for (var i = 0; i < objects.length; i++)
                objects[i].textContent = '';
        } // end fuction
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
        if(!this.checkValidity()) {
            this.querySelector('.form').classList.add("validated");
            return false;
        } // end checkvalidity
        return true;
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
        if(fnIsFunction(fn)) fn.call(this, parameters);
    } // end function
    //---------------------------------

    /*
        //---------------------------------    
        // Función para eliminar una tag
        // object:  Objeto que será eliminado   {< />}
        //---------------------------------    
    */
    function fnDeleteTag(object) {
        if(!object) return;
        object.parentNode.removeChild(object);
    } // end method
    //---------------------------------

    //---------------------------------
    // Find word in text
    // Parameters: Expression Regular, Text
    //---------------------------------
    function fnFindWord(reString, text) {
        var re = new RegExp(reString);
        var result = re.exec(text);
        return result ? result[0] : result;
    } // end function
    //---------------------------------

    //---------------------------------
    // Public API methods
    this.fnInsertAfter = fnInsertAfter;
    this.fnGetERNumberRange = fnGetERNumberRange;
    this.fnGetTextPreBrowsers = fnGetTextPreBrowsers;    
    this.fnParseJsonDate = fnParseJsonDate;
    this,fnNow = fnNow;
    this.fnBind = fnBind;
    this.fnForm = fnForm;
    this.fnExec = fnExec;
    this.fnDeleteTag = fnDeleteTag;
    this.fnFindWord = fnFindWord;
    // Public properties
    this.queryString = qs;
    // Expresiones regulares
    this.isDate = this.isDate || new RegExp(/(\d{4})-(\d{2})-(\d{2})T(\d{2})\:(\d{2})\:(\d{2})/);
    this.isNull = this.isNull || new RegExp('^null$');
    this.isTrue = this.isTrue || new RegExp('^true$');
    this.isFalse = this.isFalse || new RegExp('^false$');
    //---------------------------------    
}).apply(j.fnAddNS("tools"));

fnExtend(j.tools, { 
    Author: 'Julian Ruiz', 
    Created: '2014-01-27', 
    Page: 'http://jerc91.github.io/', 
    Title: 'Common Tools' 
});
//---------------------------------