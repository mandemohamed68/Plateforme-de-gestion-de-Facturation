import fs from 'fs';

const dbPath = './data/db_store.json';
if (fs.existsSync(dbPath)) {
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  
  if (data.dbProductTemplates) {
    const tmplNFS = data.dbProductTemplates.find((t) => t.name === "NFS / Hémogramme Complet (Numération Formule Sanguine)");
    const tmplCustom = data.dbProductTemplates.find((t) => t.name === "Hémogramme (NFS)");

    if (tmplCustom && tmplNFS) {
      console.log("Updating custom Hémogramme (NFS) with tests...");
      tmplCustom.lab_tests = tmplNFS.lab_tests;
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
      console.log("Custom template updated.");
    }
  }
}
