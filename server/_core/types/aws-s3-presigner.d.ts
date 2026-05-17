import type { S3Client } from "./aws-sdk";

export function getSignedUrl(
  client: S3Client,
  command: unknown,
  options?: { expiresIn?: number }
): Promise<string>;
