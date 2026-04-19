
/**
 * gestion centralsiée des inputs (clavier et souris )
 * cet objet stocke l'état de toutes les touches et de la souris 
 * la game loop lit simplement cet objet pour savoir ce qui est pressé 
 */
let inputStates = {

    /* partie clavier*/
    space: false,
    escape: false,
  
    /* partie souris*/
    mouseX: 0,
    mouseY: 0,
    mouseClicked: false
};

/**
 * initialise tous les écouteurs d'évènements pour le clavier et la souris 
 * @param {*} canvas 
 */
function initListeners(canvas) {

    //écouteur CLAVIER de la touche pressée "keydown"
    document.addEventListener("keydown", (event) => {
        if (event.key === " " || event.key === "Spacebar") {
            inputStates.space = true;
            event.preventDefault(); // empêche le scroll
        } 

        else if (event.key === "Escape") {
            inputStates.escape = true;
        }
    });

    //ecouteur CLAVIER de la touche relachée "keyup"
    document.addEventListener("keyup", (event) => {
        if (event.key === " " || event.key === "Spacebar") {
            inputStates.space = false;
        } 
        else if (event.key === "Escape") {
            inputStates.escape = false;
        }
    });

    // écouteur SOURIS avec le mouvement "mousemove"
    canvas.addEventListener("mousemove", (event) => {

    /** 
     * Met à jour la position de la souris dans les coordonnées du canvas
     * getBoundingClientRect() donne la position du canvas dans la fenêtre
     * on soustrait cette position pour avoir les coordonnées relatives au canvas
     */
        const rect = canvas.getBoundingClientRect();
        inputStates.mouseX = event.clientX - rect.left;
        inputStates.mouseY = event.clientY - rect.top;
    });

    //écouteur SOURIS lors du CLIC
    //la position du click est déja stockée par l'écouteur mousemove
    canvas.addEventListener("click", (event) => {

        inputStates.mouseClicked = true;
        console.log("Clic détecté à x:" + inputStates.mouseX + ", y:" + inputStates.mouseY);
    });

    //écouteur SOURIS en SORTIE du canvas
    /**
     * Quand la souris quitte le canvas, on met des coordonnées hors écran
     * Évite les bugs si on vérifie la position de la souris alors qu'elle n'est plus dans le canvas
     */
    canvas.addEventListener("mouseleave", () => {
        inputStates.mouseX = -100;
        inputStates.mouseY = -100;
    });
}

export { initListeners, inputStates };