import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MapPin, Calendar, Clock, Users, Mail, Phone } from "lucide-react";
import { format } from "date-fns";

const Confirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select(`
          *,
          slots (
            date,
            time,
            total_spots,
            available_spots
          ),
          experiences (
            title,
            location,
            image_url,
            category
          )
        `)
        .eq("id", bookingId)
        .single();

      if (bookingError) throw bookingError;
      return bookingData;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Booking not found</h2>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-success/10 rounded-full mb-6">
            <CheckCircle2 className="h-12 w-12 text-success" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Booking Confirmed!</h1>
          <p className="text-xl text-muted-foreground">
            Your adventure awaits! We've sent a confirmation email to {booking.customer_email}
          </p>
        </div>

        <Card className="shadow-medium mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <div className="aspect-video rounded-lg overflow-hidden">
                  <img
                    src={booking.experiences.image_url}
                    alt={booking.experiences.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="md:w-2/3 space-y-6">
                <div>
                  <Badge className="mb-2 bg-accent text-accent-foreground">
                    {booking.experiences.category}
                  </Badge>
                  <h2 className="text-2xl font-bold">{booking.experiences.title}</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Location</p>
                      <p className="text-muted-foreground">{booking.experiences.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Date</p>
                      <p className="text-muted-foreground">
                        {format(new Date(booking.slots.date), "MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Time</p>
                      <p className="text-muted-foreground">{booking.slots.time}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Guests</p>
                      <p className="text-muted-foreground">
                        {booking.number_of_guests} {booking.number_of_guests === 1 ? "guest" : "guests"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Customer Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {booking.customer_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{booking.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{booking.customer_email}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{booking.customer_phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Payment Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking ID</span>
                  <span className="font-mono text-sm">#{booking.id.slice(0, 8)}</span>
                </div>
                {booking.promo_code && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Promo Code</span>
                      <Badge variant="secondary">{booking.promo_code}</Badge>
                    </div>
                    <div className="flex justify-between text-success">
                      <span>Discount</span>
                      <span>-${Number(booking.discount_amount).toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Total Paid</span>
                  <span className="text-2xl font-bold text-primary">
                    ${Number(booking.total_price).toFixed(2)}
                  </span>
                </div>
                <Badge className="w-full justify-center bg-success text-success-foreground">
                  {booking.booking_status.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-secondary/50 rounded-lg p-6 mb-8">
          <h3 className="font-semibold mb-2">What's Next?</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>• You'll receive a confirmation email with your booking details</li>
            <li>• A reminder will be sent 24 hours before your experience</li>
            <li>• Please arrive 15 minutes early at the meeting point</li>
            <li>• Don't forget to bring a valid ID and your booking confirmation</li>
          </ul>
        </div>

        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate("/")} variant="outline" size="lg">
            Browse More Experiences
          </Button>
          <Button onClick={() => window.print()} className="bg-primary" size="lg">
            Print Confirmation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;