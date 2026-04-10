/**
 * =============================================================================
 * NETWORK SERVICE (NetSvc)
 * =============================================================================
 * Handles all external connectivity and firewall validation checks.
 * * WHY: Hospital and corporate environments have strict firewalls. 
 * This service verifies if required TMS domains (like NextGen or Google) 
 * are whitelisted on the host machine's network.
 */

const https = require('node:https');

const NetSvc = {
    // =========================================================================
    // --- CONNECTIVITY DIAGNOSTICS ---
    // =========================================================================

    /**
     * [NETWORK] Single URL Firewall Check
     * Tests if a specific URL can be reached through the local network.
     * * * WHY IT IS BUILT THIS WAY:
     * 1. MASQUERADING: Some Web Application Firewalls (WAFs) block raw Node.js 
     * requests. We pass 'User-Agent' and 'Accept' headers to look like Chrome.
     * 2. SSL BYPASS: 'rejectUnauthorized: false' allows us to ping internal or 
     * proxy servers that might have self-signed SSL certificates.
     * * @param {string} urlStr - The full URL to ping (must include https://).
     * @returns {Promise<boolean>} True if the domain is reachable/whitelisted.
     */
    checkUrl: (urlStr) => new Promise(res => {
        const options = {
            timeout: 5000, // 5-second max wait time so the UI doesn't hang forever
            rejectUnauthorized: false,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml'
            }
        };

        const req = https.get(urlStr, options, (response) => {
            // We don't actually care about the HTML body, so we just resume/discard the data stream
            response.resume(); 
            
            // 🚨 THE "FIREWALL PROOF" LOGIC 🚨
            // We accept any status code < 500. 
            // If the server returns 401 (Unauthorized) or 403 (Forbidden), it means 
            // the server IS reachable, and the local network firewall whitelisted it! 
            // We don't care if we aren't logged in; we only care that the pipe is open.
            // It is only truly blocked if it times out or returns 500+ (Server Dead).
            res(response.statusCode >= 200 && response.statusCode < 500);
            
        }).on('error', () => res(false)); // Network disconnected, DNS failed, or strictly blocked
        
        // Manual timeout fallback in case the socket hangs without emitting an error
        req.setTimeout(5000, () => { 
            req.destroy(); 
            res(false); 
        }); 
    }),

    /**
     * [NETWORK] Batch URL Validator
     * Takes the UI's monitor configuration and pings everything concurrently.
     * * * WHY WE USE Promise.all: We don't want to wait 5 seconds for Google, 
     * and then 5 seconds for Deploy, etc. Promise.all runs them simultaneously, 
     * meaning the entire scan takes a maximum of 5 seconds total.
     * * @param {Object} monitorConfig - Key-value pair of URLs from NET_CNF.monitors.
     * @returns {Promise<Object>} Results mapped to their keys (e.g., { google: true, deploy: false }).
     */
    checkAllUrls: async (monitorConfig) => {
        const results = {};
        
        // Wait for all HTTP requests to finish at the same time
        await Promise.all(
            Object.entries(monitorConfig).map(async ([key, url]) => {
                results[key] = await NetSvc.checkUrl(url);
            })
        );
        
        return results;
    }
}

module.exports = NetSvc;