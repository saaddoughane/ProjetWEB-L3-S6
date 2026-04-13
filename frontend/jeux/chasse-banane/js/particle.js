export default class Particle { /* gere les particules qui apparaissent lors du clic sur bananes*/

    constructor(x, y, color) {
        this.x = x;

        this.y = y;
        this.color = color;
        
        const angle = Math.random() * Math.PI * 2; //direction + vitesse random
        const speed = Math.random() * 3 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.gravity = 0.15;
        this.size = Math.random() * 3 + 2;
        this.life = 1.0;// durée de vie

        this.decay = Math.random() * 0.02 + 0.015;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }
    
    update(){

        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.rotation += this.rotationSpeed;
        this.life -= this.decay;
    }
    
    /* permet de dessiner la particule sur le canvas*/ 

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = this.color;
        ctx.beginPath();

        for (let i = 0; i < 5; i++) {

            //dessine la forme étoile
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * this.size;
            const y = Math.sin(angle) * this.size;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    
    isDead() {
        return this.life <= 0;
    }

}