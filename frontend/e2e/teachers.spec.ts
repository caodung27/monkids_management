import { test, expect } from '@playwright/test';

test.describe('Teachers', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to teachers page
    await page.goto('/dashboard/teachers');
  });

  test('should display teachers list', async ({ page }) => {
    // Check if the page title is visible
    await expect(page.getByRole('heading', { name: 'Teachers' })).toBeVisible();

    // Check if the "Add Teacher" button is visible
    await expect(page.getByRole('button', { name: 'Add Teacher' })).toBeVisible();

    // Check if the teacher list is visible
    await expect(page.getByRole('heading', { name: 'Teacher List' })).toBeVisible();
  });

  test('should navigate to new teacher form', async ({ page }) => {
    // Click the "Add Teacher" button
    await page.getByRole('button', { name: 'Add Teacher' }).click();

    // Check if we're on the new teacher page
    await expect(page.getByRole('heading', { name: 'New Teacher' })).toBeVisible();

    // Check if the form fields are visible
    await expect(page.getByLabel('First Name')).toBeVisible();
    await expect(page.getByLabel('Last Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Phone')).toBeVisible();
  });

  test('should create a new teacher', async ({ page }) => {
    // Navigate to new teacher form
    await page.goto('/dashboard/teachers/new');

    // Fill in the form
    await page.getByLabel('First Name').fill('John');
    await page.getByLabel('Last Name').fill('Doe');
    await page.getByLabel('Email').fill('john@example.com');
    await page.getByLabel('Phone').fill('1234567890');
    await page.getByLabel('Address').fill('123 Main St');
    await page.getByLabel('Date of Birth').fill('1990-01-01');
    await page.getByLabel('Gender').selectOption('male');
    await page.getByLabel('Qualification').fill('Bachelor of Education');
    await page.getByLabel('Experience').fill('5 years');
    await page.getByLabel('Salary').fill('50000');
    await page.getByLabel('Joining Date').fill('2020-01-01');

    // Submit the form
    await page.getByRole('button', { name: 'Create Teacher' }).click();

    // Check if we're redirected back to the teachers list
    await expect(page).toHaveURL('/dashboard/teachers');

    // Check if the new teacher appears in the list
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('john@example.com')).toBeVisible();
  });

  test('should edit an existing teacher', async ({ page }) => {
    // Navigate to teacher detail page
    await page.goto('/dashboard/teachers/1');

    // Check if we're on the edit teacher page
    await expect(page.getByRole('heading', { name: 'Edit Teacher' })).toBeVisible();

    // Update the form
    await page.getByLabel('First Name').fill('John Updated');
    await page.getByLabel('Last Name').fill('Doe Updated');

    // Submit the form
    await page.getByRole('button', { name: 'Update Teacher' }).click();

    // Check if we're redirected back to the teachers list
    await expect(page).toHaveURL('/dashboard/teachers');

    // Check if the updated teacher appears in the list
    await expect(page.getByText('John Updated Doe Updated')).toBeVisible();
  });

  test('should show validation errors', async ({ page }) => {
    // Navigate to new teacher form
    await page.goto('/dashboard/teachers/new');

    // Try to submit empty form
    await page.getByRole('button', { name: 'Create Teacher' }).click();

    // Check for validation error messages
    await expect(page.getByText('First name is required')).toBeVisible();
    await expect(page.getByText('Last name is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Phone is required')).toBeVisible();
  });
}); 