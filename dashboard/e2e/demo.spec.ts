import { expect, Page, test } from "@playwright/test";

const API = process.env.E2E_API_URL || "http://localhost:8000";

async function signInAsDemo(page: Page) {
  await page.goto("/signin?demo=1");
  await expect(page.locator("#email")).toHaveValue("demo@leaveflow.com");
  await page.getByRole("button", { name: /Sign in to Dashboard/i }).click();
  await expect(page.getByText("Welcome back,")).toBeVisible({ timeout: 30_000 });
}

// /demo/reset is rate limited (5 per minute), so the walkthrough below resets exactly twice.
const resetDemoViaApi = (page: Page) =>
  page.evaluate(async (api) => {
    const response = await fetch(`${api}/demo/reset`, { method: "POST", credentials: "include" });
    if (!response.ok) throw new Error(`reset failed: ${response.status}`);
  }, API);

const pendingRows = (page: Page) => page.locator('[aria-label="Pending requests"] li');

test("the landing page shows immediately and links to the demo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("text message");
  await expect(page.getByRole("link", { name: /Try the live demo/i }).first()).toBeVisible();
});

test("demo walkthrough: inbox, shortcuts, audit trail, timeline, restart", async ({ page }) => {
  await signInAsDemo(page);
  await resetDemoViaApi(page);

  await test.step("the seeded inbox shows pending requests, checks and live status", async () => {
    await page.goto("/requests");
    await expect(pendingRows(page)).toHaveCount(4);
    await expect(page.getByRole("list", { name: "Checks before approving" }).locator("li")).not.toHaveCount(0);
    await expect(page.getByText("Live updates on")).toBeVisible({ timeout: 15_000 });
  });

  await test.step("J and K move between requests", async () => {
    const selectedName = () => page.locator('[aria-label="Request details"] h2').innerText();
    const first = await selectedName();
    await page.keyboard.press("j");
    await expect.poll(selectedName).not.toBe(first);
    await page.keyboard.press("k");
    await expect.poll(selectedName).toBe(first);
  });

  await test.step("A approves and the request leaves the inbox", async () => {
    await page.keyboard.press("a");
    await expect(pendingRows(page)).toHaveCount(3);
  });

  await test.step("R opens the reject box", async () => {
    await page.keyboard.press("r");
    await expect(page.locator("textarea")).toBeFocused();
    await page.keyboard.press("Escape");
  });

  await test.step("the approved request shows who did what", async () => {
    await page.goto("/requests/history");
    await page.getByRole("link", { name: "View", exact: true }).first().click();
    const timeline = page.locator("ol li");
    await expect(timeline).toHaveCount(2);
    await expect(timeline.nth(0)).toContainText("Request created");
    await expect(timeline.nth(1)).toContainText("Approved");
  });

  await test.step("the timeline lists the team", async () => {
    await page.goto("/requests/calendar");
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByText("Priya Sharma")).toBeVisible();
  });

  await test.step("Restart demo puts the seeded requests back", async () => {
    await page.goto("/requests");
    await expect(pendingRows(page)).toHaveCount(3);
    await page.getByRole("button", { name: /Restart demo/i }).click();
    await page.getByRole("button", { name: /^Reset$/ }).click();
    await expect(page.getByText("Demo restarted")).toBeVisible({ timeout: 15_000 });
    await expect(pendingRows(page)).toHaveCount(4);
  });
});
