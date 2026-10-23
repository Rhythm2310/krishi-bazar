import { expect, test, describe, beforeEach, afterEach, mock } from "bun:test";
import * as storage from "../storage";

describe("Storage hardening", () => {
  let mockStorage: any;
  let originalWindow: any;

  beforeEach(() => {
    mockStorage = {
      getItem: mock(() => null),
      setItem: mock(() => {}),
      removeItem: mock(() => {}),
      clear: mock(() => {})
    };
    originalWindow = globalThis.window;
    // @ts-ignore
    globalThis.window = { localStorage: mockStorage };
  });

  afterEach(() => {
    // @ts-ignore
    globalThis.window = originalWindow;
  });

  test("corrupt/truncated JSON -> returns defaults, no throw", () => {
    mockStorage.getItem.mockImplementation(() => "{ corrupt_json ");
    expect(storage.loadGpaCourses()).toEqual([]);
    expect(storage.loadStudentRecord()).toEqual({ completedCredits: 0, currentCgpa: 0 });
    expect(storage.loadCgpaPlannedCourses()).toEqual([]);
    expect(storage.loadFeeOverrides()).toEqual({});
  });

  test("getter that throws (quota/security error) -> returns defaults, no throw", () => {
    mockStorage.getItem.mockImplementation(() => { throw new Error("SecurityError"); });
    expect(storage.loadGpaCourses()).toEqual([]);
    expect(storage.loadStudentRecord()).toEqual({ completedCredits: 0, currentCgpa: 0 });
    expect(storage.loadCgpaPlannedCourses()).toEqual([]);
    expect(storage.loadFeeOverrides()).toEqual({});
  });

  test("setter that throws -> swallowed with safe fallback", () => {
    mockStorage.setItem.mockImplementation(() => { throw new Error("QuotaExceededError"); });
    expect(() => storage.saveGpaCourses([])).not.toThrow();
    expect(() => storage.saveStudentRecord({ completedCredits: 0, currentCgpa: 0 })).not.toThrow();
    expect(() => storage.saveCgpaPlannedCourses([])).not.toThrow();
    expect(() => storage.saveFeeOverrides({})).not.toThrow();
  });
});
