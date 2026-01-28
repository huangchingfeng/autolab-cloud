import { Link } from "wouter";

interface AuthorBioProps {
  compact?: boolean;
}

export function AuthorBio({ compact = false }: AuthorBioProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border">
        <img
          src="/afeng-professional.jpg"
          alt="阿峰老師"
          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
        />
        <div className="min-w-0">
          <h4 className="font-semibold text-foreground">黃敬峰 / AI峰哥</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">
            台灣企業AI職場實戰專家，專注於協助企業導入AI工具提升工作效率。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 md:p-8 border border-primary/10">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Author Photo */}
        <div className="flex-shrink-0">
          <img
            src="/afeng-professional.jpg"
            alt="阿峰老師"
            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-lg"
          />
        </div>

        {/* Author Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
              作者
            </span>
          </div>
          
          <h3 className="text-xl md:text-2xl font-bold text-foreground mb-1">
            黃敬峰
          </h3>
          <p className="text-primary font-medium mb-3">
            AI峰哥 / 阿峰老師
          </p>
          
          <p className="text-muted-foreground leading-relaxed mb-4">
            台灣企業AI職場實戰專家，擁有豐富的企業內訓與顧問經驗。專注於協助企業導入AI工具，
            建立可複用的AI工作流，提升團隊工作效率與競爭力。已輔導超過百家企業進行AI數位轉型，
            學員遍及各行各業。
          </p>

          {/* Expertise Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {["AI工具應用", "企業內訓", "數位轉型", "提示詞工程", "工作流自動化"].map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 bg-background rounded-full text-muted-foreground border"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/#about"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              了解更多
            </Link>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              聯繫洽詢
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
