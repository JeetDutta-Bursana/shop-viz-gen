import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface UploadZoneProps {
  onImageUploaded: (url: string) => void;
  userId: string;
}

const UploadZone = ({ onImageUploaded, userId }: UploadZoneProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      try {
        const { error: uploadError, data } = await supabase.storage
          .from("product-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("product-images").getPublicUrl(fileName);

        setPreview(publicUrl);
        onImageUploaded(publicUrl);
        toast.success("Image uploaded successfully!");
      } catch (error: any) {
        toast.error("Upload failed: " + error.message);
      } finally {
        setUploading(false);
      }
    },
    [userId, onImageUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxFiles: 1,
  });

  const clearImage = () => {
    setPreview(null);
    onImageUploaded("");
  };

  return (
    <Card className="shadow-card">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <ImageIcon className="w-5 h-5 mr-2 text-primary" />
          Upload Product Image
        </h3>
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg"
            />
            <Button
              onClick={clearImage}
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {uploading
                ? "Uploading..."
                : isDragActive
                ? "Drop the image here"
                : "Drag & drop your product image, or click to select"}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              PNG, JPG, JPEG, or WEBP
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UploadZone;
