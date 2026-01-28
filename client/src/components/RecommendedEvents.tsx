import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

interface RecommendedEventsProps {
  currentEventId: number;
  limit?: number;
}

export function RecommendedEvents({ currentEventId, limit = 3 }: RecommendedEventsProps) {
  const { data: events, isLoading } = trpc.events.getPublishedEvents.useQuery();

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Filter out current event and limit results
  const recommendedEvents = events
    ?.filter((event) => event.id !== currentEventId)
    .slice(0, limit) || [];

  if (recommendedEvents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">目前沒有其他推薦課程</p>
        <Button asChild className="mt-4">
          <Link href="/events">查看所有活動</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {recommendedEvents.map((event) => {
        const eventDate = new Date(event.eventDate);
        
        // Calculate if event is upcoming based on end time if available
        let isUpcoming = eventDate > new Date();
        if (event.eventTime) {
          try {
            const timeMatch = event.eventTime.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
            if (timeMatch) {
              const [, , , endHour, endMin] = timeMatch;
              const year = eventDate.getFullYear();
              const month = eventDate.getMonth();
              const day = eventDate.getDate();
              const endTime = new Date(year, month, day, parseInt(endHour), parseInt(endMin), 0);
              isUpcoming = endTime > new Date();
            }
          } catch (error) {
            console.error('Error parsing eventTime:', error);
          }
        }

        return (
          <Card key={event.id} className="group hover:shadow-lg transition-shadow">
            {event.coverImage && (
              <div className="aspect-video overflow-hidden">
                <img
                  src={event.coverImage}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                {isUpcoming ? (
                  <Badge variant="default">即將舉行</Badge>
                ) : (
                  <Badge variant="secondary">已結束</Badge>
                )}
                {event.price === 0 && <Badge variant="outline">免費</Badge>}
              </div>
              <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                {event.title}
              </CardTitle>
              {event.subtitle && (
                <CardDescription className="line-clamp-2">
                  {event.subtitle}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(eventDate, "yyyy年MM月dd日 EEEE", { locale: zhTW })}
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="line-clamp-1">{event.location}</span>
                </div>
              )}
              <Button asChild className="w-full group">
                <Link href={`/events/${event.slug}`}>
                  查看詳情
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
