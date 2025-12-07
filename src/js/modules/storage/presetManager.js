/**
 * Preset Manager - Manage saved presets and configurations
 */

class PresetManager {
    constructor() {
        this.presets = new Map();
        this.categories = new Set(['General', 'CSV', 'JSON', 'Social', 'Code', 'Custom']);
        this.defaultPresets = this.createDefaultPresets();
        this.loadPresets();
    }

    createDefaultPresets() {
        return [
            {
                id: 'general_clean',
                name: 'General Clean',
                description: 'Basic text cleaning with trim and whitespace normalization',
                category: 'General',
                type: 'cleaner',
                config: {
                    cleaner: 'general',
                    options: {
                        trim: true,
                        removeExtraSpaces: true,
                        removeEmptyLines: true,
                        normalizeLineEndings: true
                    }
                },
                icon: '??',
                created: Date.now(),
                usageCount: 0,
                isDefault: true
            },
            {
                id: 'csv_clean',
                name: 'CSV Cleaner',
                description: 'Clean and format CSV data',
                category: 'CSV',
                type: 'cleaner',
                config: {
                    cleaner: 'csv',
                    options: {
                        delimiter: ',',
                        hasHeader: true,
                        trimFields: true,
                        removeEmptyRows: true
                    }
                },
                icon: '??',
                created: Date.now(),
                usageCount: 0,
                isDefault: true
            },
            {
                id: 'json_format',
                name: 'JSON Formatter',
                description: 'Format JSON with proper indentation',
                category: 'JSON',
                type: 'cleaner',
                config: {
                    cleaner: 'json',
                    options: {
                        indent: 2,
                        sortKeys: false,
                        removeNull: false
                    }
                },
                icon: '{}',
                created: Date.now(),
                usageCount: 0,
                isDefault: true
            },
            {
                id: 'social_clean',
                name: 'Social Media Cleaner',
                description: 'Remove URLs and hashtags from social media text',
                category: 'Social',
                type: 'cleaner',
                config: {
                    cleaner: 'social',
                    options: {
                        removeUrls: true,
                        removeHashtags: true,
                        removeMentions: false,
                        normalizeWhitespace: true
                    }
                },
                icon: '??',
                created: Date.now(),
                usageCount: 0,
                isDefault: true
            },
            {
                id: 'anonymize_basic',
                name: 'Basic Anonymization',
                description: 'Remove email addresses and phone numbers',
                category: 'General',
                type: 'anonymizer',
                config: {
                    processor: 'anonymizer',
                    options: {
                        patterns: ['email', 'phone'],
                        strategy: 'mask'
                    }
                },
                icon: '???',
                created: Date.now(),
                usageCount: 0,
                isDefault: true
            }
        ];
    }

    loadPresets() {
        try {
            const saved = localStorage.getItem('tcp_presets');
            if (saved) {
                const parsed = JSON.parse(saved);
                parsed.forEach(preset => {
                    this.presets.set(preset.id, preset);
                });
            } else {
                // Load default presets
                this.defaultPresets.forEach(preset => {
                    this.presets.set(preset.id, preset);
                });
                this.savePresets();
            }
        } catch (error) {
            console.error('Failed to load presets:', error);
            // Load defaults on error
            this.defaultPresets.forEach(preset => {
                this.presets.set(preset.id, preset);
            });
        }
    }

    savePresets() {
        try {
            const presetsArray = Array.from(this.presets.values());
            localStorage.setItem('tcp_presets', JSON.stringify(presetsArray));
            return true;
        } catch (error) {
            console.error('Failed to save presets:', error);
            return false;
        }
    }

