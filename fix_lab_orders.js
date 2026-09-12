const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const helper = `
// Helper to populate parameters based on exam names (including profiles)
function generateParametersForExams(examNames: string[], orderId: number): any[] {
  const paramsList: any[] = [];
  let pIdx = 0;
  
  const expandedExams = new Set<string>();
  
  // Expand profiles
  examNames.forEach(exName => {
    const tmpl = dbProductTemplates.find(t => t.name.trim().toLowerCase() === exName.trim().toLowerCase());
    if (tmpl && tmpl.category_type === 'lab_profile' && tmpl.lab_profile_exams) {
      tmpl.lab_profile_exams.forEach(subEx => expandedExams.add(subEx));
    } else {
      expandedExams.add(exName);
    }
  });

  expandedExams.forEach(itName => {
    const tmpl = dbProductTemplates.find(t => t.name.trim().toLowerCase() === itName.trim().toLowerCase());
    if (tmpl && tmpl.lab_tests && tmpl.lab_tests.length > 0) {
      tmpl.lab_tests.forEach(test => {
        paramsList.push({
          id: \`p-\${orderId}-\${pIdx++}\`,
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
        id: \`p-\${orderId}-\${pIdx++}\`,
        name: itName,
        value: '',
        unit: '',
        reference_range: tmpl?.lab_reference_range || 'Normal',
        is_abnormal: false,
        exam_name: itName
      });
    }
  });
  
  return paramsList;
}
`;

// Now replace the invoice lab order logic and the manual creation logic

