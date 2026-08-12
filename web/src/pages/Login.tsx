import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import api from '../lib/api';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const response = await api.post('/auth/login', { email, password });
            login(response.data.user, response.data.token);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to login');
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            const response = await api.post('/auth/google', {
                token: credentialResponse.credential,
            });
            login(response.data.user, response.data.token);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Google login failed');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-2xl border border-border shadow-2xl">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
                        Sign in to your account
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <div className="text-red-500 text-sm text-center font-medium">{error}</div>}
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <input
                                type="text"
                                required
                                className="relative block w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                required
                                className="relative block w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative flex w-full justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200"
                        >
                            Sign in
                        </button>
                    </div>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google login failed')}
                        />
                    </div>
                </div>

                <p className="mt-8 text-center text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Link to="/signup" className="font-medium text-primary hover:text-primary/80 transition-colors">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
};
