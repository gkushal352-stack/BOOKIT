import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Tag, MapPin, Calendar, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(20, "Phone number too long"),
  guests: z.number().min(1, "At least 1 guest required").max(20, "Maximum 20 guests"),
});

const Checkout = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { slot, experience } = location.state || {};

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    guests: 1,
  });
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!slot || !experience) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Invalid booking</h2>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const basePrice = experience.price * formData.guests;
  const discount = appliedPromo
    ? appliedPromo.discount_type === "percentage"
      ? (basePrice * appliedPromo.discount_value) / 100
      : appliedPromo.discount_value
    : 0;
  const totalPrice = Math.max(0, basePrice - discount);

  const validateForm = () => {
    try {
      checkoutSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", promoCode.toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !data) {
        toast.error("Invalid promo code");
        return;
      }

      if (new Date(data.valid_until) < new Date()) {
        toast.error("This promo code has expired");
        return;
      }

      if (data.max_uses && data.current_uses >= data.max_uses) {
        toast.error("This promo code has reached its usage limit");
        return;
      }

      setAppliedPromo(data);
      toast.success("Promo code applied successfully!");
    } catch (error) {
      toast.error("Error applying promo code");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    if (formData.guests > slot.available_spots) {
      toast.error(`Only ${slot.available_spots} spots available`);
      return;
    }

    setIsProcessing(true);

    try {
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          slot_id: slot.id,
          experience_id: experience.id,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          number_of_guests: formData.guests,
          total_price: totalPrice,
          promo_code: appliedPromo?.code || null,
          discount_amount: discount,
          booking_status: "confirmed",
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      if (appliedPromo) {
        await supabase
          .from("promo_codes")
          .update({ current_uses: appliedPromo.current_uses + 1 })
          .eq("id", appliedPromo.id);
      }

      toast.success("Booking confirmed!");
      navigate(`/confirmation/${booking.id}`);
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error(error.message || "Failed to complete booking. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/experience/${id}`)}
          className="mb-6 hover:bg-secondary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Experience
        </Button>

        <h1 className="text-4xl font-bold mb-8">Complete Your Booking</h1>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <Label htmlFor="guests">Number of Guests *</Label>
                    <Input
                      id="guests"
                      type="number"
                      min="1"
                      max={slot.available_spots}
                      value={formData.guests}
                      onChange={(e) =>
                        setFormData({ ...formData, guests: parseInt(e.target.value) || 1 })
                      }
                      className={errors.guests ? "border-destructive" : ""}
                    />
                    {errors.guests && <p className="text-sm text-destructive mt-1">{errors.guests}</p>}
                    <p className="text-sm text-muted-foreground mt-1">
                      Maximum {slot.available_spots} guests available
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="promo">Promo Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="promo"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        disabled={!!appliedPromo}
                      />
                      {appliedPromo ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setAppliedPromo(null);
                            setPromoCode("");
                          }}
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button type="button" variant="outline" onClick={handleApplyPromo}>
                          <Tag className="mr-2 h-4 w-4" />
                          Apply
                        </Button>
                      )}
                    </div>
                    {appliedPromo && (
                      <Badge className="mt-2 bg-success text-success-foreground">
                        {appliedPromo.code} applied - $
                        {discount.toFixed(2)} off
                      </Badge>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6"
                  >
                    {isProcessing ? "Processing..." : `Pay $${totalPrice.toFixed(2)}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="shadow-medium sticky top-8">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden">
                  <img
                    src={experience.image_url}
                    alt={experience.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h3 className="font-semibold text-lg">{experience.title}</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{experience.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(slot.date), "MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{slot.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{formData.guests} {formData.guests === 1 ? "guest" : "guests"}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Price per person</span>
                    <span>${experience.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Guests</span>
                    <span>× {formData.guests}</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between text-success">
                      <span>Discount</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;