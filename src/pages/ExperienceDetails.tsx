import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Clock, Star, Calendar, Users } from "lucide-react";
import { format, addDays, isSameDay } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

interface Experience {
  id: string;
  title: string;
  description: string;
  short_description: string;
  image_url: string;
  location: string;
  duration: number;
  price: number;
  rating: number;
  total_reviews: number;
  category: string;
  highlights: string[];
  what_to_bring: string[];
}

interface Slot {
  id: string;
  date: string;
  time: string;
  available_spots: number;
  total_spots: number;
}

const ExperienceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const { data: experience, isLoading: experienceLoading } = useQuery({
    queryKey: ["experience", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Experience;
    },
  });

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ["slots", id, selectedDate],
    queryFn: async () => {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("slots")
        .select("*")
        .eq("experience_id", id)
        .eq("date", dateStr)
        .order("time", { ascending: true });

      if (error) throw error;
      return data as Slot[];
    },
  });

  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  const handleBookNow = () => {
    if (!selectedSlot) {
      toast.error("Please select a time slot");
      return;
    }
    navigate(`/checkout/${id}`, { state: { slot: selectedSlot, experience } });
  };

  if (experienceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading experience...</p>
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Experience not found</h2>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 hover:bg-secondary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Experiences
        </Button>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-medium">
            <img
              src={experience.image_url}
              alt={experience.title}
              className="w-full h-full object-cover"
            />
            <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">
              {experience.category}
            </Badge>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-4">{experience.title}</h1>
              
              <div className="flex items-center gap-4 mb-6 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-5 w-5" />
                  <span>{experience.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-5 w-5" />
                  <span>{experience.duration} hours</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span>{experience.rating} ({experience.total_reviews} reviews)</span>
                </div>
              </div>

              <p className="text-lg mb-6">{experience.description}</p>

              {experience.highlights && experience.highlights.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">Highlights</h3>
                  <ul className="space-y-2">
                    {experience.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">✓</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-muted-foreground mb-1">Price per person</p>
                <p className="text-4xl font-bold text-primary">${experience.price}</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="shadow-medium">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Select Date & Time
            </h2>

            <div className="mb-8">
              <h3 className="font-semibold mb-4">Available Dates</h3>
              <div className="flex gap-3 overflow-x-auto pb-4">
                {dates.map((date) => (
                  <button
                    key={date.toISOString()}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedSlot(null);
                    }}
                    className={`flex flex-col items-center min-w-[80px] p-3 rounded-lg border-2 transition-all ${
                      isSameDay(date, selectedDate)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-xs text-muted-foreground uppercase">
                      {format(date, "EEE")}
                    </span>
                    <span className="text-2xl font-bold">{format(date, "d")}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(date, "MMM")}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Available Time Slots</h3>
              {slotsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : slots && slots.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      disabled={slot.available_spots === 0}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        slot.available_spots === 0
                          ? "border-border bg-muted text-muted-foreground cursor-not-allowed"
                          : selectedSlot?.id === slot.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="text-lg font-semibold">{slot.time}</div>
                      <div className="text-sm flex items-center justify-center gap-1 mt-1">
                        <Users className="h-3 w-3" />
                        <span>
                          {slot.available_spots === 0
                            ? "Sold Out"
                            : `${slot.available_spots} spots`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No time slots available for this date
                </p>
              )}
            </div>

            <Button
              onClick={handleBookNow}
              disabled={!selectedSlot}
              className="w-full mt-8 bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6"
            >
              Book Now
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExperienceDetails;