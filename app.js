document.addEventListener("DOMContentLoaded", () => {
    initCanvasString();
    initCanvasOrbit();
});

// Utility to get mouse/touch position safely accounting for canvas scaling
function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Check if it's a touch event
    let clientX = evt.clientX;
    let clientY = evt.clientY;
    if (evt.touches && evt.touches.length > 0) {
        clientX = evt.touches[0].clientX;
        clientY = evt.touches[0].clientY;
    } else if (evt.changedTouches && evt.changedTouches.length > 0) {
        clientX = evt.changedTouches[0].clientX;
        clientY = evt.changedTouches[0].clientY;
    }

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// -------------------------------------------------------------
// Section 1: The String Trick (Geometry of Ellipse)
// -------------------------------------------------------------
function initCanvasString() {
    const canvas = document.getElementById("canvasString");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    const sliderA = document.getElementById("sliderA");
    const sliderB = document.getElementById("sliderB");
    const sliderC = document.getElementById("sliderC");
    
    // UI Value placeholders
    const valA = document.getElementById("valA");
    const valB = document.getElementById("valB");
    const valC = document.getElementById("valC");

    const cx = canvas.width / 2;
    const cy = canvas.height / 2; 
    
    // Initial geometric state
    let a = parseFloat(sliderA.value); 
    let b = parseFloat(sliderB.value);   
    let c = Math.sqrt(a*a - b*b); 
    sliderC.value = c; // ensure synced initially

    const uiScale = 50 / 280; // Keep the '50.0' visual scale paradigm

    function updateC_from_ab() {
        if (b > a) { b = a; sliderB.value = b; }
        c = Math.sqrt(a*a - b*b);
        sliderC.value = c;
    }

    function updateB_from_ac() {
        if (c > a) { c = a; sliderC.value = c; }
        b = Math.sqrt(a*a - c*c);
        sliderB.value = b;
    }

    sliderA.addEventListener('input', (e) => {
        a = parseFloat(e.target.value);
        sliderB.max = a; sliderC.max = a;
        updateC_from_ab(); draw();
    });

    sliderB.addEventListener('input', (e) => {
        b = parseFloat(e.target.value);
        updateC_from_ab(); draw();
    });

    sliderC.addEventListener('input', (e) => {
        c = parseFloat(e.target.value);
        updateB_from_ac(); draw();
    });
    
    let isInteracting = false;
    let pointAngle = -Math.PI / 4; 

    function getEllipsePoint(angle) {
        return {
            x: cx + a * Math.cos(angle),
            y: cy + b * Math.sin(angle)
        };
    }

    let currentPoint = getEllipsePoint(pointAngle);

    // Math UI References
    const d1Color = document.querySelector('.d1-color');
    const d2Color = document.querySelector('.d2-color');
    const totalColor = document.querySelector('.total-color');

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let currentPoint = getEllipsePoint(pointAngle);
        const f1 = { x: cx - c, y: cy };
        const f2 = { x: cx + c, y: cy };

        // 1. Draw Ellipse Path (Dashed)
        ctx.beginPath();
        ctx.ellipse(cx, cy, a, b, 0, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.setLineDash([8, 12]);
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.setLineDash([]);

        // 2. Draw Foci
        ctx.fillStyle = "#fb923c"; // Orange for foci points
        ctx.shadowColor = "#fb923c";
        ctx.shadowBlur = 10;
        
        ctx.beginPath(); ctx.arc(f1.x, f1.y, 8, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(f2.x, f2.y, 8, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0; // Reset

        // 3. Draw Lines from Foci to Point
        // D1 (Focus 1 to Point)
        ctx.beginPath();
        ctx.moveTo(f1.x, f1.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.strokeStyle = "#38bdf8"; 
        ctx.lineWidth = 3;
        ctx.stroke();

        // D2 (Focus 2 to Point)
        ctx.beginPath();
        ctx.moveTo(f2.x, f2.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.strokeStyle = "#c084fc"; 
        ctx.stroke();

        // 4. Draw User Point
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(currentPoint.x, currentPoint.y, 16, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw smaller inner ring on the point
        ctx.fillStyle = "#0f172a";
        ctx.beginPath(); ctx.arc(currentPoint.x, currentPoint.y, 6, 0, Math.PI*2); ctx.fill();

        // 5. Update HTML UI Distances
        const d1 = Math.hypot(currentPoint.x - f1.x, currentPoint.y - f1.y);
        const d2 = Math.hypot(currentPoint.x - f2.x, currentPoint.y - f2.y);
        
        const d1Scaled = (d1 * uiScale).toFixed(1);
        const d2Scaled = (d2 * uiScale).toFixed(1);
        const totalScaled = (d1 * uiScale + d2 * uiScale).toFixed(1);

        if(d1Color) d1Color.textContent = d1Scaled;
        if(d2Color) d2Color.textContent = d2Scaled;
        if(totalColor) totalColor.textContent = totalScaled;

        // Update Slider Labels
        if(valA) valA.textContent = (a * uiScale).toFixed(1);
        if(valB) valB.textContent = (b * uiScale).toFixed(1);
        if(valC) valC.textContent = (c * uiScale).toFixed(1);
    }

    // Interaction handler
    function handleMove(e) {
        if (!isInteracting && e.type.includes('touch')) return; 
        
        const pos = getMousePos(canvas, e);
        pointAngle = Math.atan2(pos.y - cy, pos.x - cx);
        draw();
    }

    // Add Events
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleMove(e); }, { passive: false });
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleMove(e); }, { passive: false });
    
    // Initial paint
    draw();
}

// -------------------------------------------------------------
// Section 2: Space Orbits (Kepler's First/Second Law)
// -------------------------------------------------------------
function initCanvasOrbit() {
    const canvas = document.getElementById("canvasOrbit");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    const slider = document.getElementById("eccentricity");
    const eccValText = document.getElementById("eccVal");
    const scaleSlider = document.getElementById("orbitScale");
    const scaleValText = document.getElementById("orbitScaleVal");

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    let a = 170; // initial semi-major axis

    let e = parseFloat(slider.value); 
    if(scaleSlider) {
        a = parseFloat(scaleSlider.value);
    }
    let planetAngle = 0; 

    const uiScale = 50 / 170; // fixed visual units mapping

    function drawSystem() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Recalculate based on current eccentricity
        const c = a * e; 
        const b = a * Math.sqrt(1 - e*e); 

        // Update HTML Stats
        const displayA = a * uiScale;
        const displayC = c * uiScale;
        const displayB = b * uiScale;
        
        const periVal = document.getElementById('periVal');
        const aphVal = document.getElementById('aphVal');
        const majorVal2 = document.getElementById('majorVal2');
        const minorVal = document.getElementById('minorVal');
        
        if (periVal) periVal.textContent = (displayA - displayC).toFixed(1);
        if (aphVal) aphVal.textContent = (displayA + displayC).toFixed(1);
        if (majorVal2) majorVal2.textContent = displayA.toFixed(1);
        if (minorVal) minorVal.textContent = displayB.toFixed(1);

        // Sun sits at Focus 1 
        const sunX = cx - c;
        const sunY = cy;

        // 1. Draw Orbit Path
        ctx.beginPath();
        ctx.ellipse(cx, cy, a, b, 0, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 3;
        ctx.stroke();

        // 2. Draw Center + Empty Focus subtly
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI*2); ctx.fill(); // Center
        ctx.beginPath(); ctx.arc(cx + c, cy, 3, 0, Math.PI*2); ctx.fill(); // Empty focus
        
        ctx.font = "12px 'Outfit', sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillText("Center", cx - 18, cy + 18);
        ctx.fillText("Empty Focus", cx + c - 30, cy + 18);

        // 3. Draw The Sun (Glowing Pulse)
        const sunGradient = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 35);
        sunGradient.addColorStop(0, "#fef08a");
        sunGradient.addColorStop(0.3, "#fb923c");
        sunGradient.addColorStop(1, "rgba(251, 146, 60, 0)");
        
        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 35, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "14px 'Outfit', sans-serif";
        ctx.fillText("Sun", sunX - 12, sunY + 45);

        // 4. Planet Position using Polar Equation for Ellipse
        // r = a(1-e^2) / (1 - e*cos(θ))
        const r = (a * (1 - e*e)) / (1 - e * Math.cos(planetAngle));
        
        const planetX = sunX + r * Math.cos(planetAngle);
        const planetY = sunY + r * Math.sin(planetAngle);

        // 5. Draw Planet
        ctx.fillStyle = "#38bdf8";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(planetX, planetY, 10, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw motion trail (string back to sun to show sweep)
        ctx.beginPath();
        ctx.moveTo(sunX, sunY);
        ctx.lineTo(planetX, planetY);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // 6. Advance Angle (Kepler's Second Law Approximation)
        // Sweeps equal areas in equal times = speed proportional to 1/r^2
        const baseSpeed = 0.012;
        const speedMultiplier = Math.pow(a / r, 2); 
        planetAngle += baseSpeed * speedMultiplier;
        
        requestAnimationFrame(drawSystem);
    }

    if(slider) {
        slider.addEventListener('input', (evt) => {
            e = parseFloat(evt.target.value);
            if(eccValText) eccValText.textContent = e.toFixed(2);
        });
    }
    if(scaleSlider) {
        scaleSlider.addEventListener('input', (evt) => {
            a = parseFloat(evt.target.value);
            if(scaleValText) scaleValText.textContent = (a * uiScale).toFixed(1);
        });
    }

    // Start Animation Loop
    drawSystem();
}
