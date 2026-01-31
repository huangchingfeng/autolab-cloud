// 東捷科技 AI 課後重點整理 - JavaScript

// 複製提示詞範本功能
function copyPrompt(button) {
    const card = button.closest('.prompt-card');
    const content = card.querySelector('.prompt-content');

    // 取得所有文字內容
    let textToCopy = '';

    content.querySelectorAll('.prompt-section').forEach(section => {
        const title = section.querySelector('h5');
        const paragraph = section.querySelector('p');
        const list = section.querySelector('ul, ol');

        if (title) {
            textToCopy += title.textContent + '\n';
        }

        if (paragraph) {
            textToCopy += paragraph.textContent + '\n';
        }

        if (list) {
            list.querySelectorAll('li').forEach(li => {
                textToCopy += '• ' + li.textContent.trim() + '\n';
            });
        }

        textToCopy += '\n';
    });

    // 複製到剪貼簿
    navigator.clipboard.writeText(textToCopy.trim()).then(() => {
        // 顯示複製成功
        const originalText = button.textContent;
        button.textContent = '已複製！';
        button.classList.add('copied');

        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('複製失敗:', err);
        // 備用方案：使用舊版 API
        fallbackCopy(textToCopy.trim(), button);
    });
}

// 備用複製方法（支援舊版瀏覽器）
function fallbackCopy(text, button) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand('copy');
        const originalText = button.textContent;
        button.textContent = '已複製！';
        button.classList.add('copied');

        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    } catch (err) {
        console.error('備用複製也失敗:', err);
        alert('複製失敗，請手動選取並複製');
    }

    document.body.removeChild(textarea);
}

// 漢堡選單切換
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // 點擊選單項目後關閉選單
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // 滾動時縮小導航列
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = 'none';
        }

        lastScroll = currentScroll;
    });

    // 平滑滾動到錨點
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// 卡片動畫（滾動時淡入）
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    // 為卡片添加初始樣式和觀察
    const cards = document.querySelectorAll('.department-card, .tool-card, .prompt-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`;
        observer.observe(card);
    });
});
