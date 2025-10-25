import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2 } from "lucide-react";

interface FilterSelectorProps {
  filters: {
    modelType: string;
    background: string;
    lighting: string;
    angle: string;
    mood: string;
  };
  onFiltersChange: (filters: any) => void;
}

const FilterSelector = ({ filters, onFiltersChange }: FilterSelectorProps) => {
  const updateFilter = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card className="shadow-card">
      <CardContent className="p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Settings2 className="w-5 h-5 mr-2 text-primary" />
          Smart Filters
        </h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modelType">Model Type</Label>
            <Select value={filters.modelType} onValueChange={(v) => updateFilter("modelType", v)}>
              <SelectTrigger id="modelType">
                <SelectValue placeholder="Select model type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female-asian">Female - Asian</SelectItem>
                <SelectItem value="female-caucasian">Female - Caucasian</SelectItem>
                <SelectItem value="male-asian">Male - Asian</SelectItem>
                <SelectItem value="male-caucasian">Male - Caucasian</SelectItem>
                <SelectItem value="none">No Model (Product Only)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="background">Background</Label>
            <Select value={filters.background} onValueChange={(v) => updateFilter("background", v)}>
              <SelectTrigger id="background">
                <SelectValue placeholder="Select background" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="studio-white">Studio - White</SelectItem>
                <SelectItem value="studio-gray">Studio - Gray</SelectItem>
                <SelectItem value="outdoor-natural">Outdoor - Natural</SelectItem>
                <SelectItem value="lifestyle-home">Lifestyle - Home</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lighting">Lighting Style</Label>
            <Select value={filters.lighting} onValueChange={(v) => updateFilter("lighting", v)}>
              <SelectTrigger id="lighting">
                <SelectValue placeholder="Select lighting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="soft">Soft & Diffused</SelectItem>
                <SelectItem value="dramatic">Dramatic</SelectItem>
                <SelectItem value="natural">Natural</SelectItem>
                <SelectItem value="studio">Studio Professional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="angle">Camera Angle</Label>
            <Select value={filters.angle} onValueChange={(v) => updateFilter("angle", v)}>
              <SelectTrigger id="angle">
                <SelectValue placeholder="Select angle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="front">Front View</SelectItem>
                <SelectItem value="side">Side View</SelectItem>
                <SelectItem value="three-quarter">3/4 View</SelectItem>
                <SelectItem value="overhead">Overhead</SelectItem>
                <SelectItem value="closeup">Close-up</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mood">Mood</Label>
            <Select value={filters.mood} onValueChange={(v) => updateFilter("mood", v)}>
              <SelectTrigger id="mood">
                <SelectValue placeholder="Select mood" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="elegant">Elegant & Luxurious</SelectItem>
                <SelectItem value="casual">Casual & Relaxed</SelectItem>
                <SelectItem value="vibrant">Vibrant & Energetic</SelectItem>
                <SelectItem value="minimal">Minimal & Clean</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterSelector;
