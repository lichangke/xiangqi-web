export const config = {
  get port() {
    return Number(process.env.PORT ?? 3000);
  },
  get jwtSecret() {
    return process.env.JWT_SECRET ?? 'dev-only-secret-change-me';
  },
  get narrativeApiKey() {
    return process.env.NARRATIVE_API_KEY?.trim() ?? '';
  },
};
