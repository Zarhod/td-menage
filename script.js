// Dans script.js (fichier du site web)

// !!! TRÈS IMPORTANT : REMPLACEZ CETTE URL par l'URL de VOTRE Cloudflare Worker !!!
// C'est l'URL que vous avez notée après avoir déployé votre Worker Cloudflare (par exemple, https://menagetd.jassairbus.workers.dev).
const API_BASE_URL = 'https://menage2.jassairbus.workers.dev/'; // <<< C'EST ICI QU'IL FAUT CHANGER !

// Le reste du code de script.js doit rester exactement comme fourni précédemment.
// C'est-à-dire, les fonctions comme fetchFromAppsScript doivent être renommées
// en fetchFromWorker pour éviter toute confusion.
// Et les appels doivent se faire via API_BASE_URL.

// Exemple de correction de fetchFromAppsScript vers fetchFromWorker
async function fetchFromWorker(path, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}/${path}`, options); // <-- Ici, API_BASE_URL est votre WORKER URL

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `Erreur HTTP ${response.status}` }));
            throw new Error(`Erreur serveur (${response.status}): ${errorData.message}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Erreur lors de l'appel à l'API Worker (${path}):`, error);
        throw new Error(`Problème de communication avec le serveur: ${error.message || 'Vérifiez votre connexion.'}`);
    }
}

// Et tous les appels subséquents doivent utiliser fetchFromWorker
async function getTasks() {
    return fetchFromWorker('tasks'); // Appelle votre Worker /tasks
}

async function registerTask(taskId, employeeName) {
    return fetchFromWorker('register', { // Appelle votre Worker /register en POST
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, employeeName })
    });
}

async function getRanking() {
    return fetchFromWorker('ranking'); // Appelle votre Worker /ranking
}
