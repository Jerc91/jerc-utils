//---------------------------------
// Function for sort an array that this containt objects
// first definede and function with search implementation, for example
// function fnIsItem(element, index, array) { 
//    return j.tools.temp ? (array[index].placa == j.tools.temp) : (array[index].placa == j.tools.queryString['placa']);
// }
// second Example array.find(fnIsItem, true)
if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
        enumerable: false,
        configurable: true,
        writable: true,
        value: function(predicate,all) {
            if (this == null) throw new TypeError('Array.prototype.find called on null or undefined');
            if (typeof predicate !== 'function') throw new TypeError('predicate must be a function');
            
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;
            var listNew = [];

            for (var i = 0; i < length; i++) {
                if (i in list) {
                    value = list[i];
                    if (predicate.call(thisArg, value, i, list)) {
                        if(!all) return value;
                        else listNew.push(value);
                    } // end if
                } // end if
            } // end for
            return !all ? undefined : listNew;
        } // end function of value
    }); // end define property
} // end if function find
//---------------------------------

//---------------------------------
// Función de inicio
function fnInit(data) {
    // Se envia la informacion a la App
	var value = data.src.find(function (e) { return e[data.key] == data.value; });
    postMessage(value);
}; // end function
//---------------------------------

// Recepción del App
self.addEventListener("message", function(e){
	// Init
	fnInit(e.data);
});