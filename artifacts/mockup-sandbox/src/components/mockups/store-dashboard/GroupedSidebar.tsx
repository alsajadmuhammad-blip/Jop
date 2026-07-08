import React, { useState } from 'react';
import { 
  Package, 
  Layers, 
  ShoppingCart, 
  Zap, 
  Ticket, 
  BarChart3, 
  CreditCard, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Store
} from 'lucide-react';

const products = [
  {
    id: 1,
    name: 'قهوة عربية فاخرة',
    category: 'مشروبات',
    price: '٨٥ ر.س',
    stock: 42,
    status: 'نشط',
    image: '/__mockup/images/arabic-coffee.jpg'
  },
  {
    id: 2,
    name: 'صندوق تمور عجوة',
    category: 'مواد غذائية',
    price: '١٢٠ ر.س',
    stock: 15,
    status: 'نشط',
    image: '/__mockup/images/dates-box.jpg'
  },
  {
    id: 3,
    name: 'عطر عود ملكي',
    category: 'عطور',
    price: '٤٥٠ ر.س',
    stock: 8,
    status: 'منخفض',
    image: '/__mockup/images/oud-perfume.jpg'
  },
  {
    id: 4,
    name: 'مبخرة ذهبية حديثة',
    category: 'إكسسوارات',
    price: '١٩٠ ر.س',
    stock: 0,
    status: 'نفد',
    image: '/__mockup/images/incense-burner.jpg'
  }
];

export function GroupedSidebar() {
  const [activeItem, setActiveItem] = useState('المنتجات');

  const navigation = [
    {
      group: 'المتجر',
      items: [
        { name: 'المنتجات', icon: Package },
        { name: 'الأقسام', icon: Layers },
      ]
    },
    {
      group: 'المبيعات',
      items: [
        { name: 'الطلبات', icon: ShoppingCart },
        { name: 'عروض فلاش', icon: Zap },
        { name: 'كودات الخصم', icon: Ticket },
      ]
    },
    {
      group: 'الأداء',
      items: [
        { name: 'التقييمات والتحليل', icon: BarChart3 },
      ]
    },
    {
      group: 'الحساب',
      items: [
        { name: 'الاشتراك', icon: CreditCard },
        { name: 'الإعدادات', icon: Settings },
      ]
    }
  ];

  return (
    <div dir="rtl" className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 overflow-y-auto">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Store size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-wide">مركزي</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-8">
          {navigation.map((group) => (
            <div key={group.group}>
              <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {group.group}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = activeItem === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => setActiveItem(item.name)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-blue-600 text-white' 
                          : 'hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">{activeItem}</h1>
          <div className="flex items-center gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
              <Plus size={16} />
              إضافة منتج
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="ابحث عن منتج..." 
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block pr-10 p-2.5 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                <Filter size={16} />
                تصفية
              </button>
            </div>
          </div>

          {/* Products Table/Grid */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-right text-slate-500">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">المنتج</th>
                  <th scope="col" className="px-6 py-4 font-semibold">القسم</th>
                  <th scope="col" className="px-6 py-4 font-semibold">السعر</th>
                  <th scope="col" className="px-6 py-4 font-semibold">المخزون</th>
                  <th scope="col" className="px-6 py-4 font-semibold">الحالة</th>
                  <th scope="col" className="px-6 py-4 font-semibold w-10"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="bg-white border-b border-slate-200 hover:bg-slate-50 transition-colors last:border-0">
                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-semibold text-sm">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{product.category}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{product.price}</td>
                    <td className="px-6 py-4">{product.stock}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        product.status === 'نشط' ? 'bg-emerald-100 text-emerald-700' :
                        product.status === 'منخفض' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  );
}