import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Coffee,
    QrCode,
    LogOut,
    RefreshCw,
    Plus,
    Minus,
    CheckCircle2,
    CreditCard,
    Banknote,
    X,
    Receipt,
    Search,
    User,
    Menu as MenuIcon,
    ChevronLeft,
    Printer,
    Gift,
    RotateCcw,
    Percent,
    Scissors
} from 'lucide-react';
import api from '../api/axios';

interface TableItem {
    id: string;
    tableNumber: string;
    status: number;
    qrToken: string;
    qrCodeBase64: string;
}

interface ProductItem {
    id: string;
    name: string;
    description?: string;
    unitPrice: number;
    stockQuantity: number;
    imageUrl?: string;
    categoryId: string;
}

interface CategoryWithProducts {
    id: string;
    name: string;
    displayOrder: number;
    products: ProductItem[];
}

interface CartItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    maxStock: number;
}

interface OrderItemDetail {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface ActiveOrderData {
    orderId: string;
    tableId: string;
    tableNumber: string;
    totalAmount: number;
    items: OrderItemDetail[];
}

interface ProductSaleItem {
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

interface DailySummary {
    totalRevenue: number;
    cashTotal: number;
    cardTotal: number;
    netProfit: number;
    completedTables: number;
    productSales?: ProductSaleItem[];
}

export const PosDashboard: React.FC = () => {
    const navigate = useNavigate();
    const userRole = localStorage.getItem('role') || 'Cashier';
    const currentUserName = localStorage.getItem('fullName') || localStorage.getItem('userName') || 'Personel';

    const [tables, setTables] = useState<TableItem[]>([]);
    const [categoriesData, setCategoriesData] = useState<CategoryWithProducts[]>([]);
    const [selectedCatId, setSelectedCatId] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Alan Sekmesi: Tümü, Bahçe, İç Mekan, Teras
    const [activeZone, setActiveZone] = useState<'all' | 'bahce' | 'ic_mekan' | 'teras'>('all');

    // Sol Navbar Drawer (Analiz & Kasa)
    const [showNavDrawer, setShowNavDrawer] = useState(false);

    // Günlük Ciro & Fiş
    const [dailySummary, setDailySummary] = useState<DailySummary>({
        totalRevenue: 0,
        cashTotal: 0,
        cardTotal: 0,
        netProfit: 0,
        completedTables: 0,
        productSales: []
    });

    // Seçili Masa & Açık Adisyon & Tam Ekran Menulux POS Görünümü
    const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
    const [activeOrder, setActiveOrder] = useState<ActiveOrderData | null>(null);
    const [loadingOrder, setLoadingOrder] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [qrModalTable, setQrModalTable] = useState<TableItem | null>(null);

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const notify = (msg: string, type: 'success' | 'error' = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3500);
    };

