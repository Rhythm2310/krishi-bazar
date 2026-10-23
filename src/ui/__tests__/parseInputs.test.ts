import { describe, expect, test } from "bun:test";
import { parseCreditInput, parseWaiverInput, parseCgpaInput, parseCompletedCreditsInput } from "../parseInputs";

describe("parseInputs", () => {
  describe("parseCreditInput", () => {
    test("empty string", () => {
      expect(parseCreditInput("")).toEqual({ value: 0, error: null });
    });
    test("invalid number", () => {
      expect(parseCreditInput("abc")).toEqual({ value: 0, error: "Enter credits as a number." });
    });
    test("valid value", () => {
      expect(parseCreditInput("0.5")).toEqual({ value: 0.5, error: null });
      expect(parseCreditInput("3.0")).toEqual({ value: 3.0, error: null });
      expect(parseCreditInput("3")).toEqual({ value: 3.0, error: null });
    });
    test("off-step error", () => {
      expect(parseCreditInput("0.3")).toEqual({ value: 0.3, error: "Credits must be in 0.5 steps." });
    });
    test("range error", () => {
      expect(parseCreditInput("7")).toEqual({ value: 7, error: "Credits must be between 0.5 and 6." });
      expect(parseCreditInput("-1")).toEqual({ value: -1, error: "Credits must be between 0.5 and 6." });
    });
  });

  describe("parseWaiverInput", () => {
    test("empty string", () => {
      expect(parseWaiverInput("")).toEqual({ value: 0, error: null });
    });
    test("invalid number", () => {
      expect(parseWaiverInput("xyz")).toEqual({ value: 0, error: "Enter the waiver as a number." });
    });
    test("valid", () => {
      expect(parseWaiverInput("50")).toEqual({ value: 50, error: null });
    });
    test("range clamping + error", () => {
      expect(parseWaiverInput("101")).toEqual({ value: 100, error: "Waiver must be between 0% and 100%" });
      expect(parseWaiverInput("-5")).toEqual({ value: 0, error: "Waiver must be between 0% and 100%" });
    });
  });

  describe("parseCgpaInput", () => {
    test("empty string", () => {
      expect(parseCgpaInput("")).toEqual({ value: 0, error: null });
    });
    test("invalid number", () => {
      expect(parseCgpaInput("f")).toEqual({ value: 0, error: "Enter CGPA as a number." });
    });
    test("valid", () => {
      expect(parseCgpaInput("3.5")).toEqual({ value: 3.5, error: null });
    });
    test("range clamping + error", () => {
      expect(parseCgpaInput("4.1")).toEqual({ value: 4, error: "CGPA must be between 0.00 and 4.00." });
      expect(parseCgpaInput("-0.5")).toEqual({ value: 0, error: "CGPA must be between 0.00 and 4.00." });
    });
  });

  describe("parseCompletedCreditsInput", () => {
    test("empty string", () => {
      expect(parseCompletedCreditsInput("")).toEqual({ value: 0, error: null });
    });
    test("invalid number", () => {
      expect(parseCompletedCreditsInput("h")).toEqual({ value: 0, error: "Enter completed credits as a number." });
    });
    test("valid", () => {
      expect(parseCompletedCreditsInput("90.5")).toEqual({ value: 90.5, error: null });
    });
    test("range clamping + error", () => {
      expect(parseCompletedCreditsInput("-3")).toEqual({ value: 0, error: "Completed credits cannot be negative." });
    });
  });
});
