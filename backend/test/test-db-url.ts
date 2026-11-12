/** Returns the database name from a MySQL connection URL. */
export function databaseName(urlString: string): string {
  return new URL(urlString).pathname.replace(/^\//, '');
}

/**
 * Refuses to run the suite unless TEST_DATABASE_URL points at a database that
 * is clearly separate from the application database.
 */
export function assertIsolatedTestDatabase(
  testUrl: string,
  applicationUrl?: string,
): void {
  const testName = databaseName(testUrl);
  if (!testName.toLowerCase().includes('test')) {
    throw new Error(
      `Refusing to run tests: TEST_DATABASE_URL must point to a database whose name contains "test" (got "${testName}").`,
    );
  }

  if (!applicationUrl) return;

  let applicationName: string;
  try {
    applicationName = databaseName(applicationUrl);
  } catch {
    return;
  }

  const sameHost = new URL(applicationUrl).host === new URL(testUrl).host;
  if (sameHost && applicationName === testName) {
    throw new Error(
      'Refusing to run tests: TEST_DATABASE_URL and DATABASE_URL point to the same database.',
    );
  }
}
