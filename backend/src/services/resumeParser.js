const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const skillsPath = path.join(__dirname, 'skills_keywords.txt');
let SKILL_KEYWORDS = [];

const TECHNOLOGY_PRIORITY = [
  'react',
  'angular',
  'vue',
  'node',
  'nodejs',
  'node.js',
  'django',
  'flask',
  'fastapi',
  'spring',
  'java',
  'python',
  'javascript',
  'typescript',
  '.net',
  'c#',
  'php',
  'laravel',
  'ruby',
  'rails',
  'go',
  'golang',
  'kotlin',
  'swift',
  'android',
  'ios',
  'aws',
  'azure',
  'gcp',
  'devops',
  'kubernetes',
  'docker',
  'sql',
  'postgresql',
  'mongodb',
  'salesforce',
  'workday',
  'sap',
];

const NAME_SKIP_PATTERN =
  /^(resume|curriculum\s*vitae|cv|profile|personal\s*details?|contact|professional\s*summary|summary|objective|skills?|experience|education|projects?|certifications?|\d+\s*\/\s*\d+)$/i;

const NAME_LINE_SKIP =
  /[@#]|https?:\/\/|linkedin|github|www\.|phone|mobile|email|address|\d{5,}/i;

try {
  SKILL_KEYWORDS = fs
    .readFileSync(skillsPath, 'utf8')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
} catch {
  SKILL_KEYWORDS = [...TECHNOLOGY_PRIORITY];
}

function normalizeText(text) {
  return (text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
}

function extractSkills(text) {
  const found = [];
  const lower = text.toLowerCase();
  for (const skill of SKILL_KEYWORDS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escaped}\\b`, 'i');
    if (pattern.test(lower)) found.push(skill);
  }
  return [...new Set(found.map((s) => s.charAt(0).toUpperCase() + s.slice(1)))].join(', ');
}

function calculateExperience(text) {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)/gi,
    /(?:experience|exp)[:\s]+(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)/gi,
    /(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)/gi,
  ];

  const values = [];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const n = parseFloat(match[1]);
      if (!Number.isNaN(n) && n >= 0 && n <= 50) values.push(n);
    }
  }

  if (!values.length) return null;
  return Math.max(...values);
}

function extractName(lines) {
  for (const raw of lines.slice(0, 15)) {
    const line = raw.trim();
    if (!line || line.length > 80) continue;
    if (NAME_SKIP_PATTERN.test(line)) continue;
    if (NAME_LINE_SKIP.test(line)) continue;
    if (/^[\w.-]+@[\w.-]+\.\w+$/.test(line)) continue;

    const words = line.split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > 6) continue;

    const alphaRatio =
      line.replace(/[^a-zA-Z\s.'-]/g, '').length / Math.max(line.length, 1);
    if (alphaRatio < 0.7) continue;

    return line
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  const first = lines.find((l) => l.trim() && !NAME_LINE_SKIP.test(l));
  return first?.trim() || '';
}

function extractEmail(text) {
  const match = text.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].toLowerCase() : null;
}

function extractPhone(text) {
  const patterns = [
    /(?:\+91[\s-]?)?[6-9]\d{9}\b/,
    /\+\d{1,3}[\s-]?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/,
    /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/,
    /\b\d{10}\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0].replace(/\s+/g, ' ').trim();
  }
  return null;
}

function extractTechnology(text, skillsStr) {
  const labelMatch = text.match(
    /(?:primary\s+)?(?:technology|tech\s*stack|technical\s*skills?|specialization|role)[:\s]+([^\n]{2,80})/i
  );
  if (labelMatch) {
    return labelMatch[1].trim().replace(/\s{2,}/g, ' ');
  }

  const lower = text.toLowerCase();
  const fromPriority = [];
  for (const tech of TECHNOLOGY_PRIORITY) {
    const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(lower)) {
      fromPriority.push(tech.charAt(0).toUpperCase() + tech.slice(1));
    }
  }
  if (fromPriority.length) return fromPriority.slice(0, 3).join(', ');

  if (skillsStr) {
    const parts = skillsStr.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts.slice(0, 3).join(', ');
  }

  return '';
}

function parseResumeText(text) {
  const normalized = normalizeText(text);
  const lines = normalized.split('\n').map((l) => l.trim()).filter(Boolean);

  const email = extractEmail(normalized);
  const phone = extractPhone(normalized);
  const name = extractName(lines);
  const skills = extractSkills(normalized);
  const years = calculateExperience(normalized);
  const technology = extractTechnology(normalized, skills);

  return {
    candidate_name: name,
    candidate_email: email,
    candidate_number: phone,
    skills,
    technology,
    years_of_experience_calculated: years,
    years_of_experience_manual: years != null ? String(years) : '',
  };
}

function formatParsedForForm(parsed) {
  const exp =
    parsed.years_of_experience_calculated != null &&
    parsed.years_of_experience_calculated !== ''
      ? String(parsed.years_of_experience_calculated)
      : '';

  return {
    candidate_name: parsed.candidate_name || '',
    candidate_email: parsed.candidate_email || '',
    candidate_number: parsed.candidate_number || '',
    skills: parsed.skills || '',
    technology: parsed.technology || '',
    years_of_experience_manual: parsed.years_of_experience_manual || exp,
    years_of_experience_calculated: exp,
  };
}

async function extractTextFromResume(filePath, originalName = '') {
  const ext = path.extname(originalName || filePath).toLowerCase();

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text || '';
  }

  if (ext === '.docx' || ext === '.docm' || ext === '.dotx' || ext === '.dotm') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  }

  if (ext === '.doc') {
    const result = await mammoth.extractRawText({ path: filePath });
    if (result.value?.trim()) return result.value;
    throw new Error('Old .doc format is not supported. Please upload PDF or DOCX.');
  }

  if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf8');
  }

  throw new Error(`Unsupported file format: ${ext || 'unknown'}. Use PDF, DOCX, or TXT.`);
}

async function parseResumeFile(filePath, originalName) {
  const text = await extractTextFromResume(filePath, originalName);
  if (!text || !text.trim()) {
    throw new Error('No readable text found in the resume. Try a text-based PDF or DOCX file.');
  }
  const parsed = parseResumeText(text);
  return formatParsedForForm(parsed);
}

module.exports = {
  parseResumeFile,
  parseResumeText,
  formatParsedForForm,
  extractTextFromResume,
  extractSkillsFromText: extractSkills,
};
