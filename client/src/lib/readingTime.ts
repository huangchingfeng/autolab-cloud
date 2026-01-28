/**
 * Calculate estimated reading time based on content
 * @param content - The text content to analyze
 * @returns Estimated reading time in minutes
 */
export function calculateReadingTime(content: string): number {
  // Remove HTML tags and markdown syntax
  const plainText = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[#*`_~\[\]()]/g, '') // Remove markdown syntax
    .trim();

  // Count Chinese characters and English words separately
  const chineseChars = plainText.match(/[\u4e00-\u9fa5]/g) || [];
  const englishWords = plainText.match(/[a-zA-Z]+/g) || [];

  // Reading speed: 300-400 Chinese characters per minute, 200-250 English words per minute
  const chineseReadingSpeed = 350; // characters per minute
  const englishReadingSpeed = 225; // words per minute

  const chineseTime = chineseChars.length / chineseReadingSpeed;
  const englishTime = englishWords.length / englishReadingSpeed;

  const totalMinutes = Math.ceil(chineseTime + englishTime);

  // Minimum 1 minute
  return Math.max(1, totalMinutes);
}
