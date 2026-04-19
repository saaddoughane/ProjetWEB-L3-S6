import Banana from './banana.js';
import { initListeners, inputStates } from './handler.js';
import Particle from './particle.js'


let canvas, ctx;
let gameState;
let bananas = [];
let particles = [];

let level, score, lives, bananasClicked, bananasMissed;
let panierImg;

const SESSION_KEY = "gw_session";


//vérification de la session utilisateur 
let session = null;

try {
  session = JSON.parse(localStorage.getItem(SESSION_KEY));
} catch {
  session = null;
}

//si pas de session, redirige vers la page de connexion 
if (!session) {
  window.location.href = "../../auth.html";
} else {
bootstrapBananaGame();
}


/**
 * fonction principale qui contient toute la logique du jeu 
 * démarre après la vérification de la session user 
 * 
 */
function bootstrapBananaGame() {

/* gestion des différents niveaux du jeu demandés 1,2 et 3*/
const LEVEL_CONFIG ={
    1: { bananasToWin: 15, spawnInterval: 1500, maxBananas: 5, speedMultiplier: 1.0 },
    2: { bananasToWin: 20, spawnInterval: 1200, maxBananas: 7, speedMultiplier: 1.3 },
    3: { bananasToWin: 25, spawnInterval: 1000, maxBananas: 9, speedMultiplier: 1.6 }
};

let lastSpawnTime = 0;
let currentTime = 0;
let hiScores = [];


window.onload = init; //initialisation lorsque la page charge


/**
 * 
 * Initialise le jeu au chargement de la page 
 * Charge les images de manière asynchrone puis démarre
 */
async function init() {
    canvas = document.querySelector("#canvas");
    ctx = canvas.getContext("2d");

    //son de fond d'ambiance jeu
    const backgSound = new Audio('./assets/sounds/backg-sound.mp3');
    backgSound.loop = true;
    backgSound.volume = 0.1;

    // le son de fond démarre au premier clic/touche du joueur 
    document.addEventListener('click',() => {
        backgSound.play();
    }, { once:true }); //se déclenche une seule fois
    
    //charge les scores sauvegardes + active controles souris clavier
    loadHiScores();
    initListeners(canvas);
    
    try {
        //attend que toutes les images soient chargées
        await loadMenuImages();
        await Banana.loadImages();
    
        startGame();

    } 
    
    catch (error) {//lance quand même le jeu
        startGame();

    }
}

/**
 * Charge l'image du panier de manière asynchrone
 * @returns Promise qui se résout quand l'image est prête
 * 
 */
function loadMenuImages() {

    return new Promise((resolve, reject) => {
        let loadedCount = 0;
        const totalImages = 1;
        
        panierImg = new Image();
        
        const onImageLoad = () => {
            loadedCount++;
           
            if (loadedCount === totalImages) {
                resolve();
            }
        };
        
        const onImageError = (e) => {
           
            reject(e);
        };
        
        panierImg.onload = onImageLoad;
        panierImg.onerror = onImageError;
        panierImg.src = './assets/panier0.png';
        
    });
}

//fonction pour démarrer une nouvelle partie 
//réinitialise tous les compteurs et lance la game loop 

function startGame() {
    gameState = "MENU";
    level = 1;
    score = 0;
    lives = 3;

    bananas = [];
    particles = [];
    bananasClicked = 0;
    bananasMissed = 0;
    lastSpawnTime = currentTime;
    
    updatePanierHTML(0);
    
    requestAnimationFrame(gameLoop);
}


/**
 * boucle principale du jeu (appelée 60x/ sec)
 * gère les différents états du jeu et appelle les fonctions appropriées 
 * 
 * @param {*} time 
 */
function gameLoop(time){

    currentTime = time;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    switch(gameState) {

        case "MENU":
            drawMenu();
            updateMenu();
            break;

        case "PLAYING":
            drawGame();
            updateGame(time);
            break;

        case "LEVEL_COMPLETE":
            drawLevelComplete();
            updateLevelComplete();
            break;

        case "GAME_OVER":
            drawGameOver();
            updateGameOver();
            break;


        case "HI_SCORES":
            drawHiScores();
            updateHiScores();
            break;

        case "VICTORY":
            drawVictory();
            updateVictory();
            break;
                
    }
    
    requestAnimationFrame(gameLoop);
}


/**
 * Met à jour la logique du menu
 * Détecte les inputs pour démarrer ou voir les scores
 */
function updateMenu() {


    if (inputStates.space || inputStates.mouseClicked) {
        inputStates.space = false;
        inputStates.mouseClicked = false;
        initLevel(1);

        gameState = "PLAYING";
        showPanier();
    }

    if (inputStates.escape){ //ouvre écran des scores du jeu

        inputStates.escape = false;
        gameState = "HI_SCORES";

    }
}

/**
 * Met à jour la logique du jeu pendant la partie 
 * Génère les bananes, gère les collisions et vérifie l'objectif 
 * 
 * @param {} time 
 */
function updateGame(time) {

    const config = LEVEL_CONFIG[level];
    
    /* permet de générer des nouvelles bananes*/
    if (bananas.length < config.maxBananas) {

        if (time - lastSpawnTime > config.spawnInterval) {
            
            spawnBanana(config.speedMultiplier);
            lastSpawnTime = time;
        }
    }
    
    //met à jour toutes les bananes 
    for (let i = bananas.length - 1; i >= 0; i--) {
        let banana = bananas[i];
        banana.update();
        
        //si l'on rate la banane ça entraine des pénalités
        if (banana.isOutOfScreen(canvas.height)) {
            bananas.splice(i, 1);
            bananasMissed++;
            
            //perd 1 vie toutes les 5 bananes ratées 
            if (bananasMissed % 5 === 0 && bananasMissed > 0) {
                lives--;
                
                
                if (lives <= 0) {
                    saveHiScore(score);
                    saveScore("banana", score);
                    gameState = "GAME_OVER";
                    hidePanier();
                }
            }
        }
    }
    
    //met à jour toutes les particules 

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();

        if (particles[i].isDead()) {

            particles.splice(i, 1);
        }
    }
    
    //vérifie les clics sur les bananes 
    if (inputStates.mouseClicked) {
        inputStates.mouseClicked = false;
        checkBananaClick(inputStates.mouseX, inputStates.mouseY);
    }
    
    //permet de voir si l'objectif de ce niveau a été atteint
    if (bananasClicked >= config.bananasToWin) {
        score += level * 500;
        gameState = "LEVEL_COMPLETE";
        hidePanier();
    }
}


