export interface S3ClientConfig {
  region?: string;
  endpoint?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export class S3Client {
  constructor(config: S3ClientConfig);
  send(command: unknown): Promise<unknown>;
}

export interface S3ObjectCommandInput {
  Bucket?: string;
  Key?: string;
  Body?: Buffer | Uint8Array | string;
  ContentType?: string;
}

export class PutObjectCommand {
  constructor(input: S3ObjectCommandInput);
}

export class GetObjectCommand {
  constructor(input: S3ObjectCommandInput);
}

export class DeleteObjectCommand {
  constructor(input: S3ObjectCommandInput);
}
