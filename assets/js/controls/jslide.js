//---------------------------------
// Plugin carousel
// Depends Tools, Jquery, Namespace Main
(function () {
    // Private properties
    //---------------------------------
    var tools = j.tools;
    //---------------------------------

    /*
        //---------------------------------
        // Move elements to left
        //---------------------------------
    */
    function fnjslideLeft(e) {
        var ctx = this;
        // Recursividad
        var qSlide = ctx.qWrapper + ' ' + ctx.qSlide;

        var ul = document.querySelector(query);
        var classString = tools.fnFindWord("[a]" + ctx.rangeNumber, ul.getAttribute("class")) || 'a0';
        var activeItem = parseInt(tools.fnFindWord(ctx.rangeNumber, classString)) + 1;

        if (ctx.active) return;
        if (fnShowButton(activeItem, parent)) return;

        ctx.active = true;
        ul.classList.remove(classString);
        ul.classList.add("a" + (activeItem));
        setTimeout(function () { ctx.active = false }, 500);
        fnSetActive(query);
    } // end mehod
    //---------------------------------

    /*
        //---------------------------------
        // Move elements to right
        //---------------------------------
    */
    function fnjslideRight(e) {
        var ctx = this;
        // Recursividad
        var qSlide = ctx.qWrapper + ' ' + ctx.qSlide;

        var ul = document.querySelector(qSlide);
        var classString = tools.fnFindWord("[a]" + ctx.rangeNumber, ul.getAttribute("class")) || 'a0';
        var activeItem = parseInt(tools.fnFindWord(ctx.rangeNumber, classString)) - 1;

        if (ctx.active) return;
        if (fnShowButton(activeItem, parent)) return;
        
        ctx.active = true;
        ul.classList.remove(classString);
        if (activeItem > 0) ul.classList.add("a" + (activeItem));
        setTimeout(function () { ctx.active = false }, 500);
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
        var countItems = ctx.elementsFade, classDisabled = "disable";
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

         if(!btn1 || !btn2) return;

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

        if (button.classList.contains("disable")) return;
        if (button.classList.contains("btnLeft")) {
            if(!ctx.leftToRight) fn = ctx.fnjslideLeft;
            else fn = ctx.fnjslideRight;
        } // end if
        else if (button.classList.contains("btnRight")) {
            if(!ctx.leftToRight) fn = ctx.fnjslideRight;
            else fn = ctx.fnjslideLeft;
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

        fnShowButton(index);
        
        var ul = document.querySelector(qSlide);
        var classString = tools.fnFindWord("[a]" + ctx.rangeNumber, ul.getAttribute("class")) || 'a0';
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
       
        // SE combina el contexto y la configuración que se quiera para el jslide
        fnExtend(ctx, config);


        //---------------------------------
        // Variables locales para el funcionmamiento del plugin
        //---------------------------------
        var count = ctx.list.length;    // Cantidad de slides
        var countFadeElements = 0;      // Elemento para ocultar
        var widthElements;              // máximo tamaño para cada elemento
        var css = [];                   // Arrelgo con cada línea a construir para la hoaja de estilo por control
        var laCSS;                      // Estilos para realizar la animación
        var leftAnimation;              // Tamaño completo del slide
        var pi;                         // medida en pixeles para mover
        var qSlide;                     // Query del Slide
        var slides;                     // Estilos para minimizar los li que no esten visibles
        //---------------------------------


        //---------------------------------
        // Para recursividad, primeros calculos del control
        qSlide = ctx.qWrapper + ' ' + ctx.qSlide;

        ctx.active = false;
        ctx.elementsFade = (count > ctx.maxElementsShow ? count - ctx.maxElementsShow : 0);
        ctx.leftToRight = ctx.leftToRight || false;
        ctx.rangeNumber = tools.fnGetERNumberRange(count.toString().length);
        widthElements = Math.round(ctx.width / ctx.maxElementsShow);

        css.push(ctx.qSlide + " > li { min-width:" + widthElements + "px; }");
        //---------------------------------


        //---------------------------------
        // Se crean los estilos por cada li
        for (var i = 0; i < count; i++) {
            var i2 = i + 1;
            var b = count > 1 && ((i2 + i) == count || (i2) == count);
            var child = " li:nth-child(" + (i2 + 1) + ") ";
            if (ctx.elementsFade > countFadeElements && !ctx.leftToRight) {
                var tx = tools.fnGetTextPreBrowsers("transform: translateX(-" + (widthElements * (ctx.elementsFade - i2)) + "%);");
                css.push(ctx.qSlide + ".a" + i2 + " > li {" + tx + "}");
                // css.push(ctx.qSlide + ".a" + i2 + 1 + " > "+ child +" article {max-height:none !important;)}");
                countFadeElements++;
            } // end if
            else if (i < ctx.elementsFade && ctx.leftToRight) {
                var tx = tools.fnGetTextPreBrowsers("transform: translateX(-" + (widthElements * i2) + "px);");
                if (ctx.animation != 2) {
                    css.push(ctx.qSlide + ".a" + i2 + " > li {" + tx + "}");
                    // css.push(ctx.qSlide + ".a" + i2 + " > "+ child +" article {max-height:none !important;)}");    
                } // end if
                else
                    css.push(ctx.qSlide + ".a" + i2 + " > " + child +" {" + tx + "}"); 
            } // end if
        } // end for
        //---------------------------------


        //---------------------------------
        // Se crean los estilos para ocular y minimixar los demas slides, solo se mostrará el actual
        slides = qSlide + ':not([class*="a"]) > li:not(:first-child),';
        for (var i = 1; i < count; i++) { 
            slides += qSlide + '.a' + i + ' > li:not(:nth-child('+ (1 + i) +')),';
        } // end for
        slides = slides.substring(0, slides.length - 1);
        slides += '{ opacity: 0; overflow: hidden; }'
        css.push(slides);

        // Después de un segundo se ocultarán el tamaño sera 0
        slides = qSlide  + ':not([class*="a"])[data-active] > li:not(:first-child), ';
        for (var i = 1; i < count; i++) { 
            slides += qSlide + '[data-active].a' + i + ' > li:not(:nth-child('+ (1 + i) +')),';
        } // end for
        slides = slides.substring(0, slides.length - 1);
        slides += '{ max-height: 0 !important; }'
        css.push(slides);
        //---------------------------------


        //---------------------------------
        // Se agrega el evento al botónes si estos existen
        var btnLeft = document.querySelector(ctx.qWrapper + " .btnLeft");
        var btnRight = document.querySelector(ctx.qWrapper + " .btnRight");

        if(btnLeft && btnRight) {
            btnLeft.addEventListener('click', fnClic, false);
            btnRight.addEventListener('click', fnClic, false);

            if(ctx.leftToRight) btnLeft.classList.add("disable");
            else btnRight.classList.add("disable");

            // ctx; es el botón
            function fnClic(e) {
                fnBtnMove.call(this, e);
            } // end function
        } // end if buttons
        //---------------------------------


        //---------------------------------
        // Espacio para agregar las animaciones en el control
        if (ctx.animations) {
            laCSS = " init-jslide{0%{left:" + (ctx.leftToRight ? "-" : "") + "100%;opacity:0;}100%{left:0;opacity:1;}}";

            // Se calcula el valor én pixeles de la animación de la parte izquierda a la derecha
            if(!ctx.leftToRight) { 
                leftAnimation = (ctx.elementsFade * widthElements) - (ctx.leftToRight ? (ctx.maxElementsShow * widthElements) : 0);
                leftAnimation *= leftAnimation <= 0 ? -1 : 1;
            } else {
                leftAnimation = (ctx.maxElementsShow * widthElements) - (ctx.leftToRight ? (ctx.elementsFade * widthElements) : 0);
            } // end else

            pi = tools.fnGetTextPreBrowsers("transform: translateX(-" + leftAnimation + "px);");
            css.push(ctx.qSlide + " > li { " + pi +  " }");

            // Se agregan los primeros estilos del control
            for (var i in j.preBrowsers) {
                css.push("@" + j.preBrowsers[i] + "keyframes" + laCSS);
            } // end for

            var cSlide = document.querySelector(ctx.qSlide);
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
            fnCallTag: function() {
                var exLink = document.querySelectorAll('link[data-name="jslide-' + ctx.name + '"]');
                if(exLink.length >= 2) tools.fnDeleteTag(exLink[0]);
                // Se ejecuta la función de callback
                setTimeout(ctx.fnCall, 2000);
            }, // end function
            isNew: true
        });

        // Para que cada slide los items que nos son el actual tenga una medida 
        // de 0 después de 800ms
        fnSetActive(qSlide);

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
        if(!ul) return;
        ul.removeAttribute('data-active');
        setTimeout(function () {
            document.querySelector(query).setAttribute('data-active', '');
        }, 800);    
    } // end function
    //---------------------------------

    /*
        //---------------------------------
        // Función módelo para ocpar un espacio de memoria entre varias instancias
        //---------------------------------
    */
    function instance() {
        // Public API
        this.fnjslideLeft = fnjslideLeft;
        this.fnjslideRight = fnjslideRight;
        this.fnMoveTo = fnMoveTo;
        this.fnShowButton = fnShowButton;
        this.fnInit = fnInit;
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

fnExtend(j.jslide, { 
    Author: 'Julian Ruiz', 
    Created: '2015-03-12', 
    Title: 'jslide' 
}); // end fnExtend
//--------------------------------

/*
$('body').keydown(function (e) {
    if (e.keyCode == 37) if (!e.leftToRight) e.fnjslideLeft(); else e.fnjslideRight();
    else if (e.keyCode == 39) if (!e.leftToRight) e.fnjslideRight(); else e.fnjslideLeft();
});
*/