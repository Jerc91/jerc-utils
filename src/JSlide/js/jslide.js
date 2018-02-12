// TODO; 
// Usar depencia a jmain.js
// Validar el width de cada uno, esta agregando 6px de más
// Agregarle al jslide el jtimeline
// Volver a parametrizable o constante por lo menos
// Ver como unificar pars y ctx
// eliminar variables cuando se finalice el css
// Cuando se dimensiona no se debería quitar el a1
// Usar setAnimationFrameREquest en vex setTimeout
// Quitar la información del plugin como objeto de js y dejarlo como comentario como todos los plugins

/*
    ctx.slideElement
    ctx.contenedorSlideElement
    ctx.qSlide
    ctx.width
    ctx.widthElements
    ctx.maxWidth
    ctx.count
    ctx.countFadeElements
    ctx.manualWidth
    ctx.animation
*/

//---------------------------------
// Espacio de nombre para crear un slide
//---------------------------------
(function () {
    var DISABLEDCLASS = 'disabled',
        EVENT = 'click',
        _contadorSlides = 0,
        _parametersDefault = {
            leftToRight: true,
            maxElementsShow: 1,
            withTouch: false,
            pageX: 0,
            timingFunction: 'cubic-bezier(.4, 0, .2, 1)',
            speedAnimation: 250,
            buttons: true,
            countFadeElements: 0,
            elementos: [],
            maxWidth: 0
        };

    /*
        //---------------------------------
        // Función en donde se inicia el control jslide, crea los calculos y crea la hoja de 
        // estilos con la que navega jslide
        //---------------------------------
    */
    function JSlide(config) {
        // Se combina el contexto y la configuración que se requiera para el jslide
        var ctx = this,
            pars = Object.assign(ctx, _parametersDefault, config),
            css = [];

        ctx.active = true;
        ctx.promise = new Promise((resolve, reject) => {
            try {
                fnConfiguracionDefecto();
                fnCalcularAnchoMaximo();
                fnGenerarEstilosElementos();
                ctx.maxElementsShow == 1 && fnCrearEstilosItemPrincipal();
                fnConfigurarBotones();
                pars.animations && fnCrearEstilosAnimaciones();
                fnCrearTagLink(resolve);
                fnFinalizarConfiguracion();
            } catch(e) {
                reject(e);
            }
        }).catch(jr.fnErrorHandler);
        //---------------------------------

        // end transitions
        ctx.promise.then(() => ctx.firstChild.dispatchEvent(new HashChangeEvent('transitionend')));

        return ctx;

        //---------------------------------
        // Se configuran las opciones por defecto
        function fnConfiguracionDefecto() {
            var qWrapper, contentClass;

            //---------------------------------
            // Para recursividad, primeros calculos del control
            ctx.slideElement = ctx.slideElement || document.querySelector(pars.qSlide);
            ctx.firstChild = pars.firstChild || ctx.slideElement.querySelector(':scope > li:first-child');
            ctx.firstChild.handlerTransitionEnd = ctx.firstChild.handlerTransitionEnd || handlerTransitionEnd.bind(ctx, ctx);
            ctx.firstChild.handlerTransitionStart = ctx.firstChild.handlerTransitionStart || handlerTransitionStart.bind(ctx, ctx);

            // remove listener
            ctx.firstChild.removeEventListener('transitionend', ctx.firstChild.handlerTransitionEnd, false);
            ctx.firstChild.removeEventListener('transitionstart', ctx.firstChild.handlerTransitionStart, false);

            // add listener
            ctx.firstChild.addEventListener('transitionend', ctx.firstChild.handlerTransitionEnd, false);
            ctx.firstChild.addEventListener('transitionstart', ctx.firstChild.handlerTransitionStart, false);

            // Se obtienen los elementos y los selectores para las reglas de estilos
            if(pars.qWrapper) {
                pars.contenedorSlideElement = (ctx.contenedorSlideElement = ctx.contenedorSlideElement || document.querySelector(pars.qWrapper));
            } else {
                pars.contenedorSlideElement = (ctx.contenedorSlideElement = ctx.contenedorSlideElement || ctx.slideElement.parentNode);
                contentClass = pars.contenedorSlideElement.getAttribute('class');
                contentClass = contentClass.includes(' ') ? contentClass.substring(0, contentClass.indexOf(' ')) : contentClass;
                qWrapper = pars.contenedorSlideElement.tagName + (contentClass ? '.' + contentClass : '');
                pars.qSlide = qWrapper + ' ' + pars.qSlide;
            }

            // Se obtiene el ancho del contenedor, si no se ha pasado dentro de la configuración
            ctx.width = pars.width = pars.width || pars.contenedorSlideElement.getBoundingClientRect().width;
            
            // Se configuran los items de los elementos
            pars.count = ctx.slideElement.children.length || pars.list;
            pars.active = false;
            pars.elementsFade = (pars.count > pars.maxElementsShow ? pars.count - pars.maxElementsShow : 0);
            pars.leftToRight = pars.leftToRight || false;
            pars.rangeNumber = fnGetERNumberRange(pars.count);
            pars.name = (pars.name || ctx.name) || ++_contadorSlides;

            pars.widthElements = Math.round(pars.width / pars.maxElementsShow);

            // Animacion
            css.push(pars.qSlide + ' > li { transition-duration: ' + pars.speedAnimation + 'ms; transition-timing-function: ' + pars.timingFunction + '; }');

            // Public API (Properties)
            ctx.qSlide = pars.qSlide;
            ctx.rangeNumber = pars.rangeNumber;
            ctx.speedAnimation = pars.speedAnimation;
            ctx.leftToRight = pars.leftToRight;
            ctx.maxElementsShow = pars.maxElementsShow;
            ctx.name = pars.name;
            ctx.count = pars.count;
            ctx.elementsFade = pars.elementsFade;

            // ctx.name = ctx.name;
            // ctx.slideElement = ctx.slideElement;
            // ctx.contenedorSlideElement = ctx.contenedorSlideElement;
            // ctx.slideElement = ctx.slideElement;
        } // end fnConfiguracionDefecto
        //---------------------------------

        //---------------------------------
        // Se crea ancho máximo del contenedor
        function fnCalcularAnchoMaximo() {
            if (!pars.manualWidth) {
                css.push(pars.qSlide + " > li { min-width:" + pars.widthElements + "px; }");
            } else {
                [].slice.call(document.querySelectorAll(pars.qSlide + ' > li')).forEach(function (elemento) {
                    var anchoElemento = elemento.getBoundingClientRect().width;
                    if ((pars.maxWidth + anchoElemento) < pars.width) pars.maxWidth += anchoElemento;
                    else if ((pars.maxWidth + anchoElemento) >= pars.width) {
                        pars.elementos.push(pars.maxWidth);
                        pars.maxWidth = 0;
                    }
                });
                ctx.count = pars.elementos.length;
            }
        } // end fnCalcularAnchoMaximo
        //---------------------------------

        //---------------------------------
        // Se crean los estilos por cada li
        function fnGenerarEstilosElementos() {
            var cssProp = "transform: translateX(-",
                i2, b, child, tx;
            
            for (var i = 0; i < ctx.count; i++) {
                i2 = i + 1;
                b = ctx.count > 1 && ((i2 + i) == ctx.count || (i2) == ctx.count);
                child = " li:nth-child(" + (i2 + 1) + ") ";
                if(!pars.manualWidth) {
                    if (ctx.elementsFade > pars.countFadeElements && !pars.leftToRight) {
                        tx = cssProp + (pars.widthElements * (ctx.elementsFade - i2)) + "%);";
                        css.push(pars.qSlide + ".a" + i2 + " > li {" + tx + "}");
                        // css.push(pars.qSlide + ".a" + i2 + 1 + " > "+ child +" article {max-height:none !important;)}");
                        pars.countFadeElements++;
                    } // end if
                    else if (i < pars.elementsFade && pars.leftToRight) {
                        tx = cssProp + (pars.widthElements * i2) + "px);";
                        if (pars.animation != 2) {
                            css.push(pars.qSlide + ".a" + i2 + " > li {" + tx + "}");
                            // css.push(pars.qSlide + ".a" + i2 + " > "+ child +" article {max-height:none !important;)}");    
                        } // end if
                        else
                            css.push(pars.qSlide + ".a" + i2 + " > " + child + " {" + tx + "}");
                    } // end if
                }
                else if (pars.manualWidth) {
                    tx = cssProp + pars.elementos[i] + "px);";
                    css.push(pars.qSlide + ".a" + i2 + " > li {" + tx + "}");
                    pars.countFadeElements++;
                } // end if
            } // end for
            //---------------------------------
        } // end fnGenerarEstilosElementos
        //---------------------------------

        //---------------------------------
        // Se crea estilo item principal
        function fnCrearEstilosItemPrincipal() {
            var slides;

            //---------------------------------
            // Se crean los estilos para ocultar y minimixar los demas slides, solo se mostrará el actual
            slides = pars.qSlide + ':not([class*="a"]) > li:not(:first-child),';
            for (var i = 1; i < ctx.count; i++) {
                slides += pars.qSlide + '.a' + i + ' > li:not(:nth-child(' + (1 + i) + ')),';
            } // end for
            slides = slides.substring(0, slides.length - 1);
            slides += '{ max-height: 0; opacity: 0; overflow: hidden; }'
            css.push(slides);
        } // end fnCrearEstiloItemPrincipal
        //---------------------------------

        //---------------------------------
        // Se configuran los botones principales
        function fnConfigurarBotones() {
            if(!pars.buttons) return;

            pars.btnLeft = ctx.btnLeft = pars.contenedorSlideElement.querySelector(".btnLeft");
            pars.btnRight = ctx.btnRight = pars.contenedorSlideElement.querySelector(".btnRight");

            if(!pars.btnLeft || !pars.btnRight) return;

            pars.btnLeft.classList.remove(DISABLEDCLASS);
            pars.btnRight.classList.remove(DISABLEDCLASS);

            if (pars.leftToRight) pars.btnLeft.classList.add(DISABLEDCLASS);
            else pars.btnRight.classList.add(DISABLEDCLASS);

            ctx.handlerLeft = ctx.handlerLeft || ctx.left.bind(ctx);
            ctx.handlerRight = ctx.handlerRight || ctx.right.bind(ctx);

            pars.btnLeft.removeEventListener(EVENT, ctx.handlerLeft, false);
            pars.btnRight.removeEventListener(EVENT, ctx.handlerRight, false);

            pars.btnLeft.addEventListener(EVENT, ctx.handlerLeft, false);
            pars.btnRight.addEventListener(EVENT, ctx.handlerRight, false);
        } // end fnConfigurarBotones
        //---------------------------------

        //---------------------------------
        // Se configuran los estilos de las animaciones
        function fnCrearEstilosAnimaciones() {
            var laCSS = [
                    " init-jslide{0%{left:" + (pars.leftToRight ? "-" : "") + "100%;opacity:0;}100%{left:0;opacity:1;}}",
                    `${pars.qSlide}.init > li { animation: init-jslide 2s ease; width: 100%; }`
                ].join(''),
                leftAnimation,
                pi,
                CLASSINIT = 'init';

            // Se calcula el valor én pixeles de la animación de la parte izquierda a la derecha
            if (!pars.leftToRight) {
                leftAnimation = (ctx.elementsFade * pars.widthElements) - (pars.leftToRight ? (pars.maxElementsShow * pars.widthElements) : 0);
                leftAnimation *= leftAnimation <= 0 ? -1 : 1;
            } else {
                leftAnimation = (pars.maxElementsShow * pars.widthElements) - (pars.leftToRight ? (ctx.elementsFade * pars.widthElements) : 0);
            } // end else

            pi = "transform: translateX(-" + leftAnimation + "px);";
            css.push(ctx.qSlide + " > li { " + pi + " }");

            // Se agregan los primeros estilos del control
            css.push("@keyframes" + laCSS);
            
            ctx.slideElement.classList.add(CLASSINIT);
            pars.active = true;

            setTimeout(function () {
                ctx.slideElement.removeClass(CLASSINIT);
                pars.active = false;
            }, pars.speedAnimation); // end setTimeout
        } // end fnCrearEstilosAnimaciones
        //---------------------------------

        //---------------------------------
        // Se crea la tag de link para cargar los estilos en el DOM
        function fnCrearTagLink(resolve) {
            // Se crea el blob y agrega la tag Link
            jr.tagScriptLink({
                href: URL.createObjectURL(new Blob(css, { type: 'text/css; charset="utf-8"' })), 
                type: 'css', name: 'jslide-' + pars.name, repeatTag: true, referenceTag: true
            }).then(function() {
                var exLink = document.querySelectorAll('link[data-name="jslide-' + pars.name + '"]');
                exLink.length >= 2 && exLink[0].parentNode.removeChild(exLink[0]);                   

                ctx.slideElement.setAttribute('class', ctx.slideElement.getAttribute('class').replace(/a\d+/, ''));
                fnShowButton(0, ctx);

                pars = null;
                css = null;
                resolve();
            });
        } // end fnCrearTagLink
        //---------------------------------

        //---------------------------------
        // Se configura el final del slide
        function fnFinalizarConfiguracion() {
            // Si esta en true la propiedad a evaluar se asignan los eventos de touch
            if(ctx.withTouch) {
                ctx.touchHandler = ctx.touchHandler || fnTouchHandler.bind(ctx);

                // Se agrega el evento touch
                ctx.slideElement.removeEventListener('touchstart', ctx.touchHandler, false);
                ctx.slideElement.removeEventListener('touchend', ctx.touchHandler, false);
                
                ctx.slideElement.addEventListener('touchstart', ctx.touchHandler, false);
                ctx.slideElement.addEventListener('touchend', ctx.touchHandler, false);
            } // end if
            
            function fnTouchHandler(e) {
                fnTouch(e, ctx);
            } // end function    
        } // end fnFinalizarConfiguracion
        //---------------------------------
    } // end function init
    //---------------------------------

    /*
        //---------------------------------
        // Move elements to left
        //---------------------------------
    */
    function fnMoveLeft(e) {
        var ctx = this,
            ul = ctx.slideElement,
            classString = fnFindWord("[a]" + ctx.rangeNumber, ul.getAttribute("class")) || 'a0',
            activeItem = parseInt(fnFindWord(ctx.rangeNumber, classString)) - ctx.maxElementsShow;
        
        if (ctx.active) return ctx;
        
        ctx.promise.then(() => {
            // Se valida el final del slide
            if (fnShowButton(activeItem, ctx)) return ctx;
            ul.classList.remove(classString);
            if (activeItem < ctx.count) ul.classList.add("a" + (activeItem));

            return ctx;
        });

        return ctx;
    } // end mehod
    //---------------------------------

    /*
        //---------------------------------
        // Move elements to right
        //---------------------------------
    */
    function fnMoveRight(e) {
        var ctx = this,
            ul = ctx.slideElement,
            classString = fnFindWord("[a]" + ctx.rangeNumber, ul.getAttribute("class")) || 'a0',
            activeItem = parseInt(fnFindWord(ctx.rangeNumber, classString)) + (!ctx.manualWidth ? ctx.maxElementsShow : 1);
        if (ctx.active) return ctx;

        ctx.promise.then(() => {
            // Se valida el inicio del slide
            if (fnShowButton(activeItem, ctx)) return ctx;
            ul.classList.remove(classString);
            if (activeItem > 0) ul.classList.add("a" + (activeItem));

        });

        return ctx;
    } // end method
    //---------------------------------

    /*
        //---------------------------------
        // Show or hide the buttons of navigation jslide
        //---------------------------------
    */
    function fnMoveTo(index) {
        var ctx = this,
            ul = ctx.slideElement,
            classString = fnFindWord("[a]" + ctx.rangeNumber, ul.getAttribute("class")); // || 'a0'

        fnShowButton(index, ctx);
        
        ul.classList.remove(classString);
        if (index > 0) ul.classList.add('a' + index);

        return ctx;
    } // end fnMoveTo
    //---------------------------------

    /*
        //---------------------------------
        // Show or fade the buttons(Left, Right)
        //---------------------------------
    */
    function fnShowButton(activeItem, instanceJSlide) {
        var ctx = instanceJSlide,
            btn1, btn2,
            countItems = !ctx.manualWidth ? ctx.elementsFade : ctx.count,
            parent = ctx.qWrapper;

        if (!ctx.leftToRight) {
            btn1 = ctx.btnRight;
            btn2 = ctx.btnLeft;
        } // end if
        else {
            btn1 = ctx.btnLeft;
            btn2 = ctx.btnRight;
        } // end else

        if (!btn1 || !btn2) return;

        if (activeItem == -1 || activeItem == (-1 * ctx.maxElementsShow)) {
            btn1.classList.add(DISABLEDCLASS);
            return true;
        } // end if
        else if (activeItem == 0) {
            btn1.classList.add(DISABLEDCLASS);
            btn2.classList.remove(DISABLEDCLASS);
        } else {
            btn1.classList.remove(DISABLEDCLASS);
            btn2.classList.add(DISABLEDCLASS);
        }

        if (activeItem > countItems) {
            btn2.classList.add(DISABLEDCLASS);
            return true;
        } // end if

        if (activeItem == countItems)
            btn2.classList.add(DISABLEDCLASS);
        else
            btn2.classList.remove(DISABLEDCLASS);

        return false;
    } // end method
    //---------------------------------

    /*
        //---------------------------------
        // Función para asiganar en el contexto el li activo
        //---------------------------------
    */
    function fnSetNotActiveSlide(instanceJSlide) {
        // Recursividad
        var ctx = instanceJSlide,
            classString = fnFindWord("[a]" + ctx.rangeNumber, ctx.slideElement.getAttribute("class")) || 'a0',
            activeItem = parseInt(fnFindWord(ctx.rangeNumber, classString));

        ctx.active = false;
        ctx.activeSlide = document.querySelector(ctx.qSlide + ' > li:nth-child(' + (activeItem + 1) + ')');

        jr.execFunction(ctx.callback, ctx.activeSlide);
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
        var range = "([0-9]{";
        for(var i = 1; i <= max.toString().length; i++) 
            range += (i) + ',';
        return (range += "})").replace(',}', '}');
    } // end function
    //--------------------------------

    /*
        //---------------------------------
        // Find word in text
        // Parameters: Expression Regular, Text
        //---------------------------------
    */
    function fnFindWord(reString, text) {
        var re = new RegExp(reString);
        var result = re.exec(text);
        return result ? result[0] : result;
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Función para mover el slide cuando se tengo el evento touch
        // Parameters: 
        // e:    (Evento)

        //---------------------------------
    */
    function fnTouch(e, instanceJSlide) {
        // e.preventDefault();
        if(!e.changedTouches.length) return;
        var touch = e.changedTouches[0],
            ctx = instanceJSlide,
            diferencia;

        switch(e.type) {
            case 'touchstart':
                ctx.pageX = touch.pageX;
                break;
            case 'touchmove':
                break;
            case 'touchend':
                diferencia = (touch.pageX - ctx.pageX);
                
                if(ctx.pageX < touch.pageX && diferencia >= 300)
                    ctx.right();

                if(ctx.pageX > touch.pageX && diferencia <= -300)
                    ctx.left();

                ctx.pageX = 0;
                break;
        } // end switch
    } // end function 
    //---------------------------------

    /*
        //---------------------------------
        // Función para ejecutar un callback cuando se finalice la transición
        //---------------------------------
        // Parameters: 
        //---------------------------------
        // @cb: Función de callback
        //---------------------------------
    */
    function fnFinalizarTransicion(cb) {
        this.callback = cb;
        return this;
    } // end function 
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
        if(ctx.active) ctx.callback = resolve;
        else resolve();
        return ctx;
    }
    //---------------------------------

    /*
        //---------------------------------
        // Función para cuando inicia la transición del primer li
        //---------------------------------
        // Parameters: 
        //---------------------------------
        // @cb: Función de callback
        //---------------------------------
    */
    function handlerTransitionStart(ctx, e) {
        if(!ctx.firstChild.isEqualNode(e.target)) return;
        ctx.active = true;
    }
    //---------------------------------

    /*
        //---------------------------------
        // Función para cuando finaliza la transición del primer li
        //---------------------------------
        // Parameters: 
        //---------------------------------
        // @cb: Función de callback
        //---------------------------------
    */
    function handlerTransitionEnd(ctx, e) {
        if(!ctx.firstChild.isEqualNode(e.target)) return;
        requestAnimationFrame(() => fnSetNotActiveSlide(ctx));
    }
    //---------------------------------    

    /*
        //---------------------------------
        // Función para volver a generar el slide, mantiene sus propiedes inciales
        //---------------------------------
        // Parameters: 
        //---------------------------------
        // @config: Parámetro de inicio opcionales
        //---------------------------------
    */
    function fnResize(config) {
        var ctx = this;
        ctx.promise.then(() => {
            fnGetInstance(Object.assign(ctx, config));
        })
        return ctx;
    }
    //---------------------------------

    /*
        //---------------------------------
        // Función para obtener la instancia del JSlide
        //---------------------------------
    */
    function fnGetInstance(_args) {
        return new JSlide(_args);
    }
    //---------------------------------

    // Public API (Events)
    JSlide.prototype.left = fnMoveLeft;
    JSlide.prototype.right = fnMoveRight;
    JSlide.prototype.moveTo = fnMoveTo;
    JSlide.prototype.then = fnThen;
    JSlide.prototype.resize = fnResize;

    jr.addNS("jslide", fnGetInstance);
})();
//---------------------------------

/*
$('body').keydown(function (e) {
    if (e.keyCode == 37) if (!e.leftToRight) e.fnMoveLeft(); else e.fnMoveRight();
    else if (e.keyCode == 39) if (!e.leftToRight) e.fnMoveRight(); else e.fnMoveLeft();
});
*/