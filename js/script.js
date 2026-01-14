/**
 * Poster + Ads Manual Share Tool
 */

const CONFIG = {
    canvasWidth: 1080,
    bannerHeight: 319,
    users: {
        '1': 'assets/banner1.png',
        '2': 'assets/banner2.png'
    },
    maxFileSize: 10 * 1024 * 1024 // 10MB
};

// State
let state = {
    selectedUser: null,
    generatedDataURL: null
};

// DOM Elements
const views = {
    home: document.getElementById('view-home'),
    upload: document.getElementById('view-upload')
};
const btnUsers = document.querySelectorAll('.btn-user');
const btnBack = document.getElementById('btn-back');
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const previewContainer = document.getElementById('preview-container');
const canvasWrapper = document.querySelector('.canvas-wrapper');
const btnShare = document.getElementById('btn-share');
const btnDownload = document.getElementById('btn-download');
const errorMessage = document.getElementById('error-message');

/**
 * Initialize Event Listeners
 */
function init() {
    // Navigation
    btnUsers.forEach(btn => {
        btn.addEventListener('click', () => {
            selectUser(btn.dataset.user);
        });
    });

    btnBack.addEventListener('click', showHome);

    // File Upload
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', handleDrop);

    // Actions
    btnDownload.addEventListener('click', downloadImage);
    btnShare.addEventListener('click', shareImage);

    // Check capability
    checkCapabilities();
}

/**
 * Navigation Logic
 */
function selectUser(userId) {
    state.selectedUser = userId;
    switchView('upload');
    resetUpload();
}

function showHome() {
    state.selectedUser = null;
    switchView('home');
}

function switchView(viewName) {
    Object.values(views).forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });
    const target = views[viewName];
    target.classList.remove('hidden');
    // small timeout to allow display:block to apply before opacity transition
    setTimeout(() => target.classList.add('active'), 10);
}

function resetUpload() {
    fileInput.value = '';
    previewContainer.classList.add('hidden');
    document.querySelector('.upload-container').classList.remove('hidden');
    state.generatedDataURL = null;
    canvasWrapper.innerHTML = '';
}

/**
 * File Handling
 */
function handleFileSelect(e) {
    const file = e.target.files[0];
    processFile(file);
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    processFile(file);
}

function processFile(file) {
    if (!file) return;

    // Validate size
    if (file.size > CONFIG.maxFileSize) {
        showError('File is too large (Max 10MB)');
        return;
    }

    // Validate type
    if (!file.type.match('image.*')) {
        showError('Only image files are allowed');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => mergeImages(img);
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * Core Merging Logic
 */
function mergeImages(posterImg) {
    // Use Base64 banner to prevent canvas tainting (SecurityError)
    const bannerSrc = BANNERS[state.selectedUser];
    const bannerImg = new Image();

    bannerImg.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate dimensions
        // Target width is fixed 1080
        const scale = CONFIG.canvasWidth / posterImg.width;
        const posterHeight = posterImg.height * scale;

        canvas.width = CONFIG.canvasWidth;
        canvas.height = posterHeight + CONFIG.bannerHeight;

        // Draw Poster
        ctx.drawImage(posterImg, 0, 0, canvas.width, posterHeight);

        // Draw Banner
        ctx.drawImage(bannerImg, 0, posterHeight, canvas.width, CONFIG.bannerHeight);

        // Show result
        canvasWrapper.innerHTML = '';
        canvasWrapper.appendChild(canvas);

        document.querySelector('.upload-container').classList.add('hidden');
        previewContainer.classList.remove('hidden');

        // Instant Generate using DataURL (Synchronous)
        try {
            state.generatedDataURL = canvas.toDataURL('image/png');

            // Enable buttons immediately
            btnDownload.disabled = false;
            btnShare.disabled = false;
            btnDownload.textContent = 'Download Image';

        } catch (e) {
            console.error('Generation error:', e);
            showError('Failed to generate image.');
        }
    };

    bannerImg.onerror = (e) => {
        console.error('Banner load error:', e);
        showError('Failed to load banner. Please check assets.');
    };

    bannerImg.src = bannerSrc;
}

/**
 * Distribution Actions
 */
function downloadImage() {
    if (!state.generatedDataURL) {
        showError('Image not ready yet.');
        return;
    }

    try {
        const link = document.createElement('a');
        link.href = state.generatedDataURL;
        link.download = `poster_merged_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error('Download error:', e);
        showError('Download failed.');
    }
}

async function shareImage() {
    if (!state.generatedDataURL) {
        showError('Image not ready yet.');
        return;
    }

    try {
        // Convert DataURL to Blob for sharing
        const res = await fetch(state.generatedDataURL);
        const blob = await res.blob();
        const file = new File([blob], 'poster.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'Check out this poster',
                text: 'Here is my merged poster!'
            });
        } else {
            showError('Sharing is not supported on this browser.');
        }
    } catch (error) {
        console.error('Share error:', error);
        showError('Share failed. Try downloading instead.');
    }
}

/**
 * Utilities
 */
function checkCapabilities() {
    if (!navigator.share) {
        btnShare.classList.add('hidden');
    } else {
        btnShare.classList.remove('hidden');
    }
}

function showError(msg) {
    if (!errorMessage) return;
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 3000);
}

// Start
init();
