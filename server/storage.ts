/**
 * Cloudflare R2 儲存服務
 * 使用 AWS S3 SDK（R2 是 S3 相容的）
 */

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

// 初始化 R2 客戶端
function getR2Client(): S3Client {
  if (!ENV.r2AccountId || !ENV.r2AccessKeyId || !ENV.r2SecretAccessKey) {
    throw new Error(
      "R2 credentials missing: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY"
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${ENV.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ENV.r2AccessKeyId,
      secretAccessKey: ENV.r2SecretAccessKey,
    },
  });
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

/**
 * 上傳檔案到 R2
 * @param relKey 相對路徑 (e.g., "uploads/image.png")
 * @param data 檔案內容
 * @param contentType MIME type
 * @returns { key, url } 上傳後的 key 和公開 URL
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const client = getR2Client();
  const key = normalizeKey(relKey);

  const command = new PutObjectCommand({
    Bucket: ENV.r2BucketName,
    Key: key,
    Body: typeof data === "string" ? Buffer.from(data) : data,
    ContentType: contentType,
  });

  await client.send(command);

  // 返回公開 URL
  const url = ENV.r2PublicUrl
    ? `${ENV.r2PublicUrl}/${key}`
    : `https://${ENV.r2BucketName}.${ENV.r2AccountId}.r2.cloudflarestorage.com/${key}`;

  return { key, url };
}

/**
 * 取得檔案的公開 URL
 * @param relKey 相對路徑
 * @returns { key, url }
 */
export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);

  // 如果有公開 URL，直接返回
  if (ENV.r2PublicUrl) {
    return {
      key,
      url: `${ENV.r2PublicUrl}/${key}`,
    };
  }

  // 否則生成 presigned URL (有效期 1 小時)
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: ENV.r2BucketName,
    Key: key,
  });

  const url = await getSignedUrl(client, command, { expiresIn: 3600 });
  return { key, url };
}

/**
 * 生成上傳用的 presigned URL
 * 前端可以直接用這個 URL 上傳檔案到 R2
 * @param relKey 相對路徑
 * @param contentType MIME type
 * @param expiresIn URL 有效期（秒），預設 600 秒
 * @returns presigned URL
 */
export async function getPresignedUploadUrl(
  relKey: string,
  contentType: string,
  expiresIn = 600
): Promise<string> {
  const client = getR2Client();
  const key = normalizeKey(relKey);

  const command = new PutObjectCommand({
    Bucket: ENV.r2BucketName,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * 刪除檔案
 * @param relKey 相對路徑
 */
export async function storageDelete(relKey: string): Promise<void> {
  const client = getR2Client();
  const key = normalizeKey(relKey);

  const command = new DeleteObjectCommand({
    Bucket: ENV.r2BucketName,
    Key: key,
  });

  await client.send(command);
}

/**
 * 生成下載用的 presigned URL
 * @param relKey 相對路徑
 * @param expiresIn URL 有效期（秒），預設 3600 秒
 * @returns presigned URL
 */
export async function getPresignedDownloadUrl(
  relKey: string,
  expiresIn = 3600
): Promise<string> {
  const client = getR2Client();
  const key = normalizeKey(relKey);

  const command = new GetObjectCommand({
    Bucket: ENV.r2BucketName,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}
