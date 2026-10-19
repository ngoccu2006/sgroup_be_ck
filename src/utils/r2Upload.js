import { PutObjectCommand } from "@aws-sdk/client-s3";
import r2Client from "../configs/r2.config.js";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// day file tu ram len cloudflare r2 va tra ve url cong khai cua file
export async function uploadFileToR2(file, folder = "submissions") {
  const fileExtension = path.extname(file.originalname);
  const fileName = `${folder}/${uuidv4()}${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await r2Client.send(command);

  // Trả về URL xem/tải file công khai
  const fileUrl = `${process.env.R2_PUBLIC_DOMAIN}/${fileName}`;
  return {
    fileUrl,
    fileName: file.originalname,
    key: fileName,
  };
}