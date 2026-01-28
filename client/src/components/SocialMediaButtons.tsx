import { useState, useEffect, useRef } from "react";
import { Facebook, Instagram, Youtube, MessageCircle, Phone, Share2, X } from "lucide-react";

const SocialMediaButtons = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 點擊頁面其他區域時自動收合
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  const socialLinks = [
    {
      name: "Facebook",
      url: "https://www.facebook.com/nikeshoxmiles",
      icon: Facebook,
      color: "bg-[#1877F2] hover:bg-[#166FE5]",
    },
    {
      name: "Instagram",
      url: "https://www.instagram.com/nikeshoxmiles/",
      icon: Instagram,
      color: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-90",
    },
    {
      name: "YouTube",
      url: "https://www.youtube.com/channel/UCVVZz6m4T4k6-PZxFSlCkRQ",
      icon: Youtube,
      color: "bg-[#FF0000] hover:bg-[#CC0000]",
    },
    {
      name: "LINE 社群",
      url: "https://line.me/ti/g2/o6oRaGIHTzZ1nEofxnT9Rbv7_ZHAX-rylbJfKA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default",
      icon: null,
      color: "bg-black hover:bg-gray-800",
      customContent: true,
      customText: "社群",
    },
    {
      name: "WhatsApp",
      url: "https://api.whatsapp.com/send/?phone=886976715102&text&type=phone_number&app_absent=0",
      icon: null,
      color: "bg-[#25D366] hover:bg-[#20BD5A]",
      customContent: true,
      isLogo: true,
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
    },
  ];

  return (
    <div ref={containerRef} className="fixed right-6 top-[60%] -translate-y-1/2 z-50 flex flex-col gap-3">
      {/* 主按鈕：分享圖示（展開/收合） */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`${
          isExpanded 
            ? "bg-gray-700 hover:bg-gray-600" 
            : "bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        } text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl flex items-center justify-center`}
        title={isExpanded ? "收合" : "分享到社群"}
        aria-label={isExpanded ? "收合社群按鈕" : "展開社群按鈕"}
      >
        {isExpanded ? <X className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
      </button>

      {/* 社群按鈕列表（展開時顯示） */}
      <div
        className={`flex flex-col gap-3 transition-all duration-300 origin-top ${
          isExpanded
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-75 -translate-y-4 pointer-events-none"
        }`}
      >
        {socialLinks.map((link, index) => {
          const Icon = link.icon;
          return (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${link.color} text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl flex items-center justify-center`}
              title={link.name}
              style={{
                transitionDelay: isExpanded ? `${index * 50}ms` : "0ms",
              }}
            >
              {link.customContent ? (
                link.isLogo ? (
                  <img src={link.logoUrl} alt={link.name} className="w-6 h-6" />
                ) : (
                  <span className="text-xs font-bold text-white">{link.customText}</span>
                )
              ) : (
                Icon && <Icon className="w-5 h-5" />
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default SocialMediaButtons;
