import React, { useState } from 'react';
import { 
  Package, 
  ShoppingCart, 
  Zap, 
  Tag, 
  LayoutGrid, 
  TrendingUp, 
  CreditCard, 
  Settings, 
  Bell, 
  Search, 
  Plus, 
  MoreVertical, 
  Store,
  ChevronDown,
  Filter
} from 'lucide-react';

const NAVIGATION = [
  { id: 'products', label: 'المنتجات', icon: Package },
  { id: 'orders', label: 'الطلبات', icon: ShoppingCart },
  { id: 'flash', label: 'عروض فلاش', icon: Zap },
  { id: 'discounts', label: 'كودات الخصم', icon: Tag },
  { id: 'sections', label: 'الأقسام', icon: LayoutGrid },
  { id: 'analytics', label: 'التقييمات والتحليل', icon: TrendingUp },
  { id: 'subscription', label: 'الاشتراك', icon: CreditCard },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

const STATS = [
  { label: 'إجمالي المنتجات', value: '342', trend: '+12%', gradient: 'from-blue-600 to-blue-400' },
  { label: 'الطلبات المعلقة', value: '48', trend: '-2%', gradient: 'from-emerald-600 to-emerald-400' },
  { label: 'عروض فلاش نشطة', value: '3', trend: 'ينتهي قريباً', gradient: 'from-amber-500 to-orange-400' },
  { label: 'إيرادات اليوم', value: '1,450 ر.س', trend: '+24%', gradient: 'from-indigo-600 to-purple-500' },
];

const PRODUCTS = [
  { id: 1, name: 'قهوة مختصة كولومبية', category: 'حبوب القهوة', price: '65 ر.س', stock: 24, sales: 128, status: 'متوفر', image: '/__mockup/images/coffee-bag.jpg' },
  { id: 2, name: 'ماكينة إسبريسو احترافية', category: 'معدات التحضير', price: '4,500 ر.س', stock: 3, sales: 12, status: 'مخزون منخفض', image: '/__mockup/images/espresso-machine.jpg' },
  { id: 3, name: 'أكواب سيراميك يدوية الصنع', category: 'إكسسوارات', price: '45 ر.س', stock: 150, sales: 450, status: 'متوفر', image: '/__mockup/images/ceramic-mugs.jpg' },
  { id: 4, name: 'طاحونة قهوة يدوية', category: 'معدات التحضير', price: '180 ر.س', stock: 0, sales: 85, status: 'نفذت الكمية', image: '/__mockup/images/hand-grinder.jpg' },
  { id: 5, name: 'ميزان قهوة رقمي', category: 'أدوات القياس', price: '120 ر.س', stock: 45, sales: 210, status: 'متوفر', image: '/__mockup/images/coffee-scale.jpg' },
  { id: 6, name: 'فلتر ورقي V60', category: 'فلاتر', price: '25 ر.س', stock: 300, sales: 890, status: 'متوفر', image: '/__mockup/images/v60-filters.jpg' },
];

export function CommandCenter() {
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* Top Header - Sleek Dark Bar */}
      <header className="h-16 bg-slate-800 text-white flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center shadow-inner shadow-indigo-400/50">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">مركزي</h1>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-slate-300 font-medium tracking-wide">متجر نشط</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="relative cursor-pointer">
            <Bell className="w-5 h-5 text-slate-300 hover:text-white transition-colors" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white border-2 border-slate-800">
              3
            </span>
          </div>
          <div className="w-px h-6 bg-slate-700"></div>
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="text-left rtl:text-right hidden sm:block">
              <p className="text-sm font-semibold text-white group-hover:text-indigo-200 transition-colors">أحمد محمد</p>
              <p className="text-xs text-slate-400">المدير العام</p>
            </div>
            <img 
              src="/__mockup/images/avatar.jpg" 
              alt="User" 
              className="w-9 h-9 rounded-full object-cover border border-slate-600 group-hover:border-indigo-400 transition-colors"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col px-6 pt-6 pb-0 overflow-hidden">
        
        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
          {STATS.map((stat, i) => (
            <div key={i} className={`rounded-xl p-5 text-white bg-gradient-to-br ${stat.gradient} shadow-sm relative overflow-hidden group`}>
              {/* Decorative circle */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
              
              <div className="relative z-10">
                <p className="text-white/80 text-sm font-medium mb-1">{stat.label}</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-md font-medium backdrop-blur-sm">
                    {stat.trend}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cockpit Below Stats - Side Navigation + Main Data View */}
        <div className="flex flex-1 gap-6 pb-6 min-h-0">
          
          {/* Right Edge - Compact Vertical Navigation */}
          <nav className="w-16 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center py-4 shrink-0 z-10 relative">
            <div className="flex flex-col gap-2 w-full px-2">
              {NAVIGATION.map((nav) => {
                const isActive = activeTab === nav.id;
                const Icon = nav.icon;
                
                return (
                  <button
                    key={nav.id}
                    onClick={() => setActiveTab(nav.id)}
                    className="relative group flex items-center justify-center w-full aspect-square rounded-lg transition-all duration-200 focus:outline-none"
                  >
                    {/* Active Indicator Square */}
                    {isActive && (
                      <div className="absolute inset-0 bg-blue-50 border border-blue-100 rounded-lg shadow-sm pointer-events-none"></div>
                    )}
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-blue-600 rounded-l-full pointer-events-none"></div>
                    )}
                    
                    <Icon className={`w-5 h-5 z-10 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'}`} />
                    
                    {/* Tooltip */}
                    <div className="absolute right-full mr-4 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {nav.label}
                      {/* Tooltip arrow */}
                      <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main Data View */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative min-w-0">
            {/* Header of Content View */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-slate-900">المنتجات</h2>
                  <p className="text-xs text-slate-500">إدارة كتالوج المنتجات وتتبع المخزون</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="بحث في المنتجات..." 
                    className="pl-4 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 transition-all"
                  />
                </div>
                <button className="flex items-center justify-center w-10 h-10 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {PRODUCTS.map((product) => (
                  <div key={product.id} className="group bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
                    <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23f1f5f9'%3E%3Crect width='100' height='100'/%3E%3C/svg%3E";
                        }}
                      />
                      <div className="absolute top-3 right-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm border ${
                          product.stock > 10 ? 'bg-emerald-100/90 text-emerald-700 border-emerald-200/50' : 
                          product.stock > 0 ? 'bg-amber-100/90 text-amber-700 border-amber-200/50' : 
                          'bg-red-100/90 text-red-700 border-red-200/50'
                        }`}>
                          {product.status}
                        </span>
                      </div>
                      <button className="absolute top-3 left-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs text-slate-500 font-medium">{product.category}</p>
                        <p className="font-bold text-slate-900 dir-ltr">{product.price}</p>
                      </div>
                      <h3 className="font-semibold text-sm text-slate-800 mb-4 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      
                      <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5" />
                          <span>المخزون: <strong className="text-slate-700">{product.stock}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>المبيعات: <strong className="text-slate-700">{product.sales}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Floating Action Button */}
            <div className="absolute bottom-6 left-6 z-20">
              <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-full font-semibold shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-1 transition-all duration-300">
                <Plus className="w-5 h-5" />
                <span>إضافة منتج</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
