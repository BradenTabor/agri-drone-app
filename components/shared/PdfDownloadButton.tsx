"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type PdfDownloadButtonProps = {
  pdfUrl: string;
  filename: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  className?: string;
};

export function PdfDownloadButton({
  pdfUrl,
  filename,
  variant = "outline",
  className,
}: PdfDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element and trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download PDF:", error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? "Downloading..." : "Download PDF"}
    </Button>
  );
}
