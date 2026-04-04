const fs = require('fs');
const path = require('path');
const { findLatestReport } = require('./report-utils');

const basePath = path.resolve(process.cwd(), '..', '..');
const reportPath = findLatestReport(basePath);

if (!reportPath) {
  console.error('No aiready report found. Run: aiready scan --output json');
  process.exit(1);
}

console.log(`Using report: ${path.relative(basePath, reportPath)}`);
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const patterns = report.patterns || [];
const fileMap = new Map();
const severityRank = { critical: 4, major: 3, minor: 2, info: 1 };
const severityColor = {
  critical: '#ef4444',
  major: '#f97316',
  minor: '#f59e0b',
  info: '#60a5fa',
};

for (const pattern of patterns) {
  const id = String(pattern.fileName);
  const label = id.split('/').slice(-2).join('/');
  const issues = Array.isArray(pattern.issues) ? pattern.issues : [];
  let top = 'info';
  for (const issue of issues) {
    const severity = (issue.severity || 'info').toLowerCase();
    if ((severityRank[severity] || 0) > (severityRank[top] || 0))
      top = severity;
  }
  const tokenCost = (pattern.metrics && pattern.metrics.tokenCost) || 0;
  const size = Math.round(
    10 + Math.min(40, Math.log(Math.max(1, tokenCost)) * 6 + issues.length * 2)
  );
  fileMap.set(id, { id, label, color: severityColor[top] || '#60a5fa', size });
}

const pathRegex = /to\s+([^\s)]+)/g;
const builtLinks = [];
for (const pattern of patterns) {
  const source = String(pattern.fileName);
  for (const issue of pattern.issues || []) {
    const message = String(issue.message || '');
    let match;
    while ((match = pathRegex.exec(message))) {
      const targetPath = match[1];
      const tgt = targetPath.replace(/[),]$/g, '');
      if (fileMap.has(tgt)) {
        builtLinks.push({ source, target: tgt });
      } else {
        const matched = Array.from(fileMap.keys()).find(
          (k) => k.endsWith(tgt) || k.endsWith('/' + tgt)
        );
        if (matched) builtLinks.push({ source, target: matched });
      }
    }
  }
}

console.log('Nodes:', fileMap.size);
console.log('Links:', builtLinks.length);
console.log('Sample nodes:', Array.from(fileMap.values()).slice(0, 10));
console.log('Sample links:', builtLinks.slice(0, 10));
