import { supabase } from "./supabase";

export async function uploadSignSubmission({
  imageBlob,
  latitude,
  longitude,
  deviceMetadata,
}: {
  imageBlob: Blob;
  latitude: number;
  longitude: number;
  deviceMetadata: Record<string, string>;
}): Promise<void> {
  const storagePath = `submissions/${Date.now()}-${crypto.randomUUID()}.jpg`;

  const { error: storageError } = await supabase.storage
    .from("parking-signs")
    .upload(storagePath, imageBlob, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (storageError) throw storageError;

  const { error: dbError } = await supabase.from("sign_submissions").insert({
    image_path: storagePath,
    latitude,
    longitude,
    device_metadata: deviceMetadata,
  });

  if (dbError) {
    // Clean up the orphaned storage file before surfacing the error
    await supabase.storage.from("parking-signs").remove([storagePath]).catch(() => {});
    throw dbError;
  }
}
