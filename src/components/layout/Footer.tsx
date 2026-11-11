import { BRAND_LOGO_PATH, BRAND_NAME, BRAND_TAGLINE } from "../../lib/brand";

export function Footer() {
  return <footer><div className="container footer-inner"><div className="brand"><img className="brand-logo" src={BRAND_LOGO_PATH} alt="" /><span><b>{BRAND_NAME}</b><small>{BRAND_TAGLINE}</small></span></div><p>منصة عراقية للفرص المهنية وربط الباحثين بجهات العمل.</p><span>© {new Date().getFullYear()} {BRAND_NAME}</span></div><div className="container footer-disclaimer">{BRAND_NAME} تنشر الإعلانات الوظيفية فقط، ولا تضمن صحة المعلومات ولا تتحمل مسؤولية التوظيف أو التقديم. لا نستوفي أي أجور من الباحثين أو الجهات الناشرة.</div></footer>;
}