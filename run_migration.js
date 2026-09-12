import fs from 'fs';

// Read the db_store.json
const dbPath = './data/db_store.json';
if (fs.existsSync(dbPath)) {
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  
  if (data.dbLabOrders && data.dbProductTemplates) {
    console.log("Migrating lab orders...");
    data.dbLabOrders.forEach((order) => {
      // Re-populate parameters for ALL orders to ensure they are correct
      const paramsList = [];
      let pIdx = 0;
      const expandedExams = new Set();
      
      order.exam_names.forEach((exName) => {
        const exNameLower = exName.trim().toLowerCase();
        const tmpl = data.dbProductTemplates.find((t) => t.name.trim().toLowerCase() === exNameLower);
        if (tmpl && tmpl.category_type === 'lab_profile' && tmpl.lab_profile_exams) {
          tmpl.lab_profile_exams.forEach((subEx) => expandedExams.add(subEx));
        } else {
          expandedExams.add(exName.trim());
        }
      });

      expandedExams.forEach((itName) => {
        const tmpl = data.dbProductTemplates.find((t) => t.name.trim().toLowerCase() === itName.toLowerCase());
        if (tmpl && tmpl.lab_tests && tmpl.lab_tests.length > 0) {
          tmpl.lab_tests.forEach((test) => {
            paramsList.push({
              id: "p-" + order.id + "-" + (pIdx++),
              name: test.name,
              value: '',
              unit: test.unit || '',
              reference_range: test.reference_range || 'Normal',
              is_abnormal: false,
              exam_name: itName
            });
          });
        } else {
          paramsList.push({
            id: "p-" + order.id + "-" + (pIdx++),
            name: itName,
            value: '',
            unit: '',
            reference_range: tmpl?.lab_reference_range || 'Normal',
            is_abnormal: false,
            exam_name: itName
          });
        }
      });

      // Preserve existing values if parameter name matches
      paramsList.forEach(newParam => {
        const existing = (order.parameters || []).find((p) => p.name === newParam.name);
        if (existing) {
          newParam.value = existing.value;
          newParam.is_abnormal = existing.is_abnormal;
        }
      });

      order.exam_names = Array.from(expandedExams);
      order.parameters = paramsList;
    });

    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    console.log("Migration complete.");
  }
}