/**
 * Met à jour la logique de l'écran de niveau terminé
 * passe au niveau suivant ou affiche la victoire 
 */
function updateLevelComplete() {
    if (inputStates.space) {
        inputStates.space = false;

        if (level < 3) {
            level++;

            initLevel(level);
            gameState = "PLAYING";
            showPanier();
        } 
        
        else {
            saveHiScore(score);
            saveScore("banana", score)
            gameState= "VICTORY";
        }
    }
}


/**
 * met à jour la logique de l'écran game over
 * permet de rejouer / voir les scores
 */
function updateGameOver() {
    if (inputStates.space) {
        inputStates.space = false;

        startGame();
    }

    if (inputStates.escape) {
        inputStates.escape = false;
        gameState = "HI_SCORES";
    }
}


/**
 * met à jour la logique de l'écran des meilleurs scores
 * retour au menu sur ESP ou ESC
 */
function updateHiScores() {
    if (inputStates.space || inputStates.escape) {
        inputStates.space = false;
        inputStates.escape = false;
        gameState = "MENU";

    }
}

/**
 * initialise un niveau 
 * réinitialise les tableaux et compteurs pour le nouveau niveau 
 * @param {*} levelNumber 
 */
function initLevel(levelNumber) {
   
    bananas = [];
    bananasClicked = 0;
    bananasMissed = 0;

    lastSpawnTime =currentTime;
    updatePanierHTML(0);
}

/* fonction qui génère une banane de manière aléatoire
    avec type et position

    Applique le multiplicateur de vitesse du niveau
*/ 

function spawnBanana(speedMultiplier) {
    const x = Math.random() * (canvas.width - 60) + 30;
    const y = -50;
    
    let type;
    const random = Math.random();

    //probabilité d'apparition des types de fruits 

    if (random < 0.4) type = 'yellow'; //banane jaune 40%
    
    else if (random < 0.7) type = 'green';//banane verte 30%
    else if (random < 0.9) type = 'bunch'; //mix de bananes 20%
    else type = 'pineapple';//ananas 10%
    
    const banana = new Banana(x, y, type);
    banana.speedY *= speedMultiplier;
    bananas.push(banana);

}

