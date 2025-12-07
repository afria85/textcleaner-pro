/**
 * Validation - Input validation utilities
 */

class Validation {
    constructor() {
        this.rules = {
            required: this.validateRequired,
            email: this.validateEmail,
            url: this.validateUrl,
            phone: this.validatePhone,
            number: this.validateNumber,
            integer: this.validateInteger,
            min: this.validateMin,
            max: this.validateMax,
            minLength: this.validateMinLength,
            maxLength: this.validateMaxLength,
            pattern: this.validatePattern,
            custom: this.validateCustom
        };
    }

    validate(value, rules) {
        const errors = [];
        
        for (const [ruleName, ruleValue] of Object.entries(rules)) {
            const rule = this.rules[ruleName];
            if (rule) {
                const result = rule.call(this, value, ruleValue);
                if (!result.valid) {
                    errors.push({
                        rule: ruleName,
                        value: ruleValue,
                        message: result.message
                    });
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors,
            value
        };
    }

    validateRequired(value, required) {
        if (!required) return { valid: true };
        
        const valid = value !== undefined && value !== null && value !== '';
        return {
            valid,
            message: valid ? '' : 'This field is required'
        };
    }

    validateEmail(value, pattern = null) {
        if (!value) return { valid: true };
        
        const emailPattern = pattern || /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const valid = emailPattern.test(value);
        
        return {
            valid,
            message: valid ? '' : 'Please enter a valid email address'
        };
    }

    validateUrl(value, pattern = null) {
        if (!value) return { valid: true };
        
        const urlPattern = pattern || /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/;
        const valid = urlPattern.test(value);
        
        return {
            valid,
            message: valid ? '' : 'Please enter a valid URL'
        };
    }

    validatePhone(value, pattern = null) {
        if (!value) return { valid: true };
        
        const phonePattern = pattern || /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
        const valid = phonePattern.test(value.replace(/\s/g, ''));
        
        return {
            valid,
            message: valid ? '' : 'Please enter a valid phone number'
        };
    }

    validateNumber(value, options = {}) {
        if (!value) return { valid: true };
        
        const num = Number(value);
        const valid = !isNaN(num) && isFinite(num);
        
        if (!valid) {
            return {
                valid: false,
                message: 'Please enter a valid number'
            };
        }
        
        // Check min/max if provided
        if (options.min !== undefined && num < options.min) {
            return {
                valid: false,
                message: `Value must be at least ${options.min}`
            };
        }
        
        if (options.max !== undefined && num > options.max) {
            return {
                valid: false,
                message: `Value must be at most ${options.max}`
            };
        }
        
        return { valid: true };
    }

    validateInteger(value, options = {}) {
        if (!value) return { valid: true };
        
        const num = Number(value);
        const valid = !isNaN(num) && isFinite(num) && Number.isInteger(num);
        
        if (!valid) {
            return {
                valid: false,
                message: 'Please enter a valid integer'
            };
        }
        
        // Check min/max if provided
        if (options.min !== undefined && num < options.min) {
            return {
                valid: false,
                message: `Value must be at least ${options.min}`
            };
        }
        
        if (options.max !== undefined && num > options.max) {
            return {
                valid: false,
                message: `Value must be at most ${options.max}`
            };
        }
        
        return { valid: true };
    }

    validateMin(value, min) {
        if (!value) return { valid: true };
        
        const num = Number(value);
        const valid = !isNaN(num) && num >= min;
        
        return {
            valid,
            message: valid ? '' : `Value must be at least ${min}`
        };
    }

    validateMax(value, max) {
        if (!value) return { valid: true };
        
        const num = Number(value);
        const valid = !isNaN(num) && num <= max;
        
        return {
            valid,
            message: valid ? '' : `Value must be at most ${max}`
        };
    }

    validateMinLength(value, minLength) {
        if (!value) return { valid: true };
        
        const valid = value.length >= minLength;
        
        return {
            valid,
            message: valid ? '' : `Minimum length is ${minLength} characters`
        };
    }

    validateMaxLength(value, maxLength) {
        if (!value) return { valid: true };
        
        const valid = value.length <= maxLength;
        
        return {
            valid,
            message: valid ? '' : `Maximum length is ${maxLength} characters`
        };
    }

    validatePattern(value, pattern) {
        if (!value) return { valid: true };
        
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        const valid = regex.test(value);
        
        return {
            valid,
            message: valid ? '' : 'Value does not match required pattern'
        };
    }

    validateCustom(value, validator) {
        if (!value) return { valid: true };
        
        if (typeof validator === 'function') {
            const result = validator(value);
            return {
                valid: result === true || (result && result.valid === true),
                message: result && result.message ? result.message : 'Validation failed'
            };
        }
        
        return { valid: false, message: 'Invalid validator function' };
    }

    // Form validation
    validateForm(formData, schema) {
        const results = {};
        let isValid = true;
        
        for (const [field, rules] of Object.entries(schema)) {
            const value = formData[field];
            const validation = this.validate(value, rules);
            
            results[field] = validation;
            
            if (!validation.valid) {
                isValid = false;
            }
        }
        
        return {
            valid: isValid,
            results,
            formData
        };
    }

    // Async validation
    async validateAsync(value, validators) {
        const errors = [];
        
        for (const validator of validators) {
            try {
                const result = await validator(value);
                if (!result.valid) {
                    errors.push({
                        validator: validator.name || 'anonymous',
                        message: result.message
                    });
                }
            } catch (error) {
                errors.push({
                    validator: validator.name || 'anonymous',
                    message: error.message
                });
            }
        }
        
        return {
            valid: errors.length === 0,
            errors,
            value
        };
    }

    // File validation
    validateFile(file, options = {}) {
        const errors = [];
        
        if (!file) {
            return {
                valid: false,
                errors: [{ message: 'No file provided' }]
            };
        }
        
        // Check file size
        if (options.maxSize && file.size > options.maxSize) {
            const maxSizeMB = (options.maxSize / (1024 * 1024)).toFixed(2);
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            errors.push({
                message: `File size (${fileSizeMB} MB) exceeds maximum allowed (${maxSizeMB} MB)`
            });
        }
        
        // Check file type
        if (options.allowedTypes && options.allowedTypes.length > 0) {
            const fileExt = file.name.split('.').pop().toLowerCase();
            const mimeType = file.type.toLowerCase();
            
            const isAllowed = options.allowedTypes.some(type => {
                if (type.startsWith('.')) {
                    return fileExt === type.substring(1).toLowerCase();
                }
                return mimeType === type || mimeType.startsWith(type + '/');
            });
            
            if (!isAllowed) {
                errors.push({
                    message: `File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`
                });
            }
        }
        
        return {
            valid: errors.length === 0,
            errors,
            file
        };
    }

    // Password strength validation
    validatePassword(password, options = {}) {
        const errors = [];
        const requirements = [];
        
        // Minimum length
        const minLength = options.minLength || 8;
        if (password.length < minLength) {
            errors.push(`Password must be at least ${minLength} characters long`);
        } else {
            requirements.push(`? At least ${minLength} characters`);
        }
        
        // Check for uppercase letters
        if (options.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        } else if (options.requireUppercase) {
            requirements.push('? At least one uppercase letter');
        }
        
        // Check for lowercase letters
        if (options.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        } else if (options.requireLowercase) {
            requirements.push('? At least one lowercase letter');
        }
        
        // Check for numbers
        if (options.requireNumbers && !/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        } else if (options.requireNumbers) {
            requirements.push('? At least one number');
        }
        
        // Check for special characters
        if (options.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        } else if (options.requireSpecialChars) {
            requirements.push('? At least one special character');
        }
        
        // Calculate strength score
        let score = 0;
        if (password.length >= minLength) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/\d/.test(password)) score += 1;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
        
        let strength = 'weak';
        if (score >= 4) strength = 'strong';
        else if (score >= 3) strength = 'medium';
        
        return {
            valid: errors.length === 0,
            errors,
            strength,
            score,
            requirements,
            suggestions: this.getPasswordSuggestions(password, options)
        };
    }

    getPasswordSuggestions(password, options) {
        const suggestions = [];
        
        if (password.length < 12) {
            suggestions.push('Use a longer password (12+ characters recommended)');
        }
        
        if (!/\d/.test(password)) {
            suggestions.push('Add numbers to increase strength');
        }
        
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            suggestions.push('Add special characters for better security');
        }
        
        if (password.toLowerCase().includes('password') || password.toLowerCase().includes('123')) {
            suggestions.push('Avoid common patterns and dictionary words');
        }
        
        return suggestions;
    }

