import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  buildJobSearchAlertPayload,
  buildSearchAlertLabel,
  computeSearchAlertKey,
  sanitizeAlertFrequency,
  sanitizeJobSearchAlertCriteria,
} from '../../src/services/jobAlertService';
import { JobSearchAlertsManager } from '../../src/components/JobSearchAlertsManager';
import type { JobSearchAlert } from '../../src/types';

test('computeSearchAlertKey is deterministic and case/whitespace insensitive', () => {
  const keyA = computeSearchAlertKey({
    search: '  React   Developer ',
    location: 'Bengaluru',
    workMode: 'Remote',
    employmentType: 'Full-time',
    experienceLevel: '1-2_years',
    salaryRange: '40k_60k',
    department: 'Engineering',
    industry: 'IT',
    selectedSkill: 'TypeScript',
    quickMinSalary: false,
  });

  const keyB = computeSearchAlertKey({
    search: 'react developer',
    location: '  bengaluru  ',
    workMode: 'Remote',
    employmentType: 'Full-time',
    experienceLevel: '1-2_years',
    salaryRange: '40k_60k',
    department: 'engineering',
    industry: 'it',
    selectedSkill: 'typescript',
    quickMinSalary: false,
  });

  const keyDifferent = computeSearchAlertKey({
    search: 'react developer',
    location: 'Hyderabad',
    workMode: 'Remote',
  });

  assert.equal(keyA, keyB);
  assert.notEqual(keyA, keyDifferent);
  assert.match(keyA, /^[a-zA-Z0-9_\-]+$/);
  assert.ok(keyA.length > 0 && keyA.length <= 128);
});

test('buildSearchAlertLabel summarizes search queries cleanly', () => {
  assert.equal(buildSearchAlertLabel({}), 'All Published Jobs');

  const combined = buildSearchAlertLabel({
    search: 'Data Analyst',
    location: 'Pune',
    workMode: 'Remote',
    employmentType: 'Full-time',
    experienceLevel: 'Fresher',
    salaryRange: '20k_40k',
    selectedSkill: 'Excel',
  });

  assert.ok(combined.includes('"Data Analyst"'));
  assert.ok(combined.includes('Pune'));
  assert.ok(combined.includes('Work from home'));
  assert.ok(combined.includes('Full-time'));
  assert.ok(combined.includes('Fresher'));
  assert.ok(combined.includes('Skill: Excel'));
  assert.ok(combined.length <= 180);
});

test('buildJobSearchAlertPayload enforces firestore.rules schema bounds and allowlists', () => {
  const payload = buildJobSearchAlertPayload({
    userId: 'uid_candidate_123',
    email: '  Candidate@Example.COM  ',
    criteria: {
      search: 'x'.repeat(200),
      location: 'y'.repeat(160),
      workMode: 'InvalidMode',
      employmentType: 'InvalidType',
      experienceLevel: 'InvalidExp',
      salaryRange: 'InvalidSalary',
      department: 'd'.repeat(120),
      industry: 'i'.repeat(120),
      selectedSkill: 's'.repeat(120),
      quickMinSalary: true,
    },
    frequency: sanitizeAlertFrequency('hourly', 'weekly'),
    enabled: true,
  });

  assert.equal(payload.id, payload.queryKey);
  assert.equal(payload.userId, 'uid_candidate_123');
  assert.equal(payload.email, 'candidate@example.com');
  assert.equal(payload.search.length, 120);
  assert.equal(payload.location.length, 100);
  assert.equal(payload.workMode, 'All');
  assert.equal(payload.employmentType, 'All');
  assert.equal(payload.experienceLevel, 'All');
  assert.equal(payload.salaryRange, 'All');
  assert.equal(payload.department.length, 80);
  assert.equal(payload.industry.length, 80);
  assert.equal(payload.selectedSkill.length, 80);
  assert.equal(payload.frequency, 'weekly');
  assert.equal(payload.enabled, true);
  assert.ok(payload.label.length > 0 && payload.label.length <= 180);
});

test('JobSearchAlertsManager renders cleanly in jobs-bar and settings-panel modes', () => {
  const sampleCriteria = sanitizeJobSearchAlertCriteria({
    search: 'Purchase Executive',
    location: 'Bengaluru',
    workMode: 'Hybrid',
  });

  const jobsBarHtml = renderToStaticMarkup(
    React.createElement(JobSearchAlertsManager, {
      mode: 'jobs-bar',
      navigate: () => {},
      currentCriteria: sampleCriteria,
      fallbackEmail: 'candidate@example.com',
    })
  );

  assert.ok(jobsBarHtml.includes('Email Alerts for this Search'));
  assert.ok(jobsBarHtml.includes('Purchase Executive'));
  assert.ok(jobsBarHtml.includes('Bengaluru'));

  const sampleAlert: JobSearchAlert = {
    ...buildJobSearchAlertPayload({
      userId: 'uid_1',
      email: 'candidate@example.com',
      criteria: sampleCriteria,
      frequency: 'daily',
      enabled: true,
    }),
    createdAt: '2026-11-27T00:00:00.000Z',
    updatedAt: '2026-11-27T00:00:00.000Z',
  };

  const settingsHtml = renderToStaticMarkup(
    React.createElement(JobSearchAlertsManager, {
      mode: 'settings-panel',
      navigate: () => {},
      initialAlerts: [sampleAlert],
      fallbackEmail: 'candidate@example.com',
    })
  );

  assert.ok(settingsHtml.includes('Saved Search Query Email Alerts'));
  assert.ok(settingsHtml.includes('1 active'));
});
