(function(){function f(c){function e(g,a,h){var c,d;c=document.createDocumentFragment();for(var e=0;e<a;e++)d=document.createElement('div'),d.classList.add(g+(h?e+1:'')),c.appendChild(d);return c}var b=this;return new Promise(function(a){var d;if(b instanceof h||(b=c||{},b.theme=b.theme||i(14*Math.random())+1,b.content=(b.wrapper||document).querySelector(b.query||'body'),b.elemento=b.content.querySelector('.blockUI')),!!b.content){switch(b.relative&&b.content.classList.add('posRelav'),b.elemento||(b.elemento=document.createElement('div'),b.content.appendChild(b.elemento)),b.elemento.setAttribute('class','blockUI none'),0<b.elemento.children.length&&b.elemento.removeChild(b.elemento.children[0]),b.spinner=document.createElement('div'),b.spinner.classList.add('spinner'),b.elemento.classList.add('a'+b.theme),b.spinner.classList.add('a'+b.theme),b.elemento.appendChild(b.spinner),parseInt(b.theme)){case 1:d=e('double-bounce',2,!0);break;case 2:d=e('rect',5,!0);break;case 3:d=e('cube',2,!0);break;case 4:d=e('dot',2,!0);break;case 5:d=e('bounce',3,!0);break;case 6:d=e('cube',9);break;default:d=e('circle',1);}b.spinner.appendChild(d),b.elemento.classList.remove('off'),b.elemento.classList.add('on'),requestAnimationFrame(()=>a(b))}})}function a(c){var e=this;return new Promise(function(b){function a(c){requestAnimationFrame(()=>{c.stopPropagation(),'opacity'!==c.propertyName||(e.relative&&e.elemento.parentNode&&(e.content.parentNode.classList.remove('posRelav'),e.elemento.parentNode.removeChild(e.elemento)),b(e))})}e instanceof h||(e=c||{},e.theme=e.theme||i(14*Math.random())+1,e.content=(e.wrapper||document).querySelector(e.query||'body'),e.elemento=e.content.querySelector('.blockUI')),e.elemento||b(e),e.elemento.style.transition||b(e),e.elemento.removeEventListener('transitionend',a,!1),e.elemento.addEventListener('transitionend',a,!1),e.elemento.classList.remove('on'),e.elemento.classList.add('off')})}function h(b){var e=this;return Object.assign({query:'body',relative:!1},e,b),e.content=(e.wrapper||document).querySelector(e.query||'body'),e.elemento=e.content.querySelector('.blockUI'),e.theme=e.theme||i(14*Math.random())+1,e.block=f,e.hide=a,e}var i=Math.floor;jr.addNS('jspinner',(function(b){return new h(b)})),jr.jspinner.show=f,jr.jspinner.hide=a})();