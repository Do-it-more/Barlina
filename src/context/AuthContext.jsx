import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            try {
                const { data } = await api.get('/users/me');
                if (data && data._id && data.email) {
                    setUser(data);
                } else {
                    throw new Error("Invalid user data received");
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                setUser(null);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        refreshUser();
    }, []);

    // Instant Permission Updates Setup
    // Instant Permission Updates Setup
    useEffect(() => {
        if (!user?._id) return; // Only connect if user is logged in

        let socket;
        const socketUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/api\/?$/, '');

        import('socket.io-client').then(({ io }) => {
            // Check if component already unmounted or user changed before this loads
            if (!user?._id) return;

            socket = io(socketUrl, {
                transports: ['websocket'],
                // Add query if needed to identify connection purpose
            });

            socket.on('rbac_update', (data) => {
                // If the update targets THIS user
                if (user && data.userId === user._id) {
                    console.log("Permissions updated instantly. Refreshing profile...");
                    refreshUser();
                }
            });
        });

        return () => {
            if (socket) socket.disconnect();
        };
    }, [user?._id]); // Only re-run if ID changes, preserving connection on minor updates

    const login = async (email, password, rememberMe = true) => {
        const { data } = await api.post('/users/login', { email, password, rememberMe });

        if (data.token) {
            if (rememberMe) {
                localStorage.setItem('token', data.token);
            } else {
                sessionStorage.setItem('token', data.token);
            }
            setUser(data);
        }
        return data; // Return full data so component can check for twoFactorRequired
    };

    const verifyTwoFactorLogin = async (email, otp, rememberMe = true) => {
        const { data } = await api.post('/users/login/2fa', { email, otp });
        if (data.token) {
            if (rememberMe) {
                localStorage.setItem('token', data.token);
            } else {
                sessionStorage.setItem('token', data.token);
            }
            setUser(data);
        }
        return data;
    };

    const resendTwoFactorLogin = async (email) => {
        return await api.post('/users/login/resend-2fa', { email });
    };

    const register = async (name, email, password, phoneNumber, verificationToken, phoneVerificationToken) => {
        const { data } = await api.post('/users', { name, email, password, phoneNumber, verificationToken, phoneVerificationToken });
        // Default to localStorage for registration, or ask? Usually assume persistent or ephemeral?
        // Let's assume persistent for new registrations for better UX
        localStorage.setItem('token', data.token);
        setUser(data);
        return data;
    };

    const googleLogin = async (code) => {
        const { data } = await api.post('/users/google-auth', { code }); // Put code in body
        if (data.token) {
            localStorage.setItem('token', data.token);
            setUser(data);
        }
        return data;
    };

    const logout = async () => {
        try {
            await api.post('/users/logout');
        } catch (error) {
            console.error("Logout log failed", error);
        } finally {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            setUser(null);
            window.location.href = '/login';
        }
    };

    const updateProfile = async (formData) => {
        // Handle multipart/form-data for photo upload or regular JSON for text update
        // We will separate logic in component, but here we can have a generic refresher
        // Or specific methods. Let's make a generic re-fetch or manual update.
        // Actually best to return the updated user from API and set it.
    };

    // Helper to manually update local user state (e.g. after photo upload)
    const setUserData = (userData) => {
        setUser(userData);
    }

    return (
        <AuthContext.Provider value={{ user, login, verifyTwoFactorLogin, resendTwoFactorLogin, register, logout, loading, setUserData, googleLogin }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
