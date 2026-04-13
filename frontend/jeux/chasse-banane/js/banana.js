
export default class Banana {
   
    static images = null;
    static imagesLoaded = false;

    constructor(x, y, type = 'yellow') {
        this.x = x;
        this.y = y;
        this.type = type;
        

        this.setPropertiesByType();
        
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = 0.02;
        
        this.speedY = this.baseSpeed;
    }

    setPropertiesByType() {
        switch(this.type) {

            case 'yellow':
                this.width = 60;
                this.height = 90;
                this.imageName = 'banana';
                this.points = 50;
                this.baseSpeed = 1.5;

                break;
                
            case 'green':

                this.width = 55;
                this.height = 85;
                this.imageName = 'greenBanana';
                this.points = 100;
                this.baseSpeed = 2.5;

                break;
                
            case 'bunch':

                this.width = 75;
                this.height = 68;
                this.imageName = 'twoBananas';
                this.points = 200;
                this.baseSpeed = 3.5;

                break;
                
            case 'pineapple':
                this.width = 70;
                this.height = 65;
                this.imageName = 'pineapple';
                this.points = 500;
                this.baseSpeed = 4.5;
                break;
                
            default:

                this.width = 60;
                this.height = 90;
                this.imageName = 'banana';
                this.points = 50;
                this.baseSpeed = 1.5;

        }
    }

    // 1. save() 2. translate() 3. rotate() 4. dessiner en 0,0 5. restore()
    draw(ctx) {
        
        if (!Banana.images || !Banana.images[this.imageName]) {
            console.warn("les images ne sont pas encore chargées");
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);
    
        ctx.rotate(this.angle);
        
        ctx.drawImage(
            Banana.images[this.imageName],

            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height

        );
        
        ctx.restore(); 
    }

    update() {

        this.y += this.speedY;
        this.angle += this.rotationSpeed;
    }

    isOutOfScreen(canvasHeight) {
        return this.y - this.height / 2 > canvasHeight + 50;
    }

   
    containsPoint(x, y) {

        if(this.type === 'pineapple'){
            const radius= Math.max(this.width, this.height)/ 2 +5;

            const dx= x -this.x;
            const dy= y -this.y;

            return (dx*dx+ dy* dy) <= (radius* radius)
        }
        const halfWidth = this.width / 2+ 10;
        const halfHeight = this.height / 2 + 10;
        
        return (

            x >= this.x - halfWidth &&
            x <= this.x + halfWidth &&
            y >= this.y - halfHeight &&
            y <= this.y + halfHeight
        );
    }

    
    static async loadImages() {
       
 
        return new Promise((resolve, reject) => {
            
            const imagesToLoad = {

                banana: './assets/banana.png',
                greenBanana: './assets/green-banana.png',
                twoBananas: './assets/two-bananas.png',
                pineapple: './assets/ananas.png'
            };

            const images = {};
            let loadedCount = 0;
            const totalCount = Object.keys(imagesToLoad).length;

            for (let name in imagesToLoad) {
                const img = new Image();
                
                img.onload = () =>{

                    loadedCount++;
                    console.log(`Image ${name} chargée (${loadedCount}/${totalCount})`);
                    
                    if (loadedCount === totalCount) {
                      
                        Banana.images = images;
                        Banana.imagesLoaded = true;
                        console.log("Toutes les images sont chargées");
                        resolve(images);
                    }
                };
                
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