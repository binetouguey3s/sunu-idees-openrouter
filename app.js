// ============================================================
// 1. CONFIGURATION SUPABASE
// ============================================================
const supabaseUrl = "https://azeigwyrplqnnkrfxvuw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6ZWlnd3lycGxxbm5rcmZ4dnV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MjkyNzQsImV4cCI6MjA5NjEwNTI3NH0.zjmj8XT2oNJegWzfv20qidpVhgMhp35Zp3FHlsekLN0";

const client = supabase.createClient(supabaseUrl, supabaseAnonKey);


// ============================================================
// 2. UTILITAIRES DOM — Récupération des éléments
// ============================================================
const mur = document.getElementById('mur');
const form = document.getElementById('idee-form');
const inputTitre = document.getElementById('idea-title');
const selectCategorie = document.getElementById('categorie');
const textareaDescription = document.getElementById('description');
const boutonSubmit = form.querySelector('button[type="submit"]');


// ============================================================
// 3. FONCTIONS SUPABASE
// ============================================================

// Récupérer toutes les idées depuis Supabase
async function fetchIdees() {
    const { data, error } = await client
        .from('idees')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Erreur Supabase fetch:', error);
        mur.innerHTML = '<p style="color:red;">Impossible de charger les idées. Vérifie ta connexion.</p>';
        return;
    }

    return data || [];
}

// Ajouter une idée dans Supabase
async function creerIdeeSupabase(idee) {
    const { data, error } = await client
        .from('idees')
        .insert([idee])
        .select()
        .single();

    if (error) {
        console.error('Erreur Supabase insert:', error);
        throw error;
    }

    return data;
}

// Modifier une idée dans Supabase
async function updateIdeeSupabase(id, modifications) {
    const { data, error } = await client
        .from('idees')
        .update(modifications)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Erreur Supabase update:', error);
        throw error;
    }

    return data;
}

// Supprimer une idée dans Supabase
async function supprimerIdeeSupabase(id) {
    const { error } = await client
        .from('idees')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Erreur Supabase delete:', error);
        throw error;
    }
}


// ============================================================
// 4. FONCTIONS OPENROUTER — Appel IA + Nettoyage
// ============================================================

// Appel au proxy Vercel qui contacte OpenRouter
async function appelOpenRouter(titre, description) {
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titre, description })
    });

    const result = await response.json();

    if (!response.ok || result.error) {
        console.error('Erreur OpenRouter proxy:', result.error);
        return null;
    }

    const data = result.data;
    const texte = data?.choices?.[0]?.message?.content || '';
    return texte.trim();
}

// Nettoyer et normaliser la réponse brute de l'IA
function normaliserCategorie(texte) {
    if (!texte || typeof texte !== 'string') return null;

    const propre = texte
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim()
        .toLowerCase();

    if (/pedagogie|pedago|enseignement|education/.test(propre)) return 'Pedagogie';
    if (/evenement|event|celebration/.test(propre)) return 'Evenement';
    if (/vie de campus|campus|etudiant/.test(propre)) return 'Vie de campus';
    if (/amelioration|technique/.test(propre)) return 'Amelioration technique';

    return null;
}


// ============================================================
// 5. FONCTIONS DOM — Affichage des cartes
// ============================================================

// Trouver la classe CSS selon la catégorie
function getCategorieClasse(categorie) {
    switch (categorie) {
        case 'Pedagogie':            return 'cat-pedagogie';
        case 'Evenement':            return 'cat-evenement';
        case 'Vie de campus':        return 'cat-campus';
        case 'Amelioration technique': return 'cat-amelioration';
        default:                     return 'cat-pedagogie';
    }
}

// Créer une carte HTML pour une idée
function creerCarte(idee) {
    const carte = document.createElement('div');
    carte.classList.add('carte', getCategorieClasse(idee.categorie));
    carte.setAttribute('data-id', idee.id);

    carte.innerHTML = `
        <span class="categorie-badge">${idee.categorie}</span>
        <h3>${idee.titre}</h3>
        <p>${idee.description}</p>
        <div class="carte-action">
            <button class="btn-modifier"> Modifier</button>
            <button class="btn-supprimer"> Supprimer</button>
        </div>
    `;

    return carte;
}

// Afficher toutes les idées sur le mur
function afficherIdees(idees) {
    mur.innerHTML = '';

    if (idees.length === 0) {
        mur.innerHTML = '<p style="opacity:0.6;">Aucune idée pour le moment. Sois le premier à proposer !</p>';
        return;
    }

    idees.forEach(idee => {
        const carte = creerCarte(idee);
        mur.appendChild(carte);
    });
}


// ============================================================
// 6. VALIDATION & SANITISATION
// ============================================================

