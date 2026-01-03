/**
 * Validate file size (max 2MB)
 */
export const validateFileSize = (file: File, maxSizeMB: number = 2): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

/**
 * Validate file type for images
 */
export const validateImageType = (file: File): boolean => {
  return ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type);
};

/**
 * Convert file to base64 data URL
 */
export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target?.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
