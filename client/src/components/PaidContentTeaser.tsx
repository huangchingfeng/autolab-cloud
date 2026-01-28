import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, MessageCircle } from 'lucide-react';

interface PaidContentTeaserProps {
  onUnlock: () => void;
}

export function PaidContentTeaser({ onUnlock }: PaidContentTeaserProps) {
  return (
    <div className="relative">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background pointer-events-none" />
      
      <Card className="relative mt-8 border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">完整內容需要驗證</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                這篇文章包含更多實戰技巧、詳細步驟和獨家案例分享。
                付費學員可以輸入 Email 解鎖完整內容。
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button onClick={onUnlock} size="lg" className="gap-2">
                <Lock className="h-4 w-4" />
                我是付費學員，立即解鎖
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => window.open('https://line.me/ti/p/0976715102', '_blank')}
              >
                <MessageCircle className="h-4 w-4" />
                聯繫阿峰老師購買
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                想要完整課程影片，可以聯繫阿峰老師購買
                <br />
                <span className="font-medium text-foreground">LINE ID: 0976715102</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
