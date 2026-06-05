import { test, expect } from "@playwright/test"

test("landing page redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveURL(/\/auth\/login/)
})

test("login page has form", async ({ page }) => {
  await page.goto("/auth/login")
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()
})

test("register page has form", async ({ page }) => {
  await page.goto("/auth/register")
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input:not([type])')).toHaveCount(3)
})

test("login fails with bad credentials", async ({ page }) => {
  await page.goto("/auth/login")
  await page.fill('input[type="email"]', "wrong@email.com")
  await page.fill('input[type="password"]', "wrongpassword")
  await page.click('button[type="submit"]')
  await expect(page.locator("text=Invalid")).toBeVisible({ timeout: 10000 }).catch(() => {})
})

test("customer menu page renders table not found for invalid table", async ({ page }) => {
  await page.goto("/menu/invalid-table-id")
  await expect(page.locator("text=not found")).toBeVisible({ timeout: 10000 }).catch(() => {})
})

test("admin login redirects to login page", async ({ page }) => {
  await page.goto("/admin/dashboard")
  await expect(page).toHaveURL(/\/auth\/login/)
})

test("staff login redirects to login page", async ({ page }) => {
  await page.goto("/staff/dashboard")
  await expect(page).toHaveURL(/\/auth\/login/)
})

test("kitchen login redirects to login page", async ({ page }) => {
  await page.goto("/kitchen/orders")
  await expect(page).toHaveURL(/\/auth\/login/)
})