/* fonction qui vérifie si une banane a bien été cliquée*/ 
/* utilise la méthode containsPoint() de la classe Banana */
function checkBananaClick(mouseX, mouseY) {

    for (let i = bananas.length - 1; i >= 0; i--) {
        let banana = bananas[i];
        
        if (banana.containsPoint(mouseX, mouseY)) {
            score += banana.points;
            bananasClicked++;

            playPop();
            console.log("+" + banana.points + " pts ! Total: " + score);
            
            createParticleExplosion(banana.x, banana.y, banana.type);//explosion 
            updatePanierHTML(bananasClicked);
            
            bananas.splice(i, 1);
            break;
        }
    }
}

/**
 * Créer une explosion de particules quand fruit cliqué
 * @param {*} x 
 * @param {*} y 
 * @param {*} type 
 */
/* selon le type de fruit, l'animation des fruits diffèrent */ 

function createParticleExplosion(x, y, type) {
    let colors = [];

    switch(type) {
        case 'yellow': // pour la banane jaune, les couleurs des particules thème jaune
            colors = ['#FFDF64', '#FFF8DC', '#FFD700'];
            break;

        case 'green':// pour la banane verte, les couleurs des particules thème vert
            colors = ['#CDE77F', '#E6F8B2', '#9BC53D'];
            break;

        case 'bunch': // pour la banane jaune, les couleurs des particules thème jaune
            colors = ['#FFDF64', '#CDE77F', '#FFE97F'];
            break;

        case 'pineapple':
            colors = ['#FFD700', '#FFA500', '#FFDF64'];
            break;

    }
    
    const particleCount = Math.floor(Math.random() * 8) + 12;
    for (let i = 0; i < particleCount; i++) {
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push(new Particle(x, y, color));
    }
}


/**
 * Met à jour l'image du panier selon le nb de bananes attrapées
 * le panier se remplit petit à petit (panier0 à panier4)
 * @param {*} count 
 * @returns 
 */
function updatePanierHTML(count) {
    const panierElement = document.getElementById('panier-img');
   
    if (!panierElement) return;
    
    const config = LEVEL_CONFIG[level];
    const totalNeeded = config.bananasToWin;
    const percentage = count / totalNeeded;
    
    let panierIndex = 0;
    if (percentage >= 0.8) panierIndex = 4;

    else if (percentage >= 0.6) panierIndex = 3;
    else if (percentage >= 0.4) panierIndex = 2;
    else if (percentage >= 0.2) panierIndex = 1;
    
    panierElement.src = `./assets/panier${panierIndex}.png`;
}

//affiche le panier avec classe CSS "visible"
function showPanier() {
    const container = document.querySelector('.panier-container');
    
    if (container) container.classList.add('visible');
}

//cache le panier en retirant la classe CSS "visible"
function hidePanier() {
    const container = document.querySelector('.panier-container');
    if (container) container.classList.remove('visible');
}

/**
 * Dessine l'écran du menu principal 
 */
function drawMenu() {
    ctx.save();
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "#2D5016";
    ctx.font = "bold 36px Fredoka, Montserrat";
    ctx.textAlign = "center";
    ctx.fillText("Aide le singe à se nourrir de fruits", canvas.width / 2, 50);
    ctx.fillText("en les ciblant !", canvas.width / 2, 90);
    

    if (panierImg && panierImg.complete) {
        const panierSize = 250; 
        const panierX = canvas.width / 2 - panierSize / 2;
        const panierY = 110;
        ctx.drawImage(panierImg, panierX, panierY, panierSize, panierSize);
      
    } 
    
    else {

        console.warn(" image panier pas chargée");
    }
    
    
    const buttonY = 390;
    const buttonWidth = 200; 

    const buttonHeight = 60; 
    const buttonX = canvas.width/ 2 - buttonWidth / 2;
    
   
    const gradient = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight);
    gradient.addColorStop(0, 'rgba(255, 223, 100, 0.95)');
    gradient.addColorStop(1, 'rgba(255, 223, 100, 0.75)');
   
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 30);
    ctx.fill();
    

    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth= 2;
    ctx.beginPath();

    ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 30);
    ctx.stroke();
    

    ctx.fillStyle = "#2D5016";
    ctx.font = "bold 28px Fredoka, Montserrat";
    ctx.textAlign = "center";
    ctx.fillText("Jouer", canvas.width / 2, buttonY + 38);
    

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "500 16px Fredoka, Montserrat";
    ctx.fillText("ESPACE / Clic - Jouer  •  ESC - Meilleurs Scores", canvas.width / 2, 550);
    
    
    ctx.restore();
}

/**
 * Dessine l'écran de jeu (bananes, particules, HUD)
 */
function drawGame() {
    ctx.save();
    bananas.forEach(banana => banana.draw(ctx));
    particles.forEach(particle => particle.draw(ctx));
    drawHUD();

    ctx.restore();
}


/**
 * Dessine l'interface de jeu de haut avec la barre contenant :
 * les scores, niveaux, vie, objectif 
 */

function drawHUD() {
    ctx.save();
    
    ctx.fillStyle = "rgba(112, 78, 46, 0.85)";
    ctx.fillRect(0, 0, canvas.width, 50);
    
    ctx.fillStyle = "#E6F8B2";
    ctx.font = "bold 20px Fredoka, Montserrat";
    
    const config = LEVEL_CONFIG[level];
    

    const zone1 = canvas.width * 0.125;  // 12.5% (1/8)
    const zone2 = canvas.width * 0.375;  // 37.5% (3/8)
    const zone3 = canvas.width * 0.625;  // 62.5% (5/8)
    const zone4 = canvas.width * 0.875;  // 87.5% (7/8)
    
    ctx.textAlign = "center";
    ctx.fillText("Score: " + score, zone1, 32);
    ctx.fillText("Niveau: " + level, zone2, 32);
    ctx.fillText("Vies: " + lives, zone3, 32);
    ctx.fillText("Objectif: " + bananasClicked + "/" + config.bananasToWin, zone4, 32);
    
    ctx.restore();

}

/**
 * Dessine l'écran de niveau terminé 
 */
function drawLevelComplete() {
    ctx.save();
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cardX = 100;
    const cardY = 150;
    const cardW = canvas.width - 200;
    const cardH = 350;
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 30);
    ctx.fill();
    
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 30);
    ctx.stroke();
    
    ctx.fillStyle = "#FFDF64";
    ctx.font = "bold 56px Fredoka, Montserrat";
    ctx.textAlign = "center";
    ctx.fillText("NIVEAU " + level + " TERMINÉ !", canvas.width / 2, 230);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "500 30px Fredoka, Montserrat";
    ctx.fillText("Score : " + score, canvas.width / 2, 300);
    ctx.fillText("Bananes : " + bananasClicked, canvas.width / 2, 345);
    
    if (level < 3) {
        
        ctx.font = "500 24px Fredoka, Montserrat";
        ctx.fillStyle = "#CDE77F";
        ctx.fillText("Niveau suivant : " + (level + 1), canvas.width / 2, 400);
        
        const btnY = 440;
        const btnW = 280;
        const btnH = 50;
        const btnX = canvas.width / 2 - btnW / 2;
        
        ctx.fillStyle = "rgba(255, 223, 100, 0.9)";
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 25);
        ctx.fill();
        
        ctx.fillStyle = "#2D5016";
        ctx.font = "bold 20px Fredoka, Montserrat";
        ctx.fillText("ESPACE - Continuer", canvas.width / 2, btnY + 32);
    } 
    
    else {
        ctx.fillStyle = "#CDE77F";
        ctx.font = "500 24px Fredoka, Montserrat";
        ctx.fillText("Appuyez sur ESPACE", canvas.width / 2, 430);
    }
    
    ctx.restore();
}

/**
 * Dessine l'écran game over 
 */
