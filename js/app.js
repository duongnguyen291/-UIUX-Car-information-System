/**
 * Component Loader & Main App Logic
 */

async function loadComponents() {
    console.log('Loading components...');
    const screens = [
        { id: 'home-screen', url: 'components/home.html' },
        { id: 'monitoring-screen', url: 'components/monitor.html' },
        { id: 'controls-screen', url: 'components/controls.html' },
        { id: 'navigation-screen', url: 'components/navigate.html' },
        { id: 'automated-screen', url: 'components/auto.html' },
        { id: 'mobile-screen', url: 'components/mobile.html' }
    ];

    // Load Screens
    for (const screen of screens) {
        const element = document.getElementById(screen.id);
        if (element) {
            try {
                const response = await fetch(screen.url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const html = await response.text();
                element.innerHTML = html;
                console.log(`Loaded ${screen.id}`);
            } catch (error) {
                console.error(`Error loading component ${screen.id}:`, error);
                element.innerHTML = `<div class="error">Failed to load content: ${error.message}</div>`;
            }
        }
    }

    // Load CarPlay Overlays
    const carplayContainer = document.getElementById('carplay-container');
    if (carplayContainer) {
        try {
            const response = await fetch('components/ios-carplay.html');
            if (response.ok) {
                const html = await response.text();
                carplayContainer.innerHTML = html;
                console.log('Loaded CarPlay overlays');
            }
        } catch (error) {
            console.error('Error loading CarPlay:', error);
        }
    }

    // Initialize App Logic
    initializeLogic();

    // Initialize 3D Model
    if (typeof init3DModel === 'function') {
        init3DModel();
    }
}

document.addEventListener('DOMContentLoaded', loadComponents);

function initializeLogic() {
    console.log('Initializing app logic...');
    // Update time
    function updateTime() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const timeEl = document.getElementById('current-time');
        if (timeEl) timeEl.textContent = `${hours}:${minutes} ${ampm}`;

        // Update CarPlay times
        const iosTime = document.getElementById('ios-time');
        const androidTime = document.getElementById('android-time');
        if (iosTime) iosTime.textContent = `${hours}:${minutes}`;
        if (androidTime) androidTime.textContent = `${hours}:${minutes}`;
    }
    updateTime();
    setInterval(updateTime, 1000);

    // ============================================
    // CARPLAY FUNCTIONS
    // ============================================
    window.openCarPlay = function (mode) {
        const overlay = document.getElementById('carplay-overlay');
        const iosMode = document.getElementById('ios-carplay');
        const androidMode = document.getElementById('android-auto');
        const iosIcon = document.getElementById('switch-icon-ios');
        const androidIcon = document.getElementById('switch-icon-android');

        // Hide both modes first
        if (iosMode) iosMode.style.display = 'none';
        if (androidMode) androidMode.style.display = 'none';

        // Show selected mode
        if (mode === 'ios') {
            if (iosMode) iosMode.style.display = 'flex';
            if (iosIcon) iosIcon.style.display = 'none';
            if (androidIcon) androidIcon.style.display = 'block';
            currentCarPlayMode = 'ios';
        } else if (mode === 'android') {
            if (androidMode) androidMode.style.display = 'flex';
            if (iosIcon) iosIcon.style.display = 'block';
            if (androidIcon) androidIcon.style.display = 'none';
            currentCarPlayMode = 'android';
        }

        // Show overlay with animation
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Update time for CarPlay
        updateTime();
    }

    window.closeCarPlay = function () {
        const overlay = document.getElementById('carplay-overlay');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Toggle between iOS and Android modes
    window.currentCarPlayMode = 'ios';
    window.toggleCarPlayMode = function () {
        const iosMode = document.getElementById('ios-carplay');
        const androidMode = document.getElementById('android-auto');
        const iosIcon = document.getElementById('switch-icon-ios');
        const androidIcon = document.getElementById('switch-icon-android');

        if (currentCarPlayMode === 'ios') {
            if (iosMode) iosMode.style.display = 'none';
            if (androidMode) androidMode.style.display = 'flex';
            if (iosIcon) iosIcon.style.display = 'block';
            if (androidIcon) androidIcon.style.display = 'none';
            currentCarPlayMode = 'android';
        } else {
            if (iosMode) iosMode.style.display = 'flex';
            if (androidMode) androidMode.style.display = 'none';
            if (iosIcon) iosIcon.style.display = 'none';
            if (androidIcon) androidIcon.style.display = 'block';
            currentCarPlayMode = 'ios';
        }
        updateTime();
    }

    // Close CarPlay with Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeCarPlay();
        }
    });

    // Screen Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const screens = document.querySelectorAll('.screen');

    navItems.forEach(item => {
        item.addEventListener('click', function () {
            const screenName = this.dataset.screen;

            // Update nav active state
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // Show corresponding screen
            screens.forEach(screen => screen.classList.remove('active'));
            const targetScreen = document.getElementById(`${screenName}-screen`);
            if (targetScreen) targetScreen.classList.add('active');
        });
    });

    // Volume slider interaction
    const volumeSlider = document.querySelector('.volume-slider');
    const volumeFill = document.querySelector('.volume-fill');
    const volumeThumb = document.querySelector('.volume-thumb');

    let isDragging = false;

    if (volumeSlider) {
        volumeSlider.addEventListener('mousedown', function (e) {
            isDragging = true;
            updateVolume(e);
        });

        document.addEventListener('mousemove', function (e) {
            if (isDragging) {
                updateVolume(e);
            }
        });

        document.addEventListener('mouseup', function () {
            isDragging = false;
        });
    }

    function updateVolume(e) {
        if (!volumeSlider) return;
        const rect = volumeSlider.getBoundingClientRect();
        let x = e.clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const percent = (x / rect.width) * 100;
        if (volumeFill) volumeFill.style.width = percent + '%';
        if (volumeThumb) volumeThumb.style.left = percent + '%';
    }

    // Climate temperature control
    const tempDisplay = document.getElementById('climate-temp');
    let currentTemp = 22;

    document.querySelectorAll('.temp-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            if (this.classList.contains('plus') && currentTemp < 30) {
                currentTemp++;
            } else if (this.classList.contains('minus') && currentTemp > 16) {
                currentTemp--;
            }
            if (tempDisplay) tempDisplay.textContent = currentTemp;
        });
    });

    // Climate mode buttons
    document.querySelectorAll('.climate-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.climate-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Light buttons
    document.querySelectorAll('.light-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.light-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Seat buttons
    document.querySelectorAll('.seat-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const parent = this.closest('.seat-options');
            parent.querySelectorAll('.seat-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Ambient light colors
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Sidebar Navigation (re-binding)
    const sidebarItems = document.querySelectorAll('.nav-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            const screenName = item.dataset.screen;
            if (screenName) {
                // Trigger screen switch manually if needed or let the general listener handle it
            }
        });
    });

    // Camera System Logic
    window.toggleCamera = function (viewType) {
        const feed = document.getElementById('camera-feed-display');

        if (feed) {
            const placeholderText = feed.querySelector('span');
            feed.classList.remove('hidden');
            // Simulate loading different feeds
            if (viewType === 'reverse') {
                if (placeholderText) placeholderText.textContent = "Reversing Camera Feed";
                feed.style.background = "#1a1a1a";
            } else {
                if (placeholderText) placeholderText.textContent = "Blind Spot Monitoring";
                feed.style.background = "#0f172a";
            }
        }
    };

    window.closeCamera = function () {
        const feed = document.getElementById('camera-feed-display');
        if (feed) feed.classList.add('hidden');
    };

    // Navigation Exit
    const exitBtn = document.querySelector('.exit-btn');
    if (exitBtn) {
        exitBtn.addEventListener('click', () => {
            // Go back to Home
            const homeBtn = document.querySelector('.nav-item[data-screen="home"]');
            if (homeBtn) homeBtn.click();
        });
    }

    // General Toggle Buttons (Climate, etc.)
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            if (this.parentNode.classList.contains('climate-toggles')) {
                let siblings = this.parentNode.querySelectorAll('.toggle-btn');
                siblings.forEach(s => s.classList.remove('active'));
                this.classList.add('active');
            }
            else if (this.parentNode.classList.contains('airflow-toggles-expanded')) {
                let siblings = this.parentNode.querySelectorAll('.toggle-btn');
                siblings.forEach(s => s.classList.remove('active'));
                this.classList.add('active');
            }
            else if (this.parentNode.classList.contains('air-circulation-row')) {
                let siblings = this.parentNode.querySelectorAll('.toggle-btn');
                siblings.forEach(s => s.classList.remove('active'));
                this.classList.add('active');
            }
            else {
                this.classList.toggle('active');
            }
        });
    });

    // CarPlay Projection Logic
    window.launchCarPlay = function () {
        const overlay = document.getElementById('projection-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            // Update time on launch
            const statusBar = overlay.querySelector('.projection-status-bar .time');
            if (statusBar) {
                const now = new Date();
                statusBar.textContent = now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
            }
        }
    };

    window.exitCarPlay = function () {
        const overlay = document.getElementById('projection-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    };

    // Source Panel Switching (Mobile Screen)
    const sourceBtns = document.querySelectorAll('.source-btn');
    const sourcePanels = document.querySelectorAll('.source-panel');

    sourceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const source = btn.dataset.source;

            // Update active button
            sourceBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update active panel
            sourcePanels.forEach(panel => panel.classList.remove('active'));
            const targetPanel = document.getElementById(`panel-${source}`);
            if (targetPanel) targetPanel.classList.add('active');
        });
    });

    // Phone Tab Switching
    const phoneTabs = document.querySelectorAll('.phone-tab');
    const phoneContents = document.querySelectorAll('.phone-content');

    phoneTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            phoneTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            phoneContents.forEach(content => content.classList.remove('active'));
            if (targetTab === 'calls') {
                document.querySelector('.calls-list')?.classList.add('active');
            } else {
                document.querySelector('.messages-list')?.classList.add('active');
            }
        });
    });

    // Child Lock Toggle
    const childLockBtn = document.querySelector('.action-btn.child-lock');
    if (childLockBtn) {
        childLockBtn.addEventListener('click', () => {
            childLockBtn.classList.toggle('active');
        });
    }

    // Massage Toggle
    const massageToggles = document.querySelectorAll('.massage-toggle');
    massageToggles.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            btn.textContent = btn.classList.contains('active') ? 'ON' : 'OFF';
        });
    });

    // Zone Toggle (Interior Lighting)
    const zoneToggles = document.querySelectorAll('.zone-toggle');
    zoneToggles.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            btn.textContent = btn.classList.contains('active') ? 'ON' : 'OFF';
            const slider = btn.closest('.light-zone-row').querySelector('.light-slider');
            const valueSpan = btn.closest('.light-zone-row').querySelector('.light-value');
            if (slider && valueSpan) {
                if (!btn.classList.contains('active')) {
                    slider.value = 0;
                    valueSpan.textContent = '0%';
                } else {
                    slider.value = 100;
                    valueSpan.textContent = '100%';
                }
            }
        });
    });

    // Light Slider Value Update
    const lightSliders = document.querySelectorAll('.light-slider');
    lightSliders.forEach(slider => {
        slider.addEventListener('input', (e) => {
            const valueSpan = e.target.closest('.light-zone-row').querySelector('.light-value');
            if (valueSpan) valueSpan.textContent = e.target.value + '%';
        });
    });

    // Light Color Buttons
    const colorBtns = document.querySelectorAll('.color-btn');
    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            colorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Door Lock Buttons
    const doorBtns = document.querySelectorAll('.door-btn, .door-action-btn');
    doorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('locked');
        });
    });

    // Central Lock
    const centralLock = document.querySelector('.central-lock');
    if (centralLock) {
        centralLock.addEventListener('click', () => {
            const isLocked = centralLock.classList.contains('locked');
            if (isLocked) {
                centralLock.classList.remove('locked');
                doorBtns.forEach(btn => btn.classList.remove('locked'));
            } else {
                centralLock.classList.add('locked');
                doorBtns.forEach(btn => btn.classList.add('locked'));
            }
        });
    }

    // Media Screen - Tab Switching
    const panelTabs = document.querySelectorAll('.panel-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    panelTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            panelTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const targetTab = tab.dataset.tab;
            const target = document.querySelector(`.${targetTab}-tab`);
            if (target) target.classList.add('active');
        });
    });

    // Update CarPlay time dynamically
    const cpTimeEl = document.querySelector('.cp-time');
    if (cpTimeEl) {
        setInterval(() => {
            const now = new Date();
            const minutes = now.getMinutes().toString().padStart(2, '0');
            cpTimeEl.textContent = now.getHours() + ':' + minutes;
        }, 60000);
    }
}

