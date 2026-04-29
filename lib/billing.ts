import crypto from 'crypto';
import { env } from '@/lib/env';

export async function createLemonCheckout(checkoutData: {
  userId: string;
  userEmail: string;
  userName?: string | null;
}) {
  const payload = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          email: checkoutData.userEmail,
          name: checkoutData.userName ?? undefined,
          custom: {
            user_id: checkoutData.userId,
          },
        },
        checkout_options: {
          embed: false,
          media: false,
        },
        product_options: {
          redirect_url: `${env.appUrl}/alerts?billing=success`,
          receipt_button_text: 'Go to Peakly',
          receipt_link_url: `${env.appUrl}/alerts`,
        },
      },
      relationships: {
        store: {
          data: {
            type: 'stores',
            id: env.lemonStoreId,
          },
        },
        variant: {
          data: {
            type: 'variants',
            id: env.lemonVariantId,
          },
        },
      },
    },
  };

  const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.lemonApiKey}`,
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Lemon checkout failed: ${errorBody}`);
  }

  const json = await response.json();
  return json?.data?.attributes?.url as string | undefined;
}

export function verifyLemonSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  const hmac = crypto.createHmac('sha256', env.lemonWebhookSecret);
  const digest = hmac.update(rawBody).digest('hex');
  const provided = signatureHeader.trim();
  if (provided.length !== digest.length) return false;
  return crypto.timingSafeEqual(Buffer.from(digest, 'utf8'), Buffer.from(provided, 'utf8'));
}
