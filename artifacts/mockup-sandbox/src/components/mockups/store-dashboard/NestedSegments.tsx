import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  MoreHorizontal, 
  ChevronLeft,
  Bell,
  Settings,
  Store,
  Filter,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

type PrimaryGroup = 'operations' | 'marketing' | 'management';

const GROUPS = {
  operations: {
    label: 'التشغيل',
    subTabs: [
      { id: 'products', label: 'المنتجات' },
      { id: 'orders', label: 'الطلبات' },
      { id: 'categories', label: 'الأقسام' },
    ]
  },
  marketing: {
    label: 'التسويق',
    subTabs: [
      { id: 'flash-sales', label: 'عروض فلاش' },
      { id: 'promo-codes', label: 'كودات الخصم' },
    ]
  },
  management: {
    label: 'الإدارة',
    subTabs: [
      { id: 'analytics', label: 'التقييمات والتحليل' },
      { id: 'subscription', label: 'الاشتراك' },
      { id: 'settings', label: 'الإعدادات' },
    ]
  }
};

const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'تمور عضوية فاخرة - صندوق 1 كجم',
    price: '120.00 ر.س',
    stock: 45,
    status: 'active',
    image: '/__mockup/images/product-dates.jpg'
  },
  {
    id: 2,
    name: 'قهوة عربية محمصة - كيس 500 جم',
    price: '45.00 ر.س',
    stock: 12,
    status: 'low_stock',
    image: '/__mockup/images/product-coffee.jpg'
  },
  {
    id: 3,
    name: 'عطر عود ملكي - 50 مل',
    price: '350.00 ر.س',
    stock: 0,
    status: 'out_of_stock',
    image: '/__mockup/images/product-oud.jpg'
  }
];

export function NestedSegments() {
  const [activeGroup, setActiveGroup] = useState<PrimaryGroup>('operations');
  const [activeSubTabs, setActiveSubTabs] = useState<Record<PrimaryGroup, string>>({
    operations: 'products',
    marketing: 'flash-sales',
    management: 'analytics',
  });

  const currentGroup = GROUPS[activeGroup];
  const activeSubTabId = activeSubTabs[activeGroup];
  const currentSubTab = currentGroup.subTabs.find(t => t.id === activeSubTabId);

  const handleGroupChange = (group: PrimaryGroup) => {
    setActiveGroup(group);
  };

  const handleSubTabChange = (subTabId: string) => {
    setActiveSubTabs(prev => ({
      ...prev,
      [activeGroup]: subTabId
    }));
  };

  return (
    <div className="min-h-[100dvh] bg-[#fdfdfd] text-slate-900 font-sans" dir="rtl">
      {/* Top Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo & Store Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none tracking-tight">مركزي</h1>
              <p className="text-xs text-slate-500 mt-1">لوحة تحكم المتجر</p>
            </div>
          </div>

          {/* Primary Nav Pills */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-full shadow-inner">
            {(Object.entries(GROUPS) as [PrimaryGroup, typeof GROUPS[PrimaryGroup]][]).map(([key, group]) => (
              <button
                key={key}
                onClick={() => handleGroupChange(key)}
                className={cn(
                  "px-5 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 ease-out",
                  activeGroup === key 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                )}
              >
                {group.label}
              </button>
            ))}
          </div>

          {/* Right Actions & Avatar */}
          <div className="flex items-center gap-4">
            <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="h-5 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium leading-none">أحمد عبدالله</p>
                <p className="text-xs text-slate-500 mt-1">مدير المتجر</p>
              </div>
              <img 
                src="/__mockup/images/avatar.jpg" 
                alt="Profile" 
                className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100"
              />
            </div>
          </div>
        </div>
        
        {/* Secondary Sub-tab Strip */}
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-end">
          <div className="flex gap-8 relative h-full">
            {currentGroup.subTabs.map((tab) => {
              const isActive = activeSubTabId === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSubTabChange(tab.id)}
                  className={cn(
                    "relative pb-3 text-sm font-medium transition-colors",
                    isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Breadcrumbs & Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <span>{currentGroup.label}</span>
            <ChevronLeft className="w-4 h-4" />
            <span className="text-slate-900 font-medium">{currentSubTab?.label}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {currentSubTab?.label}
            </h2>
            
            {activeSubTabId === 'products' && (
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm shadow-blue-500/20">
                <Plus className="w-4 h-4" />
                إضافة منتج
              </button>
            )}
          </div>
        </div>

        {/* Content specific to active tab */}
        {activeGroup === 'operations' && activeSubTabId === 'products' ? (
          <div className="space-y-6">
            
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="ابحث عن منتج..." 
                  className="w-full pl-4 pr-9 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-sm"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm w-full sm:w-auto justify-center">
                  <Filter className="w-4 h-4 text-slate-500" />
                  تصفية
                </button>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {MOCK_PRODUCTS.map((product) => (
                <div key={product.id} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:border-slate-300 hover:shadow-md transition-all group">
                  <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3">
                      {product.status === 'active' && (
                        <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">نشط</span>
                      )}
                      {product.status === 'low_stock' && (
                        <span className="bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">مخزون منخفض</span>
                      )}
                      {product.status === 'out_of_stock' && (
                        <span className="bg-rose-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">نفذت الكمية</span>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="font-semibold text-slate-900 leading-tight line-clamp-2">
                        {product.name}
                      </h3>
                      <button className="text-slate-400 hover:text-slate-900 transition-colors shrink-0">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-bold text-lg text-blue-600">{product.price}</span>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        <Package className="w-3.5 h-3.5" />
                        <span>{product.stock} متوفر</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination / Load more dummy */}
            <div className="pt-6 flex justify-center">
              <button className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1">
                عرض المزيد
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-slate-200/60 rounded-2xl border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Settings className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              محتوى {currentSubTab?.label}
            </h3>
            <p className="text-sm text-slate-500 max-w-sm">
              هذه الصفحة قيد التطوير. سيتم إضافة الأدوات الخاصة بـ {currentSubTab?.label} هنا قريباً.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
