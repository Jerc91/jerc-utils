self.importScripts('../vendor/compiler.js');

//---------------------------------
// Recepción del App
self.addEventListener("message", function (e) {
    try {
        self.postMessage(self.Hogan.compile(e.data.template).render(e.data.data));
    } catch (e) {
        console.log(e);
    }
});
//---------------------------------