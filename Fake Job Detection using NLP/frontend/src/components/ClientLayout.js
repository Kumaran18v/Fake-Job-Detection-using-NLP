'use client';

import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { usePathname } from 'next/navigation';

export default function ClientLayout({ children }) {
    const pathname = usePathname();
    const hideNav = pathname === '/login' || pathname === '/register';

    return (
        <AuthProvider>
            {!hideNav && <Navbar />}
            <main>{children}</main>
        </AuthProvider>
    );
}