// ============================================
// THREE.JS 3D CAR MODEL
// ============================================
function init3DModel() {
    const container = document.getElementById('car-3d-container');
    const canvas = document.getElementById('car-canvas');
    const loadingIndicator = document.getElementById('loading-indicator');
    const loadProgress = document.getElementById('load-progress');

    if (!container || !canvas) return;

    // Scene setup
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(5, 2, 5);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0x00d4ff, 0.5);
    directionalLight2.position.set(-5, 5, -5);
    scene.add(directionalLight2);

    // Cyan accent light from below
    const pointLight = new THREE.PointLight(0x00d4ff, 1.2, 15);
    pointLight.position.set(0, -2, 0);
    scene.add(pointLight);

    // Additional rim lights for better visibility
    const rimLight1 = new THREE.PointLight(0x00d4ff, 0.5, 10);
    rimLight1.position.set(-3, 1, 0);
    scene.add(rimLight1);

    const rimLight2 = new THREE.PointLight(0x00d4ff, 0.5, 10);
    rimLight2.position.set(3, 1, 0);
    scene.add(rimLight2);

    // Strong white ambient light for overall illumination
    const whiteAmbientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(whiteAmbientLight);

    // Front white key light
    const frontKeyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    frontKeyLight.position.set(0, 5, 5);
    scene.add(frontKeyLight);

    // Top fill light (white)
    const topFillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    topFillLight.position.set(0, 8, 0);
    scene.add(topFillLight);

    let carModel = null;
    let isModelLoaded = false;

    // Loading Manager
    const loadingManager = new THREE.LoadingManager();

    loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
        const progress = (itemsLoaded / itemsTotal) * 100;
        if (loadProgress) {
            loadProgress.style.width = progress + '%';
        }
    };

    loadingManager.onLoad = function () {
        setTimeout(() => {
            if (loadingIndicator) {
                loadingIndicator.style.opacity = '0';
                setTimeout(() => {
                    loadingIndicator.style.display = 'none';
                }, 300);
            }
            isModelLoaded = true;
        }, 500);
    };

    loadingManager.onError = function (url) {
        console.error('Error loading:', url);
        if (loadingIndicator) {
            loadingIndicator.innerHTML = '<span style="color: #ff4757;">Failed to load model</span>';
        }
    };

    // Load OBJ with MTL
    const mtlLoader = new THREE.MTLLoader(loadingManager);
    mtlLoader.setPath('model-3d/source/Rr ghost/');

    mtlLoader.load('rolls-royce ghost.mtl', function (materials) {
        materials.preload();

        // Apply custom materials for better appearance
        Object.keys(materials.materials).forEach(key => {
            const mat = materials.materials[key];
            mat.side = THREE.DoubleSide;

            // Make body metallic
            if (key === 'body' || key === 'main' || key.includes('spoil')) {
                mat.color = new THREE.Color(0x1a1a2e);
                mat.shininess = 100;
            }
            // Make chrome reflective
            if (key === 'chrome' || key.includes('MSS')) {
                mat.color = new THREE.Color(0x888888);
                mat.shininess = 200;
            }
            // Make glass transparent
            if (key === 'glass') {
                mat.transparent = true;
                mat.opacity = 0.3;
                mat.color = new THREE.Color(0x88ccff);
            }
            // Make lights glow
            if (key.includes('LICHTER') || key.includes('light')) {
                mat.emissive = new THREE.Color(0x00d4ff);
                mat.emissiveIntensity = 0.5;
            }
        });

        const objLoader = new THREE.OBJLoader(loadingManager);
        objLoader.setMaterials(materials);
        objLoader.setPath('model-3d/source/Rr ghost/');

        objLoader.load('rolls-royce ghost.obj', function (object) {
            carModel = object;

            // Center and scale the model
            const box = new THREE.Box3().setFromObject(carModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            // Scale to fit container - LARGER SIZE
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 8 / maxDim;
            carModel.scale.setScalar(scale);

            // Center the model
            carModel.position.x = -center.x * scale;
            carModel.position.y = -center.y * scale;
            carModel.position.z = -center.z * scale;

            // Enable shadows
            carModel.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            scene.add(carModel);

        }, function (xhr) {
            // Progress callback
            if (xhr.lengthComputable) {
                const percentComplete = (xhr.loaded / xhr.total) * 100;
                if (loadProgress) {
                    loadProgress.style.width = percentComplete + '%';
                }
            }
        }, function (error) {
            console.error('Error loading OBJ:', error);
        });

    }, function (xhr) {
        // MTL loading progress
    }, function (error) {
        console.error('Error loading MTL:', error);
    });

    // Orbit Controls (optional - for user interaction)
    let controls = null;
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.minPolarAngle = Math.PI / 3;
        controls.maxPolarAngle = Math.PI / 2;
    }

    // Animation loop
    let rotationAngle = 0;

    function animate() {
        requestAnimationFrame(animate);

        // Auto-rotate car if no controls
        if (carModel && !controls) {
            rotationAngle += 0.003;
            carModel.rotation.y = rotationAngle;
        }

        if (controls) {
            controls.update();
        }

        renderer.render(scene, camera);
    }

    animate();

    // Handle resize
    window.addEventListener('resize', function () {
        if (container) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    });
}


