import { describe, expect, it } from "vitest";

import { insertAtCaret, unknownPlaceholders } from "./outreach/placeholders";
import { applicationProfileFromForm, formFromApplicationProfile } from "./profile/schemas";

describe("placeholders", () => {
  it("flags only placeholders the backend rejects", () => {
    expect(unknownPlaceholders("Hi {{contactFirstName}}, {{favouriteColour}}")).toEqual([
      "{{favouriteColour}}",
    ]);
  });

  it("inserts at the caret, replacing the selection", () => {
    const field = { selectionStart: 3, selectionEnd: 5 } as HTMLInputElement;
    expect(insertAtCaret(field, "Hi XX!", "{{jobTitle}}")).toEqual({
      value: "Hi {{jobTitle}}!",
      caret: 15,
    });
  });
});

describe("application profile mapping", () => {
  it("round-trips answers and leaves blanks out", () => {
    const form = formFromApplicationProfile({
      phone: "+91 98765",
      workAuthorized: true,
      requiresSponsorship: null,
      answers: { "Years of Go?": "5" },
    });

    expect(form.workAuthorized).toBe("yes");
    expect(form.requiresSponsorship).toBe("");
    expect(form.answers).toEqual([{ question: "Years of Go?", answer: "5" }]);

    const profile = applicationProfileFromForm(form);
    expect(profile).toEqual({
      phone: "+91 98765",
      workAuthorized: true,
      requiresSponsorship: null,
      answers: { "Years of Go?": "5" },
    });
    expect(profile).not.toHaveProperty("location");
  });
});
