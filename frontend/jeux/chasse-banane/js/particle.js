
/**
 * Classe Particle : représente une particule de confetti
 * Gère les particules colorées qui apparaissent lors du clic sur les bananes
 * Chaque particule a une direction aléatoire, subit la gravité et disparaît progressivement
 */
export default class Particle { 

    constructor(x, y, color) {
        this.x = x; //pos x de départ 
        this.y = y; //pos y de départ 
        this.color = color; //couleur de la particule en css 
        

        //direction RANDOM (explose dans toutes les directions)
        //angle aléatoire entre 0 et 2PI (cercle entier)
        const angle = Math.random() * Math.PI * 2; 
        const speed = Math.random() * 3 + 2; //vitesse random entre 2 et 5

        //conversion des angles : vitesse X/Y (trigonométrie)
        this.vx = Math.cos(angle) * speed; //vitesse horizontale
        this.vy = Math.sin(angle) * speed; //vitesse verticale
        
        //PHYSIQUE 
        this.gravity = 0.15; //accélération vers le bas (simule la gravité)
        this.size = Math.random() * 3 + 2; //taille random entre 2 et 5 px
        this.life = 1.0;// opacité (1=opaque, 0 = invisible) durée de vie
        this.decay = Math.random() * 0.02 + 0.015; //vitesse de disparition

        //ROTATION DE LA PARTICULE
        this.rotation = Math.random() * Math.PI * 2;//angle initial random
        this.rotationSpeed = (Math.random() - 0.5) * 0.2; //vitesse de rotation
    }
    
    /**
     * Met à jour la position, rotation et durée de vie de la particule
     * appelée 60 fois par seconde par la game loop
     */
    update(){

        //déplacement
        this.x += this.vx;
        this.y += this.vy;

        //simulation GRAVITÉ: la vitesse verticale augmente
        this.vy += this.gravity;

        //rotation de la particule
        this.rotation += this.rotationSpeed;

        //disparition progressive (diminue l'opacité)
        this.life -= this.decay;
    }
    
 
    /**
     * dessine la particule en forme d'étoiles sur le canvas
     * @param {*} ctx 
     */
    draw(ctx) {
        ctx.save();

        // Applique l'opacité (life va de 1.0 à 0.0)
        ctx.globalAlpha = this.life;

        // Déplace l'origine au centre de la particule
        ctx.translate(this.x, this.y);

        // Applique la rotation
        ctx.rotate(this.rotation);
        
        // Dessine une étoile à 5 branches
        ctx.fillStyle = this.color;
        ctx.beginPath();

        //trace les 5 points de l'étoile
        for (let i = 0; i < 5; i++) {

            // Calcul de l'angle pour chaque pointe
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * this.size;
            const y = Math.sin(angle) * this.size;
            
            if (i === 0) ctx.moveTo(x, y); //premier point
            else ctx.lineTo(x, y); //points suivants 
        }

        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    
    /**
     * Vérifie si la particule est morte (opacité = 0)
     * @returns {boolean} true si la particule doit être supprimée
     */
    isDead() {
        return this.life <= 0;
    }

}