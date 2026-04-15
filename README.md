window.BENCHMARK_PRESSES = 29;

function injectScript(url) {
const script = document.createElement("script");
script.src = url;
script.async = true; // load asynchronously
script.defer = true; // optional: defer execution
document.head.appendChild(script);
}

injectScript("https://jeremies.github.io/performance-tv-scripts/benchmark.js");
