#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const babel = require("@babel/core");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.jsx"), "utf8");
const { code } = babel.transformSync(source, {
  presets: [
    [
      "@babel/preset-react",
      {
        runtime: "classic",
        pragma: "React.createElement",
        pragmaFrag: "React.Fragment",
      },
    ],
  ],
  comments: false,
});

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NFTY — By Aug 1</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
  <div id="root">
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;color:#64748b">
      Loading org chart…
    </div>
  </div>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script>
    (function () {
      const showError = function (message) {
        var root = document.getElementById("root");
        if (!root) return;
        root.innerHTML =
          '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif">' +
          '<div style="max-width:480px;text-align:center">' +
          '<p style="font-weight:600;color:#b91c1c;margin:0 0 8px">Could not load org chart</p>' +
          '<p style="color:#64748b;font-size:14px;margin:0">' + message + "</p>" +
          '<p style="color:#94a3b8;font-size:12px;margin:16px 0 0">Try a hard refresh (Ctrl+Shift+R).</p>' +
          "</div></div>";
      };

      if (!window.React || !window.ReactDOM) {
        showError("A required script failed to load. Check your network or ad blocker.");
      }
    })();
  </script>
  <script>
${code}
  </script>
</body>
</html>
`;

const outDir = path.join(root, "public");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "index.html"), html);
fs.writeFileSync(path.join(root, "index.html"), html);
console.log("Built public/index.html (" + code.length + " bytes compiled app)");
