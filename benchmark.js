(function () {
  window.runBenchmark = function () {
    // Configuration
    var TOTAL_SWEEPS = window.BENCHMARK_SWEEPS || 4;
    // Delay between key presses. Can be overridden via window.BENCHMARK_DELAY
    var NAV_DELAY_MS = window.BENCHMARK_DELAY || 300;
    // Number of times to press down/up per sweep. Can be overridden via window.BENCHMARK_PRESSES
    var PRESSES_PER_SWEEP = window.BENCHMARK_PRESSES || 40;
    // Display the canvas graphic at the end. Can be overridden via window.BENCHMARK_DISPLAY_CANVAS
    var DISPLAY_CANVAS = window.BENCHMARK_DISPLAY_CANVAS !== false;

    if (window._benchmarkRafId) {
      cancelAnimationFrame(window._benchmarkRafId);
    }
    if (window._benchmarkTimeoutId) {
      clearTimeout(window._benchmarkTimeoutId);
    }

    simulateKeyDown("ArrowRight");

  function simulateKeyDown(key) {
    var keyCode = 0;
    if (key === "ArrowDown") keyCode = 40;
    else if (key === "ArrowUp") keyCode = 38;
    else if (key === "ArrowRight") keyCode = 39;
    else if (key === "ArrowLeft") keyCode = 37;

    var target = document.activeElement || document.body;

    var downEvent = document.createEvent("Event");
    downEvent.initEvent("keydown", true, true);
    downEvent.key = key;
    downEvent.code = key;
    downEvent.keyCode = keyCode;
    downEvent.which = keyCode;
    target.dispatchEvent(downEvent);

    // Add a slight delay and dispatch keyup, as some libraries wait for it to unblock
    setTimeout(function () {
      var upEvent = document.createEvent("Event");
      upEvent.initEvent("keyup", true, true);
      upEvent.key = key;
      upEvent.code = key;
      upEvent.keyCode = keyCode;
      upEvent.which = keyCode;
      target.dispatchEvent(upEvent);
    }, 50);
  }

  function run() {
    // Create a status overlay
    var existingOverlay = document.getElementById("benchmark-overlay");
    if (existingOverlay) existingOverlay.remove();

    var overlay = document.createElement("div");
    overlay.id = "benchmark-overlay";
    overlay.style.position = "absolute";
    overlay.style.top = "20px";
    overlay.style.right = "120px";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    overlay.style.color = "white";
    overlay.style.padding = "10px 20px";
    overlay.style.borderRadius = "8px";
    overlay.style.fontFamily = "monospace";
    overlay.style.fontSize = "20px";
    overlay.style.zIndex = "999999";
    overlay.style.pointerEvents = "none";
    overlay.style.whiteSpace = "pre-wrap";
    document.body.appendChild(overlay);

    function updateStatus(text) {
      overlay.textContent = text;
      console.log("[Benchmark]", text);
    }

    // Custom FPS Tracking
    var fpsValues = [];
    var fpsDeltas = [];
    var msValues = [];
    var tracking = false;
    var frames = 0;
    var startTime = performance.now();
    var lastFrameTime = performance.now();

    function animate() {
      var now = performance.now();
      if (tracking) {
        msValues.push(now - lastFrameTime);
      }
      lastFrameTime = now;

      frames++;
      if (now >= startTime + 1000) {
        // TODO ignore really low fps which occur during page load or transitions. frames > 5?
        if (tracking) {
          // ignore < 5 fps stutters just like original benchmark
          var duration = now - startTime;
          fpsValues.push((frames * 1000) / duration);
          fpsDeltas.push(duration / 1000);
        }
        frames = 0;
        startTime = now;
      }

      window._benchmarkRafId = requestAnimationFrame(animate);
    }
    window._benchmarkRafId = requestAnimationFrame(animate);

    updateStatus("Starting benchmark in 2 seconds...");

    window._benchmarkTimeoutId = setTimeout(function () {
      tracking = true;
      runLoop(0, 0);
    }, 2000);

    // Loop logic to replace async/await
    function runLoop(sweep, stepIndex) {
      if (sweep >= TOTAL_SWEEPS) {
        finishBenchmark();
        return;
      }

      if (stepIndex >= PRESSES_PER_SWEEP) {
        runLoop(sweep + 1, 0);
        return;
      }

      var key = sweep % 2 === 0 ? "ArrowDown" : "ArrowUp";

      var stepText =
        "Sweep " +
        (sweep + 1) +
        "/" +
        TOTAL_SWEEPS +
        " - " +
        (sweep % 2 === 0 ? "Down" : "Up") +
        " " +
        (stepIndex + 1) +
        "/" +
        PRESSES_PER_SWEEP;

      updateStatus(stepText);

      simulateKeyDown(key);

      window._benchmarkTimeoutId = setTimeout(function () {
        runLoop(sweep, stepIndex + 1);
      }, NAV_DELAY_MS);
    }

    function finishBenchmark() {
      tracking = false;
      cancelAnimationFrame(window._benchmarkRafId);

      var configText = "\nConfig: Sweeps=" + TOTAL_SWEEPS + 
                       " | Delay=" + NAV_DELAY_MS + "ms" +
                       " | Presses=" + PRESSES_PER_SWEEP + 
                       " | Canvas=" + DISPLAY_CANVAS +
                       "\nURL: " + window.location.href +
                       "\nUA: " + navigator.userAgent;

      if (fpsValues.length > 0) {
        var sumFps = 0;
        var integralFps = 0;
        for (var i = 0; i < fpsValues.length; i++) {
          sumFps += fpsValues[i];
          integralFps += fpsValues[i] * fpsDeltas[i]; // value * dt
        }
        var avgFps = sumFps / fpsValues.length;
        var minFps = Math.min.apply(null, fpsValues);
        var maxFps = Math.max.apply(null, fpsValues);

        var sumMs = 0;
        var integralMs = 0;
        for (var j = 0; j < msValues.length; j++) {
          sumMs += msValues[j];
          integralMs += msValues[j] * msValues[j]; // value * dt (since dt is msValues[j])
        }
        var avgMs = msValues.length > 0 ? sumMs / msValues.length : 0;
        var minMs = msValues.length > 0 ? Math.min.apply(null, msValues) : 0;
        var maxMs = msValues.length > 0 ? Math.max.apply(null, msValues) : 0;

        updateStatus(
          "Done!\n" +
            "FPS - Avg: " +
            avgFps.toFixed(1) +
            " | Min: " +
            minFps.toFixed(1) +
            " | Max: " +
            maxFps.toFixed(1) +
            " | Int: " +
            integralFps.toFixed(1) +
            "\n" +
            "MS  - Avg: " +
            avgMs.toFixed(1) +
            " | Min: " +
            minMs.toFixed(1) +
            " | Max: " +
            maxMs.toFixed(1) +
            " | Int: " +
            integralMs.toFixed(1) +
            configText
        );

        if (DISPLAY_CANVAS) {
          var canvas = document.createElement("canvas");
          canvas.width = 400;
          canvas.height = 150;
          canvas.style.marginTop = "15px";
          canvas.style.display = "block";
          overlay.appendChild(canvas);

          var ctx = canvas.getContext("2d");
          ctx.fillStyle = "#111";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw MS Values (Red)
          if (msValues.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = "rgba(255, 70, 70, 0.8)";
            ctx.lineWidth = 1;
            for (var j = 0; j < msValues.length; j++) {
              var xMs = (j / (msValues.length - 1 || 1)) * canvas.width;
              var yMs = canvas.height - (msValues[j] / (Math.max(60, maxMs) || 1)) * canvas.height;
              if (j === 0) ctx.moveTo(xMs, yMs);
              else ctx.lineTo(xMs, yMs);
            }
            ctx.stroke();
          }

          // Draw FPS Values (Green)
          if (fpsValues.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = "rgba(70, 255, 70, 0.8)";
            ctx.lineWidth = 2;
            for (var i = 0; i < fpsValues.length; i++) {
              var xFps = (i / (fpsValues.length - 1 || 1)) * canvas.width;
              var yFps = canvas.height - (fpsValues[i] / (Math.max(60, maxFps) || 1)) * canvas.height;
              if (i === 0) ctx.moveTo(xFps, yFps);
              else ctx.lineTo(xFps, yFps);
            }
            ctx.stroke();
          }

          // Legend
          ctx.font = "12px monospace";
          ctx.fillStyle = "rgba(70, 255, 70, 0.8)";
          ctx.fillText("FPS", 10, 20);
          ctx.fillStyle = "rgba(255, 70, 70, 0.8)";
          ctx.fillText("MS", 10, 36);
        }
      } else {
        updateStatus("Done! No samples collected." + configText);
      }
    }
  }

    run();
  };

  // Run automatically when loaded
  window.runBenchmark();
})();
