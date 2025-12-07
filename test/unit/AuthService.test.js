/**
 * AuthService Unit Tests
 * Comprehensive test suite for authentication service
 */

import AuthService from '@/js/modules/services/AuthService';
import ApiService from '@/js/modules/services/ApiService';
import Storage from '@/js/modules/storage/LocalStorage';

// Mock dependencies
jest.mock('@/js/modules/services/ApiService');
jest.mock('@/js/modules/storage/LocalStorage');

describe('AuthService', () => {
    let authService;
    let mockApi;
    let mockStorage;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Create mock instances
        mockApi = {
            post: jest.fn(),
            get: jest.fn(),
        };
        
        mockStorage = {
            get: jest.fn(),
            set: jest.fn(),
            remove: jest.fn(),
        };

        // Setup mock implementations
        ApiService.mockImplementation(() => mockApi);
        Storage.mockImplementation(() => mockStorage);

        // Create AuthService instance
        authService = new AuthService();
    });

    afterEach(() => {
        authService.destroy();
    });

    describe('Login', () => {
        it('should login successfully with valid credentials', async () => {
            // Arrange
            const mockResponse = {
                success: true,
                data: {
                    user: { id: 1, email: 'test@example.com', name: 'Test User' },
                    session: { token: 'jwt-token', expiresAt: new Date() },
                    requiresMFA: false,
                },
            };
            
            mockApi.post.mockResolvedValue(mockResponse);

            // Act
            const result = await authService.login('test@example.com', 'Password123');

            // Assert
            expect(result.success).toBe(true);
            expect(result.user.email).toBe('test@example.com');
            expect(mockApi.post).toHaveBeenCalledWith('/auth/login', expect.any(Object));
            expect(mockStorage.set).toHaveBeenCalledWith('session', expect.any(Object));
        });

        it('should fail login with invalid email format', async () => {
            // Act
            const result = await authService.login('invalid-email', 'Password123');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid email format');
        });

        it('should fail login with weak password', async () => {
            // Act
            const result = await authService.login('test@example.com', 'weak');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Password does not meet requirements');
        });

        it('should handle API errors gracefully', async () => {
            // Arrange
            mockApi.post.mockRejectedValue(new Error('Network error'));

            // Act
            const result = await authService.login('test@example.com', 'Password123');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Authentication failed. Please try again.');
        });

        it('should track failed login attempts', async () => {
            // Arrange
            mockApi.post.mockResolvedValue({
                success: false,
                error: 'Invalid credentials',
                remainingAttempts: 2,
            });

            // Act
            const result = await authService.login('test@example.com', 'WrongPassword');

            // Assert
            expect(result.success).toBe(false);
            expect(result.remainingAttempts).toBe(2);
            expect(mockStorage.set).toHaveBeenCalledWith('failed_attempts', 1);
        });
    });

    describe('Logout', () => {
        it('should logout successfully', async () => {
            // Arrange
            authService.user = { id: 1 };
            authService.session = { token: 'jwt-token' };
            
            mockApi.post.mockResolvedValue({ success: true });

            // Act
            await authService.logout();

            // Assert
            expect(mockApi.post).toHaveBeenCalledWith('/auth/logout', expect.any(Object));
            expect(mockStorage.remove).toHaveBeenCalledWith('session');
            expect(authService.user).toBeNull();
            expect(authService.session).toBeNull();
        });

        it('should clear local data even if API call fails', async () => {
            // Arrange
            authService.user = { id: 1 };
            authService.session = { token: 'jwt-token' };
            
            mockApi.post.mockRejectedValue(new Error('Network error'));

            // Act
            await authService.logout();

            // Assert
            expect(authService.user).toBeNull();
            expect(authService.session).toBeNull();
        });
    });

    describe('Registration', () => {
        it('should register user successfully', async () => {
            // Arrange
            const userData = {
                email: 'new@example.com',
                password: 'Password123',
                confirmPassword: 'Password123',
                name: 'New User',
            };
            
            mockApi.post.mockResolvedValue({
                success: true,
                data: { userId: 2 },
            });

            // Act
            const result = await authService.register(userData);

            // Assert
            expect(result.success).toBe(true);
            expect(result.userId).toBe(2);
            expect(mockApi.post).toHaveBeenCalledWith('/auth/register', expect.any(Object));
        });

        it('should validate registration data', async () => {
            // Arrange
            const invalidData = {
                email: 'invalid',
                password: 'weak',
                confirmPassword: 'different',
                name: '',
            };

            // Act
            const result = await authService.register(invalidData);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid email format');
            expect(result.error).toContain('Password must be');
            expect(result.error).toContain('Passwords do not match');
            expect(result.error).toContain('Name must be');
        });
    });

    describe('Role-based Access Control', () => {
        beforeEach(() => {
            authService.roles = new Set(['user', 'editor']);
            authService.permissions = new Map([
                ['read', true],
                ['write', true],
                ['delete', false],
            ]);
        });

        it('should check user roles correctly', () => {
            expect(authService.hasRole('user')).toBe(true);
            expect(authService.hasRole('editor')).toBe(true);
            expect(authService.hasRole('admin')).toBe(false);
        });

        it('should check user permissions correctly', () => {
            expect(authService.hasPermission('read')).toBe(true);
            expect(authService.hasPermission('write')).toBe(true);
            expect(authService.hasPermission('delete')).toBe(false);
        });

        it('should return roles array', () => {
            const roles = authService.getRoles();
            expect(roles).toContain('user');
            expect(roles).toContain('editor');
        });

        it('should return permissions object', () => {
            const permissions = authService.getPermissions();
            expect(permissions.read).toBe(true);
            expect(permissions.delete).toBe(false);
        });
    });

    describe('Session Management', () => {
        it('should restore valid session from storage', async () => {
            // Arrange
            const savedSession = {
                user: { id: 1, email: 'test@example.com' },
                session: { token: 'jwt-token' },
                roles: ['user'],
                permissions: { read: true },
                timestamp: Date.now() - 1000, // 1 second ago
            };
            
            mockStorage.get.mockResolvedValue(savedSession);

            // Act
            await authService.restoreSession();

            // Assert
            expect(authService.user).toEqual(savedSession.user);
            expect(authService.session).toEqual(savedSession.session);
        });

        it('should not restore expired session', async () => {
            // Arrange
            const expiredSession = {
                user: { id: 1 },
                session: { token: 'jwt-token' },
                timestamp: Date.now() - (31 * 60 * 1000), // 31 minutes ago
            };
            
            mockStorage.get.mockResolvedValue(expiredSession);

            // Act
            const result = await authService.restoreSession();

            // Assert
            expect(result).toBe(false);
            expect(authService.user).toBeNull();
        });

        it('should refresh expiring token', async () => {
            // Arrange
            authService.session = {
                token: 'old-token',
                refreshToken: 'refresh-token',
                expiresAt: new Date(Date.now() + (4 * 60 * 1000)), // Expires in 4 minutes
            };
            
            mockApi.post.mockResolvedValue({
                success: true,
                data: {
                    session: {
                        token: 'new-token',
                        expiresAt: new Date(Date.now() + (30 * 60 * 1000)),
                    },
                },
            });

            // Act
            await authService.refreshToken();

            // Assert
            expect(mockApi.post).toHaveBeenCalledWith('/auth/refresh', {
                refreshToken: 'refresh-token',
            });
            expect(authService.session.token).toBe('new-token');
        });
    });

    describe('Validation', () => {
        it('should validate email format', () => {
            expect(authService.validateEmail('valid@example.com')).toBe(true);
            expect(authService.validateEmail('invalid-email')).toBe(false);
            expect(authService.validateEmail('missing@domain')).toBe(false);
        });

        it('should validate password strength', () => {
            expect(authService.validatePassword('Password123')).toBe(true);
            expect(authService.validatePassword('weak')).toBe(false);
            expect(authService.validatePassword('nouppercase123')).toBe(false);
            expect(authService.validatePassword('NOLOWERCASE123')).toBe(false);
            expect(authService.validatePassword('NoNumbers')).toBe(false);
            expect(authService.validatePassword('Short1')).toBe(false);
        });
    });

    describe('Event Emission', () => {
        it('should emit login event on successful login', async () => {
            // Arrange
            const loginHandler = jest.fn();
            authService.on('login', loginHandler);
            
            mockApi.post.mockResolvedValue({
                success: true,
                data: {
                    user: { id: 1 },
                    session: { token: 'jwt-token' },
                    requiresMFA: false,
                },
            });

            // Act
            await authService.login('test@example.com', 'Password123');

            // Assert
            expect(loginHandler).toHaveBeenCalledWith({ id: 1 });
        });

        it('should emit logout event on logout', async () => {
            // Arrange
            const logoutHandler = jest.fn();
            authService.on('logout', logoutHandler);
            
            authService.user = { id: 1 };
            authService.session = { token: 'jwt-token' };

            // Act
            await authService.logout();

            // Assert
            expect(logoutHandler).toHaveBeenCalled();
        });
    });
});