// ===================================
// CONTROLS V8 INTERACTION LOGIC (MINI-DOCKS)
// ===================================
document.addEventListener('click', function (e) {
    // Dock Item Click
    if (e.target.closest('.dock-item')) {
        const btn = e.target.closest('.dock-item');
        const targetId = btn.dataset.target;

        if (targetId) {
            // Toggle logic: If already active, close it.
            if (btn.classList.contains('active')) {
                document.querySelectorAll('.mini-panel-dock').forEach(p => p.classList.remove('active'));
                document.querySelectorAll('.dock-item').forEach(b => b.classList.remove('active'));
                return;
            }

            // Close all others
            document.querySelectorAll('.mini-panel-dock').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.dock-item').forEach(b => b.classList.remove('active'));

            // Open target
            const panel = document.getElementById(targetId);
            if (panel) {
                panel.classList.add('active');
                btn.classList.add('active');
            }
        }
    }

    // Close Mini Panel Button
    if (e.target.closest('.close-mini-btn')) {
        const panel = e.target.closest('.mini-panel-dock');
        if (panel) {
            panel.classList.remove('active');
            // Deactivate dock button
            document.querySelectorAll('.dock-item').forEach(b => b.classList.remove('active'));
        }
    }

    // Interactive Control Logic (Detail Panels)

    // 1. Color Picker
    if (e.target.closest('.mini-color-dot')) {
        const btn = e.target.closest('.mini-color-dot');
        const parent = btn.parentElement;
        parent.querySelectorAll('.mini-color-dot').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Add actual lighting change logic here if needed
    }

    // 2. Temp Modes / Drive Modes / General Buttons
    if (e.target.closest('.mini-btn')) {
        const btn = e.target.closest('.mini-btn');
        // Only toggle for mode groups, not simple action buttons if they exist
        const parent = btn.parentElement;
        if (parent) {
            parent.querySelectorAll('.mini-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
    }

    // Sidebar button toggle (active state)
    const sidebarBtns = document.querySelectorAll('.side-glass-btn');
    sidebarBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            // Special handling for Airflow button - toggle between two car icons
            if (this.title === 'Airflow') {
                const svg = this.querySelector('svg');
                const currentPaths = svg.innerHTML;

                // Check which state we're in and toggle
                if (currentPaths.includes('M3.75 6.75h16.5')) {
                    // Currently showing fresh air (arrows), switch to recirculation (car with circular arrow)
                    svg.innerHTML = `
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16 12l2-2 2 2" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 12c0 4.4 3.6 8 8 8s8-3.6 8-8" opacity="0.5"/>
                        <circle cx="12" cy="14" r="2" fill="currentColor" opacity="0.8"/>
                    `;
                } else {
                    // Currently showing recirculation, switch to fresh air (arrows)
                    svg.innerHTML = `
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l3 4-3 4" opacity="0.7"/>
                    `;
                }
            }

            this.classList.toggle('active');
        });
    });

    // Reverse Camera functionality - using event delegation for dynamically loaded content
    document.addEventListener('click', function (e) {
        // Open reverse camera
        if (e.target.closest('#btn-reverse-cam')) {
            const reverseCamOverlay = document.getElementById('reverse-camera-overlay');
            if (reverseCamOverlay) {
                reverseCamOverlay.style.display = 'block';
                setTimeout(() => {
                    reverseCamOverlay.style.opacity = '1';
                }, 10);
            }
        }

        // Close reverse camera
        if (e.target.closest('#close-reverse-cam')) {
            const reverseCamOverlay = document.getElementById('reverse-camera-overlay');
            if (reverseCamOverlay) {
                reverseCamOverlay.style.opacity = '0';
                setTimeout(() => {
                    reverseCamOverlay.style.display = 'none';
                }, 300);
            }
        }
    });

    // Hover effect for close button
    document.addEventListener('mouseenter', function (e) {
        if (e.target.matches('#close-reverse-cam')) {
            e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            e.target.style.transform = 'scale(1.1)';
        }
    }, true);

    document.addEventListener('mouseleave', function (e) {
        if (e.target.matches('#close-reverse-cam')) {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            e.target.style.transform = 'scale(1)';
        }
    }, true);
});

