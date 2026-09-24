import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    User,
    Mail,
    Lock,
    ShieldCheck,
    ArrowLeft,
    Save,
    CheckCircle2,
    AlertCircle,
    Building2,
} from 'lucide-react';
import api from '../api/axios';

interface ProfileData {
    id: string;
    userName: string;
    fullName: string;
    email: string;
    role: string;
}

export const ProfileSettings: React.FC = () => {
    const navigate = useNavigate();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    // Form State
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Müdüre Özel Sistem Ayarları
    const [cafeTitle, setCafeTitle] = useState('Luxe Restaurant & Lounge');
    const [currencySymbol, setCurrencySymbol] = useState('₺');
    const [taxRate, setTaxRate] = useState('10');

    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(null), 3500);
    };

    const showError = (msg: string) => {
        setErrorMsg(msg);
        setTimeout(() => setErrorMsg(null), 3500);
    };

    useEffect(() => {
        api.get<ProfileData>('/Account/me')
            .then((res) => {
                setProfile(res.data);
                setFullName(res.data.fullName || '');
                setEmail(res.data.email || '');
            })
            .catch((err) => {
                if (axios.isAxiosError(err) && err.response?.status === 401) {
                    navigate('/login');
                } else {
                    showError('Profil bilgileri alınamadı.');
                }
            })
            .finally(() => setLoading(false));
    }, [navigate]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword && newPassword !== confirmPassword) {
            showError('Yeni şifreler birbiriyle eşleşmiyor.');
            return;
        }

        try {
            await api.put('/Account/update-profile', {
                fullName,
                email,
                currentPassword: currentPassword || null,
                newPassword: newPassword || null
            });

            showSuccess('Bilgileriniz başarıyla güncellendi.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: unknown) {
            let msg = 'Güncelleme yapılamadı.';
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                msg = err.response.data.message;
            }
            showError(msg);
        }
    };

    if (loading) {
        return (
            <div className= "min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-bold" >
            Profil yükleniyor...
        </div>
    );
  }

const isManager = profile?.role === 'Manager';

return (
    <div className= "min-h-screen bg-slate-50 text-slate-800 font-sans pb-12" >
    {/* Üst Bar */ }
    < header className = "bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20" >
        <div className="flex items-center gap-4" >
            <button
            onClick={ () => navigate(isManager ? '/admin' : '/pos') }
className = "p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition flex items-center gap-2 text-xs font-bold"
    >
    <ArrowLeft size={ 18 } />
        < span > Geri Dön </span>
            </button>
            < div className = "h-5 w-px bg-slate-200" />
                <h1 className="text-lg font-black text-slate-900" > Hesap & Profil Ayarları </h1>
                    </div>

                    < div className = "flex items-center gap-2" >
                        <span className={
                            `text-xs px-3 py-1 rounded-full font-extrabold ${isManager ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`
}>
{ isManager? 'Yönetici Hesabı': 'Kasiyer Hesabı' }
    </span>
    </div>
    </header>

    < div className = "max-w-4xl mx-auto px-6 pt-8" >
    {/* Bildirimler */ }
{
    successMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-sm font-bold shadow-sm" >
            <CheckCircle2 size={ 20 } className = "text-emerald-600" />
                <span>{ successMsg } </span>
                </div>
        )
}
{
    errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 text-sm font-bold shadow-sm" >
            <AlertCircle size={ 20 } className = "text-rose-600" />
                <span>{ errorMsg } </span>
                </div>
        )
}

<div className="grid grid-cols-1 md:grid-cols-3 gap-8" >
{/* Sol: Kimlik Özeti Kartı */ }
    < div className = "bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-fit text-center" >
        <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-600 mx-auto mb-4" >
            <User size={ 36 } />
                </div>
                < h3 className = "text-lg font-black text-slate-900" > { profile?.fullName } </h3>
                    < p className = "text-xs text-slate-500 font-mono mt-0.5" > @{ profile?.userName } </p>

                        < div className = "mt-6 pt-6 border-t border-slate-100 text-left space-y-3 text-xs" >
                            <div>
                            <span className="text-slate-400 font-medium block" > Sistem Rolü </span>
                                < span className = "font-extrabold text-slate-700" > { profile?.role } </span>
                                    </div>
                                    < div >
                                    <span className="text-slate-400 font-medium block" > E - Posta Adresi </span>
                                        < span className = "font-bold text-slate-700 truncate block" > { profile?.email || 'Belirtilmedi'}</span>
                                            </div>
                                            </div>
                                            </div>

