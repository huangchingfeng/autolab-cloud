import { Calendar, Users, TrendingUp, Award } from "lucide-react";
import { Card } from "@/components/ui/card";

export function WorkshopStats() {
  // 2025 年度數據
  const totalWorkshops = 150;
  const workingDays = 248;
  const avgPerWeek = ((totalWorkshops / workingDays) * 7).toFixed(1);
  const daysPerWorkshop = (workingDays / totalWorkshops).toFixed(1);

  return (
    <div className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">2025 年度教學成就</h2>
          <p className="text-lg text-muted-foreground">
            用數據見證阿峰老師對 AI 教育的熱情與專業投入
          </p>
        </div>

        {/* 主要數據卡片 */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* 左側：工作坊總數 */}
          <Card className="p-8 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-blue-100 rounded-lg">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  年度工作坊場次
                </h3>
                <p className="text-5xl font-bold text-blue-600 mb-2">150</p>
                <p className="text-sm text-muted-foreground">
                  涵蓋企業內訓、公開課程、專題講座
                </p>
              </div>
            </div>
          </Card>

          {/* 右側：工作天數 */}
          <Card className="p-8 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-indigo-100 rounded-lg">
                <Calendar className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  年度工作天數
                </h3>
                <p className="text-5xl font-bold text-indigo-600 mb-2">248</p>
                <p className="text-sm text-muted-foreground">
                  扣除週末與國定假日的實際工作日
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* 計算結果展示 */}
        <Card className="p-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold mb-2">這代表什麼？</h3>
            <div className="w-24 h-1 bg-white/30 mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* 平均每週場次 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <TrendingUp className="w-8 h-8" />
              </div>
              <p className="text-4xl font-bold mb-2">{avgPerWeek}</p>
              <p className="text-white/90">場 / 週</p>
              <p className="text-sm text-white/70 mt-2">
                平均每週授課場次
              </p>
            </div>

            {/* 平均間隔天數 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <Calendar className="w-8 h-8" />
              </div>
              <p className="text-4xl font-bold mb-2">{daysPerWorkshop}</p>
              <p className="text-white/90">天 / 場</p>
              <p className="text-sm text-white/70 mt-2">
                平均每場工作坊間隔
              </p>
            </div>

            {/* 授課密度 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <Users className="w-8 h-8" />
              </div>
              <p className="text-4xl font-bold mb-2">60%</p>
              <p className="text-white/90">授課密度</p>
              <p className="text-sm text-white/70 mt-2">
                超過半數工作日在授課
              </p>
            </div>
          </div>

          {/* 底部說明 */}
          <div className="mt-8 pt-6 border-t border-white/20 text-center">
            <p className="text-lg font-semibold mb-2">
              💪 幾乎每個工作日都在授課或準備課程
            </p>
            <p className="text-white/90">
              這不僅展現阿峰老師對 AI 教育的熱情與使命感，更證明市場對企業 AI 培訓的強勁需求
            </p>
          </div>
        </Card>

        {/* 視覺化進度條 */}
        <div className="mt-12">
          <Card className="p-8 bg-white shadow-lg">
            <h3 className="text-xl font-bold mb-6 text-center">
              2025 年度授課日程視覺化
            </h3>
            
            <div className="space-y-4">
              {/* 工作坊場次進度條 */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold">工作坊場次</span>
                  <span className="text-muted-foreground">150 / 248 天</span>
                </div>
                <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-end pr-4 text-white text-sm font-semibold transition-all duration-1000"
                    style={{ width: `${(totalWorkshops / workingDays) * 100}%` }}
                  >
                    {((totalWorkshops / workingDays) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* 說明文字 */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    超高強度的專業投入
                  </p>
                  <p className="text-sm text-blue-700">
                    在 248 個工作天中完成 150 場工作坊，相當於每 1.65 天就有一場課程，
                    累積了大量實戰經驗與教學案例，為企業提供最新、最實用的 AI 應用知識。
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
