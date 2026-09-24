import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Lock, User, AlertCircle } from 'lucide-react';
import api from '../api/axios';

const parseJwt = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
};

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await api.post('/Auth/login', {
                username: username.trim(),
                password: password
            });

            const token = response.data.token;
            localStorage.setItem('token', token);

            const decoded = parseJwt(token);
            const role =
                decoded?.role ||
                decoded?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
                'Cashier';

            localStorage.setItem('role', role);

            if (role === 'Manager') {
                navigate('/admin');
            } else {
                navigate('/pos');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Giriş yapılamadı. Kullanıcı adı veya şifre hatalı.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className= "min-h-screen bg-[#0b0f17] flex items-center justify-center p-4" >
        <div className="max-w-md w-full bg-[#151c28] border border-slate-700/80 rounded-3xl p-8 shadow-2xl" >
            <div className="flex flex-col items-center mb-8" >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3" >
                    <Coffee size={ 32 } />
                        </div>
                        < h2 className = "text-2xl font-black text-white tracking-wide" > Luxe Kafe & Restoran </h2>
                            < p className = "text-xs text-slate-300 font-semibold mt-1" > Personel & Kasa Girişi </p>
                                </div>

    {
        error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-600 text-white flex items-center gap-3 text-xs font-bold" >
                <AlertCircle size={ 18 } />
                    < span > { error } </span>
                    </div>
        )}

<form onSubmit={ handleSubmit } className = "space-y-4" >
    <div>
    <label className="block text-xs font-bold text-slate-200 uppercase mb-2" > Kullanıcı Adı </label>
        < div className = "relative" >
            <User size={ 18 } className = "absolute left-3.5 top-3.5 text-slate-400" />
                <input
                type="text"
required
value = { username }
onChange = {(e) => setUsername(e.target.value)}
placeholder = "admin veya kasiyer..."
className = "w-full bg-[#0b0f17] border border-slate-600 rounded-xl pl-11 pr-4 py-3 text-white font-medium focus:ring-2 focus:ring-amber-500 outline-none"
    />
    </div>
    </div>

    < div >
    <label className="block text-xs font-bold text-slate-200 uppercase mb-2" > Şifre </label>
        < div className = "relative" >
            <Lock size={ 18 } className = "absolute left-3.5 top-3.5 text-slate-400" />
                <input
                type="password"
required
value = { password }
onChange = {(e) => setPassword(e.target.value)}
placeholder = "••••••••"
className = "w-full bg-[#0b0f17] border border-slate-600 rounded-xl pl-11 pr-4 py-3 text-white font-medium focus:ring-2 focus:ring-amber-500 outline-none"
    />
    </div>
    </div>

    < button
type = "submit"
disabled = { loading }
className = "w-full mt-2 py-3.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg transition"
    >
{ loading? 'Giriş Yapılıyor...': 'Sisteme Giriş Yap' }
    </button>
    </form>
    </div>
    </div>
  );
};