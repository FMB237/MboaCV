// CV Editor JavaScript

// CV Data
const cvId = document.querySelector('[data-cv-id]')?.dataset.cvId ||
             window.location.pathname.match(/\/cv\/(\d+)\//)?.[1];

// Initialize cvData from the page
let cvData = {};

try {
    const cvDataScript = document.getElementById('cv-data');
    if (cvDataScript) {
        cvData = JSON.parse(cvDataScript.textContent);
    }
} catch (e) {
    console.error('Failed to parse CV data:', e);
    cvData = {
        personal: {},
        experience: [],
        education: [],
        skills: [],
        languages: [],
        projects: []
    };
}

// Initialize editor
document.addEventListener('DOMContentLoaded', function() {
    // Ensure all arrays exist
    if (!cvData.personal) cvData.personal = {};
    if (!cvData.experience) cvData.experience = [];
    if (!cvData.education) cvData.education = [];
    if (!cvData.skills) cvData.skills = [];
    if (!cvData.languages) cvData.languages = [];
    if (!cvData.projects) cvData.projects = [];

    renderAllSections();
    renderCV();
    setupAutoSave();
    setupTemplateChange();
});

// Toggle section collapse
function toggleSection(header) {
    const section = header.parentElement;
    section.classList.toggle('collapsed');
}

// Render all sections
function renderAllSections() {
    renderExperienceItems();
    renderEducationItems();
    renderLanguagesItems();
    renderProjectsItems();
}

// Render Experience Items
function renderExperienceItems() {
    const container = document.getElementById('experienceItems');
    if (!container) return;

    if (!cvData.experience || cvData.experience.length === 0) {
        container.innerHTML = '<p class="text-muted small">No experience added yet. Click "Add" to add your first experience.</p>';
        return;
    }

    container.innerHTML = cvData.experience.map((exp, index) => `
        <div class="item-card" data-index="${index}" data-type="experience">
            <div class="item-header">
                <span class="item-title">${escapeHtml(exp.position || 'New Position')}</span>
                <button type="button" class="btn btn-sm btn-link text-danger"
                        onclick="removeItem('experience', ${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="item-form">
                <input type="text" class="form-control form-control-sm mb-2"
                       placeholder="Position" value="${escapeHtml(exp.position || '')}"
                       onchange="updateItem('experience', ${index}, 'position', this.value)">
                <input type="text" class="form-control form-control-sm mb-2"
                       placeholder="Company" value="${escapeHtml(exp.company || '')}"
                       onchange="updateItem('experience', ${index}, 'company', this.value)">
                <div class="row mb-2">
                    <div class="col-6">
                        <input type="text" class="form-control form-control-sm"
                               placeholder="Start Date" value="${escapeHtml(exp.startDate || '')}"
                               onchange="updateItem('experience', ${index}, 'startDate', this.value)">
                    </div>
                    <div class="col-6">
                        <input type="text" class="form-control form-control-sm"
                               placeholder="End Date" value="${escapeHtml(exp.endDate || '')}"
                               onchange="updateItem('experience', ${index}, 'endDate', this.value)">
                    </div>
                </div>
                <textarea class="form-control form-control-sm" rows="3"
                          placeholder="Description"
                          onchange="updateItem('experience', ${index}, 'description', this.value)"
                >${escapeHtml(exp.description || '')}</textarea>
            </div>
        </div>
    `).join('');
}

// Render Education Items
function renderEducationItems() {
    const container = document.getElementById('educationItems');
    if (!container) return;

    if (!cvData.education || cvData.education.length === 0) {
        container.innerHTML = '<p class="text-muted small">No education added yet. Click "Add" to add your first education.</p>';
        return;
    }

    container.innerHTML = cvData.education.map((edu, index) => `
        <div class="item-card" data-index="${index}" data-type="education">
            <div class="item-header">
                <span class="item-title">${escapeHtml(edu.degree || 'New Education')}</span>
                <button type="button" class="btn btn-sm btn-link text-danger"
                        onclick="removeItem('education', ${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="item-form">
                <input type="text" class="form-control form-control-sm mb-2"
                       placeholder="Degree" value="${escapeHtml(edu.degree || '')}"
                       onchange="updateItem('education', ${index}, 'degree', this.value)">
                <input type="text" class="form-control form-control-sm mb-2"
                       placeholder="School" value="${escapeHtml(edu.school || '')}"
                       onchange="updateItem('education', ${index}, 'school', this.value)">
                <div class="row mb-2">
                    <div class="col-6">
                        <input type="text" class="form-control form-control-sm"
                               placeholder="Start Year" value="${escapeHtml(edu.startYear || '')}"
                               onchange="updateItem('education', ${index}, 'startYear', this.value)">
                    </div>
                    <div class="col-6">
                        <input type="text" class="form-control form-control-sm"
                               placeholder="End Year" value="${escapeHtml(edu.endYear || '')}"
                               onchange="updateItem('education', ${index}, 'endYear', this.value)">
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Render Languages Items
function renderLanguagesItems() {
    const container = document.getElementById('languagesItems');
    if (!container) return;

    if (!cvData.languages || cvData.languages.length === 0) {
        container.innerHTML = '<p class="text-muted small">No languages added yet. Click "Add" to add your first language.</p>';
        return;
    }

    container.innerHTML = cvData.languages.map((lang, index) => `
        <div class="item-card" data-index="${index}" data-type="languages">
            <div class="item-header">
                <span class="item-title">${escapeHtml(lang.name || 'New Language')}</span>
                <button type="button" class="btn btn-sm btn-link text-danger"
                        onclick="removeItem('languages', ${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="item-form">
                <div class="row">
                    <div class="col-7">
                        <input type="text" class="form-control form-control-sm"
                               placeholder="Language" value="${escapeHtml(lang.name || '')}"
                               onchange="updateItem('languages', ${index}, 'name', this.value)">
                    </div>
                    <div class="col-5">
                        <select class="form-select form-select-sm"
                                onchange="updateItem('languages', ${index}, 'level', this.value)">
                            <option value="" ${!lang.level ? 'selected' : ''}>Level</option>
                            <option value="Native" ${lang.level === 'Native' ? 'selected' : ''}>Native</option>
                            <option value="Fluent" ${lang.level === 'Fluent' ? 'selected' : ''}>Fluent</option>
                            <option value="Advanced" ${lang.level === 'Advanced' ? 'selected' : ''}>Advanced</option>
                            <option value="Intermediate" ${lang.level === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
                            <option value="Basic" ${lang.level === 'Basic' ? 'selected' : ''}>Basic</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Render Projects Items
function renderProjectsItems() {
    const container = document.getElementById('projectsItems');
    if (!container) return;

    if (!cvData.projects || cvData.projects.length === 0) {
        container.innerHTML = '<p class="text-muted small">No projects added yet. Click "Add" to add your first project.</p>';
        return;
    }

    container.innerHTML = cvData.projects.map((proj, index) => `
        <div class="item-card" data-index="${index}" data-type="projects">
            <div class="item-header">
                <span class="item-title">${escapeHtml(proj.name || 'New Project')}</span>
                <button type="button" class="btn btn-sm btn-link text-danger"
                        onclick="removeItem('projects', ${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="item-form">
                <input type="text" class="form-control form-control-sm mb-2"
                       placeholder="Project Name" value="${escapeHtml(proj.name || '')}"
                       onchange="updateItem('projects', ${index}, 'name', this.value)">
                <input type="url" class="form-control form-control-sm mb-2"
                       placeholder="Project URL" value="${escapeHtml(proj.url || '')}"
                       onchange="updateItem('projects', ${index}, 'url', this.value)">
                <textarea class="form-control form-control-sm" rows="2"
                          placeholder="Description"
                          onchange="updateItem('projects', ${index}, 'description', this.value)"
                >${escapeHtml(proj.description || '')}</textarea>
            </div>
        </div>
    `).join('');
}

// Add new item
function addItem(type, event) {
    if (event) {
        event.stopPropagation();
    }

    if (!cvData[type]) cvData[type] = [];

    let newItem = {};
    switch(type) {
        case 'experience':
            newItem = { position: '', company: '', startDate: '', endDate: '', description: '' };
            break;
        case 'education':
            newItem = { degree: '', school: '', startYear: '', endYear: '' };
            break;
        case 'languages':
            newItem = { name: '', level: '' };
            break;
        case 'projects':
            newItem = { name: '', url: '', description: '' };
            break;
    }

    cvData[type].push(newItem);

    // Re-render
    switch(type) {
        case 'experience': renderExperienceItems(); break;
        case 'education': renderEducationItems(); break;
        case 'languages': renderLanguagesItems(); break;
        case 'projects': renderProjectsItems(); break;
    }

    saveCV();
}

// Update item
function updateItem(type, index, field, value) {
    cvData[type][index][field] = value;
    saveCV();

    // Update title if needed
    if (field === 'position' || field === 'degree' || field === 'name') {
        const card = document.querySelector(`[data-type="${type}"][data-index="${index}"]`);
        if (card) {
            card.querySelector('.item-title').textContent = value || 'New Item';
        }
    }

    // Update CV preview
    renderCV();
}

// Remove item
function removeItem(type, index) {
    if (confirm('Are you sure you want to remove this item?')) {
        cvData[type].splice(index, 1);

        switch(type) {
            case 'experience': renderExperienceItems(); break;
            case 'education': renderEducationItems(); break;
            case 'languages': renderLanguagesItems(); break;
            case 'projects': renderProjectsItems(); break;
        }

        renderCV();
        saveCV();
    }
}

// Setup auto-save for form inputs
function setupAutoSave() {
    // Personal info fields
    document.querySelectorAll('[data-field^="personal."]').forEach(input => {
        input.addEventListener('input', debounce(function() {
            const field = this.dataset.field.replace('personal.', '');
            if (!cvData.personal) cvData.personal = {};
            cvData.personal[field] = this.value;
            renderCV();
            saveCV();
        }, 300));
    });

    // Skills field
    const skillsInput = document.getElementById('skillsInput');
    if (skillsInput) {
        skillsInput.addEventListener('input', debounce(function() {
            cvData.skills = this.value.split(',').map(s => s.trim()).filter(s => s);
            renderCV();
            saveCV();
        }, 300));
    }

    // CV title
    const cvTitle = document.getElementById('cvTitle');
    if (cvTitle) {
        cvTitle.addEventListener('input', debounce(function() {
            saveCV();
        }, 500));
    }
}

// Setup template change
function setupTemplateChange() {
    const templateSelect = document.getElementById('templateSelect');
    if (templateSelect) {
        templateSelect.addEventListener('change', function() {
            const newTemplate = this.value;
            // Reload page with new template (handled server-side)
            window.location.reload();
        });
    }
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Save CV to server
let saveTimeout;
function saveCV() {
    clearTimeout(saveTimeout);
    updateSaveStatus('saving');

    saveTimeout = setTimeout(() => {
        const cvId = window.location.pathname.match(/\/cv\/(\d+)\//)?.[1];
        if (!cvId) return;

        fetch(`/cv/${cvId}/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cvData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateSaveStatus('saved');
            }
        })
        .catch(() => {
            updateSaveStatus('error');
        });
    }, 1000);
}

// Update save status indicator
function updateSaveStatus(status) {
    const indicator = document.getElementById('saveStatus');
    if (!indicator) return;

    const icons = {
        saving: '<i class="fas fa-spinner fa-spin"></i> Saving...',
        saved: '<i class="fas fa-check-circle"></i> All changes saved',
        error: '<i class="fas fa-exclamation-circle"></i> Error saving'
    };

    indicator.innerHTML = icons[status];
    indicator.className = 'save-status ' + status;
}

// Render CV preview
function renderCV() {
    const preview = document.getElementById('cvPreview');
    if (!preview) return;

    const personal = cvData.personal || {};
    const skills = cvData.skills || [];

    // Build experience HTML
    let experienceHTML = '';
    if (cvData.experience && cvData.experience.length > 0) {
        experienceHTML = cvData.experience.map(exp => `
            <div class="cv-item">
                <div class="cv-item-header">
                    <div class="cv-item-title">${escapeHtml(exp.position || '')}</div>
                    <div class="cv-item-date">${formatDateRange(exp.startDate, exp.endDate)}</div>
                </div>
                <div class="cv-item-subtitle">${escapeHtml(exp.company || '')}</div>
                <div class="cv-item-description">${escapeHtml(exp.description || '')}</div>
            </div>
        `).join('');
    }

    // Build education HTML
    let educationHTML = '';
    if (cvData.education && cvData.education.length > 0) {
        educationHTML = cvData.education.map(edu => `
            <div class="cv-item">
                <div class="cv-item-header">
                    <div class="cv-item-title">${escapeHtml(edu.degree || '')}</div>
                    <div class="cv-item-date">${formatDateRange(edu.startYear, edu.endYear)}</div>
                </div>
                <div class="cv-item-subtitle">${escapeHtml(edu.school || '')}</div>
            </div>
        `).join('');
    }

    // Build languages HTML
    let languagesHTML = '';
    if (cvData.languages && cvData.languages.length > 0) {
        languagesHTML = cvData.languages.map(lang => `
            <div class="cv-skill-item">
                <span class="cv-skill-name">${escapeHtml(lang.name || '')}</span>
                <span class="cv-skill-level">${escapeHtml(lang.level || '')}</span>
            </div>
        `).join('');
    }

    // Build projects HTML
    let projectsHTML = '';
    if (cvData.projects && cvData.projects.length > 0) {
        projectsHTML = cvData.projects.map(proj => `
            <div class="cv-item">
                <div class="cv-item-header">
                    <div class="cv-item-title">${proj.url ? `<a href="${escapeHtml(proj.url)}" target="_blank">${escapeHtml(proj.name || '')}</a>` : escapeHtml(proj.name || '')}</div>
                </div>
                <div class="cv-item-description">${escapeHtml(proj.description || '')}</div>
            </div>
        `).join('');
    }

    // Build profile photo HTML
    const photoHTML = personal.photo ? `
        <div class="cv-photo-container">
            <img src="${personal.photo}" alt="Profile Photo">
        </div>
    ` : '';

    // Build header with optional photo
    const hasPhoto = !!personal.photo;
    const headerHTML = hasPhoto ? `
        <div class="cv-header cv-header-with-photo">
            ${photoHTML}
            <div class="cv-info">
                <h1 class="cv-name">${escapeHtml(personal.fullName || '')}</h1>
                ${personal.title ? `<p class="cv-title">${escapeHtml(personal.title)}</p>` : ''}
                <div class="cv-contact">
                    ${personal.email ? `<span><i class="fas fa-envelope"></i> ${escapeHtml(personal.email)}</span>` : ''}
                    ${personal.phone ? `<span><i class="fas fa-phone"></i> ${escapeHtml(personal.phone)}</span>` : ''}
                    ${personal.location ? `<span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(personal.location)}</span>` : ''}
                    ${personal.website ? `<span><i class="fas fa-globe"></i> ${escapeHtml(personal.website)}</span>` : ''}
                </div>
            </div>
        </div>
    ` : `
        <div class="cv-header">
            <h1 class="cv-name">${escapeHtml(personal.fullName || '')}</h1>
            ${personal.title ? `<p class="cv-title">${escapeHtml(personal.title)}</p>` : ''}
            <div class="cv-contact">
                ${personal.email ? `<span><i class="fas fa-envelope"></i> ${escapeHtml(personal.email)}</span>` : ''}
                ${personal.phone ? `<span><i class="fas fa-phone"></i> ${escapeHtml(personal.phone)}</span>` : ''}
                ${personal.location ? `<span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(personal.location)}</span>` : ''}
                ${personal.website ? `<span><i class="fas fa-globe"></i> ${escapeHtml(personal.website)}</span>` : ''}
            </div>
        </div>
    `;

    // Build full CV HTML
    preview.innerHTML = `
        <div class="cv-page">
            ${headerHTML}

            ${personal.summary ? `
            <div class="cv-section">
                <h2 class="cv-section-title">Profile</h2>
                <p>${escapeHtml(personal.summary)}</p>
            </div>
            ` : ''}

            ${cvData.experience?.length ? `
            <div class="cv-section">
                <h2 class="cv-section-title">Experience</h2>
                <div class="cv-items">${experienceHTML}</div>
            </div>
            ` : ''}

            ${cvData.education?.length ? `
            <div class="cv-section">
                <h2 class="cv-section-title">Education</h2>
                <div class="cv-items">${educationHTML}</div>
            </div>
            ` : ''}

            ${skills.length ? `
            <div class="cv-section">
                <h2 class="cv-section-title">Skills</h2>
                <div class="cv-skills-list">${skills.map(s => `<span class="cv-skill-tag">${escapeHtml(s)}</span>`).join('')}</div>
            </div>
            ` : ''}

            ${cvData.languages?.length ? `
            <div class="cv-section">
                <h2 class="cv-section-title">Languages</h2>
                <div class="cv-languages-list">${languagesHTML}</div>
            </div>
            ` : ''}

            ${cvData.projects?.length ? `
            <div class="cv-section">
                <h2 class="cv-section-title">Projects</h2>
                <div class="cv-items">${projectsHTML}</div>
            </div>
            ` : ''}
        </div>
    `;
}

// Format date range
function formatDateRange(start, end) {
    if (!start && !end) return '';
    const s = start || '';
    const e = end || 'Present';
    return `${s} - ${e}`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Preview CV in modal
function previewCV() {
    const modalPreview = document.getElementById('modalPreview');
    const cvPreview = document.getElementById('cvPreview');
    if (modalPreview && cvPreview) {
        modalPreview.innerHTML = cvPreview.innerHTML;

        const modalEl = document.getElementById('previewModal');
        if (modalEl) {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        }
    }
}

// Photo Upload Functions
function uploadPhoto(input) {
    const file = input.files[0];
    if (!file) return;

    const cvId = window.location.pathname.match(/\/cv\/(\d+)\//)?.[1];
    if (!cvId) return;

    const formData = new FormData();
    formData.append('photo', file);

    // Show loading state
    const container = document.getElementById('photoContainer');
    container.style.opacity = '0.5';

    fetch(`/cv/${cvId}/upload-photo`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update cvData
            if (!cvData.personal) cvData.personal = {};
            cvData.personal.photo = data.photo_url;

            // Update UI
            container.style.backgroundImage = `url('${data.photo_url}')`;
            container.style.opacity = '1';
            document.getElementById('photoPlaceholder').style.display = 'none';
            document.getElementById('removePhotoBtn').style.display = 'inline-block';

            // Update CV preview
            renderCV();
        } else {
            alert('Failed to upload photo: ' + data.error);
            container.style.opacity = '1';
        }
    })
    .catch(error => {
        console.error('Error uploading photo:', error);
        alert('Error uploading photo. Please try again.');
        container.style.opacity = '1';
    });
}

function removePhoto() {
    if (!confirm('Are you sure you want to remove your photo?')) return;

    const cvId = window.location.pathname.match(/\/cv\/(\d+)\//)?.[1];
    if (!cvId) return;

    fetch(`/cv/${cvId}/remove-photo`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update cvData
            if (cvData.personal) cvData.personal.photo = null;

            // Update UI
            const container = document.getElementById('photoContainer');
            container.style.backgroundImage = '';
            document.getElementById('photoPlaceholder').style.display = 'flex';
            document.getElementById('removePhotoBtn').style.display = 'none';

            // Update CV preview
            renderCV();
        }
    })
    .catch(error => {
        console.error('Error removing photo:', error);
    });
}

// Download PDF
function downloadPDF() {
    const element = document.getElementById('cvPreview');
    if (!element) return;

    const cvTitle = document.getElementById('cvTitle');
    const filename = (cvTitle ? cvTitle.value : 'CV') + '.pdf';

    const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(element).save();
    } else {
        alert('PDF library not loaded. Please try again.');
    }
}
