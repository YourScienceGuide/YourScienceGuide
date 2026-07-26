import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  downloadCombinedManualParentEmailsFile,
  downloadSeparateManualParentEmailFiles,
} from "@/lib/admin/parent-daily-email-client";

const DOWNLOAD_BLOCKED_MESSAGE =
  "Your browser blocked the file download. Allow downloads for this site and try again.";

function mockCombinedExport() {
  return vi.fn(async () =>
    new Response(new Blob(["Hello parents"]), {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="parents.txt"',
        "X-YSG-Email-Generated": "2",
        "X-YSG-Email-Skipped": "1",
      },
    }),
  );
}

function mockSeparateExport() {
  return vi.fn(async () =>
    new Response(
      JSON.stringify({
        forDate: "2026-07-26",
        skipped: [{ studentName: "Sam", reason: "No activity today" }],
        files: [
          {
            filename: "alex.txt",
            content: "To: parent@example.com\nSubject: Alex",
            to: "parent@example.com",
            subject: "Alex",
            studentName: "Alex",
          },
          {
            filename: "jordan.txt",
            content: "To: parent2@example.com\nSubject: Jordan",
            to: "parent2@example.com",
            subject: "Jordan",
            studentName: "Jordan",
          },
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    ),
  );
}

describe("parent daily email manual export downloads", () => {
  let createObjectURLDescriptor: PropertyDescriptor | undefined;
  let revokeObjectURLDescriptor: PropertyDescriptor | undefined;
  let userActivationDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    createObjectURLDescriptor = Object.getOwnPropertyDescriptor(URL, "createObjectURL");
    revokeObjectURLDescriptor = Object.getOwnPropertyDescriptor(URL, "revokeObjectURL");
    userActivationDescriptor = Object.getOwnPropertyDescriptor(
      navigator,
      "userActivation",
    );

    vi.useFakeTimers();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:parent-email-export"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(navigator, "userActivation", {
      configurable: true,
      value: { hasBeenActive: true, isActive: true },
    });
  });

  afterEach(() => {
    vi.useRealTimers();

    if (createObjectURLDescriptor) {
      Object.defineProperty(URL, "createObjectURL", createObjectURLDescriptor);
    } else {
      delete (URL as { createObjectURL?: typeof URL.createObjectURL }).createObjectURL;
    }

    if (revokeObjectURLDescriptor) {
      Object.defineProperty(URL, "revokeObjectURL", revokeObjectURLDescriptor);
    } else {
      delete (URL as { revokeObjectURL?: typeof URL.revokeObjectURL }).revokeObjectURL;
    }

    if (userActivationDescriptor) {
      Object.defineProperty(navigator, "userActivation", userActivationDescriptor);
    } else {
      delete (
        navigator as { userActivation?: Navigator["userActivation"] }
      ).userActivation;
    }
  });

  it("returns server counts after the combined download starts", async () => {
    vi.stubGlobal("fetch", mockCombinedExport());

    await expect(downloadCombinedManualParentEmailsFile()).resolves.toEqual({
      generated: 2,
      skipped: 1,
    });

    vi.runOnlyPendingTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:parent-email-export");
  });

  it("rejects the combined export when the browser cancels the download click", async () => {
    vi.stubGlobal("fetch", mockCombinedExport());
    const cancelDownload = (event: MouseEvent) => event.preventDefault();
    document.addEventListener("click", cancelDownload, { capture: true });

    try {
      await expect(downloadCombinedManualParentEmailsFile()).rejects.toThrow(
        DOWNLOAD_BLOCKED_MESSAGE,
      );
    } finally {
      document.removeEventListener("click", cancelDownload, { capture: true });
    }

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:parent-email-export");
  });

  it("rejects the separate export when a later file download is cancelled", async () => {
    vi.stubGlobal("fetch", mockSeparateExport());
    let clicks = 0;
    const cancelSecondDownload = (event: MouseEvent) => {
      clicks += 1;
      if (clicks === 2) {
        event.preventDefault();
      }
    };
    document.addEventListener("click", cancelSecondDownload, { capture: true });

    try {
      await expect(downloadSeparateManualParentEmailFiles()).rejects.toThrow(
        DOWNLOAD_BLOCKED_MESSAGE,
      );
    } finally {
      document.removeEventListener("click", cancelSecondDownload, { capture: true });
    }

    expect(clicks).toBe(2);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:parent-email-export");
  });

  it("rejects instead of reporting success when user activation expired", async () => {
    vi.stubGlobal("fetch", mockCombinedExport());
    Object.defineProperty(navigator, "userActivation", {
      configurable: true,
      value: { hasBeenActive: true, isActive: false },
    });

    await expect(downloadCombinedManualParentEmailsFile()).rejects.toThrow(
      DOWNLOAD_BLOCKED_MESSAGE,
    );

    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
