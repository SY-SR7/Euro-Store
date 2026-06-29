'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, Globe, X, ChevronDown, RefreshCw, ShoppingCart, Package } from 'lucide-react';

interface Notif {
  id: string;
  type: 'order' | 'exchange' | 'stock';
  title: string;
  body: string;
  href: string;
  read: boolean;
  at: string;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return '????';
  if (diff < 3600) return `??? ${Math.floor(diff/60)} ?`;
  if (diff < 86400) return `??? ${Math.floor(diff/3600)} ?`;
  return `??? ${Math.floor(diff/86400)} ???`;
}

const ICON: Record<string, React.ReactNode> = {
  order: <ShoppingCart className="h-4 w-4 text-blue-500" />,
  exchange: <RefreshCw className="h-4 w-4 text-purple-500" />,
  stock: <Package className="h-4 w-4 text-amber-500" />,
};

export function Navbar() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [locale, setLocale] = useState<'ar'|'en'>('ar');
  const notifRef = useRef<HTMLDivElement>(null);
  const langRef  = useRef<HTMLDivElement>(null);

  const unread = notifs.filter(n => !n.read).length;

  const fetchNotifs = useCallback(async () => {
    try {
      const [ordRes, exRes] = await Promise.all([
        fetch('/api/orders?limit=5&page=1').then(r=>r.json()).catch(()=>null),
        fetch('/api/exchanges?status=pending').then(r=>r.json()).catch(()=>null),
      ]);
      const out: Notif[] = [];
      const saved = JSON.parse(localStorage.getItem('notifs_read')||'[]') as string[];
      const orders = Array.isArray(ordRes?.orders) ? ordRes.orders : [];
      orders.slice(0,4).forEach((o:any) => {
        out.push({ id:`ord_${o.id}`, type:'order', title:`??? #${o.order_number}`,
          body:`${o.address_snapshot?.full_name??'????'} · ${o.status==='pending'?'? ????':o.status}`,
          href:`/orders/${o.id}`, read:saved.includes(`ord_${o.id}`), at:o.created_at });
      });
      const exs = Array.isArray(exRes) ? exRes : [];
      exs.slice(0,3).forEach((e:any) => {
        out.push({ id:`ex_${e.id}`, type:'exchange', title:'??? ??????? ????',
          body:e.reason?.substring(0,60)??'', href:`/exchanges`,
          read:saved.includes(`ex_${e.id}`), at:e.created_at });
      });
      out.sort((a,b)=>new Date(b.at).getTime()-new Date(a.at).getTime());
      setNotifs(out);
    } catch {}
  }, []);

  useEffect(() => { fetchNotifs(); const t = setInterval(fetchNotifs, 60000); return ()=>clearInterval(t); }, [fetchNotifs]);

  useEffect(() => {
    const cur = document.cookie.split(';').find(c=>c.trim().startsWith('NEXT_LOCALE='))?.split('=')[1]?.trim() ?? 'ar';
    setLocale(cur as 'ar'|'en');
  }, []);

  useEffect(() => {
    function click(e:MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setOpen(false);
      if (langRef.current  && !langRef.current.contains(e.target as Node))  setLangOpen(false);
    }
    document.addEventListener('mousedown', click);
    return () => document.removeEventListener('mousedown', click);
  }, []);

  const markRead = (id: string) => {
    const saved = JSON.parse(localStorage.getItem('notifs_read')||'[]') as string[];
    if (!saved.includes(id)) { saved.push(id); localStorage.setItem('notifs_read', JSON.stringify(saved)); }
    setNotifs(ns => ns.map(n => n.id===id ? {...n, read:true} : n));
  };

  const markAll = () => {
    const ids = notifs.map(n=>n.id);
    const saved = JSON.parse(localStorage.getItem('notifs_read')||'[]') as string[];
    localStorage.setItem('notifs_read', JSON.stringify([...new Set([...saved,...ids])]));
    setNotifs(ns => ns.map(n=>({...n,read:true})));
  };

  const switchLang = (l: 'ar'|'en') => {
    document.cookie = `NEXT_LOCALE=${l};path=/;max-age=31536000`;
    document.cookie = `EUROSTORE_LOCALE=${l};path=/;max-age=31536000`;
    setLocale(l); setLangOpen(false);
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-50 hidden md:flex items-center justify-between border-b border-[#E5E0D8] bg-white/95 backdrop-blur-sm px-6 py-3 shadow-sm" dir="rtl">
      {/* Title breadcrumb area */}
      <div id="navbar-title" className="text-sm font-semibold text-[#A8A29E]">EUROSTORE ADMIN</div>

      <div className="flex items-center gap-2">
        {/* Refresh */}
        <button onClick={fetchNotifs} title="????? ?????????"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E0D8] text-[#A8A29E] hover:border-[#B8860B] hover:text-[#B8860B] transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>

        {/* Language */}
        <div ref={langRef} className="relative">
          <button onClick={()=>setLangOpen(v=>!v)}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-[#E5E0D8] px-3 text-sm font-semibold text-[#57534E] hover:border-[#B8860B] transition-colors">
            <Globe className="h-4 w-4" />
            <span>{locale === 'ar' ? '????' : 'EN'}</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          {langOpen && (
            <div className="absolute left-0 top-11 z-50 w-36 rounded-2xl border border-[#E5E0D8] bg-white p-1 shadow-lg">
              {(['ar','en'] as const).map(l => (
                <button key={l} onClick={()=>switchLang(l)}
                  className={['w-full rounded-xl px-3 py-2 text-right text-sm font-semibold transition-colors',
                    locale===l ? 'bg-[#B8860B] text-white' : 'text-[#57534E] hover:bg-[#F8F6F2]'].join(' ')}>
                  {l==='ar' ? '???? ???????' : '???? English'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button onClick={()=>{ setOpen(v=>!v); }}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E0D8] text-[#57534E] hover:border-[#B8860B] transition-colors">
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute left-0 top-11 z-50 w-80 rounded-2xl border border-[#E5E0D8] bg-white shadow-xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#F0ECE6] px-4 py-3">
                <span className="font-black text-[#1C1917] text-sm">????????? {unread>0&&<span className="mr-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">{unread}</span>}</span>
                <div className="flex items-center gap-2">
                  {unread>0 && <button onClick={markAll} className="text-xs text-[#B8860B] hover:underline font-semibold">????? ????</button>}
                  <button onClick={()=>setOpen(false)} className="text-[#A8A29E] hover:text-[#1C1917]"><X className="h-4 w-4"/></button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifs.length === 0 ? (
                  <p className="p-6 text-center text-sm text-[#A8A29E]">?? ???? ???????</p>
                ) : notifs.map(n => (
                  <a key={n.id} href={n.href}
                    onClick={()=>{ markRead(n.id); setOpen(false); }}
                    className={['flex gap-3 px-4 py-3 transition-colors border-b border-[#F0ECE6] last:border-0',
                      n.read ? 'bg-white hover:bg-[#FAFAF8]' : 'bg-[#FEFCE8] hover:bg-[#FEF9D9]'].join(' ')}>
                    <div className="mt-0.5 flex-shrink-0">{ICON[n.type]}</div>
                    <div className="flex-1 min-w-0">
                      <p className={['text-xs font-bold truncate', n.read?'text-[#57534E]':'text-[#1C1917]'].join(' ')}>{n.title}</p>
                      <p className="text-xs text-[#A8A29E] truncate mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-[#A8A29E] mt-1">{timeAgo(n.at)}</p>
                    </div>
                    {!n.read && <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#B8860B]" />}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
