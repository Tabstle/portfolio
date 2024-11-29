// Daten eines einzelnen Projekts laden
async function loadProjectData(folder) {
    try {
        const response = await fetch(`../assets/${folder}/project.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} for ${folder}`);
        }
        const project = await response.json();

        // Bilder hinzufügen
        const images = [];

        // Versuche das Hauptbild zu laden
        try {
            const mainImage = `../assets/${folder}/main.jpg`;
            const imageResponse = await fetch(mainImage);
            if (imageResponse.ok) images.push(mainImage);
        } catch (e) {
            console.warn(`Main image for ${folder} not found.`);
        }

        // Detailbilder hinzufügen
        let i = 1;
        while (true) {
            const detailImage = `../assets/${folder}/detail${i}.jpg`;

            try {
                const detailResponse = await fetch(detailImage);
                if (detailResponse.ok) {
                    images.push(detailImage);
                } else {
                    break;  // Beende die Schleife, wenn ein Detailbild nicht gefunden wird
                }
            } catch (e) {
                break;  // Beende die Schleife, wenn ein Fehler beim Laden auftritt
            }

            i++;
        }

        // Fügt die Bilder zur Projektbeschreibung hinzu
        project.images = images;
        return project;
    } catch (error) {
        console.error(`Error loading project data for ${folder}:`, error);
        return null;
    }
}


// Projekte für die Index-Seite laden
async function loadIndexProjects() {
    const params = new URLSearchParams(window.location.search);
    const mainFolder = params.get('main') || 'KickWeb'; // Hauptprojekt aus URL oder Standardwert
    const otherFolders = ['Mentorship1', 'StartupInStasis'].filter(folder => folder !== mainFolder); // Andere Projekte

    const mainContainer = document.getElementById('main-project-container');
    const sideContainer = document.getElementById('side-projects-container');

    // Hauptprojekt laden
    const mainProject = await loadProjectData(mainFolder);
    if (mainProject) {
        mainContainer.innerHTML = `
            <div class="main-project">
                <img src="${mainProject.images[0] || 'placeholder.jpg'}" alt="${mainProject.title}" class="main-project-image">
                <h2>${mainProject.title}</h2>
                <p>${mainProject.longDescription || mainProject.shortDescription}</p>
                <a href="?main=${mainFolder}">Mehr erfahren</a>
            </div>
        `;
    } else {
        mainContainer.innerHTML = `<p>Hauptprojekt konnte nicht geladen werden.</p>`;
    }

    // Nebenprojekte laden
    sideContainer.innerHTML = ''; // Container leeren
    for (const folder of otherFolders.slice(0, 2)) {
        const project = await loadProjectData(folder);
        if (project) {
            const sideElement = document.createElement('div');
            sideElement.classList.add('side-project');

            sideElement.innerHTML = `
                <img src="${project.images[0] || 'placeholder.jpg'}" alt="${project.title}" class="side-project-image">
                <h3>${project.title}</h3>
                <p>${project.shortDescription}</p>
                <a href="?main=${folder}">Mehr erfahren</a>
            `;

            sideContainer.appendChild(sideElement);
        }
    }
}

// Projekte für die Galerie laden
async function loadAllProjects() {
    const galleryContainer = document.getElementById('gallery-container');

    if (!galleryContainer) {
        console.error('Gallery container not found!');
        return;
    }

    galleryContainer.innerHTML = ''; // Container leeren

    try {
        // Fetch the list of project folders from the JSON file
        const response = await fetch('../assets/projects.json');
        if (!response.ok) {
            throw new Error('Failed to load project list');
        }

        const folders = await response.json(); // Get the list of folder names
        for (const folder of folders) {
            const project = await loadProjectData(folder);
            if (project) {
                const projectElement = document.createElement('div');
                projectElement.classList.add('gallery-item');

                projectElement.innerHTML = `
                    <img src="${project.images[0] || 'placeholder.jpg'}" alt="${project.title}" class="gallery-image">
                    <h3>${project.title}</h3>
                    <p>${project.shortDescription}</p>
                    <a href="?main=${folder}">Mehr erfahren</a>
                `;

                galleryContainer.appendChild(projectElement);
            }
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// Beim Laden der Seite entscheiden, welche Funktion ausgeführt werden soll
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('main-project-container') && document.getElementById('side-projects-container')) {
        loadIndexProjects(); // Index-Seite
    } else if (document.getElementById('gallery-container')) {
        loadAllProjects(); // Galerie-Seite
    }
});