// Supprimer les balises HTML dangereuses
function sanitiser(texte) {
    return texte
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// Valider les champs du formulaire
function validerFormulaire(titre, description, categorie) {
    if (titre.length < 3) {
        alert('Le titre doit contenir au moins 3 caractères.');
        return false;
    }
    if (description.length < 10) {
        alert('La description doit contenir au moins 10 caractères.');
        return false;
    }
    if (!categorie) {
        alert('Veuillez choisir une catégorie.');
        return false;
    }
    return true;
}


// ============================================================
// 7. GESTION DES ÉVÉNEMENTS
// ============================================================

// ---- 7A. Soumission du formulaire ----
form.addEventListener('submit', async function(event) {
    event.preventDefault();

    // Récupérer et sanitiser les valeurs
    const titre = sanitiser(inputTitre.value.trim());
    const description = sanitiser(textareaDescription.value.trim());
    const categorieSelectionnee = selectCategorie.value;

    // Valider
    if (!validerFormulaire(titre, description, categorieSelectionnee)) return;

    // Indicateur de chargement
    const texteOriginal = boutonSubmit.textContent;
    boutonSubmit.disabled = true;
    boutonSubmit.textContent = '⏳ Analyse IA en cours...';

    try {
        // Appel OpenRouter pour catégoriser
        const reponseBrute = await appelOpenRouter(titre, description);
        const categorieIA = normaliserCategorie(reponseBrute);
        const categorieFinale = categorieIA || categorieSelectionnee;

        // Enregistrer dans Supabase
        const nouvelleIdee = { titre, description, categorie: categorieFinale };
        const ideeEnregistree = await creerIdeeSupabase(nouvelleIdee);

        // Mettre à jour le mur
        idees.unshift(ideeEnregistree);
        afficherIdees(idees);
        form.reset();

    } catch (error) {
        console.error('Erreur lors de la soumission:', error);

        // FALLBACK : si OpenRouter OU Supabase échoue sur l'IA,
        // on tente quand même d'enregistrer avec la catégorie choisie
        try {
            const categorieSecours = categorieSelectionnee || 'Amelioration technique';
            const nouvelleIdee = { titre, description, categorie: categorieSecours };
            const ideeEnregistree = await creerIdeeSupabase(nouvelleIdee);
            idees.unshift(ideeEnregistree);
            afficherIdees(idees);
            form.reset();
            alert(`IA indisponible. Idée enregistrée avec la catégorie : ${categorieSecours}`);
        } catch (erreurCritique) {
            console.error('Erreur critique:', erreurCritique);
            alert('Impossible d\'enregistrer l\'idée. Vérifie ta connexion.');
        }

    } finally {
        // Toujours réactiver le bouton
        boutonSubmit.disabled = false;
        boutonSubmit.textContent = texteOriginal;
    }
});


// ---- 7B. Clics sur le mur (délégation d'événements) ----
mur.addEventListener('click', async function(event) {
    const cible = event.target;
    const carte = cible.closest('.carte');
    if (!carte) return;

    const id = parseInt(carte.getAttribute('data-id'));

    // -- Supprimer --
    if (cible.classList.contains('btn-supprimer')) {
        const confirmation = confirm('Supprimer cette idée définitivement ?');
        if (!confirmation) return;

        try {
            await supprimerIdeeSupabase(id);
            idees = idees.filter(idee => idee.id !== id);
            afficherIdees(idees);
        } catch (error) {
            alert('Erreur lors de la suppression. Réessaie.');
        }
    }

    // -- Modifier --
    if (cible.classList.contains('btn-modifier')) {
        const idee = idees.find(i => i.id === id);
        if (!idee) return;

        carte.innerHTML = `
            <span class="categorie-badge">${idee.categorie}</span>
            <input type="text" class="edit-titre" value="${idee.titre}">
            <textarea class="edit-description">${idee.description}</textarea>
            <div class="carte-action">
                <button class="btn-sauvegarder"> Sauvegarder</button>
                <button class="btn-annuler"> Annuler</button>
            </div>
        `;
    }

    // -- Sauvegarder après modification --
    if (cible.classList.contains('btn-sauvegarder')) {
        const nouveauTitre = sanitiser(carte.querySelector('.edit-titre').value.trim());
        const nouvelleDescription = sanitiser(carte.querySelector('.edit-description').value.trim());

        if (nouveauTitre.length < 3 || nouvelleDescription.length < 8) {
            alert('Titre (min 3 car.) et description (min 8 car.) requis.');
            return;
        }

        try {
            await updateIdeeSupabase(id, {
                titre: nouveauTitre,
                description: nouvelleDescription
            });

            idees = idees.map(idee => {
                if (idee.id === id) {
                    return { ...idee, titre: nouveauTitre, description: nouvelleDescription };
                }
                return idee;
            });

            afficherIdees(idees);
        } catch (error) {
            alert('Erreur lors de la mise à jour. Réessaie.');
        }
    }

    // -- Annuler la modification --
    if (cible.classList.contains('btn-annuler')) {
        afficherIdees(idees);
    }
});


// ============================================================
// 8. INITIALISATION — Chargement au démarrage
// ============================================================
let idees = [];

async function init() {
    mur.innerHTML = '<p style="opacity:0.6;">⏳ Chargement des idées...</p>';
    idees = await fetchIdees();
    afficherIdees(idees);
}

init();