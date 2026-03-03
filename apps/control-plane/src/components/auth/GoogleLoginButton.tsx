'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

declare global {
    interface Window {
        google?: any;
    }
}

export default function GoogleLoginButton() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const buttonRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleCredentialResponse = async (response: any) => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        idToken: response.credential,
                    }),
                });

                const contentType = res.headers.get('content-type') || '';
                const data = contentType.includes('application/json')
                    ? await res.json()
                    : { error: await res.text() };

                if (res.ok && data.success) {
                    toast.success(data.isNewUser ? '¡Cuenta creada con éxito!' : 'Bienvenido de nuevo');
                    router.push(data.isNewUser ? '/dashboard/onboarding' : '/dashboard');
                    router.refresh();
                } else {
                    toast.error(data.error || 'Error al iniciar sesión con Google');
                }
            } catch (error) {
                console.error('Google Auth Error:', error);
                toast.error('Error de conexión');
            } finally {
                setIsLoading(false);
            }
        };

        const initializeGoogleSignIn = () => {
            if (window.google && buttonRef.current) {
                window.google.accounts.id.initialize({
                    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                    callback: handleCredentialResponse,
                });

                window.google.accounts.id.renderButton(buttonRef.current, {
                    theme: 'outline',
                    size: 'large',
                    width: 320,
                    text: 'continue_with',
                    shape: 'rectangular',
                });
            }
        };

        if (!window.google) {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = initializeGoogleSignIn;
            document.head.appendChild(script);
        } else {
            initializeGoogleSignIn();
        }
    }, [router]);

    return (
        <div className="relative w-full">
            {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-surface-2/80">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                </div>
            )}
            <div ref={buttonRef} className="w-full min-h-[44px]" />
        </div>
    );
}
