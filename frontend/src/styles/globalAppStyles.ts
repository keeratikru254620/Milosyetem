const FONT_ID = 'milosystem-font';
const STYLE_ID = 'milosystem-inline-style';

export const injectGlobalAppStyles = () => {
  let mountedFont = false;
  let mountedStyle = false;

  if (!document.getElementById(FONT_ID)) {
    const fontLink = document.createElement('link');
    fontLink.id = FONT_ID;
    fontLink.href =
      'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    mountedFont = true;
  }

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      * { font-family: 'Kanit', sans-serif !important; }
      @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
      @keyframes slide-in-blur { from { opacity: 0; transform: translateY(20px); filter: blur(10px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
      .animate-float { animation: float 6s ease-in-out infinite; }
      .animate-slide-blur { animation: slide-in-blur 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 10px; }
      .dark ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); }
      ::-webkit-scrollbar-thumb:hover { background: rgba(245, 158, 11, 0.8); }
    `;
    document.head.appendChild(style);
    mountedStyle = true;
  }

  return () => {
    if (mountedFont) {
      document.getElementById(FONT_ID)?.remove();
    }

    if (mountedStyle) {
      document.getElementById(STYLE_ID)?.remove();
    }
  };
};
