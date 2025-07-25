document.addEventListener('DOMContentLoaded', () => {
    const tasksListDiv = document.getElementById('tasks-list');
    const signupButton = document.getElementById('signup-button');
    const employeeDialog = document.getElementById('employee-dialog');
    const employeeNameInput = document.getElementById('employee-name-input');
    const submitNameButton = document.getElementById('submit-name-button');
    const cancelNameButton = document.getElementById('cancel-name-button');
    const podiumDiv = document.getElementById('podium');
    const generalRankingList = document.getElementById('general-ranking');

    let selectedTaskId = null;

    // --- Fonctions de simulation d'API (remplacez par votre worker réel) ---
    // Ces fonctions devraient appeler votre worker (https://menagetd.jassairbus.workers.dev/)
    // et gérer les réponses.

    async function fetchTasks() {
        // Simule une requête vers votre worker pour obtenir les tâches
        // Remplacez par : const response = await fetch('https://menagetd.jassairbus.workers.dev/tasks');
        // const tasks = await response.json();
        const tasks = [
            { id: 't1', name: 'Nettoyage des sols', description: 'Passer l\'aspirateur et laver les sols de tous les bureaux.' },
            { id: 't2', name: 'Vider les poubelles', description: 'Vider toutes les poubelles et remplacer les sacs.' },
            { id: 't3', name: 'Nettoyage de la cuisine', description: 'Nettoyer les plans de travail, l\'évier et le micro-ondes.' },
            { id: 't4', name: 'Rangement des fournitures', description: 'Organiser et ranger les fournitures de bureau.' },
            { id: 't5', name: 'Arrosage des plantes', description: 'Arroser toutes les plantes intérieures.' }
        ];
        return tasks;
    }

    async function registerTask(taskId, employeeName) {
        // Simule une requête POST vers votre worker pour inscrire un employé à une tâche
        // Remplacez par :
        // const response = await fetch('https://menagetd.jassairbus.workers.dev/register', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ taskId, employeeName })
        // });
        // return await response.json();
        console.log(`Simulating registration: Task ID ${taskId}, Employee: ${employeeName}`);
        return { success: true, message: `"${employeeName}" inscrit(e) à la tâche ${taskId}` };
    }

    async function fetchRanking() {
        // Simule une requête vers votre worker pour obtenir le classement
        // Remplacez par : const response = await fetch('https://menagetd.jassairbus.workers.dev/ranking');
        // const ranking = await response.json();
        const ranking = [
            { name: 'Alice', score: 120 },
            { name: 'Bob', score: 100 },
            { name: 'Charlie', score: 90 },
            { name: 'David', score: 75 },
            { name: 'Eve', score: 60 }
        ];
        return ranking.sort((a, b) => b.score - a.score); // S'assurer que c'est trié
    }

    // --- Initialisation et Affichage des Tâches ---
    async function loadTasks() {
        tasksListDiv.innerHTML = '<p>Chargement des tâches...</p>';
        try {
            const tasks = await fetchTasks();
            tasksListDiv.innerHTML = ''; // Nettoyer le message de chargement
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
        } catch (error) {
            console.error('Erreur lors du chargement des tâches :', error);
            tasksListDiv.innerHTML = '<p>Impossible de charger les tâches pour le moment. Veuillez réessayer plus tard.</p>';
        }
    }

    function selectTask(taskId, taskElement) {
        // Désélectionner la tâche précédemment sélectionnée
        const currentSelected = document.querySelector('.task-item.selected');
        if (currentSelected) {
            currentSelected.classList.remove('selected');
        }

        // Sélectionner la nouvelle tâche
        taskElement.classList.add('selected');
        selectedTaskId = taskId;
        signupButton.disabled = false; // Activer le bouton d'inscription
    }

    // --- Gestion de la Boîte de Dialogue ---
    signupButton.addEventListener('click', () => {
        if (selectedTaskId) {
            employeeDialog.style.display = 'flex'; // Afficher la boîte de dialogue
            employeeNameInput.value = ''; // Réinitialiser le champ
            employeeNameInput.focus();
        } else {
            alert('Veuillez sélectionner une tâche avant de vous inscrire.');
        }
    });

    submitNameButton.addEventListener('click', async () => {
        const employeeName = employeeNameInput.value.trim();
        if (employeeName) {
            try {
                const result = await registerTask(selectedTaskId, employeeName);
                if (result.success) {
                    alert(`Super ! ${result.message}`);
                    employeeDialog.style.display = 'none'; // Masquer la boîte de dialogue
                    selectedTaskId = null; // Réinitialiser la sélection
                    const currentSelected = document.querySelector('.task-item.selected');
                    if (currentSelected) {
                        currentSelected.classList.remove('selected');
                    }
                    signupButton.disabled = true; // Désactiver le bouton d'inscription
                    loadRanking(); // Recharger le classement après l'inscription
                } else {
                    alert(`Erreur lors de l'inscription : ${result.message}`);
                }
            } catch (error) {
                console.error('Erreur lors de l\'inscription :', error);
                alert('Une erreur est survenue lors de l\'inscription. Veuillez réessayer.');
            }
        } else {
            alert('Veuillez entrer votre nom.');
        }
    });

    cancelNameButton.addEventListener('click', () => {
        employeeDialog.style.display = 'none'; // Masquer la boîte de dialogue
    });

    // --- Affichage du Classement ---
    async function loadRanking() {
        podiumDiv.innerHTML = '<p>Chargement du classement...</p>';
        generalRankingList.innerHTML = '';
        try {
            const ranking = await fetchRanking();

            // Afficher le podium
            podiumDiv.innerHTML = ''; // Nettoyer
            if (ranking.length >= 3) {
                const first = ranking[0];
                const second = ranking[1];
                const third = ranking[2];

                // Ordre visuel du podium: 2ème, 1er, 3ème
                podiumDiv.innerHTML = `
                    <div class="podium-step silver">
                        <span class="podium-rank">2</span>
                        <span class="podium-name">${second.name}</span>
                        <span>${second.score} pts</span>
                    </div>
                    <div class="podium-step gold">
                        <span class="podium-rank">1</span>
                        <span class="podium-name">${first.name}</span>
                        <span>${first.score} pts</span>
                    </div>
                    <div class="podium-step bronze">
                        <span class="podium-rank">3</span>
                        <span class="podium-name">${third.name}</span>
                        <span>${third.score} pts</span>
                    </div>
                `;
            } else if (ranking.length > 0) {
                podiumDiv.innerHTML = '<p>Pas assez de participants pour un podium complet, voici les premiers :</p>';
            } else {
                podiumDiv.innerHTML = '<p>Aucun classement disponible pour le moment.</p>';
            }


            // Afficher le classement général détaillé
            ranking.forEach((entry, index) => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <span>${index + 1}. ${entry.name}</span>
                    <span>${entry.score} points</span>
                `;
                generalRankingList.appendChild(listItem);
            });

        } catch (error) {
            console.error('Erreur lors du chargement du classement :', error);
            podiumDiv.innerHTML = '<p>Impossible de charger le classement pour le moment.</p>';
            generalRankingList.innerHTML = '<p>Erreur de chargement.</p>';
        }
    }

    // --- Lancement initial ---
    loadTasks();
    loadRanking();
});
