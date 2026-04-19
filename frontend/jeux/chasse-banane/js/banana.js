
/**
 * Classe Banana : représente un fruit tombant dans le jeu
 * gère l'apparence, le mouvement, la collision et le chargement des images 
 */
export default class Banana {
   
    //img partagées par toutes les instances (chargées une seule fois )
    static images = null;
    static imagesLoaded = false;

    constructor(x, y, type = 'yellow') {
        this.x = x; //position horizontale
        this.y = y; //position verticale
        this.type = type; //type de fruit 
        

        //configure les propriétés selon le type (vitesse, points,taille)
        this.setPropertiesByType();
        
        //rotation aléatoire au départ 
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = 0.02;
        
        this.speedY = this.baseSpeed;
    }

    /**
     * configure automatiquement les propriétés selon le type de fruit
     * centralise toute la configuration dans un seul endroit 
     */
    setPropertiesByType() {
        switch(this.type) {

            case 'yellow':
                this.width = 60;
                this.height = 90;
                this.imageName = 'banana';
                this.points = 50;
                this.baseSpeed = 1.5; //lente

                break;
                
            case 'green':

                this.width = 55;
                this.height = 85;
                this.imageName = 'greenBanana';
                this.points = 100;
                this.baseSpeed = 2.5; //moyenne

                break;
                
            case 'bunch':

                this.width = 75;
                this.height = 68;
                this.imageName = 'twoBananas';
                this.points = 200;
                this.baseSpeed = 3.5; //Rapide

                break;
                
            case 'pineapple':
                this.width = 70;
                this.height = 65;
                this.imageName = 'pineapple';
                this.points = 500;
                this.baseSpeed = 4.5; //très rapide
                break;
                
            default:

                //valeur par défaut( banane jaune) 
                this.width = 60;
                this.height = 90;
                this.imageName = 'banana';
                this.points = 50;
                this.baseSpeed = 1.5;

        }
    }

    /**
     * Dessine la banane sur le canvas avec rotation
     * utilise save/translate/rotate/restore pour ne pas affecter le reste du canvas
     * @param {*} ctx 
     * @returns 
     */
    draw(ctx) {
        
        //vérifie que les img sont chargéesx
        if (!Banana.images || !Banana.images[this.imageName]) {
            console.warn("les images ne sont pas encore chargées");
            return;
        }

        //save() regarde l'état actuel du canvas 
        ctx.save();

        //déplace l'origine au centre de la banane 
        ctx.translate(this.x, this.y);
        
        //applique la rotation
        ctx.rotate(this.angle);
        
        //Dessine l'img centrée (d'où le -width/2 et -height/2)
        ctx.drawImage(
            Banana.images[this.imageName],

            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height

        );
        
        // restore() remet le canvas dans son état d'origine
        // Sans ça toutes les rotations s'accumuleraient
        ctx.restore(); 
    }

    /**
     * Met à jour la position et rotation de la banane 
     * Appelée 60 fois par seconde par la game loop
     */
    update() {

        this.y += this.speedY;//fait tomber la banane
        this.angle += this.rotationSpeed; //fait tourner la banane
    }

    // vérifie si la banane est sortie de l'écran 
    isOutOfScreen(canvasHeight) {
        return this.y - this.height / 2 > canvasHeight + 50;
    }

   /**
    * Détecte si un point( le clic) touche cette banane 
    * @param {*} x // coord x du clic 
    * @param {*} y  // coord y du clic 
    * @returns {boolean} true si le point touche la banane
    */
    containsPoint(x, y) {

        // pour l'ANANAS : collision circulaire (forme ronde)
        if(this.type === 'pineapple'){
            const radius= Math.max(this.width, this.height)/ 2 +5;

            const dx= x -this.x;
            const dy= y -this.y;

            // Théorème de Pythagore : distance² = dx² + dy²
            // On compare les carrés pour éviter Math.sqrt() (optimisation)
            return (dx*dx+ dy* dy) <= (radius* radius)
        }

        // pour BANANES : collision rectangulaire (forme allongée)
        const halfWidth = this.width / 2+ 10;
        const halfHeight = this.height / 2 + 10;
        
        return (

            x >= this.x - halfWidth &&
            x <= this.x + halfWidth &&
            y >= this.y - halfHeight &&
            y <= this.y + halfHeight
        );
    }

    
    /**
     * Charge toutes les images des fruits de manière asynchrone
     * Méthode statique (appelée une seule fois au démarrage)
     * @returns {Promise} Promise qui se résout quand toutes les images sont chargées
     */
    static async loadImages() {
       
 
        return new Promise((resolve, reject) => {
            
            //liste des 4 img à charger 
            const imagesToLoad = {

                banana: './assets/banana.png',
                greenBanana: './assets/green-banana.png',
                twoBananas: './assets/two-bananas.png',
                pineapple: './assets/ananas.png'
            };

            const images = {};
            let loadedCount = 0;
            const totalCount = Object.keys(imagesToLoad).length;

            //charge chaque image 
            for (let name in imagesToLoad) {
                const img = new Image();
                
                //quand une img est chargée 
                img.onload = () =>{

                    loadedCount++;
                    console.log(`Image ${name} chargée (${loadedCount}/${totalCount})`);
                    
                    // si toutes les img sont chargées : résout la Promise
                    if (loadedCount === totalCount) {
                      
                        Banana.images = images;
                        Banana.imagesLoaded = true;
                        console.log("Toutes les images sont chargées");
                        resolve(images);
                    }
                };
                
                //si une erreur de chargement: rejette la Promise
                img.onerror = () =>{
                    console.error(`Erreur chargement : ${imagesToLoad[name]}`);
                    reject(new Error(`Impossible de charger ${name}`));
                };
                
                img.src = imagesToLoad[name];
                images[name] = img;
            }
        
        });
   
    }
}