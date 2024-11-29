async function loadProjectData(folder) {
    try {
        const response = await fetch(`/assets/${folder}/project.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} for ${folder}`);
        }
        const project = await response.json();

        // Bilder hinzufügen
        const images = [];

        // Versuche das Hauptbild zu laden
        try {
            const mainImage = `/assets/${folder}/main.jpg`;
            const imageResponse = await fetch(mainImage);
            if (imageResponse.ok) images.push(mainImage);
        } catch (e) {
            console.warn(`Main image for ${folder} not found.`);
        }

        // Detailbilder hinzufügen
        let i = 1;
        while (true) {
            const detailImage = `/assets/${folder}/detail${i}.jpg`;

            try {
                const detailResponse = await fetch(detailImage);
                if (detailResponse.ok) {
                    images.push(detailImage);
                } else {
                    break;  // Beendet die Schleife, wenn ein Detailbild nicht gefunden wird
                }
            } catch (e) {
                break;  // Beendet die Schleife, wenn ein Fehler beim Laden auftritt
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

// Projekte für die Index-Seite
async function loadIndexProjects() {
    // Check if the layout has been set in sessionStorage
    let layoutKey = sessionStorage.getItem('layout');
    if (!layoutKey) {
        // If layout is not set, check the URL query parameter for layout and store it
        const params = new URLSearchParams(window.location.search);
        layoutKey = params.get('layout') || 'layout0'; // Default to 'layout0' if not found
        sessionStorage.setItem('layout', layoutKey); // Store the layout in sessionStorage
    }

    try {
        // Fetch the layout configuration
        const response = await fetch('/assets/layouts.json');
        if (!response.ok) {
            throw new Error('Failed to load layout configurations');
        }
        const layouts = await response.json();
        const layout = layouts[layoutKey];

        if (!layout) {
            throw new Error(`Layout ${layoutKey} not found`);
        }

        const mainContainer = document.getElementById('main-project-container');
        const sideContainer = document.getElementById('side-projects-container');

        // Load the main project
        const mainProject = await loadProjectData(layout.main);
        if (mainProject) {
            mainContainer.innerHTML = `
                <div class="main-project">
                    <img src="${mainProject.images[0] || 'placeholder.jpg'}" alt="${mainProject.title}" class="main-project-image">
                    <h2>${mainProject.title}</h2>
                    <p>${mainProject.longDescription || mainProject.shortDescription}</p>
                    <a href="project.html?project=${layout.main}&layout=${layoutKey}">Mehr erfahren</a>
                </div>
            `;
        } else {
            mainContainer.innerHTML = `<p>Hauptprojekt konnte nicht geladen werden.</p>`;
        }

        // Load side projects
        sideContainer.innerHTML = ''; // Clear the container
        for (const folder of layout.side) {
            const project = await loadProjectData(folder);
            if (project) {
                const sideElement = document.createElement('div');
                sideElement.classList.add('side-project');

                sideElement.innerHTML = `
                    <img src="${project.images[0] || 'placeholder.jpg'}" alt="${project.title}" class="side-project-image">
                    <h3>${project.title}</h3>
                    <p>${project.shortDescription}</p>
                    <a href="project.html?project=${folder}&layout=${layoutKey}">Mehr erfahren</a>
                `;

                sideContainer.appendChild(sideElement);
            }
        }
    } catch (error) {
        console.error('Error loading index projects:', error);
    }
}


// Projekte für die Galerie
async function loadAllProjects() {
    const galleryContainer = document.getElementById('gallery-container');

    if (!galleryContainer) {
        console.error('Gallery container not found!');
        return;
    }

    galleryContainer.innerHTML = ''; // Container leeren

    try {
        // Fetch the list of project folders from the JSON file
        const response = await fetch('/assets/projects.json');
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
                    <a href="project.html?project=${folder}">Mehr erfahren</a>
                `;

                galleryContainer.appendChild(projectElement);
            }
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// Projekt für Detailansicht
async function loadProjectDetails() {
    const container = document.getElementById('project-details-container');
    if (!container) {
        console.error('Project details container not found!');
        return;
    }

    // Get the project identifier from the query string
    const urlParams = new URLSearchParams(window.location.search);
    const projectFolder = urlParams.get('project');
    if (!projectFolder) {
        container.innerHTML = '<p>Error: No project specified!</p>';
        return;
    }

    try {
        // Load project data
        const project = await loadProjectData(projectFolder);
        if (!project) {
            container.innerHTML = `<p>Error: Unable to load project data for ${projectFolder}.</p>`;
            return;
        }

        // Generate HTML for the project details
        let imagesHTML = '';
        for (const image of project.images) {
            imagesHTML += `<img src="${image}" alt="${project.title}" class="project-image">`;
        }

        // Add "Check it out" button if the link exists
        const checkItOutButton = project.link
            ? `<a href="${project.link}" target="_blank" class="button">Check it out</a>`
            : '';

        container.innerHTML = `
            <div class="project-details">
                <h1>${project.title}</h1>
                <p>${project.longDescription || project.shortDescription}</p>
                <div class="project-images">
                    ${imagesHTML}
                </div>
                ${checkItOutButton}
            </div>
        `;
    } catch (error) {
        console.error('Error loading project details:', error);
        container.innerHTML = '<p>Error loading project details. Please try again later.</p>';
    }
}

// Load project details when the page is ready
document.addEventListener('DOMContentLoaded', loadProjectDetails);


// Beim Laden der Seite entscheiden, welche Funktion ausgeführt werden soll
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('main-project-container') && document.getElementById('side-projects-container')) {
        loadIndexProjects();
    } else if (document.getElementById('gallery-container')) {
        loadAllProjects();
    } else if (document.getElementById('project-details-container')) {
        loadProjectDetails();
    }
});
