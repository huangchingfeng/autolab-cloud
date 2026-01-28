import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { JsonLdSchema, defaultOrganizationSchema } from "@/components/JsonLdSchema";
import Breadcrumb from "@/components/Breadcrumb";
import { useEffect } from "react";

export default function Clients() {
  useEffect(() => {
    document.title = "客戶見證 - 受信任的合作夥伴 | AI峰哥";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', '感謝超過 400 家企業與政府單位的信任與支持，包含華碩、蝦皮、南山人壽、行政院數位發展部等知名機構。');
    }
  }, []);

  const enterpriseClients = [
    // 知名度高的國際企業排前面
    { name: "三菱商事", logo: "/images/clients/mitsubishi-corporation-logo.png" },
    { name: "精誠資訊", logo: "/images/clients/systex-logo.png" },
    { name: "華碩電腦", logo: "/logos/asus.png" },
    { name: "蝦皮電商", logo: "/logos/shopee.png" },
    { name: "南山人壽", logo: "/logos/nanshan.jpg" },
    { name: "台灣理光", logo: "/logos/ricoh.jpg" },
    { name: "裕隆日產", logo: "/logos/nissan.png" },
    { name: "日商TOTO", logo: "/logos/toto.jpg" },
    { name: "順益集團", logo: null },
    { name: "南都汽車集團", logo: "/logos/nanto.png" },
    { name: "歐德傢俱", logo: "/logos/op9tUYhpAYkr.jpg" },
    { name: "雅丰醫美", logo: "/logos/aphrodite.png" },
    { name: "亞洲準譯生技", logo: "/logos/apg.png" },
    { name: "Happy Hair", logo: "/logos/0t2KXq6p1ScP.png" },
    { name: "圖爾思生技", logo: "/logos/t2m1EP6EvBGT.jpg" },
    { name: "國賓影城", logo: "/logos/56J5HBTQC2jA.png" },
    { name: "台灣護理之家協會", logo: "/images/clients/tnha-logo.png" },
    { name: "瑞興銀行", logo: "/images/clients/ta-chong-bank-logo.png" },
  ];

  const governmentClients = [
    { name: "行政院數位發展部", logo: "/logos/moda.png" },
    { name: "勞動力發展署", logo: "/logos/wda.jpg" },
    { name: "經濟部能源署", logo: "/logos/moea.jpg" },
    { name: "高雄市政府", logo: "/logos/khgov.jpg" },
    { name: "高雄市社會局", logo: null },
    { name: "高雄市文化局", logo: null },
    { name: "國立美術館", logo: "/logos/ntmfa.jpeg" },
    { name: "海洋委員會", logo: "/logos/oac.png" },
    { name: "新竹市衛生局", logo: null },
    { name: "嘉義縣政府", logo: null },
    { name: "宜蘭縣工業會", logo: null },
    { name: "中衛發展中心", logo: "/logos/csd.png" },
    { name: "紡織產業綜研所", logo: "/logos/ttri.jpg" },
    { name: "世新大學", logo: "/logos/shu.png" },
  ];

  const organizationClients = [
    { name: "扶輪社", logo: "/logos/9TuZwZwsMKCG.jpg" },
    { name: "IMC桃園社", logo: null },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <JsonLdSchema data={defaultOrganizationSchema} />
      <Header />
      <Breadcrumb items={[{ label: "客戶見證" }]} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <div className="text-center space-y-6 mb-16">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                受信任的合作夥伴
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                感謝超過 400 家企業與政府單位的信任與支持
              </p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card>
                <CardContent className="pt-8 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">400+</div>
                  <p className="text-muted-foreground">企業與機關</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-8 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
                  <p className="text-muted-foreground">學員人次</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-8 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">300+</div>
                  <p className="text-muted-foreground">場次課程</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Enterprise Clients */}
        <section className="py-20 md:py-32 bg-background">
          <div className="container">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                企業客戶
              </h2>
              <p className="text-lg text-muted-foreground">
                協助企業導入 AI 工作流，提升團隊效率
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {enterpriseClients.map((client, index) => (
                <div key={index} className="bg-white rounded-lg p-6 flex items-center justify-center hover:shadow-lg transition-all hover:scale-105 min-h-[120px] border border-border">
                  {client.logo ? (
                    <img
                      src={client.logo}
                      alt={client.name}
                      className="max-w-full max-h-[80px] object-contain grayscale hover:grayscale-0 transition-all"
                    />
                  ) : (
                    <span className="text-sm font-medium text-center text-foreground">{client.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Government Clients */}
        <section className="py-20 md:py-32 bg-muted/30">
          <div className="container">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                政府與公部門
              </h2>
              <p className="text-lg text-muted-foreground">
                推動公部門數位轉型，提升行政效率
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {governmentClients.map((client, index) => (
                <div key={index} className="bg-white rounded-lg p-6 flex items-center justify-center hover:shadow-lg transition-all hover:scale-105 min-h-[120px] border border-border">
                  {client.logo ? (
                    <img
                      src={client.logo}
                      alt={client.name}
                      className="max-w-full max-h-[80px] object-contain grayscale hover:grayscale-0 transition-all"
                    />
                  ) : (
                    <span className="text-sm font-medium text-center text-foreground">{client.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Organization Clients */}
        <section className="py-20 md:py-32 bg-background">
          <div className="container">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                社團組織
              </h2>
              <p className="text-lg text-muted-foreground">
                為社團成員提供 AI 技能培訓
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {organizationClients.map((client, index) => (
                <div key={index} className="bg-white rounded-lg p-6 flex items-center justify-center hover:shadow-lg transition-all hover:scale-105 min-h-[120px] border border-border">
                  {client.logo ? (
                    <img
                      src={client.logo}
                      alt={client.name}
                      className="max-w-full max-h-[80px] object-contain grayscale hover:grayscale-0 transition-all"
                    />
                  ) : (
                    <span className="text-sm font-medium text-center text-foreground">{client.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
              <CardContent className="py-12">
                <div className="text-center space-y-6">
                  <h2 className="text-3xl font-bold">成為我們的合作夥伴</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    加入超過 400 家企業與政府單位的行列，一起擁抱 AI 時代
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" asChild>
                      <a href="#contact" className="text-primary-foreground">
                        立即洽詢
                      </a>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <a href="/corporate-training">
                        了解企業內訓
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
