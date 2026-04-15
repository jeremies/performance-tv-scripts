(function () {
  // Configuration
  var TOTAL_CYCLES = 2;
  // Delay between key presses. Can be overridden via window.BENCHMARK_DELAY
  var NAV_DELAY_MS = window.BENCHMARK_DELAY || 300;
  // Number of times to press down/up per cycle. Can be overridden via window.BENCHMARK_PRESSES
  var PRESSES_PER_CYCLE = window.BENCHMARK_PRESSES || 40;

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
    var overlay = document.createElement("div");
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
          fpsValues.push((frames * 1000) / (now - startTime));
        }
        frames = 0;
        startTime = now;
      }

      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    updateStatus("Starting benchmark in 2 seconds...");

    setTimeout(function () {
      tracking = true;
      runLoop(0, 0, "down");
    }, 2000);

    // Loop logic to replace async/await
    function runLoop(cycle, stepIndex, direction) {
      if (cycle >= TOTAL_CYCLES) {
        finishBenchmark();
        return;
      }

      if (stepIndex >= PRESSES_PER_CYCLE) {
        if (direction === "down") {
          runLoop(cycle, 0, "up");
        } else {
          runLoop(cycle + 1, 0, "down");
        }
        return;
      }

      var key = direction === "down" ? "ArrowDown" : "ArrowUp";

      simulateKeyDown(key);

      setTimeout(function () {
        runLoop(cycle, stepIndex + 1, direction);
      }, NAV_DELAY_MS);
    }

    function finishBenchmark() {
      tracking = false;
      if (fpsValues.length > 0) {
        var sumFps = 0;
        for (var i = 0; i < fpsValues.length; i++) {
          sumFps += fpsValues[i];
        }
        var avgFps = sumFps / fpsValues.length;
        var minFps = Math.min.apply(null, fpsValues);
        var maxFps = Math.max.apply(null, fpsValues);

        var sumMs = 0;
        for (var j = 0; j < msValues.length; j++) {
          sumMs += msValues[j];
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
            "\n" +
            "MS  - Avg: " +
            avgMs.toFixed(1) +
            " | Min: " +
            minMs.toFixed(1) +
            " | Max: " +
            maxMs.toFixed(1)
        );
      } else {
        updateStatus("Done! No samples collected.");
      }
    }
  }

  run();
})();
