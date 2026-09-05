/**
 * PDF / HTML Generator Script for UNIVA Module Developer Guide
 * Consolidates all MkDocs markdown files into a single publication-ready HTML / PDF document.
 */

const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, 'docs');
const outputDir = path.join(__dirname, 'site', 'pdf');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const files = [
    'index.md',
    '01-architecture-overview.md',
    '02-module-types.md',
    '03-installer-orchestration.md',
    '04-folder-structure.md',
    '05-engine-1-manifest.md',
    '06-engine-2-database.md',
    '07-engine-3-integration.md',
    '08-engine-4-security.md',
    '09-engine-5-ui.md',
    '10-lifecycle-migrations.md',
    '11-system-diagrams.md',
    '12-case-studies.md',
    '13-api-reference.md',
    '14-developer-workflow.md',
    '15-cheatsheet.md',
    '16-gap-analysis.md'
];

let fullMarkdown = `# UNIVA Module System & Installer Engine — Complete Specification & Developer Guide\n\n`;
fullMarkdown += `> **Generated Publication Build**: ${new Date().toISOString()}\n\n---\n\n`;

files.forEach(file => {
    const filePath = path.join(docsDir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        // Clean markdown header levels if needed
        fullMarkdown += content + `\n\n<div style="page-break-after: always;"></div>\n\n`;
    }
});

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>UNIVA Module System & Installer Engine — Specification Guide</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #1a202c;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        h1, h2, h3, h4 { color: #1a365d; margin-top: 1.5em; }
        h1 { border-bottom: 2px solid #3182ce; padding-bottom: 10px; }
        h2 { border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
        code { background: #edf2f7; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
        pre { background: #1a202c; color: #f7fafc; padding: 16px; border-radius: 8px; overflow-x: auto; }
        pre code { background: none; color: inherit; padding: 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #cbd5e0; padding: 10px 14px; text-align: left; }
        th { background: #ebf8ff; color: #2b6cb0; font-weight: bold; }
        tr:nth-child(even) { background: #f7fafc; }
        blockquote { border-left: 4px solid #3182ce; background: #ebf8ff; margin: 0; padding: 12px 20px; color: #2c5282; }
        .page-break { page-break-after: always; }
        @media print {
            body { max-width: 100%; padding: 0; }
            .page-break { page-break-after: always; }
        }
    </style>
</head>
<body>
    <div id="content">
        <!-- Rendered Document -->
        <pre>${fullMarkdown.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </div>
</body>
</html>`;

const outputPath = path.join(outputDir, 'UNIVA-Module-Developer-Guide.html');
fs.writeFileSync(outputPath, htmlContent, 'utf8');

console.log(`[Success] Consolidated documentation generated at: ${outputPath}`);
console.log(`[Info] Open this HTML file in your browser and select "Print -> Save as PDF" or run "npm run docs:pdf" via MkDocs!`);
