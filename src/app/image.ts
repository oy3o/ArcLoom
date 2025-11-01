export interface ImageService {
  /**
   * Generates an image based on a prompt.
   * @param prompt The detailed text prompt for the image.
   * @param aspectRatio The desired aspect ratio.
   * @returns A promise that resolves with the base64-encoded data URL of the image, or null on failure.
   */
  GenerateImage(prompt: string, aspectRatio: '1:1' | '16:9'): Promise<string | null>;
}
