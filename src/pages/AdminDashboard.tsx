import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    PlusCircle,
    Layers,
    UtensilsCrossed,
    QrCode,
    Users,
    Trash2,
    Edit2,
    LogOut,
    Image as ImageIcon,
    CheckCircle2,
    AlertCircle,
    Save,
    X,
    User,
    Coffee,
    Search
} from 'lucide-react';
import api from '../api/axios';

interface Category {
    id: string;
    name: string;
    displayOrder: number;
}

interface ProductItem {
    id: string;
    name: string;
    description?: string;
    unitPrice: number;
    costPrice: number;
    stockQuantity: number;
    imageUrl?: string;
    categoryId: string;
    categoryName?: string;
}

interface TableItem {
    id: string;
    tableNumber: string;
    qrToken: string;
    qrCodeBase64: string;
}

interface EmployeeItem {
    id: string;
    userName: string;
    fullName: string;
    email: string;
    role: string;
}

interface FinancialData {
    monthly: { revenue: number; cost: number; netProfit: number; orderCount: number };
    yearly: { revenue: number; cost: number; netProfit: number; orderCount: number };
}

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const currentUserName = localStorage.getItem('fullName') || localStorage.getItem('userName') || 'Yönetici';
    const [activeTab, setActiveTab] = useState<'productList' | 'product' | 'category' | 'table' | 'employee'>('productList');

    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Kategori Ekleme & Düzenleme State'leri
    const [catName, setCatName] = useState('');
    const [catOrder, setCatOrder] = useState('1');
    const [categories, setCategories] = useState<Category[]>([]);
    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [editCatName, setEditCatName] = useState('');
    const [editCatOrder, setEditCatOrder] = useState('1');

    // Yeni Ürün Ekleme State'leri
    const [prodName, setProdName] = useState('');
    const [prodDesc, setProdDesc] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [stockQty, setStockQty] = useState('');
    const [selectedCatId, setSelectedCatId] = useState('');
    const [prodImage, setProdImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Ürün Listeleme, Filtre ve Düzenleme Modal State'leri
    const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
    const [prodSearchTerm, setProdSearchTerm] = useState('');
    const [filterCatId, setFilterCatId] = useState('all');
    const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
    const [editProdImage, setEditProdImage] = useState<File | null>(null);
    const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);

    // Masa State'leri
    const [tableName, setTableName] = useState('');
    const [tables, setTables] = useState<TableItem[]>([]);
    const [editingTableId, setEditingTableId] = useState<string | null>(null);
    const [editTableName, setEditTableName] = useState('');

    // Personel State'leri
    const [employees, setEmployees] = useState<EmployeeItem[]>([]);
    const [empUserName, setEmpUserName] = useState('');
    const [empFullName, setEmpFullName] = useState('');
    const [empEmail, setEmpEmail] = useState('');
    const [empPassword, setEmpPassword] = useState('');
    const [empRole, setEmpRole] = useState('Cashier');

    // Finansal Rapor State'i
    const [financials, setFinancials] = useState<FinancialData | null>(null);

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(null), 3500);
    };

    const showError = (msg: string) => {
        setErrorMsg(msg);
        setTimeout(() => setErrorMsg(null), 3500);
    };

    const fetchProducts = useCallback(async () => {
        try {
            const res = await api.get('/Categories');
            const cats = (res.data || []) as Record<string, unknown>[];
            const prods: ProductItem[] = [];

            cats.forEach((c) => {
                const rawProds = (c.products || c.Products || []) as Record<string, unknown>[];
                rawProds.forEach((p) => {
                    prods.push({
                        id: String(p.id || p.Id || ''),
                        name: String(p.name || p.Name || 'Ürün'),
                        description: (p.description || p.Description || '') as string,
                        unitPrice: Number(p.unitPrice ?? p.UnitPrice ?? 0),
                        costPrice: Number(p.costPrice ?? p.CostPrice ?? 0),
                        stockQuantity: Number(p.stockQuantity ?? p.StockQuantity ?? 0),
                        imageUrl: (p.imageUrl || p.ImageUrl || '') as string,
                        categoryId: String(c.id || c.Id || ''),
                        categoryName: String(c.name || c.Name || 'Kategorisiz')
                    });
                });
            });

            setAllProducts(prods);
        } catch (err: unknown) {
            console.error('Ürünler getirilemedi:', err);
        }
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const [catRes, tableRes] = await Promise.all([
                api.get<Category[]>('/Categories'),
                api.get<TableItem[]>('/Tables')
            ]);

            const fetchedCats = catRes.data || [];
            setCategories(fetchedCats);
            setTables(tableRes.data || []);

            if (fetchedCats.length > 0) {
                setSelectedCatId((prev) => (prev ? prev : fetchedCats[0].id));
            }
            await fetchProducts();
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                navigate('/login');
            }
        }
    }, [navigate, fetchProducts]);

    const fetchEmployees = useCallback(async () => {
        try {
            const res = await api.get<EmployeeItem[]>('/Users');
            setEmployees(res.data || []);
        } catch (err: unknown) {
            console.error('Personel listesi hatası:', err);
        }
    }, []);

    const fetchFinancials = useCallback(async () => {
        try {
            const res = await api.get<FinancialData>('/Orders/financial-analytics');
            setFinancials(res.data);
        } catch (err: unknown) {
            console.log('Finansal veri hazır değil:', err);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        const loadInitialData = async () => {
            if (!isMounted) return;
            await fetchData();
            if (!isMounted) return;
            await fetchFinancials();
        };
        void loadInitialData();
        return () => {
            isMounted = false;
        };
    }, [fetchData, fetchFinancials]);

    useEffect(() => {
        let isMounted = true;
        if (activeTab === 'employee') {
            const loadEmployees = async () => {
                if (!isMounted) return;
                await fetchEmployees();
            };
            void loadEmployees();
        }
        return () => {
            isMounted = false;
        };
    }, [activeTab, fetchEmployees]);

    // Ürün Silme
    const handleDeleteProduct = async (id: string, name: string) => {
        if (!window.confirm(`"${name}" ürününü menüden silmek istediğinize emin misiniz?`)) return;
        try {
            await api.delete(`/Products/${id}`);
            showSuccess(`"${name}" başarıyla silindi.`);
            await fetchProducts();
        } catch (err: unknown) {
            let msg = 'Silinemedi.';
            if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
                msg = String(err.response.data.message);
            }
            showError(msg);
        }
    };

    // Ürün Güncelleme (Fiyat, Stok, Fotoğraf vs.)
    const handleUpdateProduct = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingProduct) return;

        try {
            const formData = new FormData();
            formData.append('Name', editingProduct.name.trim());
            formData.append('Description', editingProduct.description || '');
            formData.append('UnitPrice', editingProduct.unitPrice.toString());
            formData.append('CostPrice', editingProduct.costPrice.toString());
            formData.append('StockQuantity', editingProduct.stockQuantity.toString());
            formData.append('CategoryId', editingProduct.categoryId);
            if (editProdImage) {
                formData.append('Image', editProdImage);
            }

            await api.put(`/Products/${editingProduct.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            showSuccess(`"${editingProduct.name}" güncellendi.`);
            setEditingProduct(null);
            setEditProdImage(null);
            setEditPreviewUrl(null);
            await fetchProducts();
        } catch (err: unknown) {
            let msg = 'Güncellenemedi.';
            if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
                msg = String(err.response.data.message);
            }
            showError(msg);
        }
    };

    const handleAddCategory = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            await api.post('/Categories', { name: catName.trim(), displayOrder: parseInt(catOrder, 10) || 1 });
            showSuccess(`"${catName}" kategorisi eklendi.`);
            setCatName('');
            void fetchData();
        } catch (err: unknown) {
            let msg = 'Hata oluştu.';
            if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
                msg = String(err.response.data.message);
            }
            showError(msg);
        }
    };

    const handleUpdateCategory = async (id: string) => {
        try {
            await api.put(`/Categories/${id}`, { name: editCatName.trim(), displayOrder: parseInt(editCatOrder, 10) || 1 });
            showSuccess('Kategori güncellendi.');
            setEditingCatId(null);
            void fetchData();
        } catch (err: unknown) {
            let msg = 'Güncellenemedi.';
            if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
                msg = String(err.response.data.message);
            }
            showError(msg);
        }
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        if (!window.confirm(`"${name}" kategorisini silmek istediğinize emin misiniz?`)) return;
        try {
            await api.delete(`/Categories/${id}`);
            showSuccess('Kategori silindi.');
            void fetchData();
        } catch (err: unknown) {
            let msg = 'Silinemedi.';
            if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
                msg = String(err.response.data.message);
            }
            showError(msg);
        }
    };

    const handleAddTable = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            await api.post('/Tables', { tableNumber: tableName.trim() });
            showSuccess(`"${tableName}" masası ve QR kodu oluşturuldu.`);
            setTableName('');
            void fetchData();
        } catch (err: unknown) {
            let msg = 'Masa eklenemedi.';
            if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
                msg = String(err.response.data.message);
            }
            showError(msg);
        }
    };

    const handleUpdateTable = async (id: string) => {
        try {
            await api.put(`/Tables/${id}`, { tableNumber: editTableName.trim() });
            showSuccess('Masa adı güncellendi.');
            setEditingTableId(null);
            void fetchData();
        } catch (err: unknown) {
            let msg = 'Güncellenemedi.';
            if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
                msg = String(err.response.data.message);
            }
            showError(msg);
        }
    };

    const handleDeleteTable = async (id: string, name: string) => {
        if (!window.confirm(`"${name}" masasını silmek istediğinize emin misiniz?`)) return;
        try {
            await api.delete(`/Tables/${id}`);
            showSuccess('Masa kaldırıldı.');
            void fetchData();
        } catch (err: unknown) {
            let msg = 'Silinemedi.';
            if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
                msg = String(err.response.data.message);
            }
            showError(msg);
        }
    };

    const handleAddProduct = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedCatId) return showError('Lütfen bir kategori seçin.');
        if (!prodImage) return showError('Lütfen bir görsel seçin.');

        const formData = new FormData();
        formData.append('Name', prodName.trim());
        formData.append('Description', prodDesc.trim());
        formData.append('UnitPrice', unitPrice);
        formData.append('CostPrice', costPrice);
        formData.append('StockQuantity', stockQty);
        formData.append('CategoryId', selectedCatId);
        formData.append('Image', prodImage);

        try {
            await api.post('/Products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            showSuccess(`"${prodName}" menüye eklendi.`);
            setProdName('');
            setProdDesc('');
            setUnitPrice('');
            setCostPrice('');
            setStockQty('');
            setProdImage(null);
            setPreviewUrl(null);
            await fetchProducts();
        } catch (err: unknown) {
            let msg = 'Ürün kaydedilemedi.';
            if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
                msg = String(err.response.data.message);
            }
            showError(msg);
        }
    };

    const handleAddEmployee = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            await api.post('/Users', {
                userName: empUserName.trim(),
                fullName: empFullName.trim(),
                email: empEmail.trim(),
                password: empPassword,
                role: empRole
            });
            showSuccess(`"${empFullName}" personeli eklendi.`);
            setEmpUserName('');
            setEmpFullName('');
            setEmpEmail('');
            setEmpPassword('');
            void fetchEmployees();
        } catch (err: unknown) {
            let msg = 'Personel eklenemedi.';
            if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
                msg = String(err.response.data.message);
            }
            showError(msg);
        }
    };

    const handleDeleteEmployee = async (id: string, name: string) => {
        if (!window.confirm(`${name} personelini silmek istediğinize emin misiniz?`)) return;
        try {
            await api.delete(`/Users/${id}`);
            showSuccess(`${name} silindi.`);
            void fetchEmployees();
        } catch (err: unknown) {
            let msg = 'Silinemedi.';
            if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
                msg = String(err.response.data.message);
            }
            showError(msg);
        }
    };

    const filteredProductList = useMemo(() => {
        return allProducts.filter((p) => {
            const matchesSearch = p.name.toLowerCase().includes(prodSearchTerm.toLowerCase());
            const matchesCat = filterCatId === 'all' || p.categoryId === filterCatId;
            return matchesSearch && matchesCat;
        });
    }, [allProducts, prodSearchTerm, filterCatId]);

    return (
        <div className="w-full min-h-screen bg-slate-50 text-slate-800 font-sans pb-12 m-0 p-0">
            {/* 1. ÜST BAR */}
            <header className="w-full bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                        <UtensilsCrossed size={22} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight">Luxe Restaurant & Lounge</h1>
                        <p className="text-xs text-amber-600 font-bold">Müdür Yönetim Paneli</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/pos')}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold rounded-xl border border-slate-200 transition shadow-sm"
                    >
                        POS Masalar Ekranı
                    </button>

                    <button
                        onClick={() => navigate('/profile')}
                        className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-black rounded-xl transition flex items-center gap-2 shadow-sm"
                    >
                        <User size={15} className="text-amber-600" />
                        <span>{currentUserName}</span>
                    </button>

                    <button
                        onClick={() => { localStorage.clear(); navigate('/login'); }}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition shadow-sm"
                        title="Güvenli Çıkış"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* 2. TAM EKRAN İÇERİK */}
            <div className="w-full px-8 pt-6">
                {successMsg && (
                    <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm mb-5">
                        <CheckCircle2 size={20} className="text-emerald-600" />
                        <span>{successMsg}</span>
                    </div>
                )}
                {errorMsg && (
                    <div className="p-4 bg-rose-50 text-rose-800 border border-rose-300 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm mb-5">
                        <AlertCircle size={20} className="text-rose-600" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* Finansal Analiz Kartları */}
                {financials && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 w-full">
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Bu Ayın Performansı</h3>
                                <span className="text-xs bg-indigo-50 text-indigo-700 font-black px-3 py-1 rounded-full border border-indigo-100">
                                    {financials.monthly.orderCount} Kapalı Adisyon
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <span className="text-[11px] text-slate-400 font-semibold block">Aylık Ciro</span>
                                    <span className="text-2xl font-black text-slate-900">{financials.monthly.revenue.toFixed(2)} ₺</span>
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-400 font-semibold block">Aylık Maliyet</span>
                                    <span className="text-2xl font-black text-rose-600">{financials.monthly.cost.toFixed(2)} ₺</span>
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-400 font-semibold block">Aylık Net Kâr</span>
                                    <span className="text-2xl font-black text-emerald-600">+{financials.monthly.netProfit.toFixed(2)} ₺</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Yıllık Finansal Özet</h3>
                                <span className="text-xs bg-emerald-50 text-emerald-700 font-black px-3 py-1 rounded-full border border-emerald-100">
                                    {financials.yearly.orderCount} Kapalı Adisyon
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <span className="text-[11px] text-slate-400 font-semibold block">Yıllık Ciro</span>
                                    <span className="text-2xl font-black text-slate-900">{financials.yearly.revenue.toFixed(2)} ₺</span>
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-400 font-semibold block">Yıllık Maliyet</span>
                                    <span className="text-2xl font-black text-rose-600">{financials.yearly.cost.toFixed(2)} ₺</span>
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-400 font-semibold block">Yıllık Net Kâr</span>
                                    <span className="text-2xl font-black text-emerald-600">+{financials.yearly.netProfit.toFixed(2)} ₺</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 w-full">
                    {/* Sol Tab Menüsü */}
                    <aside className="space-y-2 md:col-span-1">
                        <button
                            onClick={() => setActiveTab('productList')}
                            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-xs font-black transition shadow-sm ${activeTab === 'productList'
                                    ? 'bg-amber-500 text-white shadow-amber-500/20'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                        >
                            <UtensilsCrossed size={18} />
                            Ürün Listesi & Sil / Düzenle
                        </button>

                        <button
                            onClick={() => setActiveTab('product')}
                            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-xs font-black transition shadow-sm ${activeTab === 'product'
                                    ? 'bg-amber-500 text-white shadow-amber-500/20'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                        >
                            <PlusCircle size={18} />
                            Yeni Ürün Ekle (MinIO)
                        </button>

                        <button
                            onClick={() => setActiveTab('category')}
                            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-xs font-black transition shadow-sm ${activeTab === 'category'
                                    ? 'bg-amber-500 text-white shadow-amber-500/20'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                        >
                            <Layers size={18} />
                            Kategoriler & Düzenleme
                        </button>

                        <button
                            onClick={() => setActiveTab('table')}
                            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-xs font-black transition shadow-sm ${activeTab === 'table'
                                    ? 'bg-amber-500 text-white shadow-amber-500/20'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                        >
                            <QrCode size={18} />
                            Masalar & QR & Düzenleme
                        </button>

                        <button
                            onClick={() => setActiveTab('employee')}
                            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-xs font-black transition shadow-sm ${activeTab === 'employee'
                                    ? 'bg-amber-500 text-white shadow-amber-500/20'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                        >
                            <Users size={18} />
                            Personel Yönetimi
                        </button>
                    </aside>

                    {/* Sağ Ana Form / Liste Alanı */}
                    <main className="md:col-span-4 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm w-full">
                        {/* TAB: ÜRÜN LİSTESİ & SİL / DÜZENLE */}
                        {activeTab === 'productList' && (
                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 mb-1">Mevcut Ürünler ({allProducts.length})</h2>
                                        <p className="text-xs text-slate-500">Ürünleri listeleyin, fotoğraflarını ve fiyatlarını güncelleyin veya silin.</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="relative w-48 sm:w-60">
                                            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Ürün Ara..."
                                                value={prodSearchTerm}
                                                onChange={(e) => setProdSearchTerm(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                                            />
                                        </div>

                                        <select
                                            value={filterCatId}
                                            onChange={(e) => setFilterCatId(e.target.value)}
                                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                                        >
                                            <option value="all">Tüm Kategoriler</option>
                                            {categories.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {filteredProductList.length === 0 ? (
                                    <div className="p-16 text-center text-slate-400 font-semibold text-xs border border-dashed rounded-2xl">
                                        Kriterlere uygun ürün bulunamadı.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredProductList.map((p) => (
                                            <div key={p.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between shadow-sm">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 relative">
                                                        {p.imageUrl ? (
                                                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                <Coffee size={24} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-block mb-1">
                                                            {p.categoryName}
                                                        </span>
                                                        <h4 className="font-black text-slate-900 text-sm truncate">{p.name}</h4>
                                                        <p className="text-[11px] text-slate-500 line-clamp-1">{p.description || 'Açıklama yok'}</p>
                                                        <div className="mt-1 flex items-center gap-2">
                                                            <span className="text-sm font-black text-rose-600">₺{p.unitPrice.toFixed(0)}</span>
                                                            <span className="text-[10px] text-slate-400 font-bold">Stok: {p.stockQuantity}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingProduct(p);
                                                            setEditPreviewUrl(p.imageUrl || null);
                                                        }}
                                                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-black rounded-xl border border-amber-200 flex items-center gap-1.5 transition"
                                                    >
                                                        <Edit2 size={13} />
                                                        <span>Düzenle</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteProduct(p.id, p.name)}
                                                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black rounded-xl border border-rose-200 flex items-center gap-1.5 transition"
                                                    >
                                                        <Trash2 size={13} />
                                                        <span>Sil</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: YENİ ÜRÜN EKLE */}
                        {activeTab === 'product' && (
                            <div>
                                <h2 className="text-xl font-black text-slate-900 mb-1">Yeni Menü Ürünü Tanımla</h2>
                                <p className="text-xs text-slate-500 mb-6">Yüklenen fotoğraflar doğrudan MinIO depolama birimine aktarılır.</p>

                                <form onSubmit={handleAddProduct} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Ürün Adı</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Örn: Pizza Margherita"
                                                value={prodName}
                                                onChange={(e) => setProdName(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Kategori</label>
                                            <select
                                                value={selectedCatId}
                                                onChange={(e) => setSelectedCatId(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                                            >
                                                {categories.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Açıklama / İçerik</label>
                                        <textarea
                                            rows={2}
                                            placeholder="Özel domates sosu, mozzarella peyniri ve fesleğen..."
                                            value={prodDesc}
                                            onChange={(e) => setProdDesc(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Satış Fiyatı (₺)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                placeholder="450"
                                                value={unitPrice}
                                                onChange={(e) => setUnitPrice(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-black"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Maliyet Fiyatı (₺)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                placeholder="180"
                                                value={costPrice}
                                                onChange={(e) => setCostPrice(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-black"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Başlangıç Stoğu</label>
                                            <input
                                                type="number"
                                                required
                                                placeholder="30"
                                                value={stockQty}
                                                onChange={(e) => setStockQty(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-black"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Ürün Fotoğrafı (MinIO)</label>
                                        <div className="flex items-center gap-5">
                                            <label className="cursor-pointer flex items-center gap-3 px-5 py-3.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl hover:border-amber-500 transition text-slate-700 text-xs font-bold">
                                                <ImageIcon size={18} className="text-amber-500" />
                                                <span>{prodImage ? prodImage.name : 'Fotoğraf Seçin...'}</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            const file = e.target.files[0];
                                                            setProdImage(file);
                                                            setPreviewUrl(URL.createObjectURL(file));
                                                        }
                                                    }}
                                                />
                                            </label>

                                            {previewUrl && (
                                                <img
                                                    src={previewUrl}
                                                    alt="Önizleme"
                                                    className="w-16 h-16 rounded-xl object-cover border border-amber-500 shadow-sm"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition mt-4"
                                    >
                                        Ürünü Kaydet ve MinIO'ya Yükle
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* TAB: KATEGORİLER */}
                        {activeTab === 'category' && (
                            <div>
                                <h2 className="text-xl font-black text-slate-900 mb-1">Kategori Yönetimi</h2>
                                <p className="text-xs text-slate-500 mb-6">Kategorileri ekleyin, adlarını düzenleyin veya silin.</p>

                                <form onSubmit={handleAddCategory} className="flex gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Kategori Adı (Örn: Tatlılar)"
                                        value={catName}
                                        onChange={(e) => setCatName(e.target.value)}
                                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Sıra"
                                        value={catOrder}
                                        onChange={(e) => setCatOrder(e.target.value)}
                                        className="w-24 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                                    />
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl transition shadow-md"
                                    >
                                        Ekle
                                    </button>
                                </form>

                                <div className="space-y-3">
                                    {categories.map((c) => (
                                        <div key={c.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                                            {editingCatId === c.id ? (
                                                <div className="flex-1 flex items-center gap-3 mr-4">
                                                    <input
                                                        type="text"
                                                        value={editCatName}
                                                        onChange={(e) => setEditCatName(e.target.value)}
                                                        className="flex-1 bg-white border border-amber-500 rounded-xl px-3 py-2 text-slate-900 text-sm outline-none font-bold"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={editCatOrder}
                                                        onChange={(e) => setEditCatOrder(e.target.value)}
                                                        className="w-20 bg-white border border-amber-500 rounded-xl px-3 py-2 text-slate-900 text-sm outline-none font-bold"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateCategory(c.id)}
                                                        className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500"
                                                    >
                                                        <Save size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingCatId(null)}
                                                        className="p-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <span className="font-extrabold text-slate-900 text-sm mr-3">{c.name}</span>
                                                    <span className="text-xs bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full font-mono font-bold">
                                                        Sıra: {c.displayOrder}
                                                    </span>
                                                </div>
                                            )}

                                            {editingCatId !== c.id && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingCatId(c.id);
                                                            setEditCatName(c.name);
                                                            setEditCatOrder(c.displayOrder.toString());
                                                        }}
                                                        className="p-2 text-amber-600 hover:bg-amber-100 rounded-xl border border-amber-200 transition"
                                                        title="Düzenle"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteCategory(c.id, c.name)}
                                                        className="p-2 text-rose-600 hover:bg-rose-100 rounded-xl border border-rose-200 transition"
                                                        title="Sil"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAB: MASALAR */}
                        {activeTab === 'table' && (
                            <div>
                                <h2 className="text-xl font-black text-slate-900 mb-1">Masa Yönetimi & QR Üretici</h2>
                                <p className="text-xs text-slate-500 mb-6">Masaları ekleyin (örn: Bahçe 1, Masa 1, Teras 1), isimlerini güncelleyin veya kaldırın.</p>

                                <form onSubmit={handleAddTable} className="flex gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Masa Adı (Örn: Bahçe 4, Masa 2, Teras 1)"
                                        value={tableName}
                                        onChange={(e) => setTableName(e.target.value)}
                                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                                    />
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl transition shadow-md"
                                    >
                                        Masa & QR Oluştur
                                    </button>
                                </form>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {tables.map((t) => (
                                        <div key={t.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                                            <div className="flex-1 mr-3">
                                                {editingTableId === t.id ? (
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <input
                                                            type="text"
                                                            value={editTableName}
                                                            onChange={(e) => setEditTableName(e.target.value)}
                                                            className="bg-white border border-amber-500 rounded-xl px-3 py-1.5 text-slate-900 text-xs outline-none font-bold flex-1"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdateTable(t.id)}
                                                            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                                                        >
                                                            <Save size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingTableId(null)}
                                                            className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                                                        >
                                                            <X size={15} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-black text-slate-900 text-base">{t.tableNumber}</h4>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingTableId(t.id);
                                                                setEditTableName(t.tableNumber);
                                                            }}
                                                            className="text-slate-400 hover:text-amber-600"
                                                            title="Masa Adını Değiştir"
                                                        >
                                                            <Edit2 size={13} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteTable(t.id, t.tableNumber)}
                                                            className="text-slate-400 hover:text-rose-600"
                                                            title="Masayı Sil"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                )}

                                                <p className="text-[10px] text-slate-400 font-mono mt-1 truncate">{t.qrToken}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => window.open(`/menu/${t.qrToken}`, '_blank')}
                                                    className="mt-2 text-xs text-amber-600 hover:underline flex items-center gap-1 font-bold"
                                                >
                                                    Menüyü Canlı Gör ↗
                                                </button>
                                            </div>

                                            {t.qrCodeBase64 && (
                                                <img
                                                    src={`data:image/png;base64,${t.qrCodeBase64}`}
                                                    alt={t.tableNumber}
                                                    className="w-16 h-16 bg-white p-1 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:scale-105 transition"
                                                    title="Büyütmek için tıklayın"
                                                    onClick={() => {
                                                        const newTab = window.open();
                                                        if (newTab) {
                                                            const img = newTab.document.createElement('img');
                                                            img.src = `data:image/png;base64,${t.qrCodeBase64}`;
                                                            img.style.width = '300px';
                                                            img.style.display = 'block';
                                                            img.style.margin = '50px auto';
                                                            newTab.document.body.appendChild(img);
                                                        }
                                                    }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAB: PERSONEL */}
                        {activeTab === 'employee' && (
                            <div>
                                <h2 className="text-xl font-black text-slate-900 mb-1">Personel & Kasiyer Yönetimi</h2>
                                <p className="text-xs text-slate-500 mb-6">Kasa görevlilerini sisteme kaydedin veya yetkilerini yönetin.</p>

                                <form onSubmit={handleAddEmployee} className="space-y-4 mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Ad Soyad</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Ahmet Yılmaz"
                                                value={empFullName}
                                                onChange={(e) => setEmpFullName(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Kullanıcı Adı (Giriş İçin)</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="ahmety"
                                                value={empUserName}
                                                onChange={(e) => setEmpUserName(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">E-Posta</label>
                                            <input
                                                type="email"
                                                placeholder="ahmet@cafe.local"
                                                value={empEmail}
                                                onChange={(e) => setEmpEmail(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Şifre</label>
                                            <input
                                                type="password"
                                                required
                                                placeholder="••••••••"
                                                value={empPassword}
                                                onChange={(e) => setEmpPassword(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Yetki</label>
                                            <select
                                                value={empRole}
                                                onChange={(e) => setEmpRole(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                                            >
                                                <option value="Cashier">Kasiyer / Garson</option>
                                                <option value="Manager">Müdür / Yönetici</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition"
                                    >
                                        Personeli Kaydet
                                    </button>
                                </form>

                                <div className="space-y-2">
                                    {employees.map((emp) => (
                                        <div key={emp.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-extrabold text-slate-900 text-sm">{emp.fullName}</span>
                                                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${emp.role === 'Manager' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {emp.role === 'Manager' ? 'Yönetici' : 'Kasiyer'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 font-mono mt-0.5">@{emp.userName} — {emp.email}</p>
                                            </div>

                                            {emp.userName !== 'admin' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteEmployee(emp.id, emp.fullName)}
                                                    className="p-2 text-rose-600 hover:bg-rose-100 rounded-xl border border-rose-200 transition"
                                                    title="Sil"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* 3. ÜRÜN DÜZENLEME MODALI */}
            {editingProduct && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-lg w-full text-slate-900 shadow-2xl">
                        <div className="flex items-center justify-between border-b pb-3 mb-4">
                            <h3 className="text-base font-black">Ürünü Düzenle: {editingProduct.name}</h3>
                            <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-700">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateProduct} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Ürün Adı</label>
                                    <input
                                        type="text"
                                        required
                                        value={editingProduct.name}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Kategori</label>
                                    <select
                                        value={editingProduct.categoryId}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                    >
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Açıklama</label>
                                <textarea
                                    rows={2}
                                    value={editingProduct.description || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Satış Fiyatı (₺)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={editingProduct.unitPrice}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, unitPrice: parseFloat(e.target.value) || 0 })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-rose-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Maliyet (₺)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={editingProduct.costPrice}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) || 0 })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Stok</label>
                                    <input
                                        type="number"
                                        required
                                        value={editingProduct.stockQuantity}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, stockQuantity: parseInt(e.target.value, 10) || 0 })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Fotoğrafı Değiştir (İsteğe Bağlı)</label>
                                <div className="flex items-center gap-3">
                                    <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 border border-slate-200">
                                        <span>Görsel Seç</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    const file = e.target.files[0];
                                                    setEditProdImage(file);
                                                    setEditPreviewUrl(URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                    </label>
                                    {editPreviewUrl && (
                                        <img src={editPreviewUrl} alt="Önizleme" className="w-12 h-12 rounded-xl object-cover border" />
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md"
                                >
                                    Değişiklikleri Kaydet
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingProduct(null)}
                                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                                >
                                    İptal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};