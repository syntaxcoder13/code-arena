import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArenaService, tierFor } from '../../src/modules/arena/arena.service';

describe('Code Arena judging boundary', () => {
  const db = { practiceAttempt: { create: vi.fn() } };
  const problems = { getWithTests: vi.fn() };
  const judge = { configured: true, runBatch: vi.fn() };
  const enforcement = { assertNotBanned: vi.fn(), assertUnderDailyCap: vi.fn() };
  const service = () => new ArenaService(db as never, problems as never, judge as never, enforcement as never, {} as never, {} as never, {} as never);
  const body = { code: 'print(42)', language: 'python', submit: true };
  beforeEach(() => {
    vi.clearAllMocks(); judge.configured = true;
    problems.getWithTests.mockResolvedValue({ reviewed: true, difficulty: 'easy', timeLimitMs: 2000, memoryLimitMb: 256, tests: [{ input: 'sample', expectedOutput: '42', sample: true }, { input: 'secret input', expectedOutput: '42' }] });
    judge.runBatch.mockResolvedValue([{ ok: true, stdout: '42\n', stderr: '', runtimeMs: 3, memoryKb: 1024, status: 'Accepted' }, { ok: true, stdout: '42\n', stderr: '', runtimeMs: 5, memoryKb: 2048, status: 'Accepted' }]);
  });
  it('records measured results and redacts hidden inputs, expected output and stdout', async () => {
    const result = await service().evaluate('user', 'problem', body);
    expect(result).toMatchObject({ status: 'SUCCESS', runtimeMs: 5, memoryMb: 2, passedCount: 2 });
    expect(result.details[1]).toEqual({ caseId: 'case_1', input: 'Hidden', expected: 'Hidden', actual: 'Accepted', passed: true });
    expect(db.practiceAttempt.create).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: 'user', passed: true, runtimeMs: 5, memoryKb: 2048 }) });
  });
  it('does not award a solve for code that contains return but gives the wrong answer', async () => {
    judge.runBatch.mockResolvedValue([{ ok: true, stdout: 'wrong', stderr: '', status: 'Accepted' }, { ok: true, stdout: 'wrong', stderr: '', status: 'Accepted' }]);
    expect((await service().evaluate('user', 'problem', { ...body, code: 'function f(){return 0;}' })).status).toBe('FAILED');
    expect(db.practiceAttempt.create).toHaveBeenCalledWith({ data: expect.objectContaining({ passed: false }) });
  });
  it('runs samples without recording a solve', async () => {
    judge.runBatch.mockResolvedValue([{ ok: true, stdout: '42', stderr: '', status: 'Accepted' }]);
    await service().evaluate('user', 'problem', { ...body, submit: false });
    expect(judge.runBatch.mock.calls[0][0]).toHaveLength(1);
    expect(db.practiceAttempt.create).not.toHaveBeenCalled();
  });
  it('executes custom stdin without counting it as a solved problem', async () => {
    judge.runBatch.mockResolvedValue([{ ok: true, stdout: 'custom output', stderr: '', status: 'Accepted' }]);
    const result = await service().evaluate('user', 'problem', { ...body, submit: false, input: 'custom' });
    expect(result.details[0].actual).toBe('custom output');
    expect(db.practiceAttempt.create).not.toHaveBeenCalled();
  });
  it('never records a wrong answer during a Judge0 outage', async () => {
    judge.runBatch.mockRejectedValue(new Error('network unavailable'));
    await expect(service().evaluate('user', 'problem', body)).rejects.toThrow('Judge0 is unavailable');
    expect(db.practiceAttempt.create).not.toHaveBeenCalled();
  });
  it('refuses unreviewed problems', async () => {
    problems.getWithTests.mockResolvedValue({ reviewed: false });
    await expect(service().evaluate('user', 'problem', body)).rejects.toThrow('Problem not found');
    expect(judge.runBatch).not.toHaveBeenCalled();
  });
  it('rejects a run when Judge0 is not configured', async () => {
    judge.configured = false;
    await expect(service().evaluate('user', 'problem', body)).rejects.toThrow('Judge0 is not configured');
  });
  it('enforces bans before sending code to Judge0', async () => {
    enforcement.assertNotBanned.mockRejectedValueOnce(new Error('banned'));
    await expect(service().evaluate('user', 'problem', body)).rejects.toThrow('banned');
    expect(judge.runBatch).not.toHaveBeenCalled();
  });
  it('uses consistent tier boundaries including Bronze after a loss', () => {
    expect(tierFor(1180)).toBe('BRONZE'); expect(tierFor(1200)).toBe('SILVER'); expect(tierFor(2400)).toBe('GRANDMASTER');
  });
});
