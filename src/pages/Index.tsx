import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ExperienceCard from "@/components/ExperienceCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Compass } from "lucide-react";
import { useState } from "react";

interface Experience {
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

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: experiences, isLoading } = useQuery({
    queryKey: ["experiences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Experience[];
    },
  });

  const filteredExperiences = experiences?.filter((exp) =>
    exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="bg-gradient-hero text-white">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Compass className="h-5 w-5" />
              <span className="text-sm font-medium">Discover Amazing Experiences</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Book Unforgettable Adventures
            </h1>
            <p className="text-xl mb-8 text-white/90">
              Explore unique experiences, from thrilling adventures to cultural discoveries
            </p>
            
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by destination, activity, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-lg bg-white/95 backdrop-blur-sm border-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Experiences Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading experiences...</p>
          </div>
        ) : filteredExperiences && filteredExperiences.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold">
                  {searchTerm ? "Search Results" : "Popular Experiences"}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {filteredExperiences.length} {filteredExperiences.length === 1 ? "experience" : "experiences"} available
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExperiences.map((experience) => (
                <ExperienceCard key={experience.id} {...experience} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-2xl font-semibold mb-2">No experiences found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Check back soon for new adventures"}
            </p>
            {searchTerm && (
              <Button onClick={() => setSearchTerm("")} variant="outline">
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
