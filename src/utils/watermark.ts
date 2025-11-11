/**
 * Get proxied image URL to bypass CORS
 */
async function getProxiedImageUrl(imageUrl: string): Promise<string> {
  // Check if we need to use proxy (external URLs that might have CORS issues)
  if (imageUrl.startsWith('data:') || imageUrl.startsWith('/')) {
    return imageUrl; // Local or data URLs don't need proxy
  }

  try {
    // Get Supabase URL from environment
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      console.warn('VITE_SUPABASE_URL not found, using original URL');
      return imageUrl;
    }

    // Use proxy Edge Function
    const proxyUrl = `${supabaseUrl}/functions/v1/proxy-image?url=${encodeURIComponent(imageUrl)}`;
    return proxyUrl;
  } catch (error) {
    console.warn('Failed to create proxy URL, using original:', error);
    return imageUrl;
  }
}

/**
 * Utility function to add BURSANA logo watermark to an image
 * Returns a data URL of the watermarked image
 */
export async function addWatermarkToImage(
  imageUrl: string,
  logoUrl: string = '/bursana-logo.svg'
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    // Try to get proxied URL if needed
    let finalImageUrl = imageUrl;
    try {
      finalImageUrl = await getProxiedImageUrl(imageUrl);
    } catch (error) {
      console.warn('Failed to get proxy URL, using original:', error);
    }

    const img = new Image();
    // Try to set crossOrigin, but handle CORS errors gracefully
    try {
      img.crossOrigin = 'anonymous';
    } catch (e) {
      // Some browsers may not support this
      console.warn('Could not set crossOrigin:', e);
    }
    
    img.onload = () => {
      // Set canvas size to image size
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);
      
      // Load and draw the logo watermark
      const logo = new Image();
      try {
        logo.crossOrigin = 'anonymous';
      } catch (e) {
        console.warn('Could not set crossOrigin for logo:', e);
      }
      
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
    
    img.onerror = async (error) => {
      // If CORS blocks the image, try using proxy
      console.warn('Failed to load image directly, trying proxy:', error);
      
      // If we haven't tried proxy yet, try it
      if (finalImageUrl === imageUrl) {
        try {
          const proxiedUrl = await getProxiedImageUrl(imageUrl);
          if (proxiedUrl !== imageUrl) {
            // Try loading with proxy
            img.src = proxiedUrl;
            return;
          }
        } catch (proxyError) {
          console.error('Proxy also failed:', proxyError);
        }
      }
      
      reject(new Error('Failed to load image. This may be due to CORS restrictions.'));
    };
    
    // Handle CORS errors by trying without crossOrigin if needed
    img.src = finalImageUrl;
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
      try {
        const watermarkedDataUrl = await addWatermarkToImage(imageUrl);
        finalImageUrl = watermarkedDataUrl;
      } catch (watermarkError) {
        // If watermarking fails (CORS issue), try to download directly
        console.warn('Watermarking failed, downloading original image:', watermarkError);
        // Fall through to download original image
      }
    }
    
    // If it's already a data URL, use it directly
    if (finalImageUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = finalImageUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    
    // For regular URLs, try to fetch (may fail due to CORS)
    try {
      // Try direct fetch first
      let response = await fetch(finalImageUrl);
      
      // If direct fetch fails, try proxy
      if (!response.ok) {
        const proxiedUrl = await getProxiedImageUrl(finalImageUrl);
        if (proxiedUrl !== finalImageUrl) {
          response = await fetch(proxiedUrl);
        }
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (fetchError) {
      // If fetch fails, try proxy
      try {
        const proxiedUrl = await getProxiedImageUrl(finalImageUrl);
        if (proxiedUrl !== finalImageUrl) {
          const response = await fetch(proxiedUrl);
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            return;
          }
        }
      } catch (proxyError) {
        console.warn('Proxy also failed:', proxyError);
      }
      
      // If all else fails, open image in new tab for user to save manually
      console.warn('Direct download failed (CORS), opening in new tab:', fetchError);
      window.open(finalImageUrl, '_blank');
      throw new Error('CORS blocked direct download. Image opened in new tab - please right-click and save.');
    }
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

