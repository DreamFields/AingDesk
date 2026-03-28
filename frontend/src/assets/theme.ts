import { eventBUS } from "@/views/Home/utils/tools";
import storage from "@/utils/storage";

export function themeChange(theme:string) {
    if (theme === 'dark') {
        document.documentElement.style.setProperty('--bt-tit-color-secondary', '#ffffff'); 
        document.documentElement.style.setProperty('--bt-notice-text-color', '#b5b5b5'); 
        document.documentElement.style.setProperty('--bt-list-item-hover', 'rgba(22, 163, 74, .5)'); 
        document.documentElement.style.setProperty('--bt-panel', '#2c2c2c'); 
      } else {
        document.documentElement.style.setProperty('--bt-tit-color-secondary', '#73767a'); 
        document.documentElement.style.setProperty('--bt-notice-text-color', '#545454'); 
        document.documentElement.style.setProperty('--bt-list-item-hover', 'rgba(28, 196, 90, 0.1)'); 
        document.documentElement.style.setProperty('--bt-panel', '#ffffff'); 
      }
}

export function fontScaleChange(scale: number) {
  const safeScale = Math.min(130, Math.max(85, Number(scale) || 100));
  const baseFontSize = 14;
  const scaled = (baseFontSize * safeScale) / 100;

  document.documentElement.style.setProperty('--bt-fz', `${Math.round(scaled)}px`);
  document.documentElement.style.setProperty('--bt-fz-small', `${Math.max(11, Math.round(scaled - 2))}px`);
  document.documentElement.style.setProperty('--bt-fz-large', `${Math.round(scaled + 2)}px`);
}

export function chatFontScaleChange(scale: number) {
  const safeScale = Math.min(200, Math.max(85, Number(scale) || 100));
  const baseFontSize = 14;
  const scaled = (baseFontSize * safeScale) / 100;

  document.documentElement.style.setProperty('--chat-fz', `${Math.round(scaled)}px`);
  // 同步更新代码块字体大小（保持与markdown内容一致）
  document.documentElement.style.setProperty('--code-fz', `${Math.round(scaled)}px`);
}

themeChange(storage.themeMode)
fontScaleChange(storage.fontScale)
chatFontScaleChange(storage.chatFontScale)

eventBUS.$on("themeChange",themeChange)
eventBUS.$on("fontScaleChange",fontScaleChange)
eventBUS.$on("chatFontScaleChange",chatFontScaleChange)




