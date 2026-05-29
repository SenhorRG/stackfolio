import { test, expect } from '@playwright/test';

test.describe('Stackfolio critical paths', () => {
  test('home and skills list', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Stackfolio' })).toBeVisible();
    await page.goto('/skills');
    await expect(page.getByRole('heading', { name: 'Skills' })).toBeVisible();
  });

  test('login and profiles', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('dev@stackfolio.local');
    await page.getByPlaceholder('Password').fill('devpassword');
    await page.getByRole('button', { name: 'Dev login' }).click();
    await page.waitForURL('/');
    await page.goto('/profiles');
    await expect(page.getByText('principal')).toBeVisible();
  });

  test('skill detail', async ({ page }) => {
    await page.goto('/skills');
    await page.getByRole('link', { name: 'React' }).first().click();
    await expect(page.getByRole('heading', { name: 'React' })).toBeVisible();
  });
});
