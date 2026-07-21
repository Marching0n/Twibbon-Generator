/**
 * Twibbon Generator Studio Core Script
 * Dynamic Resolution Engine matching Frame 1 dimensions exactly
 */

document.addEventListener('DOMContentLoaded', () => {
    // Canvas & Context Setup
    const canvas = document.getElementById('twibbonCanvas');
    const ctx = canvas.getContext('2d');
    
    // Dynamic Frame Resolution (defaults to frame 1 natural dimensions once loaded)
    let canvasWidth = 1080;
    let canvasHeight = 1080;

    // State Variables
    let photoImg = null;
    let frameImg = new Image();
    
    // Default Transformations
    let state = {
        x: canvasWidth / 2,
        y: canvasHeight / 2,
        scale: 1.0,
        rotation: 0, // degrees
        flipH: 1,    // 1 or -1
        flipV: 1,    // 1 or -1
        brightness: 100,
        contrast: 100
    };

    // Interaction State
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    // UI Elements
    const photoInput = document.getElementById('photoInput');
    const selectPhotoBtn = document.getElementById('selectPhotoBtn');
    const dropZone = document.getElementById('dropZone');
    
    const frameResBadge = document.getElementById('frameResBadge');
    const canvasInfoBadge = document.querySelector('.canvas-info-badge');

    const zoomRange = document.getElementById('zoomRange');
    const zoomVal = document.getElementById('zoomVal');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');

    const rotateRange = document.getElementById('rotateRange');
    const rotateVal = document.getElementById('rotateVal');
    const rotateChips = document.querySelectorAll('.btn-chip');

    const fitPhotoBtn = document.getElementById('fitPhotoBtn');
    const fillPhotoBtn = document.getElementById('fillPhotoBtn');
    const flipHBtn = document.getElementById('flipHBtn');
    const flipVBtn = document.getElementById('flipVBtn');
    const resetTransformBtn = document.getElementById('resetTransformBtn');

    const brightnessRange = document.getElementById('brightnessRange');
    const contrastRange = document.getElementById('contrastRange');

    const downloadBtn = document.getElementById('downloadBtn');

    // -------------------------------------------------------------
    // Initializing & Loading Twibbon Frame 1
    // -------------------------------------------------------------
    
    // Load Twibbon Frame 1 as primary frame template
    loadFrame('assets/frame1.png');

    // Create a default placeholder photo until user uploads one
    createPlaceholderPhoto();

    // -------------------------------------------------------------
    // Frame Loading & Dynamic Canvas Resolution Syncing
    // -------------------------------------------------------------
    function loadFrame(src) {
        frameImg = new Image();
        frameImg.crossOrigin = 'anonymous';
        frameImg.onload = () => {
            // Set canvas dimensions to fit exact resolution of frame image
            canvasWidth = frameImg.naturalWidth || frameImg.width || 1080;
            canvasHeight = frameImg.naturalHeight || frameImg.height || 1080;

            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            // Update UI badges showing frame resolution
            if (frameResBadge) {
                frameResBadge.textContent = `${canvasWidth} × ${canvasHeight} px`;
            }
            if (canvasInfoBadge) {
                canvasInfoBadge.innerHTML = `<i class="fa-solid fa-ruler-combined"></i> ${canvasWidth} × ${canvasHeight} px`;
            }

            // Auto fit user photo to updated frame resolution
            if (photoImg) {
                autoFitPhoto();
            }

            renderCanvas();
        };
        frameImg.onerror = () => {
            showToast('Failed to load Twibbon frame 1 image');
        };
        frameImg.src = src;
    }

    // -------------------------------------------------------------
    // Canvas Drawing Engine
    // -------------------------------------------------------------
    function renderCanvas() {
        // Clear Canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // 1. Draw User Photo (Behind Frame)
        if (photoImg && photoImg.complete) {
            ctx.save();

            // Move origin to user photo position
            ctx.translate(state.x, state.y);

            // Rotate
            ctx.rotate((state.rotation * Math.PI) / 180);

            // Scale & Flip
            ctx.scale(state.scale * state.flipH, state.scale * state.flipV);

            // Apply Filters (Brightness & Contrast)
            ctx.filter = `brightness(${state.brightness}%) contrast(${state.contrast}%)`;

            // Draw image centered at origin
            const drawW = photoImg.width;
            const drawH = photoImg.height;
            ctx.drawImage(photoImg, -drawW / 2, -drawH / 2, drawW, drawH);

            ctx.restore();
        }

        // 2. Draw Twibbon Frame (On Top with Exact Resolution Fit)
        if (frameImg && frameImg.complete) {
            ctx.save();
            ctx.filter = 'none'; // Frame is drawn without filters
            ctx.drawImage(frameImg, 0, 0, canvasWidth, canvasHeight);
            ctx.restore();
        }
    }

    // -------------------------------------------------------------
    // Photo Loading & Processing
    // -------------------------------------------------------------
    function loadUserPhoto(src) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            photoImg = img;
            autoFitPhoto();
            renderCanvas();
            showToast('Photo uploaded successfully!');
        };
        img.src = src;
    }

    // Default Placeholder Canvas Photo
    function createPlaceholderPhoto() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 800;
        tempCanvas.height = 800;
        const tCtx = tempCanvas.getContext('2d');

        // Gradient Background
        const grad = tCtx.createLinearGradient(0, 0, 800, 800);
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(1, '#818cf8');
        tCtx.fillStyle = grad;
        tCtx.fillRect(0, 0, 800, 800);

        // Avatar Symbol
        tCtx.fillStyle = '#ffffff';
        tCtx.beginPath();
        tCtx.arc(400, 320, 140, 0, Math.PI * 2); // Head
        tCtx.fill();

        tCtx.beginPath();
        tCtx.arc(400, 720, 260, Math.PI, 0); // Body
        tCtx.fill();

        // Text
        tCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        tCtx.font = 'bold 36px sans-serif';
        tCtx.textAlign = 'center';
        tCtx.fillText('Upload Your Photo', 400, 520);

        loadUserPhoto(tempCanvas.toDataURL());
    }

    // Auto-fit photo into frame canvas dimensions
    function autoFitPhoto() {
        if (!photoImg) return;
        state.x = canvasWidth / 2;
        state.y = canvasHeight / 2;
        state.rotation = 0;
        state.flipH = 1;
        state.flipV = 1;

        // Calculate scale to fit inside frame cutout
        const scaleX = (canvasWidth * 0.85) / photoImg.width;
        const scaleY = (canvasHeight * 0.85) / photoImg.height;
        state.scale = Math.max(scaleX, scaleY);

        updateUIControls();
    }

    function autoFillPhoto() {
        if (!photoImg) return;
        state.x = canvasWidth / 2;
        state.y = canvasHeight / 2;
        
        const scaleX = canvasWidth / photoImg.width;
        const scaleY = canvasHeight / photoImg.height;
        state.scale = Math.max(scaleX, scaleY);

        updateUIControls();
        renderCanvas();
    }

    // File Input Handlers
    selectPhotoBtn.addEventListener('click', () => photoInput.click());
    dropZone.addEventListener('click', (e) => {
        if (e.target !== selectPhotoBtn && !selectPhotoBtn.contains(e.target)) {
            photoInput.click();
        }
    });

    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handlePhotoFile(file);
    });

    // Drag & Drop
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        if (file) handlePhotoFile(file);
    });

    function handlePhotoFile(file) {
        if (!file.type.match('image.*')) {
            showToast('Please select a valid image file (PNG, JPG, WEBP)');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => loadUserPhoto(e.target.result);
        reader.readAsDataURL(file);
    }

    // -------------------------------------------------------------
    // Interactive Canvas Mouse & Touch Drag & Zoom Controls
    // -------------------------------------------------------------
    function getCanvasCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const scaleX = canvasWidth / rect.width;
        const scaleY = canvasHeight / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    function startDrag(e) {
        isDragging = true;
        const pos = getCanvasCoordinates(e);
        startX = pos.x - state.x;
        startY = pos.y - state.y;
    }

    function moveDrag(e) {
        if (!isDragging) return;
        e.preventDefault();
        const pos = getCanvasCoordinates(e);
        state.x = pos.x - startX;
        state.y = pos.y - startY;
        renderCanvas();
    }

    function stopDrag() {
        isDragging = false;
    }

    canvas.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('mouseup', stopDrag);

    canvas.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('touchmove', moveDrag, { passive: false });
    window.addEventListener('touchend', stopDrag);

    // Scroll Wheel Zoom on Canvas
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
        state.scale = Math.min(Math.max(0.1, state.scale + zoomDelta), 4.0);
        updateUIControls();
        renderCanvas();
    }, { passive: false });

    // -------------------------------------------------------------
    // UI Sliders & Adjustment Controls
    // -------------------------------------------------------------
    function updateUIControls() {
        const scalePercent = Math.round(state.scale * 100);
        zoomRange.value = scalePercent;
        zoomVal.textContent = `${scalePercent}%`;

        rotateRange.value = state.rotation;
        rotateVal.textContent = `${state.rotation}°`;
    }

    zoomRange.addEventListener('input', (e) => {
        state.scale = parseFloat(e.target.value) / 100;
        zoomVal.textContent = `${Math.round(state.scale * 100)}%`;
        renderCanvas();
    });

    zoomInBtn.addEventListener('click', () => {
        state.scale = Math.min(4.0, state.scale + 0.1);
        updateUIControls();
        renderCanvas();
    });

    zoomOutBtn.addEventListener('click', () => {
        state.scale = Math.max(0.1, state.scale - 0.1);
        updateUIControls();
        renderCanvas();
    });

    rotateRange.addEventListener('input', (e) => {
        state.rotation = parseInt(e.target.value);
        rotateVal.textContent = `${state.rotation}°`;
        renderCanvas();
    });

    rotateChips.forEach(chip => {
        chip.addEventListener('click', () => {
            state.rotation = parseInt(chip.getAttribute('data-rotate'));
            updateUIControls();
            renderCanvas();
        });
    });

    fitPhotoBtn.addEventListener('click', () => {
        autoFitPhoto();
        renderCanvas();
    });

    fillPhotoBtn.addEventListener('click', () => {
        autoFillPhoto();
    });

    flipHBtn.addEventListener('click', () => {
        state.flipH *= -1;
        renderCanvas();
    });

    flipVBtn.addEventListener('click', () => {
        state.flipV *= -1;
        renderCanvas();
    });

    brightnessRange.addEventListener('input', (e) => {
        state.brightness = e.target.value;
        renderCanvas();
    });

    contrastRange.addEventListener('input', (e) => {
        state.contrast = e.target.value;
        renderCanvas();
    });

    resetTransformBtn.addEventListener('click', () => {
        autoFitPhoto();
        state.brightness = 100;
        state.contrast = 100;
        brightnessRange.value = 100;
        contrastRange.value = 100;
        renderCanvas();
        showToast('Transforms reset');
    });

    // -------------------------------------------------------------
    // Download Export Handler
    // -------------------------------------------------------------
    downloadBtn.addEventListener('click', () => {
        renderCanvas();

        const link = document.createElement('a');
        link.download = `twibbon-podkuansing-${canvasWidth}x${canvasHeight}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();

        showToast('Downloading your Twibbon frame!');
    });

    // -------------------------------------------------------------
    // Toast Helper
    // -------------------------------------------------------------
    const toastEl = document.getElementById('toast');
    let toastTimeout = null;

    function showToast(msg) {
        if (!toastEl) return;
        toastEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${msg}`;
        toastEl.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toastEl.classList.remove('show');
        }, 2500);
    }
});