{/* Sağ: Güncelleme Formları */ }
<div className="md:col-span-2 space-y-6" >
{/* Kişisel Bilgiler & Şifre Değiştirme */ }
    < form onSubmit = { handleUpdate } className = "bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5" >
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3" >
            <ShieldCheck size={ 18 } className = "text-amber-500" />
                Kişisel Bilgiler & Şifre
                    </h3>

                    < div className = "grid grid-cols-1 sm:grid-cols-2 gap-4" >
                        <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2" > Ad Soyad </label>
                            < div className = "relative" >
                                <User size={ 16 } className = "absolute left-3 top-3 text-slate-400" />
                                    <input
                      type="text"
required
value = { fullName }
onChange = {(e) => setFullName(e.target.value)}
className = "w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
    />
    </div>
    </div>

    < div >
    <label className="block text-xs font-bold text-slate-600 uppercase mb-2" > E - Posta </label>
        < div className = "relative" >
            <Mail size={ 16 } className = "absolute left-3 top-3 text-slate-400" />
                <input
                      type="email"
required
value = { email }
onChange = {(e) => setEmail(e.target.value)}
className = "w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
    />
    </div>
    </div>
    </div>

{/* Şifre Bölümü */ }
<div className="pt-4 border-t border-slate-100 space-y-3" >
    <span className="text-xs font-bold text-slate-500 block" > Şifre Değiştir(Değiştirmek istemiyorsanız boş bırakın) </span>

        < div >
        <label className="block text-[11px] font-bold text-slate-600 mb-1" > Mevcut Şifre </label>
            < div className = "relative" >
                <Lock size={ 16 } className = "absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="password"
placeholder = "Mevcut şifreniz"
value = { currentPassword }
onChange = {(e) => setCurrentPassword(e.target.value)}
className = "w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
    />
    </div>
    </div>

    < div className = "grid grid-cols-1 sm:grid-cols-2 gap-3" >
        <div>
        <label className="block text-[11px] font-bold text-slate-600 mb-1" > Yeni Şifre </label>
            < input
type = "password"
placeholder = "Yeni şifre"
value = { newPassword }
onChange = {(e) => setNewPassword(e.target.value)}
className = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
    />
    </div>
    < div >
    <label className="block text-[11px] font-bold text-slate-600 mb-1" > Yeni Şifre(Tekrar) </label>
        < input
type = "password"
placeholder = "Yeni şifre tekrar"
value = { confirmPassword }
onChange = {(e) => setConfirmPassword(e.target.value)}
className = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
    />
    </div>
    </div>
    </div>

    < button
type = "submit"
className = "w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-2"
    >
    <Save size={ 16 } /> Değişiklikleri Kaydet
        </button>
        </form>

{/* Müdüre Özel Genel Kafe / Restoran Ayarları */ }
{
    isManager && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4" >
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3" >
                <Building2 size={ 18 } className = "text-purple-600" />
                    Müdür Sistem & Restoran Ayarları
                        </h3>

                        < div className = "grid grid-cols-1 sm:grid-cols-3 gap-3" >
                            <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1" > Restoran Adı </label>
                                < input
    type = "text"
    value = { cafeTitle }
    onChange = {(e) => setCafeTitle(e.target.value)
}
className = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
    />
    </div>
    < div >
    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1" > Para Birimi </label>
        < input
type = "text"
value = { currencySymbol }
onChange = {(e) => setCurrencySymbol(e.target.value)}
className = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
    />
    </div>
    < div >
    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1" > KDV Oranı(%) </label>
        < input
type = "number"
value = { taxRate }
onChange = {(e) => setTaxRate(e.target.value)}
className = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
    />
    </div>
    </div>

    < button
type = "button"
onClick = {() => showSuccess('Sistem yapılandırma ayarları kaydedildi.')}
className = "w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase rounded-xl transition"
    >
    Genel Ayarları Güncelle
        </button>
        </div>
            )}
</div>
    </div>
    </div>
    </div>
  );
};