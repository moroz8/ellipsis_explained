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
    
    // Define ellipse geometry
    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 20; // shifted slightly down for UI space
    const a = 280; // semi-major axis (width)
    const b = 160;   // semi-minor axis (height)
    const c = Math.sqrt(a*a - b*b); // focus distance from center
    
    // Foci positions
    const f1 = { x: cx - c, y: cy };
    const f2 = { x: cx + c, y: cy };

    let isInteracting = false;
    let pointAngle = -Math.PI / 4; // Start at a nice initial angle

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

        // 1. Draw Ellipse Path (Dashed)
        ctx.beginPath();
        ctx.ellipse(cx, cy, a, b, 0, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.setLineDash([5, 8]);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);

        // 2. Draw Foci
        ctx.fillStyle = "#fb923c"; // Orange for foci points
        ctx.shadowColor = "#fb923c";
        ctx.shadowBlur = 10;
        
        ctx.beginPath(); ctx.arc(f1.x, f1.y, 6, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(f2.x, f2.y, 6, 0, Math.PI*2); ctx.fill();
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
        ctx.arc(currentPoint.x, currentPoint.y, 10, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw smaller inner ring on the point
        ctx.fillStyle = "#0f172a";
        ctx.beginPath(); ctx.arc(currentPoint.x, currentPoint.y, 4, 0, Math.PI*2); ctx.fill();

        // 5. Update HTML UI Distances
        const d1 = Math.hypot(currentPoint.x - f1.x, currentPoint.y - f1.y);
        const d2 = Math.hypot(currentPoint.x - f2.x, currentPoint.y - f2.y);
        
        // Scale to an arbitrary nice unit (e.g. Total = 100)
        const scale = 100 / (a * 2); 
        const d1Scaled = (d1 * scale).toFixed(1);
        const d2Scaled = (d2 * scale).toFixed(1);
        const totalScaled = (d1 * scale + d2 * scale).toFixed(1);

        if(d1Color) d1Color.textContent = d1Scaled;
        if(d2Color) d2Color.textContent = d2Scaled;
        if(totalColor) totalColor.textContent = totalScaled;
    }

    // Interaction handler
    function handleMove(e) {
        if (!isInteracting && e.type.includes('touch')) return; 
        
        const pos = getMousePos(canvas, e);
        // Find angle logic relative to center
        pointAngle = Math.atan2(pos.y - cy, pos.x - cx);
        currentPoint = getEllipsePoint(pointAngle);
        draw();
    }

    // Add Events
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleMove(e); }, { passive: false });
    
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

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const a = 260; // semi-major axis

    let e = parseFloat(slider.value); // eccentricity
    let planetAngle = 0; // True anomaly roughly

    function drawSystem() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Recalculate based on current eccentricity
        const c = a * e; 
        const b = a * Math.sqrt(1 - e*e); 

        // Sun sits at Focus 1 
        const sunX = cx - c;
        const sunY = cy;

        // 1. Draw Orbit Path
        ctx.beginPath();
        ctx.ellipse(cx, cy, a, b, 0, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 2;
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

    // Start Animation Loop
    drawSystem();
}
