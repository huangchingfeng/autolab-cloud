import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/lib/trpc';
import { Loader2, Lock, Mail } from 'lucide-react';

interface ArticleAccessFormProps {
  articleSlug: string;
  onAccessGranted: () => void;
}

export function ArticleAccessForm({ articleSlug, onAccessGranted }: ArticleAccessFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const verifyMutation = trpc.blog.verifyArticleAccess.useMutation({
    onSuccess: () => {
      onAccessGranted();
    },
    onError: (err) => {
      setError('此 Email 不在付費學員名單中，請確認您輸入的 Email 是否正確');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('請輸入您的 Email');
      return;
    }

    verifyMutation.mutate({ email, articleSlug });
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">學員限定內容</CardTitle>
          <CardDescription>
            此文章為付費學員專屬內容，請輸入您報名時使用的 Email 進行驗證
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email 地址
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  disabled={verifyMutation.isPending}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  驗證中...
                </>
              ) : (
                '驗證並閱讀'
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>還不是付費學員？</p>
              <p className="mt-1">
                聯繫阿峰老師購買課程
                <br />
                <span className="font-medium text-foreground">LINE ID: 0976715102</span>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
