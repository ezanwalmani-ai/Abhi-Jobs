import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatModuleDisplayTitle,
  resolveModuleProgressSummary,
  resolveModuleQuizSidebarState,
  toggleAccordionModule,
} from '../../src/utils/courseSidebarNavigation';

test('formatModuleDisplayTitle formats clean numbered module headings without duplicates', () => {
  assert.equal(
    formatModuleDisplayTitle(1, 'Excel Fundamentals'),
    'Module 01: Excel Fundamentals'
  );
  assert.equal(
    formatModuleDisplayTitle(2, 'Module 02: Working with Worksheets'),
    'Module 02: Working with Worksheets'
  );
  assert.equal(
    formatModuleDisplayTitle(12, 'Career Capstone Project'),
    'Module 12: Career Capstone Project'
  );
});

test('toggleAccordionModule enforces single-module expansion', () => {
  // Expanding Module 2 collapses Module 1
  assert.equal(toggleAccordionModule('mod-1', 'mod-2'), 'mod-2');
  // Clicking currently expanded Module 2 collapses it
  assert.equal(toggleAccordionModule('mod-2', 'mod-2'), null);
  // Expanding from collapsed state opens clicked module
  assert.equal(toggleAccordionModule(null, 'mod-3'), 'mod-3');
});

test('resolveModuleQuizSidebarState returns accurate Locked, Available, Passed, and Failed states', () => {
  const lockedByVideo = resolveModuleQuizSidebarState({
    moduleOrder: 1,
    isModuleLocked: false,
    isQuizUnlocked: false,
    isQuizPassed: false,
    bestScorePercent: null,
    attemptCount: 0,
    questionCount: 10,
    requiresVideoWatch: true,
  });
  assert.equal(lockedByVideo.status, 'locked');
  assert.equal(lockedByVideo.statusLabel, 'Locked');
  assert.match(lockedByVideo.detailLabel, /90% video/i);
  assert.equal(lockedByVideo.actionLabel, null);

  const lockedByPrevMod = resolveModuleQuizSidebarState({
    moduleOrder: 2,
    isModuleLocked: true,
    isQuizUnlocked: false,
    isQuizPassed: false,
    bestScorePercent: null,
    attemptCount: 0,
    questionCount: 10,
    requiresVideoWatch: true,
  });
  assert.equal(lockedByPrevMod.status, 'locked');
  assert.match(lockedByPrevMod.detailLabel, /M01 Quiz/i);

  const available = resolveModuleQuizSidebarState({
    moduleOrder: 1,
    isModuleLocked: false,
    isQuizUnlocked: true,
    isQuizPassed: false,
    bestScorePercent: null,
    attemptCount: 0,
    questionCount: 10,
    requiresVideoWatch: true,
  });
  assert.equal(available.status, 'available');
  assert.equal(available.statusLabel, 'Available');
  assert.equal(available.actionLabel, 'Start Quiz');

  const failed = resolveModuleQuizSidebarState({
    moduleOrder: 1,
    isModuleLocked: false,
    isQuizUnlocked: true,
    isQuizPassed: false,
    bestScorePercent: 50,
    attemptCount: 1,
    questionCount: 10,
    requiresVideoWatch: true,
  });
  assert.equal(failed.status, 'failed');
  assert.equal(failed.statusLabel, 'Failed');
  assert.equal(failed.detailLabel, 'Best 50%');
  assert.equal(failed.actionLabel, 'Retake');

  const failedZero = resolveModuleQuizSidebarState({
    moduleOrder: 1,
    isModuleLocked: false,
    isQuizUnlocked: true,
    isQuizPassed: false,
    bestScorePercent: 0,
    attemptCount: 1,
    questionCount: 10,
    requiresVideoWatch: true,
  });
  assert.equal(failedZero.status, 'failed');
  assert.equal(failedZero.detailLabel, 'Best 0%');

  const passed = resolveModuleQuizSidebarState({
    moduleOrder: 1,
    isModuleLocked: false,
    isQuizUnlocked: true,
    isQuizPassed: true,
    bestScorePercent: 90,
    attemptCount: 1,
    questionCount: 10,
    requiresVideoWatch: true,
  });
  assert.equal(passed.status, 'passed');
  assert.equal(passed.statusLabel, 'Passed');
  assert.equal(passed.detailLabel, '90%');
  assert.equal(passed.actionLabel, 'Retake');
});

test('resolveModuleProgressSummary tracks lesson and quiz completion accurately', () => {
  const inProgress = resolveModuleProgressSummary({
    completedLessons: 1,
    totalLessons: 3,
    hasQuiz: true,
    quizPassed: false,
  });
  assert.equal(inProgress.isModuleCompleted, false);
  assert.equal(inProgress.progressText, '1/3 lessons');
  assert.equal(inProgress.progressPercent, 25);

  const lessonsDoneQuizPending = resolveModuleProgressSummary({
    completedLessons: 1,
    totalLessons: 1,
    hasQuiz: true,
    quizPassed: false,
  });
  assert.equal(lessonsDoneQuizPending.isModuleCompleted, false);
  assert.equal(lessonsDoneQuizPending.progressText, '1/1 lesson');
  assert.equal(lessonsDoneQuizPending.progressPercent, 50);

  const completed = resolveModuleProgressSummary({
    completedLessons: 1,
    totalLessons: 1,
    hasQuiz: true,
    quizPassed: true,
  });
  assert.equal(completed.isModuleCompleted, true);
  assert.equal(completed.progressText, 'Completed');
  assert.equal(completed.progressPercent, 100);
});
