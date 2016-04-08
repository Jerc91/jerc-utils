// Validación del espacio de nombre principal "j"
if(!window.j) window.j = (Namespace ? new Namespace() : {});

//---------------------------------
// Espacio de nombre para crear un lightbox
//---------------------------------
(function () {

    //---------------------------------
    // Propiedades privadas
    //---------------------------------
    var identifier = "lightbox", 
        classWrapper = "lightbox",
        classContent = "content", 
        classContentLB = "contentLB",
        classOut = "out", 
        classIn = "in", 
        classInactiv = "inactived",
        classBg = "bg", 
        classClose = "close fa fa-times-circle", 
        active = false;


     /*
        //---------------------------------
        // Function para mostrar el Lightbox, al inicio se muestra una animación.
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // html:    Es el html que contendrá el lightbox.
        // removeEvents:    Si se pasa éste parámetro se quitarán los eventos,
        //                  click y keydown para ocultar el lightbox, se mantendrá
        //                  visible.
        //---------------------------------
    */
    function fnShow(html, removeEvents) {

        var popup = document.getElementById(identifier);
        popup.className = classIn;
        popup.querySelector(' .' + classContentLB).innerHTML = html;

        active = true;

        if (popup) {
            // Se agrega la función de ocultar el lightbox al botón x
            popup.getElementsByClassName(classBg)[0].addEventListener('click', fnClose);
            popup.getElementsByClassName(classClose)[0].addEventListener('click', fnClose);
            document.querySelector('body').addEventListener('keydown', fnKeyDown); // key down
        } // end if popup

        // Se eliminan los eventos para que se cierre el documento
        if(removeEvents) {
            popup.classList.add(classInactiv);
            popup.querySelector('.' + classBg).removeEventListener('click', fnClose);
            popup.querySelector('.' + classClose.replace(/ /g, '.')).removeEventListener('click', fnClose);
            document.querySelector('body').removeEventListener('keydown', fnKeyDown); // key down
        } // end if
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Function para ocultar el Lightbox, al finalizar se muestra una animación
        //---------------------------------
    */
    function fnClose() {
        var popup = document.getElementById(identifier);

        if (popup) {
            popup.className = classOut;
            popup.classList.remove(classInactiv);
            setTimeout(function () { popup.className = identifier; active = false; }, 800);
        } // end if

        return false;
    }; // end function
    //---------------------------------

    /*
        //---------------------------------
        // Cuando se presione la tecla esc se ocultará el lightbox.
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // e:   Evento
        //---------------------------------
    */
    function fnKeyDown(e){
        if (e.keyCode == 27 && active) {
            fnClose();
        } // end if
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Inicio del control
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // qParent: Selector del elemento que contendrá el lightbox, si éste se pasa en nulo,
        //          el elemento body, será quien contenga el lightbox
        //---------------------------------
    */
    function fnInit(qParent) {
        var query = '#' + identifier + ' .' + classClose.replace(/ /g, '.');
        var closeN = document.querySelector(query);
        if(!closeN) {
            // SE crea el contenedor del lightbox
            var wrapper = document.createElement('div');
            wrapper.id = identifier;
            wrapper.classList.add(classWrapper);
            // Se crea el contenido del lighbox
            var content = document.createElement('div');
            content.classList.add(classContent);
            // Se crea el botón de cerrar
            closeN = document.createElement('a');
            closeN.setAttribute('class', classClose);
            closeN.setAttribute('title', 'cerrar');
            // Se crea el contenido del lightbox
            var contentLB = document.createElement('div');
            contentLB.classList.add(classContentLB);
            // Se crea el fondo
            var bg = document.createElement('a');
            bg.classList.add(classBg);
            // Se adicionan los eleemntos de cada uno
            wrapper.appendChild(content);
            wrapper.appendChild(bg);
            content.appendChild(closeN);
            content.appendChild(contentLB);
            // Se adiciona el lightbox al elemento indicado
            document.querySelector(qParent || 'body').appendChild(wrapper);
        } // end else
        // Se inhabilita el link de cerrar
        closeN.setAttribute('href','javascript:void(0)');
    } // end function
    //---------------------------------

    //---------------------------------
    // Public APi
    //---------------------------------
    this.fnClose = fnClose;
    this.fnShow = fnShow;
    this.fnInit = fnInit;

}).apply(j.fnAddNS ? j.fnAddNS("jlightbox") : j);
//---------------------------------

//---------------------------------
if(fnExtend) {
    fnExtend(j, {
        Author: 'Julian Ruiz',
        Created: '2016-01-17',
        Page: 'http://jerc91.github.io/#!/JLightbox',
        Title: 'JLightbox'
    }); // fin combinación
} // end if
//---------------------------------