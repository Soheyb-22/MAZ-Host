// Handling cache
// Caching is now handled by cache.html + iframe_cache.js for firmware based caching
// This way we dont cache just everyhting for everyone. faster caching.

// Redirect to http if on webkitty.arabpixel.net and using https
if (window.location.protocol === 'https:'
    && window.location.hostname === 'webkitty.arabpixel.net'
    && isPS4) {
    const httpUrl = new URL(window.location.href);
    httpUrl.protocol = 'http:';
    window.location.replace(httpUrl.href);
}

window.addEventListener('load', function () {
    // check for applicationCache only on PS4
    if (isPS4 && (!window.applicationCache || window.applicationCache.status === window.applicationCache.UNCACHED) && !devMode) {
        // Not cached! Redirecting...
        window.location.href = './cache.html';
    }
})

// Still not used anywhere because I'm not sure how useful this can be.
function terminateCache() {
    if (window.applicationCache) {
        // Status 3 is 'downloading', Status 1 is 'checking'
        if (window.applicationCache.status === 3 || window.applicationCache.status === 1) {
            console.log("Terminating cache process to save memory...");
            window.applicationCache.abort();
            document.title = projectName;
            window.applicationCache.removeEventListener("progress", null);
            window.applicationCache.oncached = null;
            window.applicationCache.onupdateready = null;
        }
    }
}