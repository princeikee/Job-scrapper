import { SKILL_DICTIONARY, normalizeSkillName } from '../analytics/skillDictionary.js';

const skillMatchers = SKILL_DICTIONARY.map((skill) => ({
  skill,
  regex: new RegExp(`\\b${escapeRegex(skill)}\\b`, 'i'),
}));

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractSkills({ title = '', description = '', explicitSkills = [] }) {
  const detected = new Set();
  const haystack = `${title} ${description}`;

  for (const matcher of skillMatchers) {
    if (matcher.regex.test(haystack)) {
      detected.add(matcher.skill);
    }
  }

  for (const skill of explicitSkills) {
    const normalized = normalizeSkillName(skill);
    const matched = SKILL_DICTIONARY.find((item) => normalizeSkillName(item) === normalized);
    if (matched) {
      detected.add(matched);
    }
  }

  return [...detected];
}
