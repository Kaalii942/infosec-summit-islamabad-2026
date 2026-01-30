document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('postCanvas');
    const ctx = canvas.getContext('2d');
    const photoUpload = document.getElementById('photoUpload');
    const userNameInput = document.getElementById('userName');
    const universityNameInput = document.getElementById('universityName');
    const generateBtn = document.getElementById('generateBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');
    const placeholderPreview = document.getElementById('placeholderPreview');
    const dropArea = document.getElementById('dropArea');
    const loader = document.getElementById('loader');
    const btnText = document.querySelector('.btn-text');

    let userImage = null;
    let templateImage = new Image();
    templateImage.src = 'tamplate.png';

    // Drag and drop handlers
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('is-active'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('is-active'), false);
    });

    dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
            photoUpload.files = files;
            handleImageUpload(files[0]);
        }
    }

    photoUpload.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleImageUpload(e.target.files[0]);
        }
    });

    function handleImageUpload(file) {
        if (file.size > 5 * 1024 * 1024) {
            alert('File size exceeds 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                userImage = img;
                document.querySelector('.file-msg').textContent = file.name;
                updatePreview();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Live Preview Listeners
    userNameInput.addEventListener('input', debounce(updatePreview, 300));
    universityNameInput.addEventListener('input', debounce(updatePreview, 300));

    function debounce(func, timeout = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    }

    function updatePreview() {
        if (userImage && userNameInput.value && universityNameInput.value) {
            drawPost(userNameInput.value, universityNameInput.value);
            canvas.style.display = 'block';
            placeholderPreview.style.display = 'none';
            downloadBtn.disabled = false;
        }
    }

    generateBtn.addEventListener('click', async () => {
        const name = userNameInput.value.trim();
        const uni = universityNameInput.value.trim();

        if (!userImage || !name || !uni) {
            alert('Please fill in all fields and upload a photo.');
            return;
        }

        loader.style.display = 'block';
        btnText.style.display = 'none';
        generateBtn.disabled = true;

        try {
            await drawPost(name, uni);
            canvas.style.display = 'block';
            placeholderPreview.style.display = 'none';
            downloadBtn.disabled = false;
        } catch (error) {
            console.error(error);
            alert('Error generating post. Please ensure you are using a modern browser.');
        } finally {
            loader.style.display = 'none';
            btnText.style.display = 'block';
            generateBtn.disabled = false;
        }
    });

    async function drawPost(name, university) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // ==================================================
        // 🛠️ SETTINGS: ADJUST COORDINATES HERE
        // ==================================================
        const CONFIG = {
            shieldX: 570,   // Left/Right center
            shieldY: 740,   // UP/DOWN (Increase to move photo DOWN)
            shieldW: 380,   // Photo Width
            shieldH: 440,   // Photo Height

            nameY: 1080,    // Name UP/DOWN (Increase to move DOWN)
            uniY: 1160,     // University UP/DOWN (Increase to move DOWN)
            boxCenter: 1150 // Vertical center (used if no university info)
        };
        // ==================================================

        // 1. Draw Template
        ctx.drawImage(templateImage, 0, 0, 1080, 1350);

        // 2. Draw User Photo with Clipping
        ctx.save();
        drawShieldPath(ctx, CONFIG.shieldX, CONFIG.shieldY, CONFIG.shieldW, CONFIG.shieldH);
        ctx.clip();

        if (userImage) {
            const scale = Math.max(CONFIG.shieldW / userImage.width, CONFIG.shieldH / userImage.height);
            const drawW = userImage.width * scale;
            const drawH = userImage.height * scale;
            const drawX = CONFIG.shieldX - drawW / 2;
            const drawY = CONFIG.shieldY - drawH / 2;

            ctx.drawImage(userImage, drawX, drawY, drawW, drawH);
        }
        ctx.restore();

        // 3. Draw Text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const hasUni = university && university.trim().length > 0;

        // --- Name Drawing ---
        const currentNameY = hasUni ? CONFIG.nameY : CONFIG.boxCenter;
        let nameFontSize = 75;
        ctx.font = `800 ${nameFontSize}px "Outfit", sans-serif`;
        const maxNameWidth = 840;

        while (ctx.measureText(name.toUpperCase()).width > maxNameWidth && nameFontSize > 30) {
            nameFontSize -= 2;
            ctx.font = `800 ${nameFontSize}px "Outfit", sans-serif`;
        }

        const grad = ctx.createLinearGradient(0, currentNameY - 40, 0, currentNameY + 40);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, '#ffcefd');
        ctx.fillStyle = grad;
        ctx.fillText(name.toUpperCase(), 540, currentNameY);

        // --- University Drawing ---
        if (hasUni) {
            ctx.fillStyle = '#ffffff';
            let uniFontSize = 26;
            ctx.font = `600 ${uniFontSize}px "Outfit", sans-serif`;
            const maxUniWidth = 800;

            while (ctx.measureText(university.toUpperCase()).width > maxUniWidth && uniFontSize > 14) {
                uniFontSize--;
                ctx.font = `600 ${uniFontSize}px "Outfit", sans-serif`;
            }
            ctx.fillText(university.toUpperCase(), 540, CONFIG.uniY);
        }
    }


    function drawShieldPath(ctx, cx, cy, w, h) {
        const x = cx;
        const y = cy - h / 2;
        const hw = w / 2;

        ctx.beginPath();

        // 1. Center Peak (Top-most point)
        ctx.moveTo(x, y);

        // 2. Top-right Crown Slope
        // Isko 'S' shape curve diya gaya hai takay "dip" aur "edge" sahi aaye
        ctx.bezierCurveTo(
            x + hw * 0.3, y + h * 0.07,  // Control 1: Center se halka sa niche
            x + hw * 0.6, y + h * 0.14,  // Control 2: Shoulder ki taraf jate hue dip
            x + hw * 0.85, y + h * 0.154  // Right Shoulder edge (Sharp corner feel)
        );

        // 3. Right Side "Belly" 
        // Is curve ko wide rakha hai takay template jaisi width aaye
        ctx.bezierCurveTo(
            x + hw * 1.05, y + h * 0.55, // Control 1: Bahar ki taraf nikalta hua
            x + hw * 0.7, y + h * 0.90,  // Control 2: Niche ki taraf curve hota hua
            x, y + h                     // Bottom Tip (Sharp point)
        );

        // 4. Left Side "Belly" (Mirror)
        ctx.bezierCurveTo(
            x - hw * 0.7, y + h * 0.90,  // CP1 (mirror of Right CP2)
            x - hw * 1.05, y + h * 0.55, // CP2 (mirror of Right CP1)
            x - hw * 0.85, y + h * 0.154 // Left Shoulder edge (Matching Right: 0.154)
        );

        // 5. Top-left Crown Slope (Mirror)
        ctx.bezierCurveTo(
            x - hw * 0.6, y + h * 0.14,  // CP1 (mirror of Right CP2)
            x - hw * 0.3, y + h * 0.07,  // CP2 (mirror of Right CP1)
            x, y                         // Back to Center Peak
        );

        ctx.closePath();
    }

    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'Infosec-Summit-Attendee.png';
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    });

    resetBtn.addEventListener('click', () => {
        userNameInput.value = '';
        universityNameInput.value = '';
        photoUpload.value = '';
        userImage = null;
        document.querySelector('.file-msg').textContent = 'or drag and drop here (JPG, PNG - Max 5MB)';
        canvas.style.display = 'none';
        placeholderPreview.style.display = 'flex';
        downloadBtn.disabled = true;
    });
});
