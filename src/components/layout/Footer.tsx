import { BriefcaseBusiness } from "lucide-react";

export function Footer() {
  return <footer><div className="container footer-inner"><div className="brand"><span className="brand-mark"><BriefcaseBusiness size={17} /></span><span><b>مسار</b><small>وظائف العراق</small></span></div><p>منصة مستقلة تربط الناس بالفرص المناسبة.</p><span>© {new Date().getFullYear()} مسار</span></div></footer>;
}