    createPreset(data) {
        const preset = {
            id: data.id || `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: data.name || 'Unnamed Preset',
            description: data.description || '',
            category: data.category || 'Custom',
            type: data.type || 'cleaner',
            config: data.config || {},
            icon: data.icon || '??',
            created: Date.now(),
            updated: Date.now(),
            usageCount: 0,
            isDefault: false,
            tags: data.tags || [],
            favorite: data.favorite || false
        };

        // Validate required fields
        if (!preset.config.cleaner && !preset.config.processor) {
            throw new Error('Preset must specify either a cleaner or processor');
        }

        this.presets.set(preset.id, preset);
        this.savePresets();

        return {
            success: true,
            preset,
            message: 'Preset created successfully'
        };
    }

    getPreset(id) {
        return this.presets.get(id) || null;
    }

    updatePreset(id, updates) {
        const preset = this.presets.get(id);
        if (!preset) {
            return { success: false, error: 'Preset not found' };
        }

        // Don't allow updating default presets
        if (preset.isDefault) {
            return { success: false, error: 'Cannot modify default presets' };
        }

        const updatedPreset = {
            ...preset,
            ...updates,
            updated: Date.now()
        };

        this.presets.set(id, updatedPreset);
        this.savePresets();

        return {
            success: true,
            preset: updatedPreset,
            message: 'Preset updated successfully'
        };
    }

    deletePreset(id) {
        const preset = this.presets.get(id);
        if (!preset) {
            return { success: false, error: 'Preset not found' };
        }

        // Don't allow deleting default presets
        if (preset.isDefault) {
            return { success: false, error: 'Cannot delete default presets' };
        }

        this.presets.delete(id);
        this.savePresets();

        return {
            success: true,
            preset,
            message: 'Preset deleted successfully'
        };
    }

    getAllPresets(filter = {}) {
        let presets = Array.from(this.presets.values());

        // Apply filters
        if (filter.category) {
            presets = presets.filter(p => p.category === filter.category);
        }

        if (filter.type) {
            presets = presets.filter(p => p.type === filter.type);
        }

        if (filter.favorite === true) {
            presets = presets.filter(p => p.favorite);
        }

        if (filter.search) {
            const searchTerm = filter.search.toLowerCase();
            presets = presets.filter(p => 
                p.name.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm) ||
                (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        }

        // Sort based on preference
        const sortField = filter.sortBy || 'usageCount';
        const sortOrder = filter.sortOrder || 'desc';

        presets.sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];

            // Handle different data types
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return presets;
    }

    getCategories() {
        return Array.from(this.categories);
    }

    addCategory(category) {
        this.categories.add(category);
        return Array.from(this.categories);
    }

    recordUsage(presetId) {
        const preset = this.presets.get(presetId);
        if (preset) {
            preset.usageCount = (preset.usageCount || 0) + 1;
            preset.lastUsed = Date.now();
            this.savePresets();
        }
    }

    exportPresets(format = 'json') {
        const presets = this.getAllPresets();

        switch (format) {
            case 'json':
                return JSON.stringify(presets, null, 2);

            case 'csv':
                const headers = ['ID', 'Name', 'Description', 'Category', 'Type', 'Usage Count', 'Created', 'Tags'];
                const rows = presets.map(p => [
                    p.id,
                    p.name,
                    p.description,
                    p.category,
                    p.type,
                    p.usageCount,
                    new Date(p.created).toLocaleDateString(),
                    p.tags?.join('; ') || ''
                ]);

                return [
                    headers.join(','),
                    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
                ].join('\n');

            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    importPresets(data, format = 'json', options = {}) {
        try {
            let presets;

            switch (format) {
                case 'json':
                    presets = JSON.parse(data);
                    break;

                case 'csv':
                    // Simple CSV parsing
                    const lines = data.split('\n');
                    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
                    presets = lines.slice(1).map(line => {
                        const values = line.split(',').map(v => v.replace(/^"|"$/g, '').trim());
                        const preset = {};
                        headers.forEach((header, index) => {
                            preset[header.toLowerCase().replace(' ', '_')] = values[index];
                        });
                        return preset;
                    });
                    break;

                default:
                    return { success: false, error: `Unsupported import format: ${format}` };
            }

            if (!Array.isArray(presets)) {
                return { success: false, error: 'Invalid presets data format' };
            }

            const results = {
                imported: 0,
                skipped: 0,
                errors: []
            };

            presets.forEach(preset => {
                try {
                    // Validate preset
                    if (!preset.name || !preset.config) {
                        results.errors.push(`Invalid preset: ${JSON.stringify(preset)}`);
                        results.skipped++;
                        return;
                    }

                    // Check for duplicates
                    if (this.presets.has(preset.id) && options.overwrite !== true) {
                        results.skipped++;
                        return;
                    }

                    // Import preset
                    this.createPreset(preset);
                    results.imported++;

                } catch (error) {
                    results.errors.push(error.message);
                    results.skipped++;
                }
            });

            this.savePresets();

            return {
                success: true,
                ...results,
                total: presets.length
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    duplicatePreset(id, newName = null) {
        const original = this.presets.get(id);
        if (!original) {
            return { success: false, error: 'Preset not found' };
        }

        const duplicate = {
            ...original,
            id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: newName || `${original.name} (Copy)`,
            created: Date.now(),
            updated: Date.now(),
            usageCount: 0,
            isDefault: false
        };

        // Remove original-specific fields
        delete duplicate.isDefault;

        this.presets.set(duplicate.id, duplicate);
        this.savePresets();

        return {
            success: true,
            originalId: id,
            duplicateId: duplicate.id,
            preset: duplicate
        };
    }

    getMostUsed(limit = 5) {
        const presets = this.getAllPresets({ sortBy: 'usageCount', sortOrder: 'desc' });
        return presets.slice(0, limit);
    }

    getRecent(limit = 5) {
        const presets = this.getAllPresets({ sortBy: 'lastUsed', sortOrder: 'desc' });
        return presets.filter(p => p.lastUsed).slice(0, limit);
    }

    searchPresets(query, fields = ['name', 'description', 'tags']) {
        const results = [];
        const searchTerm = query.toLowerCase();

        this.presets.forEach(preset => {
            for (const field of fields) {
                if (field === 'tags') {
                    if (preset.tags && preset.tags.some(tag => tag.toLowerCase().includes(searchTerm))) {
                        results.push(preset);
                        break;
                    }
                } else if (preset[field] && preset[field].toLowerCase().includes(searchTerm)) {
                    results.push(preset);
                    break;
                }
            }
        });

        return results;
    }

    // Preset validation
    validatePreset(preset) {
        const errors = [];

        if (!preset.name || preset.name.trim().length === 0) {
            errors.push('Preset name is required');
        }

        if (!preset.config) {
            errors.push('Preset configuration is required');
        }

        if (!preset.type) {
            errors.push('Preset type is required');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Reset to default presets
    resetToDefaults() {
        this.presets.clear();
        this.defaultPresets.forEach(preset => {
            this.presets.set(preset.id, preset);
        });
        this.savePresets();

        return {
            success: true,
            message: 'Reset to default presets',
            count: this.defaultPresets.length
        };
    }
}

export default PresetManager;