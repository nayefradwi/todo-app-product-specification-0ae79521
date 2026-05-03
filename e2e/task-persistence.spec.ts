import { expect, test, type Page } from "@playwright/test";

/**
 * End-to-end persistence verification.
 *
 * This is the canonical proof that tasks created by an authenticated user
 * are persisted in Postgres and re-hydrated on subsequent logins. It
 * exercises the full acceptance-criteria flow described in the task:
 *
 *   1. Register a brand-new user (unique email per run).
 *   2. Add two tasks with distinct titles.
 *   3. Mark exactly one of the tasks as completed.
 *   4. Log out (POST `/api/auth/logout` via the Logout button — the button
 *      hits the same route the task description names, and additionally
 *      clears the session cookie via Set-Cookie which a raw fetch wouldn't
 *      apply to the browser context).
 *   5. Log back in with the same credentials.
 *   6. Assert that BOTH tasks reappear in the DOM with their original
 *      titles, the previously-completed task is still marked completed
 *      (checkbox `aria-checked="true"`, row `data-completed="true"`, and
 *      title rendered with strikethrough via the `line-through` Tailwind
 *      class), and the other task is still un-completed.
 *
 * The test does NOT rely on any shared fixture state — it registers a
 * fresh user keyed by `Date.now()` + a random suffix so multiple parallel
 * test runs against the same database never collide.
 */

const TEST_PASSWORD = "PlaywrightPwd123!";

function uniqueCredentials() {
  // Date.now() is monotonic per process; the random suffix protects against
  // collisions between concurrently-running test workers.
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    email: `e2e-persistence-${suffix}@example.com`,
    password: TEST_PASSWORD,
    taskA: `E2E task A · ${suffix}`,
    taskB: `E2E task B · ${suffix}`,
  };
}

async function registerUser(page: Page, email: string, password: string) {
  await page.goto("/register");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/auth/register") &&
        response.request().method() === "POST",
    ),
    page.getByRole("button", { name: /create account/i }).click(),
  ]);
  // After 201 the page navigates to "/" (the protected task list).
  await page.waitForURL("**/");
  await expect(page.getByRole("heading", { name: /my tasks/i })).toBeVisible();
}

async function logIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/auth/login") &&
        response.request().method() === "POST",
    ),
    page.getByRole("button", { name: /^log in$/i }).click(),
  ]);
  await page.waitForURL("**/");
  await expect(page.getByRole("heading", { name: /my tasks/i })).toBeVisible();
}

async function addTask(page: Page, title: string) {
  await page.locator("#new-task-title").fill(title);
  // Wait for the POST round-trip so the row is guaranteed to be in the DB
  // (not just in the optimistic local state) before we move on.
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/tasks") &&
        r.request().method() === "POST",
    ),
    page.getByRole("button", { name: /^add$/i }).click(),
  ]);
  expect(response.status()).toBe(201);
  // The row should now be rendered in the list.
  await expect(
    page
      .getByTestId("task-list")
      .getByTestId("task-item")
      .filter({ hasText: title }),
  ).toBeVisible();
}

function rowFor(page: Page, title: string) {
  return page.getByTestId("task-item").filter({ hasText: title });
}

async function toggleCompleted(page: Page, title: string) {
  const row = rowFor(page, title);
  // Wait for the PATCH /api/tasks/{id} round-trip explicitly so we know
  // the completion state has been persisted server-side, not just flipped
  // optimistically in the browser.
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) =>
        /\/api\/tasks\/[^/]+$/.test(new URL(r.url()).pathname) &&
        r.request().method() === "PATCH",
    ),
    row.getByRole("checkbox").click(),
  ]);
  expect(response.ok()).toBe(true);
  // Row reflects the persisted completed state.
  await expect(row).toHaveAttribute("data-completed", "true");
  await expect(row.getByRole("checkbox")).toHaveAttribute(
    "aria-checked",
    "true",
  );
}

async function logOut(page: Page) {
  // Click the Logout button in the (protected) layout; under the hood it
  // POSTs to /api/auth/logout and then router.push('/login'). We assert on
  // both the network call and the resulting navigation so a future change
  // that switches the redirect target still leaves us asserting against
  // the logout endpoint named in the task description.
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/auth/logout") &&
        r.request().method() === "POST",
    ),
    page.getByRole("button", { name: /^logout$/i }).click(),
  ]);
  expect(response.ok()).toBe(true);
  await page.waitForURL("**/login");
  await expect(page.getByRole("button", { name: /^log in$/i })).toBeVisible();
}

test.describe("task persistence across logout / re-login", () => {
  test("preserves added tasks and completion state after re-login", async ({
    page,
  }) => {
    const { email, password, taskA, taskB } = uniqueCredentials();

    // (1) Register a brand-new user.
    await registerUser(page, email, password);

    // (2) Add two tasks with distinct titles.
    await addTask(page, taskA);
    await addTask(page, taskB);
    await expect(page.getByTestId("task-item")).toHaveCount(2);

    // (3) Mark the first task as completed.
    await toggleCompleted(page, taskA);

    // Sanity checks before we tear down the session: pre-logout state
    // should match what we expect to see post-login.
    await expect(rowFor(page, taskA)).toHaveAttribute(
      "data-completed",
      "true",
    );
    await expect(rowFor(page, taskB)).toHaveAttribute(
      "data-completed",
      "false",
    );

    // (4) Log out via the Logout button (POST /api/auth/logout).
    await logOut(page);

    // (5) Log back in with the same credentials.
    await logIn(page, email, password);

    // (6) Assert that both tasks are present with the correct titles, the
    //     completed task still shows the checked + strikethrough state,
    //     and the other task is still un-completed.
    await expect(page.getByTestId("task-item")).toHaveCount(2);

    const persistedA = rowFor(page, taskA);
    const persistedB = rowFor(page, taskB);

    // Titles round-tripped intact.
    await expect(persistedA).toContainText(taskA);
    await expect(persistedB).toContainText(taskB);

    // Completed task: checked checkbox, data-completed="true", and a
    // strikethrough title (the `line-through` Tailwind class is applied to
    // the row's <label> when `completed` is true).
    await expect(persistedA).toHaveAttribute("data-completed", "true");
    await expect(persistedA.getByRole("checkbox")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(persistedA.locator("label")).toHaveClass(/line-through/);

    // Un-completed task: not checked, no strikethrough.
    await expect(persistedB).toHaveAttribute("data-completed", "false");
    await expect(persistedB.getByRole("checkbox")).toHaveAttribute(
      "aria-checked",
      "false",
    );
    await expect(persistedB.locator("label")).not.toHaveClass(/line-through/);
  });
});
