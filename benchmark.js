(function () {
  if (window.__benchmarkRunning) return;
  window.__benchmarkRunning = true;

  // Configuration
  var TOTAL_CYCLES = 2;
  var NAV_DELAY_MS = 300;
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
    document.body.appendChild(overlay);

    function updateStatus(text) {
      overlay.textContent = text;
      console.log("[Benchmark]", text);
    }

    // Custom FPS Tracking
    var fpsValues = [];
    var tracking = false;
    var frames = 0;
    var startTime = performance.now();

    function animate() {
      var now = performance.now();
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
      var stepText =
        "Cycle " +
        (cycle + 1) +
        "/" +
        TOTAL_CYCLES +
        " - " +
        (direction === "down" ? "Down" : "Up") +
        " " +
        (stepIndex + 1) +
        "/" +
        PRESSES_PER_CYCLE;

      updateStatus(stepText);
      simulateKeyDown(key);

      setTimeout(function () {
        runLoop(cycle, stepIndex + 1, direction);
      }, NAV_DELAY_MS);
    }

    function finishBenchmark() {
      tracking = false;
      if (fpsValues.length > 0) {
        var sum = 0;
        for (var i = 0; i < fpsValues.length; i++) {
          sum += fpsValues[i];
        }
        var avg = sum / fpsValues.length;
        var min = Math.min.apply(null, fpsValues);
        var max = Math.max.apply(null, fpsValues);

        updateStatus(
          "Done! Avg: " +
            avg.toFixed(1) +
            " FPS | Min: " +
            min.toFixed(1) +
            " | Max: " +
            max.toFixed(1)
        );
      } else {
        updateStatus("Done! No FPS samples collected.");
      }
    }
  }

  run();
})();