    // Credit card validation
    validateCreditCard(number, type = 'auto') {
        // Remove non-digits
        const cleaned = number.replace(/\D/g, '');
        
        if (cleaned.length < 13 || cleaned.length > 19) {
            return {
                valid: false,
                message: 'Invalid card number length'
            };
        }
        
        // Luhn algorithm check
        let sum = 0;
        let isEven = false;
        
        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned.charAt(i), 10);
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        const valid = sum % 10 === 0;
        
        // Determine card type
        let cardType = 'unknown';
        if (valid) {
            cardType = this.detectCardType(cleaned);
        }
        
        return {
            valid,
            cardType,
            formatted: this.formatCardNumber(cleaned),
            message: valid ? '' : 'Invalid credit card number'
        };
    }

    detectCardType(number) {
        const patterns = {
            visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
            mastercard: /^5[1-5][0-9]{14}$/,
            amex: /^3[47][0-9]{13}$/,
            discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
            diners: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
            jcb: /^(?:2131|1800|35\d{3})\d{11}$/
        };
        
        for (const [type, pattern] of Object.entries(patterns)) {
            if (pattern.test(number)) {
                return type;
            }
        }
        
        return 'unknown';
    }

    formatCardNumber(number) {
        const groups = [];
        for (let i = 0; i < number.length; i += 4) {
            groups.push(number.substring(i, i + 4));
        }
        return groups.join(' ');
    }

    // Date validation
    validateDate(dateString, options = {}) {
        if (!dateString) return { valid: true };
        
        const date = new Date(dateString);
        const valid = !isNaN(date.getTime());
        
        if (!valid) {
            return {
                valid: false,
                message: 'Invalid date format'
            };
        }
        
        // Check min/max dates if provided
        if (options.minDate) {
            const minDate = new Date(options.minDate);
            if (date < minDate) {
                return {
                    valid: false,
                    message: `Date must be on or after ${minDate.toLocaleDateString()}`
                };
            }
        }
        
        if (options.maxDate) {
            const maxDate = new Date(options.maxDate);
            if (date > maxDate) {
                return {
                    valid: false,
                    message: `Date must be on or before ${maxDate.toLocaleDateString()}`
                };
            }
        }
        
        return {
            valid: true,
            date: date.toISOString(),
            formatted: date.toLocaleDateString()
        };
    }

    // JSON validation
    validateJSON(jsonString, options = {}) {
        try {
            const parsed = JSON.parse(jsonString);
            
            // Validate against schema if provided
            if (options.schema) {
                const schemaErrors = this.validateJSONSchema(parsed, options.schema);
                if (schemaErrors.length > 0) {
                    return {
                        valid: false,
                        errors: schemaErrors,
                        message: 'JSON does not match schema'
                    };
                }
            }
            
            return {
                valid: true,
                parsed,
                size: jsonString.length
            };
            
        } catch (error) {
            return {
                valid: false,
                error: error.message,
                message: 'Invalid JSON format'
            };
        }
    }

    validateJSONSchema(data, schema) {
        const errors = [];
        // Simplified schema validation
        // In production, use a proper JSON schema validator like ajv
        return errors;
    }

    // Bulk validation
    validateAll(values, ruleSets) {
        const results = {};
        let allValid = true;
        
        for (const [key, value] of Object.entries(values)) {
            const rules = ruleSets[key];
            if (rules) {
                const validation = this.validate(value, rules);
                results[key] = validation;
                if (!validation.valid) {
                    allValid = false;
                }
            }
        }
        
        return {
            valid: allValid,
            results
        };
    }
}

export default Validation;