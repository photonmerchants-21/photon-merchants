import { writeFileSync } from "fs";
import { join } from "path";
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";

/**
 * Sends password-reset notification (local provider logs to terminal in dev)
 * and writes the latest customer reset URL for local QA.
 */
export default async function resetPasswordTokenHandler({
  event: {
    data: { entity_id: email, token, actor_type },
  },
  container,
}: SubscriberArgs<{
  entity_id: string;
  token: string;
  actor_type: string;
}>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION);
  const config = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE);

  const storefrontUrl =
    (config.admin as { storefrontUrl?: string } | undefined)?.storefrontUrl ||
    process.env.STOREFRONT_URL ||
    "http://127.0.0.1:3001";

  const adminBackend =
    (config.admin as { backendUrl?: string } | undefined)?.backendUrl &&
    (config.admin as { backendUrl?: string }).backendUrl !== "/"
      ? (config.admin as { backendUrl?: string }).backendUrl
      : "http://127.0.0.1:9000";
  const adminPath =
    (config.admin as { path?: string } | undefined)?.path || "/app";

  const urlPrefix =
    actor_type === "customer"
      ? storefrontUrl.replace(/\/$/, "")
      : `${adminBackend}${adminPath}`;

  const path =
    actor_type === "customer" ? "/account/reset-password" : "/reset-password";
  const reset_url = `${urlPrefix}${path}?token=${encodeURIComponent(
    token
  )}&email=${encodeURIComponent(email)}`;

  await notificationModuleService.createNotifications({
    to: email,
    channel: "email",
    template: "password-reset",
    data: { reset_url, email },
  });

  if (actor_type === "customer") {
    try {
      writeFileSync(
        join(process.cwd(), ".photon-last-reset-url"),
        reset_url,
        "utf8"
      );
    } catch {
      /* non-fatal in prod-like envs */
    }
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
};
