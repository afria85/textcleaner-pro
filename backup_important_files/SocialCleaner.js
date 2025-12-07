/**
 * Social Cleaner - Clean social media text
 */

class SocialCleaner {
    constructor() {
        this.name = 'Social Media Cleaner';
        this.description = 'Clean and format text from social media platforms';
        this.supportedFormats = ['.txt', '.md'];
        this.defaultOptions = {
            removeHashtags: false,
            removeMentions: false,
            removeUrls: true,
            removeEmojis: false,
            removeSpecialChars: false,
            normalizeWhitespace: true,
            fixCapitalization: true,
            removeRepeatedChars: true,
            maxLineLength: 280, // Twitter character limit
            platform: 'auto' // auto, twitter, facebook, instagram, linkedin
        };

        // Platform-specific configurations
        this.platformConfigs = {
            twitter: {
                maxLength: 280,
                allowedChars: /[\p{L}\p{N}\p{P}\p{S}\s]/gu,
                commonHashtags: []
            },
            facebook: {
                maxLength: 63206,
                allowedChars: /[\p{L}\p{N}\p{P}\p{S}\s]/gu
            },
            instagram: {
                maxLength: 2200,
                allowedChars: /[\p{L}\p{N}\p{P}\p{S}\s]/gu
            },
            linkedin: {
                maxLength: 3000,
                allowedChars: /[\p{L}\p{N}\p{P}\s]/gu // More professional
            }
        };
    }

    async process(input, options = {}) {
        const opts = { ...this.defaultOptions, ...options };
        const startTime = performance.now();

        try {
            let output = input;
            const platform = opts.platform === 'auto' ? this.detectPlatform(input) : opts.platform;
            const platformConfig = this.platformConfigs[platform] || {};

            // Apply platform-specific cleaning
            if (platformConfig.allowedChars) {
                output = output.replace(new RegExp(platformConfig.allowedChars, 'gu'), '');
            }

            // Remove URLs
            if (opts.removeUrls) {
                output = this.removeUrls(output);
            }

            // Remove hashtags
            if (opts.removeHashtags) {
                output = this.removeHashtags(output);
            }

            // Remove mentions
            if (opts.removeMentions) {
                output = this.removeMentions(output);
            }

            // Remove emojis
            if (opts.removeEmojis) {
                output = this.removeEmojis(output);
            }

            // Remove special characters
            if (opts.removeSpecialChars) {
                output = this.removeSpecialCharacters(output);
            }

            // Normalize whitespace
            if (opts.normalizeWhitespace) {
                output = this.normalizeWhitespace(output);
            }

            // Fix capitalization
            if (opts.fixCapitalization) {
                output = this.fixCapitalization(output);
            }

            // Remove repeated characters
            if (opts.removeRepeatedChars) {
                output = this.removeRepeatedCharacters(output);
            }

            // Apply platform-specific length limit
            if (platformConfig.maxLength && opts.maxLineLength > 0) {
                const maxLength = Math.min(platformConfig.maxLength, opts.maxLineLength);
                output = this.truncateToLength(output, maxLength);
            }

            const processingTime = performance.now() - startTime;

            // Calculate statistics
            const originalLength = input.length;
            const cleanedLength = output.length;
            const removedCount = originalLength - cleanedLength;
            const urlsRemoved = (input.match(/https?:\/\/[^\s]+/g) || []).length;
            const hashtagsRemoved = (input.match(/#\w+/g) || []).length;
            const mentionsRemoved = (input.match(/@\w+/g) || []).length;

            return {
                output,
                metadata: {
                    platform,
                    originalLength,
                    cleanedLength,
                    removedCount,
                    urlsRemoved,
                    hashtagsRemoved,
                    mentionsRemoved,
                    processingTime,
                    options: opts
                }
            };

        } catch (error) {
            throw new Error(`Social media cleaning failed: ${error.message}`);
        }
    }

    detectPlatform(text) {
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('retweet') || lowerText.includes('rt @') || text.length <= 280) {
            return 'twitter';
        } else if (lowerText.includes('shared a post') || lowerText.includes('facebook.com')) {
            return 'facebook';
        } else if (lowerText.includes('#instagram') || lowerText.includes('instagr.am')) {
            return 'instagram';
        } else if (lowerText.includes('linkedin.com') || lowerText.includes('#linkedin')) {
            return 'linkedin';
        }
        
        return 'general';
    }

    removeUrls(text) {
        const urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+/gi;
        return text.replace(urlPattern, '');
    }

    removeHashtags(text) {
        return text.replace(/#\w+/g, '');
    }

    removeMentions(text) {
        return text.replace(/@\w+/g, '');
    }

    removeEmojis(text) {
        // Unicode emoji ranges
        const emojiPattern = /[\p{Emoji_Presentation}\p{Emoji}\p{Emoji_Modifier_Base}\p{Emoji_Modifier}]/gu;
        return text.replace(emojiPattern, '');
    }

    removeSpecialCharacters(text) {
        // Keep basic punctuation and letters/numbers
        return text.replace(/[^\w\s.,!?;:'"()\-]/g, '');
    }

    normalizeWhitespace(text) {
        return text
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim();
    }

    fixCapitalization(text) {
        // Capitalize first letter of each sentence
        return text.replace(/(^\w|\.\s+\w)/g, m => m.toUpperCase());
    }

    removeRepeatedCharacters(text) {
        // Remove repeated characters (e.g., "soooo" -> "so")
        return text.replace(/(.)\1{2,}/g, '$1$1');
    }

    truncateToLength(text, maxLength) {
        if (text.length <= maxLength) return text;
        
        // Try to truncate at a sentence boundary
        const truncated = text.substring(0, maxLength);
        const lastPeriod = truncated.lastIndexOf('.');
        const lastQuestion = truncated.lastIndexOf('?');
        const lastExclamation = truncated.lastIndexOf('!');
        const lastBoundary = Math.max(lastPeriod, lastQuestion, lastExclamation);
        
        if (lastBoundary > maxLength * 0.7) { // If boundary is in the last 30%
            return truncated.substring(0, lastBoundary + 1);
        }
        
        return truncated + '...';
    }

    // Additional social media specific methods
    extractHashtags(text) {
        const hashtags = text.match(/#\w+/g) || [];
        return [...new Set(hashtags)]; // Remove duplicates
    }

    extractMentions(text) {
        const mentions = text.match(/@\w+/g) || [];
        return [...new Set(mentions)];
    }

    extractUrls(text) {
        const urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+/gi;
        return text.match(urlPattern) || [];
    }

    countCharacters(text, platform = 'twitter') {
        const config = this.platformConfigs[platform] || this.platformConfigs.twitter;
        let count = text.length;
        
        // Twitter counts URLs as 23 characters
        if (platform === 'twitter') {
            const urls = this.extractUrls(text);
            urls.forEach(url => {
                count -= url.length;
                count += 23;
            });
        }
        
        return {
            count,
            max: config.maxLength,
            remaining: config.maxLength - count
        };
    }
}

export default SocialCleaner;