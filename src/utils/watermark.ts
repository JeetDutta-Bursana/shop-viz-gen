/**
 * Utility function to add BURSANA logo watermark to an image
 * Returns a data URL of the watermarked image
 */
export async function addWatermarkToImage(
  imageUrl: string,
  logoUrl: string = '/bursana-logo.svg'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Set canvas size to image size
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);
      
      // Load and draw the logo watermark
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      
      logo.onload = () => {
        // Calculate watermark size (15% of image width, maintain aspect ratio)
        const watermarkWidth = canvas.width * 0.15;
        const watermarkHeight = (logo.height / logo.width) * watermarkWidth;
        
        // Position watermark in bottom-right corner with padding
        const padding = canvas.width * 0.02; // 2% of image width
        const x = canvas.width - watermarkWidth - padding;
        const y = canvas.height - watermarkHeight - padding;
        
        // Add semi-transparent white background for better visibility
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const bgPadding = padding * 0.5;
        ctx.fillRect(
          x - bgPadding,
          y - bgPadding,
          watermarkWidth + (bgPadding * 2),
          watermarkHeight + (bgPadding * 2)
        );
        
        // Draw the logo watermark
        ctx.globalAlpha = 1.0;
        ctx.drawImage(logo, x, y, watermarkWidth, watermarkHeight);
        
        // Convert to data URL
        const watermarkedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        resolve(watermarkedDataUrl);
      };
      
      logo.onerror = () => {
        // If logo fails to load, return image without watermark
        console.warn('Logo failed to load, returning image without watermark');
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        resolve(dataUrl);
      };
      
      logo.src = logoUrl;
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Download an image with watermark if needed
 */
export async function downloadImageWithWatermark(
  imageUrl: string,
  isFreeCredit: boolean,
  filename: string = `bursana-ai-${Date.now()}.jpg`
): Promise<void> {
  try {
    let finalImageUrl = imageUrl;
    
    // If this is a free credit image, add watermark before downloading
    if (isFreeCredit) {
      const watermarkedDataUrl = await addWatermarkToImage(imageUrl);
      finalImageUrl = watermarkedDataUrl;
    }
    
    // Create download link
    const response = await fetch(finalImageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