    const fetchAllData = useCallback(async () => {
        try {
            setLoading(true);
            try {
                const tableRes = await api.get<TableItem[]>('/Tables');
                setTables(tableRes.data || []);
            } catch (err) {
                console.error('Masalar hatası:', err);
            }

            try {
                const menuRes = await api.get('/Categories');
                const raw = (menuRes.data || []) as Record<string, unknown>[];

                const mapped: CategoryWithProducts[] = raw.map((c) => {
                    const rawProds = (c.products || c.Products || []) as Record<string, unknown>[];
                    return {
                        id: String(c.id || c.Id || ''),
                        name: String(c.name || c.Name || 'Genel'),
                        displayOrder: Number(c.displayOrder ?? c.DisplayOrder ?? 0),
                        products: rawProds.map((p) => ({
                            id: String(p.id || p.Id || ''),
                            name: String(p.name || p.Name || 'Ürün'),
                            description: (p.description || p.Description || '') as string,
                            unitPrice: Number(p.unitPrice ?? p.UnitPrice ?? 0),
                            stockQuantity: Number(p.stockQuantity ?? p.StockQuantity ?? 0),
                            imageUrl: (p.imageUrl || p.ImageUrl || '') as string,
                            categoryId: String(p.categoryId || p.CategoryId || c.id || c.Id || '')
                        }))
                    };
                });

                setCategoriesData(mapped);
            } catch (err) {
                console.error('Kategori hatası:', err);
            }

            try {
                const sumRes = await api.get<DailySummary>('/Orders/daily-summary');
                if (sumRes.data) setDailySummary(sumRes.data);
            } catch {
                // Ciro henüz hazır değil
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // Doğal Sayı Sıralaması: Masa 1, Masa 2 ... Masa 10
    const sortedTables = useMemo(() => {
        return [...tables].sort((a, b) =>
            a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true, sensitivity: 'base' })
        );
    }, [tables]);

    // Alan Bazlı Filtreleme (Bahçe, İç Mekan, Teras)
    const filteredTables = useMemo(() => {
        if (activeZone === 'all') return sortedTables;
        return sortedTables.filter((table) => {
            const name = table.tableNumber.toLowerCase();
            if (activeZone === 'bahce') return name.includes('bahçe') || name.includes('bahce');
            if (activeZone === 'teras') return name.includes('teras');
            if (activeZone === 'ic_mekan') return !name.includes('bahçe') && !name.includes('bahce') && !name.includes('teras');
            return true;
        });
    }, [sortedTables, activeZone]);

    const handleOpenTable = async (table: TableItem) => {
        setSelectedTable(table);
        setCart([]);
        setActiveOrder(null);
        setSelectedCatId('all');
        setSearchTerm('');
        setLoadingOrder(true);

        try {
            const res = await api.get(`/Orders/table/${table.id}/active`);
            const data = res.data;

            if (data) {
                const rawItems = (data.items || data.Items || []) as Record<string, unknown>[];
                const parsedItems: OrderItemDetail[] = rawItems.map((i) => {
                    const qty = Number(i.quantity ?? i.Quantity ?? 1);
                    const price = Number(i.unitPrice ?? i.UnitPrice ?? 0);
                    return {
                        productId: String(i.productId || i.ProductId || ''),
                        productName: String(i.productName || i.ProductName || 'Ürün'),
                        quantity: qty,
                        unitPrice: price,
                        totalPrice: Number(i.totalPrice ?? i.TotalPrice ?? (qty * price))
                    };
                });

                setActiveOrder({
                    orderId: String(data.orderId || data.OrderId || ''),
                    tableId: String(data.tableId || data.TableId || table.id),
                    tableNumber: String(data.tableNumber || data.TableNumber || table.tableNumber),
                    totalAmount: Number(data.totalAmount ?? data.TotalAmount ?? 0),
                    items: parsedItems
                });
            }
        } catch {
            setActiveOrder(null);
        } finally {
            setLoadingOrder(false);
        }
    };

    const handleUpdateActiveOrderItem = async (productId: string, delta: number) => {
        if (!activeOrder) return;
        try {
            await api.post('/Orders/update-item-quantity', {
                orderId: activeOrder.orderId,
                productId,
                delta
            });
            notify(delta < 0 ? 'Ürün düşürüldü / silindi.' : 'Ürün artırıldı.');
            await fetchAllData();
            if (selectedTable) await handleOpenTable(selectedTable);
        } catch (error: unknown) {
            let message = 'İşlem gerçekleştirilemedi.';
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                message = String(error.response.data.message);
            }
            notify(message, 'error');
        }
    };

    const addToCart = (product: ProductItem) => {
        if (product.stockQuantity <= 0) {
            notify(`"${product.name}" tükendi!`, 'error');
            return;
        }

        setCart((prev) => {
            const existing = prev.find((i) => i.productId === product.id);
            if (existing) {
                if (existing.quantity >= product.stockQuantity) {
                    notify(`Maksimum stok: ${product.stockQuantity}`, 'error');
                    return prev;
                }
                return prev.map((i) =>
                    i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [
                ...prev,
                {
                    productId: product.id,
                    productName: product.name,
                    quantity: 1,
                    unitPrice: product.unitPrice,
                    maxStock: product.stockQuantity
                }
            ];
        });
    };

    const updateCartQty = (productId: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((i) => {
                    if (i.productId === productId) {
                        const next = i.quantity + delta;
                        if (next > i.maxStock) {
                            notify(`Stok sınırını aşamazsınız! (Maks: ${i.maxStock})`, 'error');
                            return i;
                        }
                        return next > 0 ? { ...i, quantity: next } : null;
                    }
                    return i;
                })
                .filter(Boolean) as CartItem[]
        );
    };

    const handleSaveOrder = async () => {
        if (!selectedTable || cart.length === 0) return;
        try {
            await api.post('/Orders', {
                tableId: selectedTable.id,
                items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity }))
            });
            notify(`${selectedTable.tableNumber} için sipariş adisyona işlendi.`);
            setCart([]);
            await fetchAllData();
            await handleOpenTable(selectedTable);
        } catch (error: unknown) {
            let message = 'Sipariş eklenirken hata oluştu.';
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                message = String(error.response.data.message);
            }
            notify(message, 'error');
        }
    };

    const handleCloseBill = async (method: 'Cash' | 'CreditCard') => {
        if (!activeOrder || !selectedTable) return;
        try {
            await api.post('/Orders/complete-payment', {
                orderId: activeOrder.orderId,
                paymentMethod: method === 'Cash' ? 0 : 1
            });
            notify(`${selectedTable.tableNumber} hesabı kapatıldı. Ciroya eklendi!`);
            setActiveOrder(null);
            setSelectedTable(null);
            setShowPaymentModal(false);
            await fetchAllData();
        } catch (error: unknown) {
            let message = 'Ödeme tamamlanamadı.';
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                message = String(error.response.data.message);
            }
            notify(message, 'error');
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const allProductsList = useMemo(() => categoriesData.flatMap((c) => c.products || []), [categoriesData]);

    const displayedProducts = useMemo(() => {
        const list = selectedCatId === 'all'
            ? allProductsList
            : (categoriesData.find((c) => c.id === selectedCatId)?.products || []);
        return list.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [categoriesData, selectedCatId, searchTerm, allProductsList]);

    const newItemsTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const activeBillTotal = (activeOrder?.totalAmount || 0) + newItemsTotal;

    return (
        <div className="w-full min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans select-none m-0 p-0">
            {/* 1. ÜST BAR: Tam Genişlik */}
            <header className="w-full bg-white border-b border-slate-200 px-8 py-3.5 flex items-center justify-between shadow-sm sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowNavDrawer(true)}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition shadow-sm flex items-center gap-2 font-bold text-xs"
                        title="Kasa & Rapor Menüsü"
                    >
                        <MenuIcon size={20} className="text-slate-800" />
                        <span className="hidden sm:inline">Menü & Raporlar</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-xs font-black text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            Sistem Çevrimiçi
                        </span>
                    </div>
                </div>

                {/* Sağ: Kullanıcı Adı, Refresh, Çıkış */}
                <div className="flex items-center gap-3">
                    {userRole === 'Manager' && (
                        <button
                            onClick={() => navigate('/admin')}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition"
                        >
                            Müdür Paneli
                        </button>
                    )}

                    <button
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl transition shadow-sm"
                        title="Hesap Ayarları"
                    >
                        <User size={16} className="text-amber-600" />
                        <div className="text-left">
                            <span className="text-xs font-black block leading-tight">{currentUserName}</span>
                            <span className="text-[10px] text-amber-700/80 font-semibold block leading-tight">{userRole === 'Manager' ? 'Yönetici' : 'Kasiyer'}</span>
                        </div>
                    </button>

                    <button
                        onClick={fetchAllData}
                        className="p-2.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition shadow-sm"
                        title="Yenile"
                    >
                        <RefreshCw size={17} />
                    </button>

                    <button
                        onClick={handleLogout}
                        className="p-2.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition shadow-sm"
                        title="Güvenli Çıkış"
                    >
                        <LogOut size={17} />
                    </button>
                </div>
            </header>

            {/* Bildirim */}
            {notification && (
                <div className={`mx-8 mt-3 p-3.5 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-md z-40 ${notification.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-50 text-rose-800 border border-rose-300'
                    }`}>
                    <CheckCircle2 size={18} className={notification.type === 'success' ? 'text-emerald-600' : 'text-rose-600'} />
                    <span>{notification.msg}</span>
                </div>
            )}

            {/* 2. SOL AÇILAN MODERN NAVBAR & ANALİZ PANELİ */}
            {showNavDrawer && (
                <div className="fixed inset-0 z-50 flex justify-start bg-slate-900/40 backdrop-blur-sm transition-opacity">
                    <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col border-r border-slate-200">
                        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-2.5">
                                <Receipt className="text-amber-600" size={22} />
                                <div>
                                    <h3 className="text-base font-black text-slate-900 leading-tight">Kasa & Satış Analizi</h3>
                                    <p className="text-[11px] text-slate-500 font-medium">Günlük Z-Raporu & Fiş Dökümü</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowNavDrawer(false)}
                                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-5">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                                    <span className="text-[11px] font-bold uppercase text-emerald-700 block">Günlük Ciro</span>
                                    <span className="text-xl font-black text-emerald-900">{dailySummary.totalRevenue.toFixed(2)} ₺</span>
                                </div>
                                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl">
                                    <span className="text-[11px] font-bold uppercase text-indigo-700 block">Net Kâr</span>
                                    <span className="text-xl font-black text-indigo-900">{dailySummary.netProfit.toFixed(2)} ₺</span>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-slate-500">Kapanan Masa Sayısı:</span>
                                    <span className="font-black text-slate-800 text-sm">{dailySummary.completedTables} Masa</span>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-inner">
                                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 pb-2 border-b border-slate-200 flex items-center justify-between">
                                    <span>Satılan Ürünler</span>
                                    <span>Adet / Tutar</span>
                                </h4>

                                {(!dailySummary.productSales || dailySummary.productSales.length === 0) ? (
                                    <p className="text-xs text-slate-400 text-center py-8 font-medium">Bugün henüz hesap kapatılmadı.</p>
                                ) : (
                                    <div className="divide-y divide-slate-200/80 font-mono text-xs max-h-72 overflow-y-auto pr-1">
                                        {dailySummary.productSales.map((ps, idx) => (
                                            <div key={idx} className="py-2.5 flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-slate-800 font-sans">{ps.productName}</p>
                                                    <p className="text-[11px] text-slate-400">{ps.quantity}x {ps.unitPrice.toFixed(2)} ₺</p>
                                                </div>
                                                <span className="font-extrabold text-slate-900">{ps.total.toFixed(2)} ₺</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. ANA EKRAN: KENAR KISITLAMALARI KALDIRILMIŞ TAM EKRAN MASALAR */}
            <main className="flex-1 w-full px-8 py-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Salon Masaları ({tables.length})</h2>
                        <span className="text-xs text-slate-500 font-medium hidden md:inline">Alana göre filtreleyip masayı seçin.</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-bold">
                        <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-xl border border-emerald-200 shadow-sm">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Boş Masa
                        </span>
                        <span className="flex items-center gap-1.5 bg-rose-100 text-rose-800 px-3.5 py-1.5 rounded-xl border border-rose-200 shadow-sm">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" /> Dolu Masa
                        </span>
                    </div>
                </div>

                {/* ALAN FİLTRELEME SEKMELERİ */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
                    <button
                        onClick={() => setActiveZone('all')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition shadow-sm ${activeZone === 'all'
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                            }`}
                    >
                        Tüm Masalar ({tables.length})
                    </button>

                    <button
                        onClick={() => setActiveZone('bahce')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition shadow-sm ${activeZone === 'bahce'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                            }`}
                    >
                        🌿 Bahçe ({tables.filter(t => t.tableNumber.toLowerCase().includes('bahçe') || t.tableNumber.toLowerCase().includes('bahce')).length})
                    </button>

                    <button
                        onClick={() => setActiveZone('ic_mekan')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition shadow-sm ${activeZone === 'ic_mekan'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                            }`}
                    >
                        ☕ İç Mekan ({tables.filter(t => !t.tableNumber.toLowerCase().includes('bahçe') && !t.tableNumber.toLowerCase().includes('bahce') && !t.tableNumber.toLowerCase().includes('teras')).length})
                    </button>

                    <button
                        onClick={() => setActiveZone('teras')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition shadow-sm ${activeZone === 'teras'
                                ? 'bg-amber-600 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                            }`}
                    >
                        ☀️ Teras ({tables.filter(t => t.tableNumber.toLowerCase().includes('teras')).length})
                    </button>
                </div>

                {loading ? (
                    <div className="py-36 text-center text-slate-400 font-semibold">Masalar yükleniyor...</div>
                ) : filteredTables.length === 0 ? (
                    <div className="p-20 text-center bg-white border border-slate-200 rounded-3xl shadow-sm">
                        <Coffee size={44} className="mx-auto text-slate-300 mb-2" />
                        <h3 className="text-base font-bold text-slate-800">Bu alanda henüz masa bulunmuyor</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 w-full">
                        {filteredTables.map((table) => {
                            const isOccupied = table.status === 1;

                            return (
                                <div
                                    key={table.id}
                                    onClick={() => handleOpenTable(table)}
                                    className={`group cursor-pointer rounded-2xl p-4 border-2 transition-all duration-200 flex flex-col justify-between h-44 shadow-sm hover:shadow-lg hover:-translate-y-0.5 ${isOccupied
                                            ? 'bg-rose-50/90 border-rose-400 hover:border-rose-600'
                                            : 'bg-white border-emerald-200 hover:border-emerald-500'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-base font-black text-slate-900 group-hover:text-amber-600 transition">
                                                {table.tableNumber}
                                            </h3>
                                            <span
                                                className={`inline-block mt-1.5 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${isOccupied
                                                        ? 'bg-rose-600 text-white shadow-sm'
                                                        : 'bg-emerald-600 text-white shadow-sm'
                                                    }`}
                                            >
                                                {isOccupied ? 'DOLU' : 'BOŞ'}
                                            </span>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setQrModalTable(table);
                                            }}
                                            className="p-1.5 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-xl border border-slate-200 transition shadow-sm"
                                            title="Karekodu Gör"
                                        >
                                            <QrCode size={16} />
                                        </button>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                                        <span>{isOccupied ? 'Adisyon' : 'Sipariş'}</span>
                                        <span className="text-amber-600 font-extrabold">Aç →</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* 4. MENULUX POS TAM EKRAN SİPARİŞ & ADİSYON DÜZENİ */}
            {selectedTable && (
                <div className="fixed inset-0 z-50 bg-[#1e2230] text-white flex flex-col animate-in fade-in duration-150">
                    <div className="bg-gradient-to-r from-[#e91e63] via-[#d81b60] to-[#2c3248] px-8 py-3 flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSelectedTable(null)}
                                className="p-1.5 bg-black/20 hover:bg-black/40 rounded-xl transition flex items-center gap-1 text-xs font-bold"
                            >
                                <ChevronLeft size={20} />
                                <span>Masalar</span>
                            </button>
                            <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
                                MENULUX <span className="italic font-serif font-normal text-amber-300">Pos</span>
                            </h2>
                            <span className="text-xs uppercase bg-black/20 px-3 py-1 rounded-full font-bold">
                                SİPARİŞ EKRANI
                            </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-bold">
                            <span className="flex items-center gap-1.5 text-slate-200">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                İnternet Bağlı
                            </span>
                            <span className="bg-black/20 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                                <User size={14} className="text-amber-300" />
                                {currentUserName}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* 1. KOLON: Sol Hızlı İşlem Araç Çubuğu */}
                        <div className="w-20 bg-[#161922] border-r border-slate-700/60 flex flex-col items-center py-4 gap-4 text-slate-300">
                            <button
                                onClick={() => setCart([])}
                                className="flex flex-col items-center gap-1 text-[11px] font-bold hover:text-white transition group"
                                title="Yeni / Temizle"
                            >
                                <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center">
                                    <Plus size={18} />
                                </div>
                                <span>Yeni</span>
                            </button>

                            <button
                                onClick={() => notify('İkram fonksiyonu seçildi.')}
                                className="flex flex-col items-center gap-1 text-[11px] font-bold hover:text-white transition group"
                                title="İkram"
                            >
                                <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center">
                                    <Gift size={18} />
                                </div>
                                <span>İkram</span>
                            </button>

                            <button
                                onClick={() => notify('İade talebi oluşturuldu.')}
                                className="flex flex-col items-center gap-1 text-[11px] font-bold hover:text-white transition group"
                                title="İade"
                            >
                                <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center">
                                    <RotateCcw size={18} />
                                </div>
                                <span>İade</span>
                            </button>

                            <button
                                onClick={() => notify('Hesap bölme aktif.')}
                                className="flex flex-col items-center gap-1 text-[11px] font-bold hover:text-white transition group"
                                title="Hesap Böl"
                            >
                                <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center">
                                    <Scissors size={18} />
                                </div>
                                <span>Böl</span>
                            </button>

                            <button
                                onClick={() => notify('İskonto uygulandı.')}
                                className="flex flex-col items-center gap-1 text-[11px] font-bold hover:text-white transition group"
                                title="İskonto"
                            >
                                <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center">
                                    <Percent size={18} />
                                </div>
                                <span>İskonto</span>
                            </button>

                            <button
                                onClick={() => window.print()}
                                className="flex flex-col items-center gap-1 text-[11px] font-bold hover:text-white transition group"
                                title="Fiş Yazdır"
                            >
                                <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center">
                                    <Printer size={18} />
                                </div>
                                <span>Yazdır</span>
                            </button>
                        </div>

                        {/* 2. KOLON: Açık Adisyon & Sipariş Sepeti */}
                        <div className="w-96 bg-white text-slate-800 border-r border-slate-200 flex flex-col justify-between shadow-xl">
                            <div>
                                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                                    <div className="flex items-center gap-2">
                                        <span className="w-7 h-7 rounded-full bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                                            {selectedTable.tableNumber.replace(/[^0-9]/g, '') || '#'}
                                        </span>
                                        <h3 className="text-base font-black text-slate-900">{selectedTable.tableNumber}</h3>
                                    </div>
                                    <span className="text-xs bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-extrabold">
                                        {currentUserName}
                                    </span>
                                </div>

                                <div className="p-4 divide-y divide-slate-100 max-h-[calc(100vh-270px)] overflow-y-auto">
                                    {loadingOrder ? (
                                        <div className="text-center py-10 text-xs text-slate-400">Adisyon getiriliyor...</div>
                                    ) : (!activeOrder || activeOrder.items.length === 0) && cart.length === 0 ? (
                                        <div className="text-center py-16 text-slate-400">
                                            <Receipt size={32} className="mx-auto text-slate-300 mb-2" />
                                            <p className="text-xs font-semibold">Bu masada henüz sipariş yok.</p>
                                            <p className="text-[11px] text-slate-400 mt-1">Sağ taraftaki menüden ürün seçebilirsiniz.</p>
                                        </div>
                                    ) : null}

                                    {activeOrder?.items.map((item) => (
                                        <div key={item.productId} className="py-2.5 flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 flex-1 pr-2">
                                                <span className="font-extrabold text-rose-600 text-sm">{item.quantity}x</span>
                                                <div>
                                                    <span className="font-bold text-slate-800 text-xs block">{item.productName}</span>
                                                    <span className="text-[10px] text-slate-400 block">{item.unitPrice.toFixed(2)} ₺ / adet</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                                                    <button
                                                        onClick={() => handleUpdateActiveOrderItem(item.productId, -1)}
                                                        className="w-5 h-5 flex items-center justify-center hover:bg-slate-200 rounded text-slate-600"
                                                        title="1 Azalt"
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateActiveOrderItem(item.productId, 1)}
                                                        className="w-5 h-5 flex items-center justify-center hover:bg-slate-200 rounded text-slate-600"
                                                        title="1 Artır"
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                                <span className="font-black text-slate-900 text-sm w-16 text-right">{item.totalPrice.toFixed(2)} ₺</span>
                                            </div>
                                        </div>
                                    ))}

                                    {cart.map((item) => (
                                        <div key={item.productId} className="py-2.5 flex items-center justify-between text-sm bg-amber-50/70 -mx-4 px-4 border-l-4 border-amber-500">
                                            <div className="flex items-center gap-2 flex-1 pr-2">
                                                <span className="font-extrabold text-amber-600 text-sm">{item.quantity}x</span>
                                                <div>
                                                    <span className="font-bold text-slate-900 text-xs block">{item.productName}</span>
                                                    <span className="text-[10px] text-amber-700 font-semibold block">{item.unitPrice.toFixed(2)} ₺ (Yeni)</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-0.5 bg-white rounded-lg p-0.5 border border-amber-200 shadow-sm">
                                                    <button
                                                        onClick={() => updateCartQty(item.productId, -1)}
                                                        className="w-5 h-5 flex items-center justify-center hover:bg-slate-100 rounded text-slate-700"
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => updateCartQty(item.productId, 1)}
                                                        className="w-5 h-5 flex items-center justify-center hover:bg-slate-100 rounded text-slate-700"
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                                <span className="font-black text-amber-900 text-sm w-16 text-right">
                                                    {(item.unitPrice * item.quantity).toFixed(2)} ₺
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border-t border-slate-200">
                                {cart.length > 0 && (
                                    <button
                                        onClick={handleSaveOrder}
                                        className="w-full mb-3 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition"
                                    >
                                        Yeni Ürünleri Adisyona Ekle
                                    </button>
                                )}

                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Toplam Tutar</span>
                                    <span className="text-2xl font-black text-slate-900">₺{activeBillTotal.toFixed(2)}</span>
                                </div>

                                <button
                                    disabled={!activeOrder || activeOrder.items.length === 0}
                                    onClick={() => setShowPaymentModal(true)}
                                    className={`w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition ${activeOrder && activeOrder.items.length > 0
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    ÖDEME AL
                                </button>
                            </div>
                        </div>

                        {/* 3. KOLON: Fotoğraflı Ürün Kartları */}
                        <div className="flex-1 bg-[#f1f3f7] text-slate-800 flex flex-col p-6 overflow-hidden">
                            <div className="flex items-center justify-between mb-5">
                                <div className="text-xs font-black text-slate-500 uppercase tracking-wider">
                                    Menüler &gt; <span className="text-slate-900">{categoriesData.find(c => c.id === selectedCatId)?.name || 'Tüm Menü'}</span>
                                </div>

                                <div className="relative w-64">
                                    <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Ürün Ara..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded-2xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-rose-500 shadow-sm font-semibold"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-1">
                                {displayedProducts.length === 0 ? (
                                    <div className="p-16 text-center text-slate-400 font-semibold text-xs">
                                        Bu kategoride henüz ürün bulunmuyor.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                        {displayedProducts.map((prod) => {
                                            const isOutOfStock = prod.stockQuantity <= 0;

                                            return (
                                                <button
                                                    key={prod.id}
                                                    disabled={isOutOfStock}
                                                    onClick={() => addToCart(prod)}
                                                    className={`bg-white rounded-2xl p-2.5 border border-slate-200 transition text-left flex flex-col justify-between shadow-sm hover:shadow-md hover:border-rose-400 group h-52 relative overflow-hidden ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''
                                                        }`}
                                                >
                                                    <div className="w-full h-28 rounded-xl bg-slate-100 overflow-hidden mb-2 relative">
                                                        {prod.imageUrl ? (
                                                            <img
                                                                src={prod.imageUrl}
                                                                alt={prod.name}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                                onError={(e) => {
                                                                    (e.target as HTMLElement).style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                <Coffee size={28} />
                                                            </div>
                                                        )}
                                                        {isOutOfStock && (
                                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[11px] font-black text-white">
                                                                Satışa Kapalı
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <h4 className="font-extrabold text-slate-900 text-xs truncate group-hover:text-rose-600 transition">
                                                            {prod.name}
                                                        </h4>
                                                        <div className="mt-1.5 flex items-center justify-between">
                                                            <span className="text-sm font-black text-rose-600">₺{prod.unitPrice.toFixed(0)}</span>
                                                            <span className="text-[10px] text-slate-400 font-bold">Stok: {prod.stockQuantity}</span>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 4. KOLON: Sağ Dikey Kategori Menüsü */}
                        <div className="w-48 bg-[#161922] border-l border-slate-700/60 flex flex-col py-4 px-2 space-y-1.5 overflow-y-auto">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2 block">
                                MENÜLER
                            </span>

                            <button
                                onClick={() => setSelectedCatId('all')}
                                className={`w-full py-3.5 px-4 rounded-xl text-xs font-black text-left transition uppercase tracking-wide ${selectedCatId === 'all'
                                        ? 'bg-white text-slate-900 shadow-md font-extrabold'
                                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                TÜM MENÜ
                            </button>

                            {categoriesData.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCatId(cat.id)}
                                    className={`w-full py-3.5 px-4 rounded-xl text-xs font-black text-left transition uppercase tracking-wide truncate ${selectedCatId === cat.id
                                            ? 'bg-white text-slate-900 shadow-md font-extrabold'
                                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ödeme Modalı */}
                    {showPaymentModal && (
                        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                            <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-slate-900 shadow-2xl">
                                <div className="flex items-center justify-between border-b pb-3 mb-4">
                                    <h3 className="text-base font-black">Tahsilat Yöntemi</h3>
                                    <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-700">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="text-center py-2 mb-4">
                                    <span className="text-xs text-slate-500 font-bold block">Ödenecek Toplam Tutar</span>
                                    <span className="text-3xl font-black text-slate-900">₺{activeBillTotal.toFixed(2)}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleCloseBill('Cash')}
                                        className="py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-md transition"
                                    >
                                        <Banknote size={20} />
                                        <span>NAKİT</span>
                                    </button>

                                    <button
                                        onClick={() => handleCloseBill('CreditCard')}
                                        className="py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-md transition"
                                    >
                                        <CreditCard size={20} />
                                        <span>KREDİ KARTI</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 5. QR MODAL */}
            {qrModalTable && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full text-center relative shadow-2xl">
                        <h3 className="text-lg font-black text-slate-900">{qrModalTable.tableNumber}</h3>
                        <p className="text-xs text-slate-500 mb-3">Müşterinin telefonundan okutacağı temassız karekod</p>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 inline-block mb-3 shadow-inner">
                            <img
                                src={`data:image/png;base64,${qrModalTable.qrCodeBase64}`}
                                alt={qrModalTable.tableNumber}
                                className="w-48 h-48 mx-auto"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => window.open(`/menu/${qrModalTable.qrToken}`, '_blank')}
                                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition shadow-sm"
                            >
                                Menüyü Aç
                            </button>
                            <button
                                onClick={() => setQrModalTable(null)}
                                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};