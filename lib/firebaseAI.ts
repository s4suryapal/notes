import { NativeModules } from 'react-native';

const { FirebaseAIModule } = NativeModules;

export interface FirebaseAI {
  isAvailable(): Promise<boolean>;
  getSdkInfo(): Promise<string | null>;
  generateText(model: string, prompt: string): Promise<string>;
}

/**
 * Firebase AI (Gemini) wrapper for generating text
 */
export const firebaseAI: FirebaseAI = {
  /**
   * Check if Firebase AI is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (!FirebaseAIModule) return false;
      return await FirebaseAIModule.isAvailable();
    } catch (error) {
      console.error('Error checking Firebase AI availability:', error);
      return false;
    }
  },

  /**
   * Get SDK info
   */
  async getSdkInfo(): Promise<string | null> {
    try {
      if (!FirebaseAIModule) return null;
      return await FirebaseAIModule.getSdkInfo();
    } catch (error) {
      console.error('Error getting Firebase AI SDK info:', error);
      return null;
    }
  },

  /**
   * Generate text using Firebase AI (Gemini)
   * @param model - Model name (default: "gemini-2.0-flash-exp")
   * @param prompt - The prompt to generate text from
   * @returns Generated text
   */
  async generateText(model: string = 'gemini-2.0-flash-exp', prompt: string): Promise<string> {
    try {
      if (!FirebaseAIModule) {
        throw new Error('Firebase AI Module not available');
      }
      return await FirebaseAIModule.generateText(model, prompt);
    } catch (error) {
      console.error('Error generating text with Firebase AI:', error);
      throw error;
    }
  },
};

/**
 * Generate a concise title from note content
 * @param content - Note content (HTML or plain text)
 * @param maxLength - Maximum title length (default: 50)
 * @returns Generated title
 */
export async function generateNoteTitle(content: string, maxLength: number = 50): Promise<string> {
  try {
    // Strip HTML tags
    const plainText = content.replace(/<[^>]*>/g, ' ').trim();

    // If content is too short, use it as is
    if (plainText.length === 0) {
      return 'Untitled Note';
    }

    if (plainText.length <= maxLength) {
      return plainText;
    }

    // Get first 500 chars to analyze
    const contentPreview = plainText.substring(0, 500);

    // Generate title using AI
    const prompt = `Generate a concise, descriptive title (maximum ${maxLength} characters) for this note content. Return ONLY the title, no quotes or extra text:\n\n${contentPreview}`;

    const generatedTitle = await firebaseAI.generateText('gemini-2.0-flash-exp', prompt);

    // Clean up the response (remove quotes if present)
    let title = generatedTitle.trim().replace(/^["']|["']$/g, '');

    // Ensure title doesn't exceed max length
    if (title.length > maxLength) {
      title = title.substring(0, maxLength - 3) + '...';
    }

    return title || 'Untitled Note';
  } catch (error) {
    console.error('Error generating note title:', error);

    // Fallback: use first line or first N characters
    const plainText = content.replace(/<[^>]*>/g, ' ').trim();
    if (plainText.length === 0) return 'Untitled Note';

    const firstLine = plainText.split('\n')[0];
    if (firstLine.length <= maxLength) {
      return firstLine;
    }

    return plainText.substring(0, maxLength - 3) + '...';
  }
}
