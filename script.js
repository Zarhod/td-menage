// script.js

// Remplacez cette URL par l'URL de votre Cloudflare Worker.
const API_URL = "https://menagetd.jassairbus.workers.dev/"; 

const { useState, useEffect, useCallback } = React;

// --- Composant Tâche ---
function Task({ task, members, onTaskUpdated }) {
    const [selectedMember, setSelectedMember] = useState('');
    const [isAssigning, setIsAssigning] = useState(false); // État pour désactiver le bouton pendant l'assignation
    // État pour gérer la visibilité de la section d'assignation (sélecteur + boutons)
    const [showAssignSection, setShowAssignSection] = useState(false); 

    const handleAssignTask = useCallback(async () => {
        if (!selectedMember || isAssigning) return; // Empêche l'assignation si pas de membre ou déjà en cours

        setIsAssigning(true); // Désactive le bouton "Prendre la tâche" et "Annuler"
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    taskId: task.ID,
                    responsible: selectedMember,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('Tâche assignée avec succès:', data);
            alert(data.message || 'Tâche assignée !');
            setSelectedMember(''); // Réinitialiser la sélection
            setShowAssignSection(false); // Masquer la section après l'assignation
            onTaskUpdated(); // Demander le rafraîchissement des données
        } catch (error) {
            console.error('Erreur lors de l\'assignation de la tâche:', error);
            alert('Erreur lors de l\'assignation de la tâche: ' + error.message);
        } finally {
            setIsAssigning(false); // Réactive les boutons
        }
    }, [selectedMember, task.ID, onTaskUpdated, isAssigning]);


    return (
        <div className="card task-card">
            <h3>{task.Tâche}</h3>
            <div className="task-details">
                <p><strong>Description:</strong> {task.Description}</p>
                <p><strong>Points:</strong> {task.Points}</p>
                <p><strong>Dernière exécution:</strong> {task['Dernière Exécution'] || 'Jamais'}</p>
                {task.Responsable && <p><strong>Responsable:</strong> {task.Responsable}</p>}
            </div>
            
            {/* Conditionnement de l'affichage de la section d'assignation ou du bouton "Assigner" */}
            {!showAssignSection ? (
                <button 
                    onClick={() => setShowAssignSection(true)} 
                    className="show-assign-button" 
                >
                    Assigner la tâche
                </button>
            ) : (
                <div className={`task-assign-section ${showAssignSection ? 'show' : ''}`}>
                    <select value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)} disabled={isAssigning}>
                        <option value="">Sélectionner un membre</option>
                        {members.map(member => (
                            <option key={member} value={member}>{member}</option>
                        ))}
                    </select>
                    <button onClick={handleAssignTask} disabled={!selectedMember || isAssigning}>
                        {isAssigning ? 'Assignation...' : 'Prendre la tâche'}
                    </button>
                    <button 
                        onClick={() => setShowAssignSection(false)} 
                        className="cancel-assign-button" 
                        disabled={isAssigning}
                    >
                        Annuler
                    </button>
                </div>
            )}
        </div>
    );
}

// --- Composant Score ---
function Score({ score }) {
    return (
        <div className="card score-card">
            <span>{score['Membre de l\'équipe']}</span>
            <span className="score-value">{score['Score Total']} points</span>
        </div>
    );
}

// --- Composant Principal de l'Application ---
function App() {
    const [tasks, setTasks] = useState([]);
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null);
    const [members, setMembers] = useState([]); // Liste unique des membres pour le select

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.status === 'success') {
                setTasks(data.tasks);
                setScores(data.scores);

                // Extraire les membres uniques des tâches et scores pour le select
                const uniqueMembers = new Set();
                data.tasks.forEach(task => {
                    if (task.Responsable) uniqueMembers.add(task.Responsable);
                });
                data.scores.forEach(score => {
                    uniqueMembers.add(score['Membre de l\'équipe']);
                });
                setMembers(Array.from(uniqueMembers).sort()); // Trier par ordre alphabétique

            } else {
                throw new Error(data.message || 'Erreur inconnue lors de la récupération des données.');
            }
        } catch (err) {
            console.error('App: Erreur lors de la récupération des données:', err);
            setError(err.message);
        } finally {
            setLoading(false); // Correction ici : utilise setLoading
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTaskUpdated = useCallback(() => {
        fetchData(); // Rafraîchir toutes les données après une modification
    }, [fetchData]);

    if (loading) {
        return <div className="loading">Chargement des données...</div>;
    }

    if (error) {
        return <div className="error-message">Erreur: {error}</div>;
    }

    const availableTasks = tasks.filter(task => task.Statut === "À faire");
    const completedTasks = tasks.filter(task => task.Statut !== "À faire");


    return (
        <div className="container">
            <header className="app-header">
                {/* CHEMIN DU LOGO : Assurez-vous que logo.png est dans le même dossier que index.html */}
                <img src="logo.png" alt="Logo Maison Propre" className="app-logo" />
                <h1>Maison Propre</h1>
                <p>Gérez les tâches ménagères et suivez les scores de l'équipe.</p>
            </header>

            <div className="content-sections">
                <section className="section tasks-section">
                    <h2>Tâches disponibles</h2>
                    {availableTasks.length === 0 ? (
                        <p className="no-tasks-message">Toutes les tâches sont prises ! Excellent travail !</p>
                    ) : (
                        <div className="task-list">
                            {availableTasks.map(task => (
                                <Task key={task.ID} task={task} members={members} onTaskUpdated={handleTaskUpdated} />
                            ))}
                        </div>
                    )}
                </section>

                <section className="section scores-section">
                    <h2>Scores de l'équipe</h2>
                    {scores.length === 0 ? (
                        <p className="no-scores-message">Aucun score disponible pour l'instant.</p>
                    ) : (
                        <div className="score-list">
                            {scores.map((score) => ( 
                                <Score key={score['Membre de l\'équipe']} score={score} />
                            ))}
                        </div>
                    )}
                </section>
                
                {/* Section des tâches déjà prises, seulement si il y en a */}
                {completedTasks.length > 0 && (
                    <section className="section completed-tasks-section">
                        <h2>Tâches déjà prises cette semaine</h2>
                        <div className="task-list">
                            {completedTasks.map(task => (
                                <div key={task.ID} className="card completed-task-card">
                                    <h4>{task.Tâche}</h4> {/* Intitulé de la tâche */}
                                    <p>Par **{task.Responsable}** le {task['Dernière Exécution']}</p> {/* Nom et date */}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <footer className="app-footer">
                <p>&copy; 2024 Maison Propre App. Tous droits réservés.</p>
            </footer>
        </div>
    );
}

// Rendu de l'application
ReactDOM.render(<App />, document.getElementById('root'));
