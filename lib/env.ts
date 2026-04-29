function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get supabaseUrl() {
    return readRequiredEnv('NEXT_PUBLIC_SUPABASE_URL');
  },
  get supabaseAnonKey() {
    return readRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  },
  get supabaseServiceRoleKey() {
    return readRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  },
  get appUrl() {
    return readRequiredEnv('NEXT_PUBLIC_APP_URL');
  },
  get lemonApiKey() {
    return readRequiredEnv('LEMON_SQUEEZY_API_KEY');
  },
  get lemonStoreId() {
    return readRequiredEnv('LEMON_SQUEEZY_STORE_ID');
  },
  get lemonVariantId() {
    return readRequiredEnv('LEMON_SQUEEZY_VARIANT_ID');
  },
  get lemonWebhookSecret() {
    return readRequiredEnv('LEMON_SQUEEZY_WEBHOOK_SECRET');
  },
  get resendApiKey() {
    return readRequiredEnv('RESEND_API_KEY');
  },
} as const;
