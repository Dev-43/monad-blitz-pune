const https = require("https");

function fetchUrl(url) {
  https.get(url, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log(`Redirecting to: ${res.headers.location}`);
      fetchUrl(res.headers.location);
      return;
    }
    
    let data = "";
    res.on("data", (chunk) => { data += chunk; });
    res.on("end", () => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.status === "1") {
          console.log("ABI retrieved successfully:");
          console.log(JSON.stringify(JSON.parse(parsed.result), null, 2));
        } else {
          console.log("Failed to get ABI:", parsed.message || parsed.result);
        }
      } catch (err) {
        console.log("Error parsing response:", err.message);
        console.log("Raw response:", data);
      }
    });
  }).on("error", (err) => {
    console.log("Error fetching ABI:", err.message);
  });
}

const url = "https://testnet.monadexplorer.com/api?module=contract&action=getabi&address=0x8004A818BFB912233c491871b3d84c89A494BD9e";
fetchUrl(url);
