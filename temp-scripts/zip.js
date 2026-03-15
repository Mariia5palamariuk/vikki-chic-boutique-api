const fs = require("fs");
const archiver = require("archiver");

const output = fs.createWriteStream("vikki-chic-boutique-api.zip");
const archive = archiver("zip", {
  zlib: { level: 9 }
});

output.on("close", () => {
  console.log("Archive created:", archive.pointer(), "bytes");
});

archive.on("error", (err) => {
  throw err;
});

archive.pipe(output);

// додаємо файли у zip
archive.file("index.js", { name: "index.js" });
archive.file("package.json", { name: "package.json" });

archive.finalize();