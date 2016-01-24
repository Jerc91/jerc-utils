// Validación del espacio de nombre principal "j"
if(!window.j) window.j = (NameSpace ? new NameSpace() : {});

//---------------------------------
// Espacio de nombre para crear un slide
//---------------------------------
(function () {
    // Private properties
    //---------------------------------
    var preBrowsers = ['', '-moz-', '-ms-', '-o-', '-webkit-'];
    //---------------------------------

    /*
        //---------------------------------
        // Move elements to left
        //---------------------------------
    */
    function fnMoveLeft(e) {
        var ctx = this;
        // Recursividad
        var qSlide = ctx.qWrapper + ' ' + ctx.qSlide;

        var ul = document.querySelector(qSlide);
        var classString = fnFindWord("[a]" + ctx.rangeNumber, ul.getAttribute("class")) || 'a0';
        var activeItem = parseInt(fnFindWord(ctx.rangeNumber, classString)) + ctx.maxElementsShow;
        
        if (ctx.active) return;
        if (fnShowButton.call(ctx, activeItem)) return;
        
        ctx.active = true;
        // Se valida el final del slide
        if (activeItem < ctx.list) {
            ul.classList.remove(classString);
            ul.classList.add("a" + (activeItem));  
        } // end if
        setTimeout(function () { ctx.active = false }, 300);
        fnSetActive(qSlide);
    } // end mehod
    //---------------------------------

    /*
        //---------------------------------
        // Move elements to right
        //---------------------------------
    */
    function fnMoveRight(e) {
        var ctx = this;
        // Recursividad
        var qSlide = ctx.qWrapper + ' ' + ctx.qSlide;

        var ul = document.querySelector(qSlide);
        var classString = fnFindWord("[a]" + ctx.rangeNumber, ul.getAttribute("class")) || 'a0';
        var activeItem = parseInt(fnFindWord(ctx.rangeNumber, classString)) - ctx.maxElementsShow;
        
        if (ctx.active) return;
        if (fnShowButton.call(ctx, activeItem)) return;

        ctx.active = true;
        // Se valida el inicio del slide
        ul.classList.remove(classString);
        if (activeItem > 0) ul.classList.add("a" + (activeItem));
        setTimeout(function () { ctx.active = false }, 300);
        fnSetActive(qSlide);
    } // end method
    //---------------------------------

    /*
        //---------------------------------
        // Show or fade the buttons(Left, Right)
        //---------------------------------
    */
    function fnShowButton(activeItem) {
        var ctx = this;
        var btn1, btn2;
        var countItems = ctx.elementsFade, classDisabled = "disabled";
        var parent = ctx.qWrapper;

        if (!ctx.leftToRight) {
            btn1 = parent + " .btnRight";
            btn2 = parent + " .btnLeft";
        } // end if
        else {
            btn1 = parent + " .btnLeft";
            btn2 = parent + " .btnRight";
        } // end else

        btn1 = document.querySelector(btn1);
        btn2 = document.querySelector(btn2);

        if (!btn1 || !btn2) return;

        if (activeItem == -1) {
            btn1.classList.add(classDisabled);
            return true;
        } // end if
        else if (activeItem == 0)
            btn1.classList.add(classDisabled);
        else
            btn1.classList.remove(classDisabled);

        if (activeItem > countItems) {
            btn2.classList.add(classDisabled);
            return true;
        } // end if

        if (activeItem == countItems)
            btn2.classList.add(classDisabled);
        else
            btn2.classList.remove(classDisabled);

        return false;
    } // end method
    //---------------------------------

    /*
        //---------------------------------
        // Show or hide the buttons of navigation jslide
        //---------------------------------
    */
    function fnBtnMove(e) {
        var ctx = this;
        var button = e.target;
        var fn;

        if (button.classList.contains("disabled")) return;
        if (button.classList.contains("btnLeft")) {
            if (!ctx.leftToRight) fn = ctx.fnMoveLeft;
            else fn = ctx.fnMoveRight;
        } // end if
        else if (button.classList.contains("btnRight")) {
            if (!ctx.leftToRight) fn = ctx.fnMoveRight;
            else fn = ctx.fnMoveLeft;
        } // end else if

        fn.apply(this, e);
    } // end method
    //---------------------------------

    /*
        //---------------------------------
        // Show or hide the buttons of navigation jslide
        //---------------------------------
    */
    function fnMoveTo(index) {
        var ctx = this;
        // Recursividad
        var qSlide = ctx.qWrapper + ' ' + ctx.qSlide;

        fnShowButton.call(ctx, index);

        var ul = document.querySelector(qSlide);
        var classString = fnFindWord("[a]" + ctx.rangeNumber, ul.getAttribute("class")); // || 'a0';
        ul.classList.remove(classString);
        if (index > 0) ul.classList.add('a' + index);
        fnSetActive(qSlide);

        return this;
    } // end fnMoveTo
    //---------------------------------

    /*
        //---------------------------------
        // Función en donde se inicia el control jslide, crea los calculos y crea la hoja de 
        // estilos con la que navega jslide
        //---------------------------------
    */
    function fnInit(config) {
        // Se obtiene el contexto que es la instancia, del módelo
        // del jslide
        var ctx = this;

        // Se combina el contexto y la configuración que se quiera para el jslide
        fnExtend(ctx, config);


        //---------------------------------
        // Variables locales para el funcionmamiento del plugin
        //---------------------------------
        var count = ctx.list.length || ctx.list;    // Cantidad de slides
        var countFadeElements = 0;                  // Elemento para ocultar
        var widthElements;                          // máximo tamaño para cada elemento
        var css = [];                               // Arrelgo con cada línea a construir para la hoaja de estilo por control
        var laCSS;                                  // Estilos para realizar la animación
        var leftAnimation;                          // Determina de a donde parte la animación inicial
        var pi;                                     // medida en pixeles para mover
        var qSlide;                                 // Query del Slide
        var slides;                                 // Estilos para minimizar los li que no esten visibles
        //---------------------------------


        //---------------------------------
        // Para recursividad, primeros calculos del control
        qSlide = ctx.qWrapper + ' ' + ctx.qSlide;

        ctx.active = false;
        ctx.elementsFade = (count > ctx.maxElementsShow ? count - ctx.maxElementsShow : 0);
        ctx.leftToRight = ctx.leftToRight || false;
        ctx.rangeNumber = fnGetERNumberRange(count);
        widthElements = Math.round(ctx.width / ctx.maxElementsShow);
        css.push(qSlide + " > li { min-width:" + widthElements + "px; }");
        //---------------------------------


        //---------------------------------
        // Se crean los estilos por cada li
        for (var i = 0; i < count; i++) {
            var i2 = i + 1;
            var b = count > 1 && ((i2 + i) == count || (i2) == count);
            var child = " li:nth-child(" + (i2 + 1) + ") ";
            if (ctx.elementsFade > countFadeElements && !ctx.leftToRight) {
                var tx = fnGetTextPreBrowsers("transform: translateX(-" + (widthElements * (ctx.elementsFade - i2)) + "%);");
                css.push(qSlide + ".a" + i2 + " > li {" + tx + "}");
                // css.push(ctx.qSlide + ".a" + i2 + 1 + " > "+ child +" article {max-height:none !important;)}");
                countFadeElements++;
            } // end if
            else if (i < ctx.elementsFade && ctx.leftToRight) {
                var tx = fnGetTextPreBrowsers("transform: translateX(-" + (widthElements * i2) + "px);");
                if (ctx.animation != 2) {
                    css.push(qSlide + ".a" + i2 + " > li {" + tx + "}");
                    // css.push(ctx.qSlide + ".a" + i2 + " > "+ child +" article {max-height:none !important;)}");    
                } // end if
                else
                    css.push(qSlide + ".a" + i2 + " > " + child + " {" + tx + "}");
            } // end if
        } // end for
        //---------------------------------

        if(ctx.maxElementsShow == 1) {
            //---------------------------------
            // Se crean los estilos para ocular y minimixar los demas slides, solo se mostrará el actual
            slides = qSlide + ':not([class*="a"]) > li:not(:first-child),';
            for (var i = 1; i < count; i++) {
                slides += qSlide + '.a' + i + ' > li:not(:nth-child(' + (1 + i) + ')),';
            } // end for
            slides = slides.substring(0, slides.length - 1);
            slides += '{ opacity: 0; overflow: hidden; }'
            css.push(slides);

            // Después de un segundo se ocultarán el tamaño sera 0
            slides = qSlide + ':not([class*="a"])[data-active] > li:not(:first-child), ';
            for (var i = 1; i < count; i++) {
                slides += qSlide + '[data-active].a' + i + ' > li:not(:nth-child(' + (1 + i) + ')),';
            } // end for
            slides = slides.substring(0, slides.length - 1);
            slides += '{ max-height: 0 !important; }'
            css.push(slides);
            //---------------------------------    
        } // end if

        //---------------------------------
        // Se agrega el evento al botónes si estos existen
        var btnLeft, btnRight;

        if (ctx.buttons) {
            btnLeft = document.querySelector(ctx.qWrapper + " .btnLeft");
            btnRight = document.querySelector(ctx.qWrapper + " .btnRight");
        } // end if buttons

        if (btnLeft && btnRight) {
            btnLeft.addEventListener('click', fnClick, false);
            btnRight.addEventListener('click', fnClick, false);

            if (ctx.leftToRight) btnLeft.classList.add("disabled");
            else btnRight.classList.add("disabled");

            // ctx; es el botón
            function fnClick(e) {
                fnBtnMove.call(ctx, e);
            } // end function
        } // end if buttons
        //---------------------------------


        //---------------------------------
        // Espacio para agregar las animaciones en el control
        if (ctx.animations) {
            laCSS = " init-jslide{0%{left:" + (ctx.leftToRight ? "-" : "") + "100%;opacity:0;}100%{left:0;opacity:1;}}";

            // Se calcula el valor én pixeles de la animación de la parte izquierda a la derecha
            if (!ctx.leftToRight) {
                leftAnimation = (ctx.elementsFade * widthElements) - (ctx.leftToRight ? (ctx.maxElementsShow * widthElements) : 0);
                leftAnimation *= leftAnimation <= 0 ? -1 : 1;
            } else {
                leftAnimation = (ctx.maxElementsShow * widthElements) - (ctx.leftToRight ? (ctx.elementsFade * widthElements) : 0);
            } // end else

            pi = fnGetTextPreBrowsers("transform: translateX(-" + leftAnimation + "px);");
            css.push(qSlide + " > li { " + pi + " }");

            // Se agregan los primeros estilos del control
            for (var i in preBrowsers) {
                css.push("@" + preBrowsers[i] + "keyframes" + laCSS);
            } // end for

            var cSlide = document.querySelector(qSlide);
            cSlide.classList.add('init');
            ctx.active = true;

            setTimeout(function () {
                cSlide.removeClass("init");
                ctx.active = false;
            }, 2000); // end setTimeout
        } // end if animations
        //---------------------------------


        // Se crea el blob y agrega la tag Link
        var blob = blob || new Blob(css, { type: 'text/css; charset="utf-8"' });
        fnCreateScriptTemp({
            href: URL.createObjectURL(blob),
            type: 'css', name: 'jslide-' + ctx.name,
            fnCallTag: function () {
                var exLink = document.querySelectorAll('link[data-name="jslide-' + ctx.name + '"]');
                if (exLink.length >= 2) exLink[0].parentNode.removeChild(exLink[0]);
                // Se ejecuta la función de callback
                setTimeout(ctx.fnCall, 2000);
            }, // end function
            isNew: true
        });

        // Para que cada slide los items que nos son el actual tenga una medida 
        // de 0 después de 800ms
        fnSetActive(qSlide);

        // SI esta en tru e la propiedad a evaluar se asignan los eventos de touch
        if(ctx.withTouch) {
            // Se agrega el evento touch
            var slide = document.querySelector(qSlide);
            slide.addEventListener('touchstart', fnTouchHandler, false);
            slide.addEventListener('touchend', fnTouchHandler, false);    
        } // end if
        
        function fnTouchHandler(e) {
            fnTouch.call(ctx, e, this);
        }; // end function

        return ctx;
    } // end function init
    //---------------------------------

    /*
        //---------------------------------
        // Función para agregar después de 800ms un atributo data-active, que es el encargado
        // de ocultar los slides no activos, para que su tamaño sea 0 px
        //---------------------------------
    */
    function fnSetActive(query) {
        var ul = document.querySelector(query);
        if (!ul) return;
        delete ul.dataset.active;
        setTimeout(function () {
            document.querySelector(query).dataset.active = '';
        }, 800);
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
        // Agrega el prefijo de los navegadores, para la creación de reglas de 
        // estilos como: -webkit-, -moz-, ...
        // debe existir una variable "j" con la propiedad preBrowsers []
        // text: text al que se van agregar los prefijos de los navegadores {string}
        //---------------------------------
    */
    function fnGetTextPreBrowsers(text) {
        var result = '';
        for (var i in preBrowsers) result += (preBrowsers[i] + text);
        return result;
    } // end function
    //---------------------------------

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
    function fnTouch(e) {
        // e.preventDefault();
        if(!e.changedTouches.length) return;
        var touch = e.changedTouches[0];
        var ctx = this;

        switch(e.type) {
            case 'touchstart':
                ctx.pageX = touch.pageX;
                break;
            case 'touchmove':
                break;
            case 'touchend':
                var diferencia = touch.pageX - ctx.pageX;
                
                if(ctx.pageX < touch.pageX && diferencia >= 100)
                    ctx.fnMoveRight();

                if(ctx.pageX > touch.pageX && diferencia <= -100)
                    ctx.fnMoveLeft();

                ctx.pageX = 0;
                break;
        } // end switch
    } // end function 
    //---------------------------------

    /*
        //---------------------------------
        // Función módelo para ocupar un espacio de memoria entre varias instancias
        //---------------------------------
    */
    function instance() {
        // Public API
        this.fnInit = fnInit;
        this.fnMoveLeft = fnMoveLeft;
        this.fnMoveRight = fnMoveRight;
        this.fnMoveTo = fnMoveTo;
        this.fnShowButton = fnShowButton;
        // Default Values
        this.leftToRight = true;
        this.maxElementsShow = 1;
        this.withTouch = true;
        this.pageX = 0;
        this.width = 600;
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Función para obtener la instancia del JSlide
        //---------------------------------
    */
    function fnGetInstance() {
        return new instance();
    } // enf function
    //---------------------------------

    //this.fnShowButton = fnShowButton;
    this.fnGetInstance = fnGetInstance;
    //---------------------------------
}).apply(j.fnAddNS("jslide"));
//---------------------------------

//---------------------------------
if(fnExtend) {
    fnExtend(j, {
        Author: 'Julian Ruiz',
        Created: '2016-01-17',
        Page: 'http://jerc91.github.io/#!/JSlide',
        Title: 'JSlide'
    }); // fin combinación
} // end if
//---------------------------------

/*
$('body').keydown(function (e) {
    if (e.keyCode == 37) if (!e.leftToRight) e.fnMoveLeft(); else e.fnMoveRight();
    else if (e.keyCode == 39) if (!e.leftToRight) e.fnMoveRight(); else e.fnMoveLeft();
});
*/