```javascript
window.BENCHMARK_PRESSES = 29;
window.BENCHMARK_SWEEPS = 4;
window.BENCHMARK_DELAY = 300;
window.BENCHMARK_DISPLAY_CANVAS = true;

function injectScript(url) {
  const script = document.createElement("script");
  script.src = url;
  script.async = true; // load asynchronously
  script.defer = true; // optional: defer execution
  document.head.appendChild(script);
}

injectScript("https://jeremies.github.io/performance-tv-scripts/benchmark.js");
```
