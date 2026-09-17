const fs = require("fs");
const html = fs.readFileSync("index.html", "utf8");

const jsFiles = ["js/advisor-auth.js", "js/leads-storage.js", "js/campaigns-manager.js", "js/vocational-test.js", "js/uide-form-logic.js", "js/app.js"];
let referenced = [];

jsFiles.forEach(file => {
    const code = fs.readFileSync(file, "utf8");
    const re = /getElementById\(['"]([^'"]+)['"]\)/g;
    let match;
    while ((match = re.exec(code)) !== null) {
        referenced.push({ id: match[1], file });
    }
});

let missing = [];
referenced.forEach(({ id, file }) => {
    const re = new RegExp(`id=["']${id}["']`);
    if (!re.test(html)) {
        missing.push({ id, file });
    }
});

if (missing.length > 0) {
    console.error("Missing IDs found in index.html:", missing);
    process.exit(1);
} else {
    console.log(`SUCCESS: All ${referenced.length} referenced element IDs exist in index.html!`);
}
