// TODO; 
// Usar depencia a jmain.js
// Quitar la información del plugin como objeto de js y dejarlo como comentario como todos los plugins
// cambiar para que se inicie solo
// Quitar timeout y dejar evento de transición
// Usar clone, and replaceWith

//---------------------------------
// Espacio de nombre para crear un lightbox
//---------------------------------
(function () {

    //---------------------------------
    // Propiedades privadas
    //---------------------------------
    var ctx = this,
        identifier = "lightbox",
        classWrapper = "lightbox",
        classContent = "content",
        classContentLB = "contentLB",
        classOut = "out",
        classIn = "in",
        classActive = "active",
        classInactived = "inactived",
        classBg = "bg",
        classClose = "close fa fa-times-circle",
        active = false;


    /*
       //---------------------------------
       // Function para mostrar el Lightbox, al inicio se muestra una animación.
       //---------------------------------
       // Parámetros:
       //---------------------------------
       // html:            Es el html que contendrá el lightbox.
       // removeEvents:    Si se pasa éste parámetro se quitarán los eventos,
       //                  click y keydown para ocultar el lightbox, se mantendrá
       //                  visible.
       //---------------------------------
    */
    function fnShow(html, removeEvents) {
        var ctx = this,
            popup = ctx.popup = document.getElementById(identifier),
            popupClone = ctx.popup.cloneNode(true),
            popupBg = popupClone.querySelector(`.${classBg}`),
            popupClose = popupClone.querySelector(`.${classClose.replace(/ /g, '.')}`),
            contentLB = popupClone.querySelector(`.${classContentLB}`),
            content = popupClone.querySelector(`.${classContent}`),
            contenedorPopup = popup.parentNode;

        // Asignación HTML, Node
        if (typeof html === 'string') 
            html = document.createRange().createContextualFragment(html);

        if(contentLB.firstElementChild) contentLB.removeChild(contentLB.firstElementChild);
        if(html) popupClone.querySelector(`.${classContentLB}`).appendChild(html);

        if (popupClone) {
            // Bg
            popupBg.handlerClick = popupBg.handlerClick || fnHide.bind(ctx);
            popupBg.removeEventListener('click', popupBg.handlerClick);
            popupBg.addEventListener('click', popupBg.handlerClick);
            // Close
            popupClose.handlerClick = popupClose.handlerClick || fnHide.bind(ctx);
            popupClose.removeEventListener('click', popupClose.handlerClick);
            popupClose.addEventListener('click', popupClose.handlerClick);
            // KeyDown
            contenedorPopup.handlerKeyDown && contenedorPopup.removeEventListener('keydown', contenedorPopup.handlerKeyDown);
            contenedorPopup.handlerKeyDown = fnKeyDown.bind(ctx);
            contenedorPopup.addEventListener('keydown', contenedorPopup.handlerKeyDown);
        } // end if popup

        // Se eliminan los eventos para que se cierre el documento
        if (removeEvents) {
            popupClone.classList.add(classInactived);
            popupBg.removeEventListener('click', popupBg.handlerClick);
            popupClose.removeEventListener('click', popupClose.handlerClick);
            contenedorPopup.handlerKeyDown && contenedorPopup.removeEventListener('keydown', contenedorPopup.handlerKeyDown);
        } // end if

        content.handlerAnimationStart = content.handlerAnimationStart || fnHandlerAnimationStart.bind(ctx);
        content.handlerAnimationEnd = content.handlerAnimationEnd || fnHandlerAnimationEnd.bind(ctx);

        content.removeEventListener('animationstart', content.handlerAnimationStart);
        content.addEventListener('animationstart', content.handlerAnimationStart);

        content.removeEventListener('animationend', content.handlerAnimationEnd);
        content.addEventListener('animationend', content.handlerAnimationEnd);

        ctx.content = content;
        ctx.animationsCount = 0;

        popupClone.classList.add(classIn);
        popupClone.classList.add(classActive);
        popup.replaceWith(popupClone);

        ctx.active = true;
        ctx.popup = document.getElementById(identifier);

        return ctx;
    }
    //---------------------------------

    /*
        //---------------------------------
        // Function para ocultar el Lightbox, al finalizar se muestra una animación
        //---------------------------------
    */
    function fnHide(e) {
        var ctx = this,
            popup = ctx.popup || document.getElementById(identifier);
        ctx.popup = popup;

        if (popup) {
            popup.classList.remove(classIn);
            popup.classList.remove(classInactived);
            popup.classList.add(classOut);
        }

        return ctx;;
    }
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
    function fnKeyDown(e) {
        var ctx = this;
        if (e.keyCode == 27) {
            ctx.hide();
        }
    }
    //---------------------------------

    /*
        //---------------------------------
        // Función para controlar el inicio de la animación
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // e:   Evento
        //---------------------------------
    */
    function fnHandlerAnimationStart(e) {
        e.preventDefault();

        var ctx = this;
        if(!ctx.content.isEqualNode(e.target)) return;
        
        ++ctx.animationsCount;
        return ctx;
    }

    /*
        //---------------------------------
        // Función para controlar el fin de la animación
        //---------------------------------
        // Parámetros:
        //---------------------------------
        // e:   Evento
        //---------------------------------
    */
    function fnHandlerAnimationEnd(e) {
        e.preventDefault();

        var ctx = this;
        if(!ctx.content.isEqualNode(e.target)) return;

        ctx.active = true;
        if(ctx.animationsCount >= 2) {
            ctx.animationsCount = 0;
            ctx.popup.className = identifier;
            ctx.active = false;
        }

        return ctx;
    }

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
    function JLightbox(qParent) {
        var ctx = this,
            query = '#' + identifier + ' .' + classClose.replace(/ /g, '.'),
            closeN = document.querySelector(query);

        if (!closeN) {
            // Se crea el contenedor del lightbox
            var wrapper = document.createElement('div'),
                content = document.createElement('div'),
                contentLB = document.createElement('div'),
                bg = document.createElement('a');

            wrapper.id = identifier;
            wrapper.classList.add(classWrapper);

            // Se crea el contenido del lighbox
            content.classList.add(classContent);
            // Se crea el botón de cerrar
            closeN = document.createElement('a');
            closeN.setAttribute('class', classClose);
            closeN.setAttribute('title', 'cerrar');
            // Se crea el contenido del lightbox
            contentLB.classList.add(classContentLB);
            // Se crea el fondo
            bg.classList.add(classBg);
            // Se adicionan los eleemntos de cada uno
            content.appendChild(closeN);
            content.appendChild(contentLB);
            wrapper.appendChild(content);
            wrapper.appendChild(bg);
            ctx.popup = wrapper;

            // Se adiciona el lightbox al elemento indicado
            document.querySelector(qParent || 'body').appendChild(wrapper);
        } // end else

        return ctx;
    }
    //---------------------------------

    /*
        //---------------------------------
        // Función para simular una estructura de promise
        //---------------------------------
        // Parameters: 
        //---------------------------------
        // @cb: Función de callback
        //---------------------------------
    */
    function fnThen(resolve, reject) {
        var ctx = this;       
        
        if(ctx.animationsCount == 1) ctx.callback = resolve; // Show        
        else if(!ctx.animationsCount == 0) ctx.callback = resolve; // Hide
        else resolve();

        return ctx;
    }
    //---------------------------------

    // Public API (Events)
    JLightbox.prototype.show = fnShow;
    JLightbox.prototype.hide = fnHide;
    JLightbox.prototype.then = fnThen;

    /*
        //---------------------------------
        // Función para obtener la instancia del JSlide
        //---------------------------------
    */
    function fnGetInstance(_args) {
        return new JLightbox(_args);
    }
    //---------------------------------

    //---------------------------------
    // Public APi
    //---------------------------------
    fnGetInstance.show = fnShow;
    fnGetInstance.hide = fnHide;

    jr.addNS("jlightbox", fnGetInstance);
    jr.jlightbox.show = fnShow;
    jr.jlightbox.hide = fnHide;
})();
//---------------------------------