import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Link } from "wouter";

export function EventPromotion() {
  const { data: events, isLoading } = trpc.events.getPublishedEvents.useQuery({ limit: 2 });

  if (isLoading) {
    return (
      <section className="container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-48 bg-muted rounded"></div>
          </div>
        </div>
      </section>
    );
  }

  if (!events || events.length === 0) {
    return null;
  }

  return (
    <section className="container py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/30 dark:via-amber-950/30 dark:to-yellow-950/30 rounded-2xl p-8 border border-orange-100 dark:border-orange-900">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">最新活動與課程</h3>
              <p className="text-sm text-muted-foreground">立即報名，提升您的 AI 實戰能力</p>
            </div>
          </div>

          {/* Events Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="group block"
              >
                <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-orange-100/50 dark:border-orange-900/50">
                  {/* Event Image */}
                  {event.coverImage && (
                    <div className="aspect-[16/9] overflow-hidden">
                      <img
                        src={event.coverImage}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  {/* Event Info */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {event.price === 0 ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          免費
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                          NT$ {event.price}
                        </Badge>
                      )}
                      {new Date(event.eventDate) > new Date() && (
                        <Badge variant="outline" className="text-xs">
                          即將開課
                        </Badge>
                      )}
                    </div>
                    
                    <h4 className="font-semibold mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {event.title}
                    </h4>
                    
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(event.eventDate), "MM/dd (E) HH:mm", {
                            locale: zhTW,
                          })}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-6 text-center">
            <Button asChild variant="outline" className="gap-2 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950">
              <Link href="/events">
                查看所有活動
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
