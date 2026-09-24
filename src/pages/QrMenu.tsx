import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Coffee, Utensils, AlertCircle, Search, Sparkles, ArrowLeft, LayoutGrid } from 'lucide-react';
import api from '../api/axios';

interface ProductItem {
    id: string;
    name: string;
    description?: string;
    unitPrice: number;
    stockQuantity: number;
    imageUrl?: string;
    inStock: boolean;
    categoryId: string;
}

interface CategoryItem {
    id: string;
    name: string;
    displayOrder: number;
    products: ProductItem[];
}

interface MenuResponse {
    tableNumber: string;
    categories: CategoryItem[];
}

export const QrMenu: React.FC = () => {
    const { qrToken } = useParams<{ qrToken: string }>();
    const navigate = useNavigate();

    const [menuData, setMenuData] = useState<MenuResponse | null>(null);
    const [selectedMainCat, setSelectedMainCat] = useState<string>('all');
    const [selectedSubCat, setSelectedSubCat] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(Boolean(qrToken));
    const [errorMsg, setErrorMsg] = useState<string | null>(qrToken ? null : 'Karekod bilgisi bulunamadı.');

    useEffect(() => {
        if (!qrToken) return;

        let isMounted = true;

        api.get(`/Menu/${qrToken}`)
            .then((res) => {
                if (!isMounted) return;
                const raw = res.data;
                if (!raw) throw new Error('Veri boş döndü.');

                const rawCats = (raw.categories || raw.Categories || []) as Record<string, unknown>[];

                const mappedCategories: CategoryItem[] = rawCats.map((c) => {
                    const prods = (c.products || c.Products || []) as Record<string, unknown>[];
                    return {
                        id: String(c.id || c.Id || ''),
                        name: String(c.name || c.Name || 'Genel'),
                        displayOrder: Number(c.displayOrder ?? c.DisplayOrder ?? 0),
                        products: prods.map((p) => {
                            const stock = Number(p.stockQuantity ?? p.StockQuantity ?? 0);
                            return {
                                id: String(p.id || p.Id || ''),
                                name: String(p.name || p.Name || 'Ürün'),
                                description: (p.description || p.Description || '') as string,
                                unitPrice: Number(p.unitPrice ?? p.UnitPrice ?? p.price ?? p.Price ?? 0),
                                stockQuantity: stock,
                                imageUrl: (p.imageUrl || p.ImageUrl || '') as string,
                                inStock: stock > 0,
                                categoryId: String(c.id || c.Id || '')
                            };
                        })
                    };
                });

                setMenuData({
                    tableNumber: String(raw.tableNumber || raw.TableNumber || 'Masa'),
                    categories: mappedCategories
                });
            })
            .catch((err: unknown) => {
                if (!isMounted) return;
                let msg = 'Menü yüklenirken bir hata oluştu veya karekod geçersiz.';
                if (axios.isAxiosError(err) && err.response?.data?.message) {
                    msg = String(err.response.data.message);
                }
                setErrorMsg(msg);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [qrToken]);

    const mainCategoryGroups = useMemo(() => [
        { id: 'all', name: 'TÜM MENÜ' },
        { id: 'yemekler', name: 'YEMEKLER' },
        { id: 'icecekler', name: 'İÇECEKLER' },
        { id: 'tatlilar', name: 'TATLILAR' }
    ], []);

    const subCategories = useMemo(() => {
        if (!menuData || selectedMainCat === 'all') return [];

        return menuData.categories.filter((cat) => {
            const name = (cat.name || '').toLocaleLowerCase('tr-TR');
            if (selectedMainCat === 'yemekler') {
                return name.includes('yemek') || name.includes('burger') || name.includes('pide') ||
                    name.includes('lahmacun') || name.includes('pizza') || name.includes('kebap') ||
                    name.includes('döner') || name.includes('tavuk') || name.includes('et') || name.includes('makarna');
            }
            if (selectedMainCat === 'icecekler') {
                return name.includes('içecek') || name.includes('icecek') || name.includes('soğuk') ||
                    name.includes('sıcak') || name.includes('kahve') || name.includes('çay') ||
                    name.includes('kola') || name.includes('meşrubat') || name.includes('mesrubat') ||
                    name.includes('soft') || name.includes('su');
            }
            if (selectedMainCat === 'tatlilar') {
                return name.includes('tatlı') || name.includes('tatli') || name.includes('sütlü') ||
                    name.includes('şerbetli') || name.includes('pasta') || name.includes('dondurma');
            }
            return true;
        });
    }, [menuData, selectedMainCat]);

    const displayedProducts = useMemo(() => {
        if (!menuData) return [];

        let list = menuData.categories.flatMap((c) => c.products || []);

        if (selectedMainCat !== 'all') {
            const subCatIds = subCategories.map((c) => c.id);
            if (subCatIds.length > 0) {
                list = list.filter((p) => subCatIds.includes(p.categoryId));
            } else {
                list = list.filter((p) => {
                    const cat = menuData.categories.find(c => c.id === p.categoryId);
                    const catName = (cat?.name || '').toLocaleLowerCase('tr-TR');

                    if (selectedMainCat === 'yemekler') {
                        return catName.includes('yemek') || catName.includes('pizza') || catName.includes('burger');
                    }
                    if (selectedMainCat === 'icecekler') {
                        return catName.includes('içecek') || catName.includes('icecek') || catName.includes('kahve') ||
                            catName.includes('soğuk') || catName.includes('sıcak') || catName.includes('çay');
                    }
                    if (selectedMainCat === 'tatlilar') {
                        return catName.includes('tatlı') || catName.includes('tatli') || catName.includes('pasta');
                    }
                    return false;
                });
            }
        }

        if (selectedSubCat !== 'all') {
            list = list.filter((p) => p.categoryId === selectedSubCat);
        }

        if (searchTerm.trim()) {
            const term = searchTerm.trim().toLocaleLowerCase('tr-TR');
            list = list.filter((p) =>
                (p.name || '').toLocaleLowerCase('tr-TR').includes(term) ||
                (p.description && p.description.toLocaleLowerCase('tr-TR').includes(term))
            );
        }

        return list;
    }, [menuData, selectedMainCat, selectedSubCat, subCategories, searchTerm]);

    const handleGoToTables = () => {
        navigate('/pos');
    };

    if (loading) {
        return (
            <div className= "w-screen h-screen bg-[#111622] flex flex-col items-center justify-center text-white px-4" >
            <Coffee size={ 44 } className = "text-amber-500 animate-bounce mb-3" />
                <p className="text-sm font-bold text-slate-300" > Menü yükleniyor...</p>
                    </div>
    );
  }

if (errorMsg || !menuData) {
    return (
        <div className= "w-screen h-screen bg-[#111622] flex flex-col items-center justify-center text-white px-6 text-center" >
        <AlertCircle size={ 48 } className = "text-rose-500 mb-3" />
            <h2 className="text-lg font-black mb-1" > Menüye Ulaşılamadı </h2>
                < p className = "text-xs text-slate-400 max-w-sm mb-6" > { errorMsg } </p>
                    < button
    type = "button"
    onClick = { handleGoToTables }
    className = "text-xs bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-2xl font-black shadow-lg transition flex items-center gap-2 mx-auto cursor-pointer"
        >
        <ArrowLeft size={ 16 } />
          Masalar Ekranına Dön
        </button>
        </div>
    );
}

return (
    <div className= "w-screen min-h-screen bg-[#f3f4f8] text-slate-800 font-sans flex flex-col select-none m-0 p-0" >
    <header className="w-full bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-sm flex items-center justify-between gap-3" >
        <div className="flex items-center gap-3" >
            <button
            type="button"
onClick = { handleGoToTables }
title = "Masalar Ekranına Dön"
className = "flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition border border-slate-200 shadow-sm active:scale-95 cursor-pointer"
    >
    <ArrowLeft size={ 16 } />
        < span className = "hidden sm:inline" > Masalara Dön </span>
            </button>

            < div className = "w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20" >
                <Coffee size={ 20 } />
                    </div>
                    < div >
                    <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5" >
                        Luxe Restaurant & Cafe
                            < Sparkles size = { 14} className = "text-amber-500" />
                                </h1>
                                < span className = "text-[11px] text-rose-600 font-black uppercase tracking-wider block" >
                                { menuData.tableNumber }
                                    </span>
                                    </div>
                                    </div>

                                    < div className = "flex items-center gap-2" >
                                        <button
            type="button"
onClick = { handleGoToTables }
className = "sm:hidden p-2 text-slate-600 bg-slate-100 rounded-xl border border-slate-200 cursor-pointer"
title = "Masalar"
    >
    <LayoutGrid size={ 16 } />
        </button>

        < div className = "relative w-40 sm:w-64" >
            <Search size={ 15 } className = "absolute left-3 top-2.5 text-slate-400" />
                <input
              type="text"
placeholder = "Menüde ara..."
value = { searchTerm }
onChange = {(e) => setSearchTerm(e.target.value)}
className = "w-full bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
    />
    </div>
    </div>
    </header>

    < div className = "flex-1 flex w-full overflow-hidden" >
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto w-full" >
        {
            subCategories.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
                    <button
                type="button"
                onClick = {() => setSelectedSubCat('all')
        }
className = {`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition shadow-sm cursor-pointer ${selectedSubCat === 'all'
        ? 'bg-rose-600 text-white shadow-rose-600/30'
        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
    }`}
              >
    Hepsi
    </button>
{
    subCategories.map((sub) => (
        <button
                  type= "button"
                  key = { sub.id }
                  onClick = {() => setSelectedSubCat(sub.id)}
className = {`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition shadow-sm cursor-pointer ${selectedSubCat === sub.id
        ? 'bg-rose-600 text-white shadow-rose-600/30'
        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
    }`}
                >
    { sub.name }({ sub.products.length })
    </button>
              ))}
</div>
          )}

{
    displayedProducts.length === 0 ? (
        <div className= "m-auto text-center p-12 bg-white border border-slate-200 rounded-3xl shadow-sm max-w-md" >
        <Utensils size={ 44 } className = "mx-auto text-slate-300 mb-3" />
            <h3 className="text-sm font-black text-slate-700" > Ürün Bulunamadı </h3>
                < p className = "text-xs text-slate-400 mt-1" > Bu kategoride veya arama kriterinde ürün yok.</p>
                    </div>
          ) : (
        <div className= "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4" >
        {
            displayedProducts.map((p) => (
                <div
                  key= { p.id }
                  className = "bg-white rounded-2xl p-3 border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-md transition h-64 group"
                >
                <div className="w-full h-36 rounded-xl bg-slate-100 overflow-hidden mb-2 relative" >
            {
                p.imageUrl ? (
                    <img
                        src= { p.imageUrl }
                        alt={ p.name }
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
        }
}
                      />
                    ) : (
    <div className= "w-full h-full flex flex-col items-center justify-center text-slate-300 gap-1 bg-slate-50" >
    <Utensils size={ 30 } />
        < span className = "text-[10px] font-bold text-slate-400" > Lezzetli Menü </span>
            </div>
                    )}

{
    !p.inStock && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center text-xs font-black text-white" >
            Tükendi
            </div>
                    )
}
</div>

    < div >
    <h3 className="font-extrabold text-slate-900 text-xs truncate group-hover:text-rose-600 transition" >
    { p.name }
        </h3>
{
    p.description && (
        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-medium" > { p.description } </p>
                    )
}
<div className="mt-2 flex items-center justify-between" >
    <span className="text-sm sm:text-base font-black text-rose-600" >₺{ p.unitPrice.toFixed(0) } </span>
        < span className = {`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
            { p.inStock ? 'Mevcut' : 'Tükendi' }
                </span>
                </div>
                </div>
                </div>
              ))}
</div>
          )}
</div>

    < aside className = "w-40 sm:w-48 bg-[#181d28] border-l border-slate-700/60 flex flex-col py-4 px-2 space-y-1.5 overflow-y-auto shadow-xl" >
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2 block" >
            MENÜLER
            </span>

{
    mainCategoryGroups.map((group) => {
        const isSelected = selectedMainCat === group.id;

        return (
            <button
                type= "button"
        key = { group.id }
        onClick = {() => {
            setSelectedMainCat(group.id);
            setSelectedSubCat('all');
        }
    }
                className = {`w-full py-3.5 px-3 sm:px-4 rounded-xl text-xs font-black text-left transition uppercase tracking-wide truncate cursor-pointer ${isSelected
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
              >
{ group.name }
    </button>
            );
          })}
</aside>
    </div>
    </div>
  );
};