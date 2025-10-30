import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ExperienceCardProps {
  id: string;
  title: string;
  short_description: string;
  image_url: string;
  location: string;
  duration: number;
  price: number;
  rating: number;
  total_reviews: number;
  category: string;
}

const ExperienceCard = ({
  id,
  title,
  short_description,
  image_url,
  location,
  duration,
  price,
  rating,
  total_reviews,
  category,
}: ExperienceCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all hover:shadow-medium hover:-translate-y-1"
      onClick={() => navigate(`/experience/${id}`)}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={image_url}
          alt={title}
          className="w-full h-full object-cover transition-transform hover:scale-110"
        />
        <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
          {category}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {short_description}
        </p>
        
        <div className="flex items-center gap-3 mb-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{duration}h</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{rating}</span>
            <span className="text-sm text-muted-foreground">({total_reviews})</span>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">From</div>
            <div className="text-xl font-bold text-primary">${price}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExperienceCard;