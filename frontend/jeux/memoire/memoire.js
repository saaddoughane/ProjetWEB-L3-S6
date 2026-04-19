
//configuration du jeu 
const MEMORY_SESSION_KEY = "gw_session";

//configuration des 3 niveaux de difficulté
const NIVEAUX = [


    { id: 1, nbPaires: 4,  cols: 4, classe: 'niveau-1' },
    { id: 2, nbPaires: 6,  cols: 4, classe: 'niveau-2' },
    { id: 3, nbPaires: 10, cols: 5, classe: 'niveau-3' }
];

//chargement et configuration des sons 
const sons = {
    flip:     new Audio('./sounds/flip.wav'),
    paire:    new Audio('./sounds/paire.wav'),
    erreur:   new Audio('./sounds/erreur.wav'),
    victoire: new Audio('./sounds/victoire.ogg')
};

sons.flip.volume= 1.0;
sons.paire.volume= 0.7;
sons.erreur.volume= 0.1;
sons.victoire.volume = 1.0;

const IMAGES_CARTES = [

    './images/ours-polaire.png',
    './images/baleine.png',
    './images/elf.png',
    './images/esquimau.png',
    './images/igloo.png',
    './images/otarie.png',
    './images/pine-tree.png',
    './images/poisson.png',
    './images/renne.png',
    './images/pingouin.png'

];


let niveauIndex = 0;           // Niveau actuel (0, 1, ou 2)
let cartesRetournees = [];     // Tableau des 2 cartes retournées
let cartesTrouvees = 0;        // Nombre total de cartes trouvées
let coups = 0;                 // Nombre de coups effectués
let secondes = 0;              // Temps écoulé en secondes
let timerInterval = null;      // Intervalle du chronomètre
let peutCliquer = true;        // Verrou anti-spam (mutex)
let niveauStats = [];          // Statistiques de chaque niveau
let memorySavedLevels = 0;     // Nombre de niveaux deja sauvegardes
let memoryRunSaved = false;    // Score déjà sauvegardé ?
let memoryRunCompleted = false; // Tous les niveaux terminés ?


const pageAccueil   = document.getElementById('pageAccueil');
const pageJeu       = document.getElementById('pageJeu');
const grilleCartes  = document.getElementById('grilleCartes');
const modalVictoire = document.getElementById('modalVictoire');
const modalFin      = document.getElementById('modalFin');

const elNiveau      = document.getElementById('niveauActuel');
const elCoups       = document.getElementById('coups');
const elTemps       = document.getElementById('temps');
const elCoupsFinaux = document.getElementById('coupsFinaux');
const elTempsFinaux = document.getElementById('tempsFinaux');



const musiqueAmbiance = document.getElementById('musiqueAmbiance');

//son musique de fond 
musiqueAmbiance.volume = 0.09; 


//vérification session utilisateur 
let currentUser = null;

try {
    currentUser = JSON.parse(localStorage.getItem(MEMORY_SESSION_KEY) || "null");
} catch {
    currentUser = null;
}

//si pas de session : redirige vers page de connexion 
if (!currentUser) {
    window.location.href = "../../auth.html";
} else {
    bootstrapMemoryGame();
}


/**
 * Fonction principale qui contient toute la logique du jeu
 * démarre après vérification de la session utilisateur 
 */
function bootstrapMemoryGame() {


    function demarrerMusique() {

        musiqueAmbiance.play().catch(err => {
            console.log("La musique nécessite une interaction utilisateur");
        });
    }


    function arreterMusique() {
        musiqueAmbiance.pause();
        musiqueAmbiance.currentTime = 0;
    }

    /**
     * Mélange aléatoirement un tableau (algorithme Fisher-Yates)
     * @param {Array} arr - Tableau à mélanger
     * @returns {Array} Nouveau tableau mélangé
     */
    function melangerTableau(arr) {
        const a = [...arr]; //copie du tableau 
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }


/**
 * Formate le temps en format MM:SS
 * @param {*} s 
 * @returns 
 */    
function formaterTemps(s) {
    return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
}


/**
 * Calcule le score d'un niveau (max 500 points)
 * Formule: bonus niveau + bonus temps - pénalité coups
 * @param {number} niveau - Numéro du niveau (1, 2 ou 3)
 * @param {number} coupsActuels - Nombre de coups effectués
 * @param {number} secondesActuelles - Temps écoulé en secondes
 * @returns {number} Score du niveau (0-500)
 */
function calculerScoreMemoire(niveau, coupsActuels, secondesActuelles) {
    const bonusNiveau = Number(niveau) * 100;
    const bonusTemps = Math.max(0, 200 - Number(secondesActuelles));
    const penalite = Number(coupsActuels) * 5;

    return Math.max(0, Math.min(500, Math.round(bonusNiveau + bonusTemps - penalite)));
}

//réinitialise les statistiques de la partie en cours 
function resetMemoryRun() {
    niveauStats = [];
    memoryRunSaved = false;
    memoryRunCompleted = false;
    memorySavedLevels = 0;
}


/**
 * Enregistre les résultats du niveau actuel 
 * stocke les coups, le temps et score dans niveauStats
 */
function enregistrerResultatNiveau() {
    const niveau = NIVEAUX[niveauIndex].id;

    niveauStats[niveauIndex] = {
        niveau,
        coups,
        temps: secondes,
        score: calculerScoreMemoire(niveau, coups, secondes)
    };
}


/**
 * Construit un résumé de toute la partie (tous les niveaux)
 * @returns 
 */
function construireResumeRun() {
    const niveauxCompletes = niveauStats.filter(Boolean);

    return {
        completedLevels: niveauxCompletes.length,
        niveau: niveauxCompletes.reduce((max, entry) => Math.max(max, Number(entry.niveau || 0)), 0),
        coups: niveauxCompletes.reduce((sum, entry) => sum + Number(entry.coups || 0), 0),
        temps: niveauxCompletes.reduce((sum, entry) => sum + Number(entry.temps || 0), 0),
        score: niveauxCompletes.reduce((sum, entry) => sum + Number(entry.score || 0), 0)
    };
}


/**
 * Sauvegarde le score total si la partie est terminée
 * utilise la fonction saveScore() pour enregistrer dans le systeme global
 * @returns 
 */
function saveMemoryRunIfNeeded() {
    if (memoryRunSaved) return; //déja sauvegardé 
    if (!memoryRunCompleted) return; // pas encore terminé 

    const resume = construireResumeRun();
    if (resume.completedLevels === 0 || resume.score <= 0) return;

    memoryRunSaved = true;

    if (typeof saveScore === "function") {
        saveScore("memory", resume.score, resume);
    }
}


function saveMemoryProgressIfNeeded() {
    const resume = construireResumeRun();
    if (resume.completedLevels === 0 || resume.score <= 0) return;
    if (resume.completedLevels <= memorySavedLevels) return;

    memorySavedLevels = resume.completedLevels;

    if (typeof saveScore === "function") {
        saveScore("memory", resume.score, resume);
    }
}


/**
 * affiche la page d'accueil 
 * cache le jeu et les modales, arrete le timer 
 */
function afficherAccueil() {
    saveMemoryRunIfNeeded();


    pageAccueil.style.display  = 'flex';
    pageJeu.style.display      = 'none';
    modalVictoire.classList.remove('active');
    modalFin.classList.remove('active');
    clearInterval(timerInterval);
}


/**
 * Initialise un niveau
 * - Sélectionne les images selon le nombre de paires
 * - Mélange et crée les cartes dans le DOM
 * - Lance le chronomètre
 * - Réinitialise les compteurs
 * 
 */
function initNiveau() {


    const niv = NIVEAUX[niveauIndex]; 

    //selectionne n paires
    const paires = IMAGES_CARTES.slice(0, niv.nbPaires);
    
    // double + mélange 
    const jeu = melangerTableau([...paires, ...paires]);

    //reinitialisation des variables
    coups = 0;
    secondes = 0;
    cartesTrouvees = 0;
    cartesRetournees = [];
    peutCliquer= true;


    //mise a jour de l'interface 
    elNiveau.textContent = niv.id;
    elCoups.textContent  = '0';
    elTemps.textContent  = '00:00';

    // Afficher page jeu
    pageAccueil.style.display = 'none';
    pageJeu.style.display     = 'flex';
    modalVictoire.classList.remove('active');
    modalFin.classList.remove('active');

    // Construire la grille de cartes 
    grilleCartes.innerHTML = '';
    grilleCartes.className = `grille-cartes ${niv.classe}`;

    //création dynamique de chaque carte 
    jeu.forEach(src => {
        const carte = document.createElement('div');
        carte.classList.add('carte');

        //face avant (dos de la carte)
        const faceAvant = document.createElement('div');
        faceAvant.classList.add('face', 'face-avant');

        //face arrière (image de l'animal)
        const faceArriere = document.createElement('div');
        faceArriere.classList.add('face', 'face-arriere');

        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Animal arctique';
        faceArriere.appendChild(img);

        carte.appendChild(faceAvant);
        carte.appendChild(faceArriere);
        // Stocke l'image dans data-src pour comparaison
        carte.dataset.src = src;

         // Événement de clic
        carte.addEventListener('click', () => clicCarte(carte));
        grilleCartes.appendChild(carte);
    });

    // LANCEMENT DU CHRONOMÈTRE
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {

        secondes++;
        elTemps.textContent = formaterTemps(secondes);
    }, 1000);
}

/**
 * Gère le clic sur une carte
 * - Vérifie le verrou peutCliquer (mutex)
 * - Retourne la carte
 * - Compare les 2 cartes retournées
 * - Valide ou invalide la paire
 */
function clicCarte(carte) {

    if (!peutCliquer) return; //verrou actif : ignore
    if (carte.classList.contains('retournee')) return; //déja retournée : ignore
    if (carte.classList.contains('trouvee')) return; //déja trouvée : ignore 
    if (cartesRetournees.length >= 2) return; //2 cartes déja retournées : ignore 

    //RETOURNE LA CARTE
    carte.classList.add('retournee');
    sons.flip.currentTime = 0;
    sons.flip.play();
    cartesRetournees.push(carte);

    //si 2 cartes retournées : vérification 
    if (cartesRetournees.length === 2) {
        
        coups++;
        elCoups.textContent = coups;
        peutCliquer = false; //verrouille les clics 

        const [c1, c2] = cartesRetournees;

        //COMPARAISON DES IMG
        if (c1.dataset.src === c2.dataset.src) {
            
            //cas PAIRE TROUVEE 
            setTimeout(() => {

                c1.classList.add('trouvee');
                c2.classList.add('trouvee');
                sons.paire.currentTime = 0;
                sons.paire.play();
                cartesTrouvees += 2;
                cartesRetournees = [];
                peutCliquer = true; //dévérouille

                const totalCartes = NIVEAUX[niveauIndex].nbPaires * 2;
               
               //si toutes les paires trouvées : VICTOIRE
                if (cartesTrouvees === totalCartes) {
                    clearInterval(timerInterval);
                    setTimeout(() => afficherVictoire(), 500);
                }

            }, 400);
        } 
        
        else {

            //cas PAS de paire 
            setTimeout(() => {


                sons.erreur.currentTime = 0;
                sons.erreur.play();
                c1.classList.remove('retournee');
                c2.classList.remove('retournee');
                cartesRetournees = [];
                peutCliquer = true; //dévérouille après 1 sec

            }, 1000);
        }
    }


}

document.getElementById('btnMenuModal').addEventListener('click', () => {
    modalVictoire.classList.remove('active');
    afficherAccueil();
});

/**
 * affiche la modale de victoire du niveau 
 * - Enregistre les stats du niveau
 * - Joue le son de victoire
 * - Affiche bouton "Niveau suivant" ou cache si dernier niveau
 */
function afficherVictoire() {
    enregistrerResultatNiveau();
    saveMemoryProgressIfNeeded();

    sons.victoire.currentTime = 0;
    sons.victoire.play();

    document.querySelector('#modalVictoire h2').textContent = `Niveau ${NIVEAUX[niveauIndex].id} réussi ! 🎉`;
    elCoupsFinaux.textContent = coups;
    elTempsFinaux.textContent = formaterTemps(secondes);

    const btnSuivant = document.getElementById('btnSuivant');

    if (niveauIndex < NIVEAUX.length - 1) {

        //il reste encore des niveaux 
        btnSuivant.textContent = `Niveau ${NIVEAUX[niveauIndex].id + 1} →`;
        btnSuivant.style.display = 'block';
    } 
    
    else {
        
        //Dernier niveau terminé 
        btnSuivant.style.display = 'none';
    }

    modalVictoire.classList.add('active');
}



/**
 * Bouton "Jouer" sur la page d'accueil
 * Démarre une nouvelle partie au niveau 1
 */
document.getElementById('btnJouer').addEventListener('click', () => {
    niveauIndex = 0;
    resetMemoryRun();
    demarrerMusique();
    initNiveau();

});

// Titre → retour accueil
document.getElementById('titrePrincipal').addEventListener('click', () => {
    afficherAccueil();
});

// Recommencer : rejoue le niveau actuel 
document.getElementById('btnRecommencer').addEventListener('click', () => {
    initNiveau();
});

// Menu
document.getElementById('btnMenu').addEventListener('click', () => {
    afficherAccueil();
});

// Niveau suivant dans la modale de victoire
//passe au niveau suivant ou affiche la modale de fin
document.getElementById('btnSuivant').addEventListener('click', () => {
    
    if (niveauIndex < NIVEAUX.length - 1) {
        niveauIndex++;
        initNiveau();
    } 
    
    else {

        //tous les niveaux terminés 
        modalVictoire.classList.remove('active');
        memoryRunCompleted = true;
        saveMemoryRunIfNeeded();
        modalFin.classList.add('active');
    }
});

// Rejouer ce niveau
document.getElementById('btnRejouer').addEventListener('click', () => {
    modalVictoire.classList.remove('active');
    initNiveau();
});

// Rejouer depuis le début
document.getElementById('btnDebut').addEventListener('click', () => {
    niveauIndex = 0;
    modalFin.classList.remove('active');
    afficherAccueil();
});

//RACCOURCIS CLAVIER 

/**
 * ESPACE sur l'accueil qui démarre le jeu
 * ESCAPE pendant le jeu pour retour à l'accueil
 */
document.addEventListener('keydown', e => {
    if (e.code === 'Space' && pageAccueil.style.display !== 'none') {
        e.preventDefault();
        niveauIndex = 0;
        resetMemoryRun();
        demarrerMusique();
        initNiveau();
    }
    if (e.code === 'Escape' && pageJeu.style.display !== 'none') {
        afficherAccueil();
    }
});


/**
 * Crée 30 flocons de neige animés
 * Tailles et vitesses aléatoires pour effet naturel
 */
const conteneurNeige = document.getElementById('neige-container');
for (let i = 0; i < 30; i++) {
    const flocon   = document.createElement('div');
    const tailles  = ['petit', 'moyen', 'grand'];
    flocon.classList.add('flocon', tailles[Math.floor(Math.random() * 3)]);
    flocon.textContent = '❄';
    flocon.style.left= `${Math.random() * 100}%`;
    flocon.style.animationDuration = `${6 + Math.random() * 12}s`;
    flocon.style.animationDelay = `${Math.random() * 10}s`;
    conteneurNeige.appendChild(flocon);
}


/**
 * Sauvegarde le score avant de quitter la page
 */
window.addEventListener('beforeunload', saveMemoryRunIfNeeded);
}
