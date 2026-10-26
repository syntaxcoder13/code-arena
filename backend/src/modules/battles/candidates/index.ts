import { ProblemCandidate } from '../problem-candidate.types';
import { EASY_CANDIDATES } from './easy';
import { MEDIUM_CANDIDATES } from './medium';
import { HARD_CANDIDATES } from './hard';
import { EASY_CANDIDATES_2 } from './easy2';
import { MEDIUM_CANDIDATES_2 } from './medium2';
import { HARD_CANDIDATES_2 } from './hard2';
import { EASY_CANDIDATES_3 } from './easy3';
import { MEDIUM_CANDIDATES_3 } from './medium3';
import { HARD_CANDIDATES_3 } from './hard3';
import { EASY_CANDIDATES_4 } from './easy4';
import { MEDIUM_CANDIDATES_4 } from './medium4';
import { HARD_CANDIDATES_4 } from './hard4';
import { EASY_CANDIDATES_5 } from './easy5';
import { MEDIUM_CANDIDATES_5 } from './medium5';
import { HARD_CANDIDATES_5 } from './hard5';
import { EASY_CANDIDATES_6 } from './easy6';
import { MEDIUM_CANDIDATES_6 } from './medium6';
import { HARD_CANDIDATES_6 } from './hard6';

/**
 * Every problem, alongside the two solutions that produced its answers.
 *
 * Nothing here is trusted: the expected outputs are not written down, they
 * are whatever the two solutions agree on when they are actually run.
 *
 *   npm run problems:verify                  store anything new
 *   npm run problems:verify -- --revalidate  re-check what is already banked
 *
 * Problems already banked are kept here rather than deleted, because they are
 * what makes revalidation possible - and a stored answer is only as good as
 * the runtime that produced it. A plain verify run reports them as
 * duplicates, which is the right answer to "should this be stored again".
 */
export const PROBLEM_CANDIDATES: ProblemCandidate[] = [
  ...EASY_CANDIDATES,
  ...MEDIUM_CANDIDATES,
  ...HARD_CANDIDATES,
  ...EASY_CANDIDATES_2,
  ...MEDIUM_CANDIDATES_2,
  ...HARD_CANDIDATES_2,
  ...EASY_CANDIDATES_3,
  ...MEDIUM_CANDIDATES_3,
  ...HARD_CANDIDATES_3,
  ...EASY_CANDIDATES_4,
  ...MEDIUM_CANDIDATES_4,
  ...HARD_CANDIDATES_4,
  ...EASY_CANDIDATES_5,
  ...MEDIUM_CANDIDATES_5,
  ...HARD_CANDIDATES_5,
  ...EASY_CANDIDATES_6,
  ...MEDIUM_CANDIDATES_6,
  ...HARD_CANDIDATES_6,
];