function drawGameOver() {
    ctx.save();
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cardX = 80;
    const cardY = 120;
    const cardW = canvas.width - 160;
    const cardH = 400;
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 30);
    ctx.fill();
    
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 30);
    ctx.stroke();
    
    ctx.fillStyle = "#FF6B6B";
    ctx.font = "bold 64px Fredoka, Montserrat";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, 200);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "500 28px Fredoka, Montserrat";
    ctx.fillText("Score Final : " + score, canvas.width / 2, 270);
    ctx.fillText("Niveau Atteint : " + level, canvas.width / 2, 320);
    ctx.fillText("Bananes : " + bananasClicked, canvas.width / 2, 370);
    
    const btn1Y = 430;
    const btnW = 240;
    const btnH = 45;
    const btnX = canvas.width / 2 - btnW / 2;
    
    ctx.fillStyle = "rgba(255, 223, 100, 0.9)";
    ctx.beginPath();
    ctx.roundRect(btnX, btn1Y, btnW, btnH, 25);
    ctx.fill();
    
    ctx.fillStyle = "#2D5016";
    ctx.font = "bold 20px Fredoka, Montserrat";
    ctx.fillText("ESPACE - Rejouer", canvas.width / 2, btn1Y + 28);
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "500 16px Fredoka, Montserrat";
    ctx.fillText("ESC - Meilleurs Scores", canvas.width / 2, 495);
    
    ctx.restore();
}

/**
 * Dessine l'écran des meilleurs scores
 */
function drawHiScores() {
    ctx.save();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(45, 80, 22, 0.9)');
    gradient.addColorStop(1, 'rgba(45, 80, 22, 0.7)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "#FFDF64";
    ctx.font = "bold 52px Fredoka, Montserrat";
    ctx.textAlign = "center";
    ctx.fillText("🏆 MEILLEURS SCORES", canvas.width / 2, 100);
    
    const cardX = 100;
    const cardY = 140;
    const cardW = canvas.width - 200;
    const cardH = 360;
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 25);
    ctx.fill();
    
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 25);
    ctx.stroke();
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "500 24px Fredoka, Montserrat";
    
    if (hiScores.length === 0) {
        ctx.fillText("Aucun score enregistré", canvas.width / 2, 320);
    } 
    
    else {
        hiScores.forEach((scoreData, index) => {
            const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
            const medal = medals[index] || (index + 1) + "e";
            const text = medal + "  " + scoreData.score + " pts - " + scoreData.date;
            
           
            ctx.fillStyle = index % 2 === 0 ? "#FFFFFF" : "rgba(255, 223, 100, 0.9)";
            ctx.fillText(text, canvas.width / 2, 200 + (index * 55));
        });

    }
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "500 18px Fredoka, Montserrat";
    ctx.fillText("Appuyez sur ESPACE pour rejouer", canvas.width / 2, 560);
    
    ctx.restore();
}

/**
 * Charge les meilleurs scores depuis localStorage
 */
function loadHiScores() {
    const saved = localStorage.getItem('chasseAmazonienneHiScores');
   
    if (saved) {
        hiScores = JSON.parse(saved);
    }
}

/**
 * Sauvegarde un nouveau score dans les meilleurs scores
 * garde seulement les 5 meilleurs 
 * @param {*} newScore 
 */
function saveHiScore(newScore) {
    const date = new Date().toLocaleDateString('fr-FR');
    hiScores.push({ score: newScore, date: date });
  
    hiScores.sort((a, b) => b.score - a.score);
    hiScores = hiScores.slice(0, 5);
    localStorage.setItem('chasseAmazonienneHiScores', JSON.stringify(hiScores));
}

/**
 * dessine l'écran de victoire totale (tous les niveaux terminés)
 */
function drawVictory() {

    ctx.save();
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#FFDF64";
    ctx.font = "bold 64px Fredoka, Montserrat";
    ctx.textAlign = "center";
    ctx.fillText("VICTOIRE TOTALE !", canvas.width / 2, 200);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "500 28px Fredoka, Montserrat";
    ctx.fillText("Score Final : " + score, canvas.width / 2, 280);
    ctx.fillText("Bananes : " + bananasClicked, canvas.width / 2, 330);

    ctx.fillStyle = "#CDE77F";
    ctx.font = "500 24px Fredoka, Montserrat";
    ctx.fillText("Appuyez sur ESPACE pour revenir au menu", canvas.width / 2, 400);

    ctx.restore();
}

/**
 * Met à jour la logique de l'écran de victoire
 */
function updateVictory() {
    if (inputStates.space) {
        inputStates.space = false;
        startGame(); 
    }
}

//permet de mettre le son pop quand une banane est attrapée
function playPop() {
    const pop = new Audio('./assets/sounds/pop-sound.mp3');
    pop.volume = 0.6;
    pop.play();
}
}
