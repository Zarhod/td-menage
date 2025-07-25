document.addEventListener('DOMContentLoaded', () => {
    // --- Éléments du DOM ---
    const tasksListDiv = document.getElementById('tasks-list');
    const signupButton = document.getElementById('signup-button');
    const employeeModal = document.getElementById('employee-modal');
    const closeButton = employeeModal.querySelector('.close-button');
    const employeeNameInput = document.getElementById('employee-name-input');
    const submitNameButton = document.getElementById('submit-name-button');
    const podiumDiv = document.getElementById('podium');
    const generalRankingList = document.getElementById('general-ranking-list');

    let selectedTaskId = null; // Stocke l'ID de la tâche sélectionnée

    // --- Configuration de l'API Apps Script ---
    // !!! TRÈS IMPORTANT : REMPLACEZ CETTE URL par l'URL de votre déploiement Apps Script !!!
    // Exemple : 'https://script.google.com/macros/s/AKfycbu_VotreIdentifiantUniqueAppsScript/exec'
    const APPS_SCRIPT_WEB_APP_URL = 'https://menage2.jassairbus.workers.dev'; // <<< À MODIFIER !

    // --- Fonctions d'interaction avec l'Apps Script ---
    async function fetchFromAppsScript(path, options = {}) {
        try {
            // L'Apps Script utilise un paramètre 'path' pour router les requêtes
            const response = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?path=${path}`, options);
            
            // Si la réponse n'est pas OK, tente de lire un message d'erreur JSON
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Erreur HTTP ${response.status}` }));
                throw new Error(`Erreur serveur (${response.status}): ${errorData.message}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Erreur lors de l'appel à l'API Apps Script (${path}):`, error);
            // Propage l'erreur pour un affichage utilisateur
            throw new Error(`Problème de communication avec le serveur: ${error.message || 'Vérifiez votre connexion.'}`);
        }
    }

    async function getTasks() {
        return fetchFromAppsScript('tasks');
    }

    async function registerTask(taskId, employeeName) {
        return fetchFromAppsScript('register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId, employeeName })
        });
    }

    async function getRanking() {
        return fetchFromAppsScript('ranking');
    }

    // --- Fonctions de gestion de l'UI ---

    // Affiche les tâches dans l'interface
    async function displayTasks() {
        tasksListDiv.innerHTML = '<p class="message loading-message"><i class="fas fa-spinner fa-spin"></i> Chargement des missions...</p>';
        try {
            const tasks = await getTasks();
            tasksListDiv.innerHTML = ''; // Nettoyer le message de chargement
            if (tasks && tasks.length > 0) {
                tasks.forEach(task => {
                    const taskItem = document.createElement('div');
                    taskItem.classList.add('task-item');
                    taskItem.dataset.taskId = task.id;
                    taskItem.innerHTML = `
                        <h3>${task.name}</h3>
                        <p>${task.description}</p>
                    `;
                    taskItem.addEventListener('click', () => selectTask(task.id, taskItem));
                    tasksListDiv.appendChild(taskItem);
                });
            } else {
                tasksListDiv.innerHTML = '<p class="message"><i class="fas fa-info-circle"></i> Aucune mission disponible pour le moment. Revenez vite !</p>';
            }
        } catch (error) {
            tasksListDiv.innerHTML = `<p class="message error-message"><i class="fas fa-exclamation-triangle"></i> Oups ! ${error.message}</p>`;
            console.error('Erreur lors de l\'affichage des tâches:', error);
        }
    }

    // Gère la sélection d'une tâche
    function selectTask(taskId, taskElement) {
        const currentSelected = document.querySelector('.task-item.selected');
        if (currentSelected) {
            currentSelected.classList.remove('selected');
        }

        taskElement.classList.add('selected');
        selectedTaskId = taskId;
        signupButton.disabled = false; // Active le bouton
    }

    // Ouvre la modale
    function openModal() {
        employeeModal.classList.add('is-open');
        employeeNameInput.value = '';
        employeeNameInput.focus();
    }

    // Ferme la modale
    function closeModal() {
        employeeModal.classList.remove('is-open');
    }

    // Gère l'inscription
    async function handleSignup() {
        const employeeName = employeeNameInput.value.trim();
        if (!employeeName) {
            alert('Veuillez entrer votre nom !');
            return;
        }

        // Désactive les boutons pendant l'envoi pour éviter les clics multiples
        submitNameButton.disabled = true;
        signupButton.disabled = true;
        employeeNameInput.disabled = true;
        submitNameButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription...';

        try {
            const result = await registerTask(selectedTaskId, employeeName);
            if (result.success) {
                alert(`🎉 Bravo, ${employeeName} ! ${result.message}`);
                closeModal();
                selectedTaskId = null; // Réinitialise la sélection
                const currentSelected = document.querySelector('.task-item.selected');
                if (currentSelected) {
                    currentSelected.classList.remove('selected');
                }
                signupButton.disabled = true;
                displayRanking(); // Actualise le classement
            } else {
                alert(`Désolé, échec de l'inscription : ${result.message || 'Veuillez réessayer.'}`);
            }
        } catch (error) {
            alert(`Une erreur est survenue : ${error.message}`);
            console.error('Erreur lors de l\'inscription:', error);
        } finally {
            // Réactive les boutons et le champ
            submitNameButton.disabled = false;
            signupButton.disabled = false;
            employeeNameInput.disabled = false;
            submitNameButton.innerHTML = '<i class="fas fa-check-circle"></i> Valider mon inscription';
        }
    }

    // Affiche le classement et le podium
    async function displayRanking() {
        podiumDiv.innerHTML = '<p class="message loading-message"><i class="fas fa-spinner fa-spin"></i> Calcul du classement...</p>';
        generalRankingList.innerHTML = '';
        try {
            const ranking = await getRanking();

            podiumDiv.innerHTML = ''; // Nettoyer
            if (ranking && ranking.length > 0) {
                // Afficher le podium (2e, 1er, 3e)
                const first = ranking[0];
                const second = ranking[1] || null;
                const third = ranking[2] || null;

                if (second) {
                    podiumDiv.innerHTML += `
                        <div class="podium-step silver">
                            <span class="podium-rank">2</span>
                            <span class="podium-name">${second.name}</span>
                            <span class="podium-score">${second.score} pts</span>
                        </div>
                    `;
                }
                if (first) {
                    podiumDiv.innerHTML += `
                        <div class="podium-step gold">
                            <span class="podium-rank">1</span>
                            <span class="podium-name">${first.name}</span>
                            <span class="podium-score">${first.score} pts</span>
                        </div>
                    `;
                }
                if (third) {
                    podiumDiv.innerHTML += `
                        <div class="podium-step bronze">
                            <span class="podium-rank">3</span>
                            <span class="podium-name">${third.name}</span>
                            <span class="podium-score">${third.score} pts</span>
                        </div>
                    `;
                }

                // Afficher le classement détaillé
                ranking.forEach((entry, index) => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <span><i class="fas fa-medal rank-icon"></i> ${index + 1}. ${entry.name}</span>
                        <span>${entry.score} points</span>
                    `;
                    generalRankingList.appendChild(listItem);
                });
            } else {
                podiumDiv.innerHTML = '<p class="message"><i class="fas fa-info-circle"></i> Pas encore de classement ! Soyez le premier à vous lancer !</p>';
                generalRankingList.innerHTML = '';
            }

        } catch (error) {
            podiumDiv.innerHTML = `<p class="message error-message"><i class="fas fa-exclamation-triangle"></i> Erreur au classement : ${error.message}</p>`;
            generalRankingList.innerHTML = '';
            console.error('Erreur lors de l\'affichage du classement:', error);
        }
    }

    // --- Écouteurs d'événements ---
    signupButton.addEventListener('click', openModal);
    closeButton.addEventListener('click', closeModal);
    employeeModal.addEventListener('click', (event) => { // Fermer la modale si on clique en dehors
        if (event.target === employeeModal) {
            closeModal();
        }
    });
    submitNameButton.addEventListener('click', handleSignup);
    employeeNameInput.addEventListener('keypress', (event) => { // Envoyer avec "Entrée"
        if (event.key === 'Enter') {
            handleSignup();
        }
    });

    // --- Initialisation de l'application ---
    displayTasks();
    displayRanking();
});
