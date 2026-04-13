
let inputStates = {

    /* partie clavier*/
    space: false,
    escape: false,
  
    /* partie souris*/
    mouseX: 0,
    mouseY: 0,
    mouseClicked: false
};


function initListeners(canvas) {

    document.addEventListener("keydown", (event) => {
        if (event.key === " " || event.key === "Spacebar") {
            inputStates.space = true;
            event.preventDefault(); // empêche le scroll
        } 

        else if (event.key === "Escape") {
            inputStates.escape = true;
        }
    });

    //ecouteur clavier
    document.addEventListener("keyup", (event) => {
        if (event.key === " " || event.key === "Spacebar") {
            inputStates.space = false;
        } 
        else if (event.key === "Escape") {
            inputStates.escape = false;
        }
    });

    // écouteur souris
    canvas.addEventListener("mousemove", (event) => {

        const rect = canvas.getBoundingClientRect();
        inputStates.mouseX = event.clientX - rect.left;
        inputStates.mouseY = event.clientY - rect.top;
    });

    //écouteur souris lors du clic
    canvas.addEventListener("click", (event) => {

        inputStates.mouseClicked = true;
        console.log("Clic détecté à x:" + inputStates.mouseX + ", y:" + inputStates.mouseY);
    });

    //écouteur souris en sortie du canvas
    canvas.addEventListener("mouseleave", () => {
        inputStates.mouseX = -100;
        inputStates.mouseY = -100;
    });
}

export { initListeners, inputStates };